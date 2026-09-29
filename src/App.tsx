import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  FilePlus2,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  Calculator,
  Phone,
  LogOut,
  Wallet,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  ChevronDown,
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { ApplicationForm } from "./components/ApplicationForm";
import { CustomerLedger } from "./components/CustomerLedger";
import { ExpenseTracker } from "./components/expenses/ExpenseTracker";
import { ReportsHub } from "./components/reports/ReportsHub";
import { SettingsHub } from "./components/settings/SettingsHub";
import { ServiceTestModal } from "./components/ServiceTestModal";
import { ShortcutsHelpModal } from "./components/common/ShortcutsHelpModal";
import { AppStatusBar } from "./components/common/AppStatusBar";
import { LsfcVectorLogo } from "./components/LsfcVectorLogo";
import { useInstitutionSettings } from "./utils/institutionSettings";
import { seedInitialDataIfEmpty } from "./utils/sampleData";
import { migrateCustomerNumbers } from "./utils/customerStore";
import { toBanglaNumber } from "./components/InvoicePrint";
import { useAuth, logout, getRoleLabel } from "./utils/authStore";
import { SettingsRoleGate } from "./components/auth/SettingsRoleGate";
import { LoginScreen } from "./components/auth/LoginScreen";
import { ThemeProvider, useTheme } from "./utils/themeContext";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { ToastProvider } from "./components/common/Toast";
import { ConfirmDialog } from "./components/common/ConfirmDialog";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "ড্যাশবোর্ড ও বিশ্লেষণ",
  application: "নতুন আবেদন ও ইনভয়েস",
  ledger: "ভূমি মালিক লেজার",
  expenses: "দৈনন্দিন খরচ",
  reports: "রিপোর্ট ও স্টেটমেন্ট",
  settings: "সেটিংস ও ব্যাকআপ",
};

export type AppTabType =
  | "dashboard"
  | "application"
  | "ledger"
  | "expenses"
  | "reports"
  | "settings";

const VALID_TABS: AppTabType[] = [
  "dashboard",
  "application",
  "ledger",
  "expenses",
  "reports",
  "settings",
];

function getTabFromHash(): AppTabType {
  if (typeof window === "undefined") return "dashboard";
  const raw = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (VALID_TABS.includes(raw as AppTabType)) {
    return raw as AppTabType;
  }
  return "dashboard";
}

interface NavItem {
  id: AppTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DAILY_WORK_ITEMS: NavItem[] = [
  { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { id: "application", label: "নতুন আবেদন ও ইনভয়েস", icon: FilePlus2 },
  { id: "ledger", label: "ভূমি মালিক লেজার", icon: Users },
  { id: "expenses", label: "দৈনন্দিন খরচ", icon: Wallet },
];

const MANAGEMENT_ITEMS: NavItem[] = [
  { id: "reports", label: "রিপোর্ট ও স্টেটমেন্ট", icon: BarChart3 },
  { id: "settings", label: "সেটিংস ও ব্যাকআপ", icon: SettingsIcon },
];

function MainAppContent() {
  const { theme, themeClasses } = useTheme();
  const { currentUser, refresh } = useAuth();
  const { settings } = useInstitutionSettings();

  const [activeTab, setActiveTab] = useState<AppTabType>(getTabFromHash);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("lsfc_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const handleTabChange = (tab: AppTabType) => {
    setActiveTab(tab);
    if (window.location.hash !== `#${tab}`) {
      window.location.hash = tab;
    }
    if (isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("lsfc_sidebar_collapsed", String(next));
      } catch (e) {
        console.warn("Could not save sidebar state to localStorage", e);
      }
      return next;
    });
  };

  // Seed sample data and migrate legacy customer identifiers
  useEffect(() => {
    seedInitialDataIfEmpty();
    const migrated = migrateCustomerNumbers();
    if (migrated > 0) {
      console.info(`✅ ${migrated} জন ভূমি মালিকের জন্য নতুন নম্বর তৈরি হয়েছে।`);
    }
  }, []);

