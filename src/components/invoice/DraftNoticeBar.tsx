import React from "react";
import { FileEdit, RotateCcw } from "lucide-react";

export interface DraftNoticeBarProps {
  onClearDraft: () => void;
}

export const DraftNoticeBar: React.FC<DraftNoticeBarProps> = ({ onClearDraft }) => {
  return (
    <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs font-kalpurush shadow-2xs animate-in fade-in">
      <div className="flex items-center gap-2 text-[#902A8B] dark:text-purple-300">
        <FileEdit className="w-4 h-4 shrink-0" />
        <span>
          অসংরক্ষিত খসড়া পুনরুদ্ধার করা হয়েছে। আপনি যেখান থেকে কাজ রেখেছিলেন সেখান থেকেই শুরু করতে পারছেন।
        </span>
      </div>
      <button
        type="button"
        onClick={onClearDraft}
        className="px-2.5 py-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-[11px] font-bold font-anek flex items-center gap-1 transition cursor-pointer shrink-0"
      >
        <RotateCcw className="w-3 h-3" /> খসড়া রিসেট
      </button>
    </div>
  );
};
