import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useTheme, THEMES, AppTheme } from "../utils/themeContext";

export const ThemeSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, setTheme, currentThemeOption } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const CurrentIcon = currentThemeOption.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="btn-theme-switcher"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="অ্যাপ্লিকেশন থিম পরিবর্তন করুন"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
          theme === "dark"
            ? "bg-slate-800 text-purple-300 border-slate-700 hover:bg-slate-700"
            : theme === "white"
            ? "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
            : "bg-purple-50 text-[#902A8B] border-purple-200 hover:bg-purple-100"
        }`}
      >
        <CurrentIcon className="w-3.5 h-3.5" />
        {!compact && (
          <span className="hidden sm:inline font-anek font-bold">
            {currentThemeOption.shortName}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-xl shadow-xl border z-50 overflow-hidden bg-white border-gray-200 dark:bg-slate-900 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40">
            <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 font-anek">
              থিম নির্বাচন করুন
            </p>
          </div>

          <div className="p-1 space-y-0.5">
            {THEMES.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id as AppTheme);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition cursor-pointer text-left ${
                    isSelected
                      ? "bg-purple-50 text-[#902A8B] font-bold dark:bg-purple-950/60 dark:text-purple-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1 rounded-md ${
                        opt.id === "purple"
                          ? "bg-purple-100 text-[#902A8B] dark:bg-purple-900 dark:text-purple-200"
                          : opt.id === "dark"
                          ? "bg-slate-800 text-purple-300 dark:bg-slate-700 dark:text-purple-200"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-anek text-xs leading-tight">{opt.name}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-400 font-normal leading-tight">
                        {opt.tagline}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#902A8B] dark:text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
