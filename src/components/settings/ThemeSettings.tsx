import React from "react";
import { Check, Palette, Monitor } from "lucide-react";
import { useTheme, THEMES, AppTheme } from "../../utils/themeContext";

export const ThemeSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-gray-900 font-anek flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#902A8B]" />
          সিস্টেম ও ইন্টারফেস থিম
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          ভূমিসেবা সহায়তা কেন্দ্র পোর্টালের ডিসপ্লে থিম আপনার পছন্দ ও কাজের পরিবেশ অনুযায়ী নির্ধারণ করুন।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {THEMES.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id as AppTheme)}
              className={`text-left p-4 rounded-xl border-2 transition-all relative cursor-pointer ${
                isSelected
                  ? "border-[#902A8B] bg-purple-50/50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#902A8B] text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}

              {/* Theme Mockup Visual */}
              <div
                className={`w-full h-24 rounded-lg mb-3 border p-2 flex flex-col justify-between overflow-hidden ${
                  opt.id === "purple"
                    ? "bg-slate-50 border-purple-200"
                    : opt.id === "dark"
                    ? "bg-slate-950 border-slate-800"
                    : "bg-[#fcfcfd] border-gray-200"
                }`}
              >
                {/* Header Mockup */}
                <div
                  className={`h-4 rounded flex items-center px-1.5 justify-between ${
                    opt.id === "dark" ? "bg-slate-900" : "bg-white"
                  }`}
                >
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#902A8B]" />
                    <div className="w-8 h-1.5 rounded-xs bg-gray-300 dark:bg-slate-700" />
                  </div>
                  <div className="w-3 h-1.5 rounded-xs bg-emerald-400" />
                </div>

                {/* Nav Bar Mockup */}
                <div
                  className={`h-3 rounded flex items-center px-1 gap-1 ${
                    opt.id === "purple"
                      ? "bg-[#902A8B]"
                      : opt.id === "dark"
                      ? "bg-slate-800"
                      : "bg-slate-200"
                  }`}
                >
                  <div className="w-4 h-1.5 rounded-xs bg-white/90" />
                  <div className="w-4 h-1.5 rounded-xs bg-white/40" />
                  <div className="w-4 h-1.5 rounded-xs bg-white/40" />
                </div>

                {/* Content Body Mockup */}
                <div className="grid grid-cols-2 gap-1">
                  <div
                    className={`h-7 rounded p-1 flex flex-col justify-between ${
                      opt.id === "dark"
                        ? "bg-slate-900 border border-slate-800"
                        : "bg-white border border-gray-100 shadow-2xs"
                    }`}
                  >
                    <div className="w-6 h-1 rounded-xs bg-gray-300 dark:bg-slate-700" />
                    <div className="w-10 h-2 rounded-xs bg-purple-200 dark:bg-purple-900/60" />
                  </div>
                  <div
                    className={`h-7 rounded p-1 flex flex-col justify-between ${
                      opt.id === "dark"
                        ? "bg-slate-900 border border-slate-800"
                        : "bg-white border border-gray-100 shadow-2xs"
                    }`}
                  >
                    <div className="w-6 h-1 rounded-xs bg-gray-300 dark:bg-slate-700" />
                    <div className="w-8 h-2 rounded-xs bg-emerald-200 dark:bg-emerald-900/60" />
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    opt.id === "purple"
                      ? "bg-purple-100 text-[#902A8B]"
                      : opt.id === "dark"
                      ? "bg-slate-800 text-purple-300"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900 font-anek">{opt.name}</h4>
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{opt.tagline}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-gray-700 space-y-1">
        <p className="font-bold text-[#902A8B] flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" /> থিম সম্পর্কিত তথ্য:
        </p>
        <p className="text-gray-600">
          নির্বাচিত থিমটি আপনার ব্রাউজারে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে। ইনভয়েস প্রিন্ট করার সময় যেকোনো থিমেই প্রিন্টআউট সবসময় পরিষ্কার সাদা কাগজ ও অফিশিয়াল স্ট্যান্ডার্ড অনুযায়ী নিখুঁতভাবে প্রিন্ট হবে।
        </p>
      </div>
    </div>
  );
};