  // Hash-based routing listener (J-5)
  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Global Keyboard Shortcuts (H-5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 -> open shortcuts cheatsheet
      if (e.key === "F1") {
        e.preventDefault();
        setShowShortcutsModal(true);
        return;
      }
      // Ctrl+N / Cmd+N -> new invoice
      if ((e.ctrlKey || e.metaKey) && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        handleTabChange("application");
        return;
      }
      // Ctrl+K / Cmd+K -> quick fee calculator
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setShowCalculatorModal((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  // B-1: Strict full-screen login first guard
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={refresh} />;
  }

  const sidebarThemeClass =
    theme === "dark"
      ? "bg-slate-900 border-slate-800 text-slate-100"
      : theme === "white"
      ? "bg-slate-100 border-gray-200 text-gray-800"
      : "bg-white border-purple-100/80 text-slate-800 shadow-[1px_0_15px_rgba(144,42,139,0.02)]";

  const sidebarBorderClass =
    theme === "dark"
      ? "border-slate-800"
      : theme === "white"
      ? "border-gray-200"
      : "border-purple-100/70";

  const renderSidebarContent = (collapsed: boolean, isDrawer = false) => (
    <div className="flex flex-col h-full">
      {/* Top Header in Sidebar */}
      <div
        className={`p-3.5 border-b flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        } ${sidebarBorderClass}`}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.orgNameBn}
                className="w-8 h-8 object-contain shrink-0 drop-shadow-xs"
              />
            ) : (
              <LsfcVectorLogo size={32} className="shrink-0 drop-shadow-xs" />
            )}
            <div className="min-w-0">
              <h1
                className={`font-bold text-sm font-anek leading-tight truncate ${
                  theme === "purple" ? "text-[#902A8B]" : ""
                }`}
              >
                {settings.orgNameBn}
              </h1>
              <span
                className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 truncate ${
                  theme === "dark"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                    : "bg-emerald-50 text-[#37A448] border-emerald-200"
                }`}
              >
                লাইসেন্স: {toBanglaNumber(settings.licenseNo)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.orgNameBn}
                className="w-8 h-8 object-contain shrink-0"
              />
            ) : (
              <LsfcVectorLogo size={28} className="shrink-0" />
            )}
          </div>
        )}

        {isDrawer ? (
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-label="মেনু বন্ধ করুন"
            className="p-1.5 rounded-lg transition cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "সাইডবার প্রসারিত করুন" : "সাইডবার সংকুচিত করুন"}
            title={collapsed ? "সাইডবার প্রসারিত করুন" : "সাইডবার সংকুচিত করুন"}
            className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg transition cursor-pointer ${
              theme === "dark"
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-400 hover:text-[#902A8B] hover:bg-purple-50/70"
            } ${collapsed ? "mt-2" : ""}`}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Primary Action Button: নতুন ইনভয়েস (E-1, H-5) */}
      <div className="p-3 border-b border-inherit">
        <button
          type="button"
          id="btn-sidebar-new-invoice"
          onClick={() => handleTabChange("application")}
          aria-label="নতুন ইনভয়েস (Ctrl+N)"
          title="নতুন ইনভয়েস তৈরি (Ctrl+N)"
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold font-anek text-xs shadow-xs transition cursor-pointer ${
            collapsed ? "px-0" : ""
          } ${
            theme === "white"
              ? "bg-[#902A8B] hover:bg-[#7b2276] text-white"
              : "bg-[#37A448] hover:bg-[#2e8b3c] text-white"
          }`}
        >
          <FilePlus2 className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <span className="flex items-center justify-between w-full">
              <span>নতুন ইনভয়েস</span>
              <kbd className="text-[10px] px-1 py-0.2 bg-black/20 text-white/90 rounded font-mono">
                ^N
              </kbd>
            </span>
          )}
        </button>
      </div>

      {/* Navigation Groups - Cleaned D-11 (removed uppercase tracking-wider) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Group 1: দৈনন্দিন কাজ */}
        <div>
          {!collapsed ? (
            <div
              className={`px-2.5 pb-1.5 text-xs font-bold font-anek ${
                theme === "dark"
                  ? "text-slate-400"
                  : theme === "white"
                  ? "text-gray-500"
                  : "text-purple-800/70"
              }`}
            >
              দৈনন্দিন কাজ
            </div>
          ) : (
            <div className={`my-1 mx-auto w-6 border-t ${sidebarBorderClass}`} />
          )}
          <nav className="space-y-1">
            {DAILY_WORK_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleTabChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold font-anek rounded-full transition cursor-pointer w-full ${
                    collapsed ? "justify-center px-0" : ""
                  } ${
                    isActive
                      ? theme === "purple"
                        ? "bg-gradient-to-r from-purple-100/90 to-purple-50 text-[#902A8B] shadow-2xs border border-purple-200/80"
                        : themeClasses.navTabActive
                      : themeClasses.navTabInactive
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Group 2: ব্যবস্থাপনা */}
        <div>
          {!collapsed ? (
            <div
              className={`px-2.5 pb-1.5 pt-2 text-xs font-bold font-anek ${
                theme === "dark"
                  ? "text-slate-400"
                  : theme === "white"
                  ? "text-gray-500"
                  : "text-purple-800/70"
              }`}
            >
              ব্যবস্থাপনা
            </div>
          ) : (
            <div className={`my-1 mx-auto w-6 border-t ${sidebarBorderClass}`} />
          )}
          <nav className="space-y-1">
            {MANAGEMENT_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleTabChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold font-anek rounded-full transition cursor-pointer w-full ${
                    collapsed ? "justify-center px-0" : ""
                  } ${
                    isActive
                      ? theme === "purple"
                        ? "bg-gradient-to-r from-purple-100/90 to-purple-50 text-[#902A8B] shadow-2xs border border-purple-200/80"
                        : themeClasses.navTabActive
                      : themeClasses.navTabInactive
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom User info (B-7) */}
      <div className={`p-2.5 border-t ${sidebarBorderClass}`}>
        <div
          className={`p-2 rounded-xl border flex items-center gap-2 ${
            collapsed ? "justify-center" : ""
          } ${
            theme === "dark"
              ? "bg-slate-800/80 border-slate-700 text-slate-200"
              : theme === "white"
              ? "bg-white border-gray-200 text-gray-900"
              : "bg-purple-50/50 border-purple-100 text-slate-800"
          }`}
        >
          <div
            title={`${currentUser.displayName} (${getRoleLabel(currentUser.role)})`}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br from-[#902A8B] to-[#781e74] text-white shadow-2xs"
          >
            {currentUser.displayName.slice(0, 1)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-bold truncate leading-tight text-slate-800 dark:text-slate-100">
                {currentUser.displayName}
              </div>
              <div className="text-[10px] font-semibold mt-0.5 truncate leading-tight text-[#37A448]">
                {getRoleLabel(currentUser.role)}
              </div>
            </div>
          )}
          <button
            id="btn-sidebar-logout"
            aria-label="লগআউট করুন"
            title="লগআউট করুন"
            onClick={() => setShowLogoutModal(true)}
            className="p-1.5 rounded-lg transition cursor-pointer text-gray-400 hover:text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen ${themeClasses.pageBg} flex font-kalpurush transition-colors duration-150`}
    >
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 border-r transition-all duration-200 shrink-0 ${
          isSidebarCollapsed ? "w-[72px]" : "w-[232px]"
        } ${sidebarThemeClass}`}
      >
        {renderSidebarContent(isSidebarCollapsed, false)}
      </aside>

      {/* Mobile Drawer (Below 1024px) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <aside
            className={`relative z-10 w-[232px] max-w-[85vw] h-full shadow-2xl ${sidebarThemeClass}`}
          >
            {renderSidebarContent(false, true)}
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Streamlined Top Bar (D-7) */}
        <header
          className={`h-14 min-h-[56px] ${themeClasses.headerBg} sticky top-0 z-30 shadow-xs transition-colors duration-150 flex items-center pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-4 lg:pr-[15px] border-b`}
        >
          <div className="w-full flex items-center justify-between gap-3">
            {/* Left: Mobile hamburger & Current Page Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                aria-label="মেনু খুলুন"
                className={`lg:hidden p-1.5 rounded-lg border transition cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2
                className={`font-bold font-anek text-base sm:text-lg truncate ${
                  theme === "dark" ? "text-slate-100" : "text-gray-800"
                }`}
              >
                {PAGE_TITLES[activeTab] || "ড্যাশবোর্ড"}
              </h2>
            </div>

            {/* Right: Quick actions, Helpline, Profile menu (D-7, D-9) */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Fee Calculator Button (Ctrl+K) */}
              <button
                id="btn-open-service-calculator"
                onClick={() => setShowCalculatorModal(true)}
                aria-label="ফি পরীক্ষক ও ক্যালকুলেটর (Ctrl+K)"
                title="ফি পরীক্ষক (Ctrl+K)"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-800 text-purple-300 border-slate-700 hover:bg-slate-700"
                    : theme === "white"
                    ? "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                    : "bg-purple-50 text-[#902A8B] border-purple-200 hover:bg-purple-100"
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-[#37A448]" />
                <span className="hidden sm:inline">ফি পরীক্ষক</span>
                <kbd className="hidden md:inline-block text-[9px] px-1 bg-gray-200/80 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded font-mono font-bold">
                  ^K
                </kbd>
              </button>

              {/* Shortcuts button (F1) (H-5) */}
              <button
                type="button"
                onClick={() => setShowShortcutsModal(true)}
                aria-label="কীবোর্ড শর্টকাট সহায়তা (F1)"
                title="কীবোর্ড শর্টকাট (F1)"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                <span className="hidden xl:inline">শর্টকাট</span>
                <kbd className="hidden sm:inline-block text-[9px] px-1 bg-gray-200/80 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded font-mono font-bold">
                  F1
                </kbd>
              </button>

              {/* Helpline badge */}
              <div
                className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${
                  theme === "dark"
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-[#37A448]" />
                <span className="font-semibold text-gray-700 dark:text-slate-200">
                  {toBanglaNumber(settings.mobile)}
                </span>
              </div>

              {/* User Profile & Preferences Popover (D-7, D-9) */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  id="btn-header-profile"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  aria-expanded={isProfileMenuOpen}
                  aria-label="ব্যবহারকারী মেনু"
                  className={`flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition cursor-pointer ${
                    theme === "dark"
                      ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-[#902A8B] text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.displayName.slice(0, 1)}
                  </div>
                  <span className="hidden sm:inline font-bold text-xs truncate max-w-[100px]">
                    {currentUser.displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 text-xs font-kalpurush">
                    <div className="pb-2.5 border-b border-gray-100 dark:border-slate-800">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {currentUser.displayName}
                      </div>
                      <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#37A448] border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                        {getRoleLabel(currentUser.role)}
                      </div>
                    </div>

                    {/* Preferences / Theme section (D-9) */}
                    <div className="py-2.5 border-b border-gray-100 dark:border-slate-800">
                      <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1.5">
                        থিম পছন্দ:
                      </div>
                      <div className="flex items-center justify-between">
                        <ThemeSwitcher />
                      </div>
                    </div>

                    {/* Quick shortcuts link */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setShowShortcutsModal(true);
                      }}
                      className="w-full flex items-center gap-2 py-2 px-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-700 dark:text-slate-300 font-medium transition cursor-pointer"
                    >
                      <Keyboard className="w-4 h-4 text-gray-400" />
                      <span>কীবোর্ড শর্টকাট (F1)</span>
                    </button>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full mt-1 flex items-center gap-2 py-2 px-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg font-bold transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>সেশন থেকে লগআউট</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-4 lg:pr-[15px] py-6">
          {activeTab === "dashboard" && (
            <Dashboard
              onNavigateToForm={() => handleTabChange("application")}
              onNavigateToLedger={() => handleTabChange("ledger")}
              onNavigateToSettings={() => handleTabChange("settings")}
            />
          )}
          {activeTab === "application" && <ApplicationForm />}
          {activeTab === "ledger" && <CustomerLedger />}
          {activeTab === "expenses" && <ExpenseTracker />}
          {activeTab === "reports" && <ReportsHub />}
          {activeTab === "settings" && (
            <SettingsRoleGate>
              <SettingsHub />
            </SettingsRoleGate>
          )}
        </main>

        {/* Sleek Status Bar replacing heavy footer (D-6) */}
        <AppStatusBar />
      </div>

      {/* Service Calculator Test Modal (Ctrl+K) */}
      {showCalculatorModal && (
        <ServiceTestModal onClose={() => setShowCalculatorModal(false)} />
      )}

      {/* Shortcuts Help Modal (F1) */}
      {showShortcutsModal && (
        <ShortcutsHelpModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />
      )}

      {/* In-App Logout Confirmation Modal */}
      <ConfirmDialog
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          refresh();
          setShowLogoutModal(false);
        }}
        title="লগআউট নিশ্চিতকরণ"
        message="আপনি কি নিশ্চিতভাবে বর্তমান সেশন থেকে লগআউট করতে চান?"
        confirmLabel="হ্যাঁ, লগআউট"
        cancelLabel="বাতিল"
        variant="danger"
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;