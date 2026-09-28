import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FilePlus2,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  Calculator,
  Phone,
  LogIn,
  LogOut,
  Wallet,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { ApplicationForm } from "./components/ApplicationForm";
import { CustomerLedger } from "./components/CustomerLedger";
import { ExpenseTracker } from "./components/expenses/ExpenseTracker";
import { ReportsHub } from "./components/reports/ReportsHub";
import { SettingsHub } from "./components/settings/SettingsHub";
import { ServiceTestModal } from "./components/ServiceTestModal";
import { LsfcVectorLogo } from "./components/LsfcVectorLogo";
import { useInstitutionSettings } from "./utils/institutionSettings";
import { seedInitialDataIfEmpty } from "./utils/sampleData";
import { migrateCustomerNumbers } from "./utils/customerStore";
import { toBanglaNumber } from "./components/InvoicePrint";
import { useAuth, logout } from "./utils/authStore";
import { SettingsRoleGate } from "./components/auth/SettingsRoleGate";
import { LoginModal } from "./components/auth/LoginModal";
import { AuthGate } from "./components/auth/AuthGate";
import { ThemeProvider, useTheme } from "./utils/themeContext";
import { ThemeSwitcher } from "./components/ThemeSwitcher";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "ড্যাশবোর্ড",
  application: "নতুন আবেদন ও ইনভয়েস",
  ledger: "ভূমি মালিক লেজার",
  expenses: "দৈনন্দিন খরচ",
  reports: "রিপোর্ট ও স্টেটমেন্ট",
  settings: "সেটিংস ও ব্যাকআপ",
};

