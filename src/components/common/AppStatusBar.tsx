import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, ShieldCheck, Database, HardDrive, UserCheck } from "lucide-react";
import { useAuth, getRoleLabel } from "../../utils/authStore";
import { useInstitutionSettings } from "../../utils/institutionSettings";
import { toBanglaNumber } from "../InvoicePrint";

export const AppStatusBar: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useInstitutionSettings();
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [lastBackup, setLastBackup] = useState<string | null>(() => {
    try {
      return localStorage.getItem("lsfc.last_backup");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const checkBackup = () => {
      try {
        setLastBackup(localStorage.getItem("lsfc.last_backup"));
      } catch {
        // ignore
      }
    };

    window.addEventListener("storage", checkBackup);
    window.addEventListener("lsfc:backup-completed", checkBackup);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", checkBackup);
      window.removeEventListener("lsfc:backup-completed", checkBackup);
    };
  }, []);

  const formatBackupDate = (isoStr: string | null) => {
    if (!isoStr) return "কোনো ব্যাকআপ নেই";
    try {
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return "কোনো ব্যাকআপ নেই";
      const day = toBanglaNumber(d.getDate());
      const monthNames = [
        "জানুয়ারি",
        "ফেব্রুয়ারি",
        "মার্চ",
        "এপ্রিল",
        "মে",
        "জুন",
        "জুলাই",
        "আগস্ট",
        "সেপ্টেম্বর",
        "অক্টোবর",
        "নভেম্বর",
        "ডিসেম্বর",
      ];
      const month = monthNames[d.getMonth()];
      const year = toBanglaNumber(d.getFullYear());
      return `${day} ${month}, ${year}`;
    } catch {
      return "কোনো ব্যাকআপ নেই";
    }
  };

  return (
    <footer className="h-8 min-h-[32px] bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 text-[11px] font-kalpurush text-gray-600 dark:text-slate-400 select-none flex items-center px-4 sm:px-6 justify-between shrink-0 shadow-2xs z-20">
      {/* Left: Organization & Location */}
      <div className="flex items-center gap-3 truncate">
        <span className="flex items-center gap-1 font-bold text-gray-800 dark:text-slate-200 truncate">
          <HardDrive className="w-3.5 h-3.5 text-[#902A8B] shrink-0" />
          <span className="truncate">{settings.orgNameBn}</span>
        </span>
        <span className="hidden md:inline-block text-gray-300 dark:text-slate-700">•</span>
        <span className="hidden md:inline-block text-gray-500 dark:text-slate-400 truncate">
          লাইসেন্স: {toBanglaNumber(settings.licenseNo)}
        </span>
      </div>

      {/* Right: User, Connectivity, Backup, Version */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 font-medium">
        {/* Active user badge */}
        {currentUser && (
          <div
            title={`বর্তমান ব্যবহারকারী: ${currentUser.displayName} (${getRoleLabel(currentUser.role)})`}
            className="hidden lg:flex items-center gap-1 text-gray-700 dark:text-slate-300"
          >
            <UserCheck className="w-3 h-3 text-[#902A8B]" />
            <span className="font-semibold">{currentUser.displayName}</span>
            <span className="text-[10px] text-gray-400">({getRoleLabel(currentUser.role)})</span>
          </div>
        )}

        <span className="hidden lg:inline-block text-gray-300 dark:text-slate-700">•</span>

        {/* Backup status */}
        <div
          title="শেষ ব্যাকআপের স্থিতি"
          className="hidden sm:flex items-center gap-1.5 text-gray-600 dark:text-slate-400"
        >
          <Database className="w-3 h-3 text-[#37A448]" />
          <span>ব্যাকআপ:</span>
          <span className="font-semibold text-gray-700 dark:text-slate-300">
            {formatBackupDate(lastBackup)}
          </span>
        </div>

        <span className="hidden sm:inline-block text-gray-300 dark:text-slate-700">•</span>

        {/* Connectivity status */}
        <div
          title={isOnline ? "নেটওয়ার্ক সংযুক্ত রয়েছে" : "অফলাইন মোড (লোকাল স্টোরেজ কার্যকর)"}
          className="flex items-center gap-1"
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3 text-[#37A448]" />
              <span className="text-[#37A448] font-semibold hidden xs:inline">অনলাইন</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-500" />
              <span className="text-amber-600 font-semibold hidden xs:inline">অফলাইন (লোকাল)</span>
            </>
          )}
        </div>

        <span className="text-gray-300 dark:text-slate-700">•</span>

        {/* System Version */}
        <div className="flex items-center gap-1 text-gray-500 dark:text-slate-400 font-mono text-[10px]">
          <ShieldCheck className="w-3 h-3 text-[#902A8B]" />
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};
