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

function MainAppContent() {
  const { theme, themeClasses } = useTheme();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "application" | "ledger" | "expenses" | "reports" | "settings"
  >("dashboard");
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { settings } = useInstitutionSettings();
  const { currentUser, refresh } = useAuth();

  useEffect(() => {
    seedInitialDataIfEmpty();
    const migrated = migrateCustomerNumbers();
    if (migrated > 0) {
      console.info(`✅ ${migrated} জন ভূমি মালিকের জন্য নতুন নম্বর তৈরি হয়েছে।`);
    }
  }, []);

  return (
    <div className={`min-h-screen ${themeClasses.pageBg} flex flex-col font-kalpurush transition-colors duration-150`}>
      {/* Top Navbar */}
      <header className={`${themeClasses.headerBg} sticky top-0 z-30 shadow-xs transition-colors duration-150`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-16 py-2">
            {/* Logo and Center Title */}
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.orgNameBn}
                  className="w-10 h-10 object-contain drop-shadow-xs shrink-0"
                />
              ) : (
                <LsfcVectorLogo size={42} className="drop-shadow-xs" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`font-bold text-lg font-anek leading-none ${
                    theme === "dark" ? "text-purple-300" : "text-[#902A8B]"
                  }`}>
                    {settings.orgNameBn}
                  </h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    theme === "dark"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                      : "bg-emerald-50 text-[#37A448] border-emerald-200"
                  }`}>
                    লাইসেন্স নং: {toBanglaNumber(settings.licenseNo)}
                  </span>
                </div>
                {settings.taglineBn && (
                  <p className={`text-[11px] font-semibold mt-0.5 ${
                    theme === "dark" ? "text-emerald-400" : "text-[#37A448]"
                  }`}>
                    {settings.taglineBn}
                  </p>
                )}
                <p className={`text-[11px] mt-0.5 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}>
                  {settings.licensingAuthority} • পরিচালনায়: {settings.partnerOrg}
                </p>
              </div>
            </div>

            {/* Quick Actions & Contact */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Theme Switcher */}
              <ThemeSwitcher />

              <button
                id="btn-open-service-calculator"
                onClick={() => setShowCalculatorModal(true)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-800 text-purple-300 border-slate-700 hover:bg-slate-700"
                    : theme === "white"
                    ? "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                    : "bg-purple-50 text-[#902A8B] border-purple-200 hover:bg-purple-100"
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-[#37A448]" />
                <span>ফি পরীক্ষক</span>
              </button>

              <div className={`hidden lg:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-800 text-slate-300 border-slate-700"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}>
                <Phone className="w-3.5 h-3.5 text-[#37A448]" />
                <span className="font-medium">হেল্পলাইন:</span>
                <span className={`font-bold ${theme === "dark" ? "text-slate-100" : "text-gray-800"}`}>
                  {toBanglaNumber(settings.mobile)}
                </span>
              </div>

              {/* User / Auth State Badge */}
              {currentUser ? (
                <div className={`flex items-center gap-2 py-1 px-2.5 rounded-xl border ${
                  theme === "dark"
                    ? "bg-slate-800/80 border-slate-700 text-slate-200"
                    : "bg-purple-50/80 border-purple-200 text-gray-900"
                }`}>
                  <div className="w-6 h-6 rounded-full bg-[#902A8B] text-white flex items-center justify-center text-[10px] font-bold">
                    {currentUser.displayName.slice(0, 1)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className={`text-xs font-bold leading-none ${theme === "dark" ? "text-slate-100" : "text-gray-900"}`}>
                      {currentUser.displayName}
                    </div>
                    <div className="text-[10px] text-[#37A448] font-semibold mt-0.5 leading-none">
                      {currentUser.role === "admin"
                        ? "সুপার অ্যাডমিন"
                        : currentUser.role === "branch_incharge"
                        ? "কেন্দ্রের ইন-চার্জ"
                        : "অপারেটর / কর্মী"}
                    </div>
                  </div>
                  <button
                    id="btn-navbar-logout"
                    title="লগআউট করুন"
                    onClick={() => setShowLogoutModal(true)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="btn-navbar-login"
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#902A8B] hover:bg-[#7b2276] rounded-xl shadow-xs transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>সাইন-ইন</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className={`${themeClasses.navBarBg} transition-colors duration-150`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-2.5 overflow-x-auto py-1.5">
              <button
                id="nav-dashboard"
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-bold font-anek rounded-lg whitespace-nowrap transition cursor-pointer ${
                  activeTab === "dashboard"
                    ? themeClasses.navTabActive
                    : themeClasses.navTabInactive
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> ড্যাশবোর্ড
              </button>

              <button
                id="nav-application"
                onClick={() => setActiveTab("application")}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-bold font-anek rounded-lg whitespace-nowrap transition cursor-pointer ${
                  activeTab === "application"
                    ? themeClasses.navTabActive
                    : themeClasses.navTabInactive
                }`}
              >
                <FilePlus2 className="w-4 h-4" /> নতুন আবেদন ও ইনভয়েস
              </button>

              <button
                id="nav-ledger"
                onClick={() => setActiveTab("ledger")}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-bold font-anek rounded-lg whitespace-nowrap transition cursor-pointer ${
                  activeTab === "ledger"
                    ? themeClasses.navTabActive
                    : themeClasses.navTabInactive
                }`}
              >
                <Users className="w-4 h-4" /> ভূমি মালিক লেজার
              </button>

              <button
                id="nav-expenses"
                onClick={() => setActiveTab("expenses")}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-bold font-anek rounded-lg whitespace-nowrap transition cursor-pointer ${
                  activeTab === "expenses"
                    ? themeClasses.navTabActive
                    : themeClasses.navTabInactive
                }`}
              >
                <Wallet className="w-4 h-4" /> দৈনন্দিন খরচ
              </button>

              <button
                id="nav-reports"
                onClick={() => setActiveTab("reports")}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-bold font-anek rounded-lg whitespace-nowrap transition cursor-pointer ${
                  activeTab === "reports"
                    ? themeClasses.navTabActive
                    : themeClasses.navTabInactive
                }`}
              >
                <BarChart3 className="w-4 h-4" /> রিপোর্ট ও স্টেটমেন্ট
              </button>

              <button
                id="nav-settings"
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-bold font-anek rounded-lg whitespace-nowrap transition cursor-pointer ${
                  activeTab === "settings"
                    ? themeClasses.navTabActive
                    : themeClasses.navTabInactive
                }`}
              >
                <SettingsIcon className="w-4 h-4" /> সেটিংস ও ব্যাকআপ
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-[#902A8B]">{settings.orgNameBn}</span> • {settings.addressBn}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>হেল্পলাইন: {toBanglaNumber(settings.mobile)}</span>
            <span>অফিস সময়: {settings.officeHours}</span>
          </div>
        </div>
      </footer>

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