interface NavItem {
  id: "dashboard" | "application" | "ledger" | "expenses" | "reports" | "settings";
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
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "application" | "ledger" | "expenses" | "reports" | "settings"
  >("dashboard");
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("lsfc_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const { settings } = useInstitutionSettings();
  const { currentUser, refresh } = useAuth();

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

  useEffect(() => {
    seedInitialDataIfEmpty();
    const migrated = migrateCustomerNumbers();
    if (migrated > 0) {
      console.info(`✅ ${migrated} জন ভূমি মালিকের জন্য নতুন নম্বর তৈরি হয়েছে।`);
    }
  }, []);

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
      <div className={`p-3.5 border-b flex items-center ${collapsed ? "justify-center" : "justify-between"} ${sidebarBorderClass}`}>
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
              <h1 className={`font-bold text-sm font-anek leading-tight truncate ${
                theme === "purple" ? "text-[#902A8B]" : ""
              }`}>
                {settings.orgNameBn}
              </h1>
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 truncate ${
                theme === "dark"
                  ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                  : "bg-emerald-50 text-[#37A448] border-emerald-200"
              }`}>
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
            title={collapsed ? "প্রসারিত করুন" : "সংকুচিত করুন"}
            className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg transition cursor-pointer ${
              theme === "dark"
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-400 hover:text-[#902A8B] hover:bg-purple-50/70"
            } ${collapsed ? "mt-2" : ""}`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Primary Action Button: নতুন ইনভয়েস (always visible) */}
      <div className="p-3 border-b border-inherit">
        <button
          type="button"
          id="btn-sidebar-new-invoice"
          onClick={() => {
            setActiveTab("application");
            if (isDrawer) setIsMobileDrawerOpen(false);
          }}
          aria-label="নতুন ইনভয়েস"
          title="নতুন ইনভয়েস"
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold font-anek text-xs shadow-xs transition cursor-pointer ${
            collapsed ? "px-0" : ""
          } ${
            theme === "white"
              ? "bg-[#902A8B] hover:bg-[#7b2276] text-white"
              : "bg-[#37A448] hover:bg-[#2e8b3c] text-white"
          }`}
        >
          <FilePlus2 className="w-4 h-4 shrink-0" />
          {!collapsed && <span>নতুন ইনভয়েস</span>}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Group 1: দৈনন্দিন কাজ */}
        <div>
          {!collapsed ? (
            <div className={`px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${
              theme === "dark"
                ? "text-slate-400"
                : theme === "white"
                ? "text-gray-500"
                : "text-purple-800/60"
            }`}>
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
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isDrawer) setIsMobileDrawerOpen(false);
                  }}
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
            <div className={`px-2.5 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider ${
              theme === "dark"
                ? "text-slate-400"
                : theme === "white"
                ? "text-gray-500"
                : "text-purple-800/60"
            }`}>
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
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isDrawer) setIsMobileDrawerOpen(false);
                  }}
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

      {/* Bottom User / Auth Section */}
      <div className={`p-2.5 border-t ${sidebarBorderClass}`}>
        {currentUser ? (
          <div className={`p-2 rounded-xl border flex items-center gap-2 ${
            collapsed ? "justify-center" : ""
          } ${
            theme === "dark"
              ? "bg-slate-800/80 border-slate-700 text-slate-200"
              : theme === "white"
              ? "bg-white border-gray-200 text-gray-900"
              : "bg-purple-50/50 border-purple-100 text-slate-800"
          }`}>
            <div
              title={`${currentUser.displayName} (${
                currentUser.role === "admin"
                  ? "সুপার অ্যাডমিন"
                  : currentUser.role === "branch_incharge"
                  ? "কেন্দ্রের ইন-চার্জ"
                  : "অপারেটর / কর্মী"
              })`}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br from-[#902A8B] to-[#781e74] text-white shadow-2xs"
            >
              {currentUser.displayName.slice(0, 1)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs font-bold truncate leading-tight text-slate-800">
                  {currentUser.displayName}
                </div>
                <div className="text-[10px] font-semibold mt-0.5 truncate leading-tight text-[#37A448]">
                  {currentUser.role === "admin"
                    ? "সুপার অ্যাডমিন"
                    : currentUser.role === "branch_incharge"
                    ? "কেন্দ্রের ইন-চার্জ"
                    : "অপারেটর / কর্মী"}
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
        ) : (
          <button
            id="btn-sidebar-login"
            aria-label="সাইন-ইন"
            title="সাইন-ইন"
            onClick={() => {
              setShowLoginModal(true);
              if (isDrawer) setIsMobileDrawerOpen(false);
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer ${
              collapsed ? "px-0" : ""
            } ${
              theme === "white"
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-[#902A8B] text-white hover:bg-[#7b2276]"
            }`}
          >
            <LogIn className="w-4 h-4 shrink-0" />
            {!collapsed && <span>সাইন-ইন</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${themeClasses.pageBg} flex font-kalpurush transition-colors duration-150`}>
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
          <aside className={`relative z-10 w-[232px] max-w-[85vw] h-full shadow-2xl ${sidebarThemeClass}`}>
            {renderSidebarContent(false, true)}
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Slim Top Bar (~56px) */}
        <header className={`h-14 min-h-[56px] ${themeClasses.headerBg} sticky top-0 z-30 shadow-xs transition-colors duration-150 flex items-center pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-4 lg:pr-[15px] border-b`}>
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
              <h2 className={`font-bold font-anek text-base sm:text-lg truncate ${
                theme === "dark" ? "text-slate-100" : "text-gray-800"
              }`}>
                {PAGE_TITLES[activeTab] || "ড্যাশবোর্ড"}
              </h2>
            </div>

            {/* Center / Right: Search Bar & Actions matching reference UI */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 dark:bg-slate-800/90 rounded-full border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 w-44 lg:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-hidden w-full text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                aria-label="বিজ্ঞপ্তি"
                className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
              </button>

              <button
                id="btn-open-service-calculator"
                onClick={() => setShowCalculatorModal(true)}
                aria-label="ফি পরীক্ষক"
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
              </button>

              <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-800 text-slate-300 border-slate-700"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}>
                <Phone className="w-3.5 h-3.5 text-[#37A448]" />
                <span className="font-medium hidden md:inline">হেল্পলাইন:</span>
                <span className={`font-bold ${theme === "dark" ? "text-slate-100" : "text-gray-800"}`}>
                  {toBanglaNumber(settings.mobile)}
                </span>
              </div>

              {/* Theme Switcher */}
              <ThemeSwitcher />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-4 lg:pr-[15px] py-6">
          {activeTab === "dashboard" && (
            <Dashboard onNavigateToForm={() => setActiveTab("application")} />
          )}
          {activeTab === "application" && (
            <AuthGate
              title="আবেদন ও ইনভয়েস তৈরিতে সাইন-ইন প্রয়োজন"
              description="নতুন ভূমিসেবা আবেদন ও ইনভয়েস তৈরি করতে অনুগ্রহ করে সাইন-ইন করুন।"
            >
              <ApplicationForm />
            </AuthGate>
          )}
          {activeTab === "ledger" && (
            <AuthGate
              title="ভূমি মালিক লেজার দেখতে সাইন-ইন প্রয়োজন"
              description="ভূমি মালিক খতিয়ান ও লেনদেন দেখতে অনুগ্রহ করে সাইন-ইন করুন।"
            >
              <CustomerLedger />
            </AuthGate>
          )}
          {activeTab === "expenses" && <ExpenseTracker />}
          {activeTab === "reports" && <ReportsHub />}
          {activeTab === "settings" && (
            <SettingsRoleGate>
              <SettingsHub />
            </SettingsRoleGate>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto py-4 text-xs text-gray-500">
          <div className="w-full pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-4 lg:pr-[15px] flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-bold text-[#902A8B]">{settings.orgNameBn}</span> • {settings.addressBn}
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>হেল্পলাইন: {toBanglaNumber(settings.mobile)}</span>
              <span>অফিস সময়: {settings.officeHours}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Service Calculator Test Modal */}
      {showCalculatorModal && (
        <ServiceTestModal onClose={() => setShowCalculatorModal(false)} />
      )}

      {/* User Login & Role Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* In-App Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-[#EC2324] rounded-full flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 font-anek">
              লগআউট নিশ্চিতকরণ
            </h3>
            <p className="text-xs text-gray-500 mt-1.5 mb-6">
              আপনি কি নিশ্চিতভাবে বর্তমান সেশন থেকে লগআউট করতে চান?
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-1/2 py-2 px-4 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                id="btn-confirm-logout"
                onClick={() => {
                  logout();
                  refresh();
                  setShowLogoutModal(false);
                }}
                className="w-1/2 py-2 px-4 text-xs font-bold text-white bg-[#EC2324] hover:bg-red-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                হ্যাঁ, লগআউট
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
}

export default App;