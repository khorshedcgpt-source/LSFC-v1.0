import React from "react";
import { Keyboard } from "lucide-react";
import { Modal } from "./Modal";

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    keys: ["Ctrl", "N"],
    description: "সরাসরি নতুন আবেদন ও ইনভয়েস ফর্ম খুলুন",
    tag: "সর্বাধিক ব্যবহৃত",
  },
  {
    keys: ["Ctrl", "K"],
    description: "দ্রুত ফি পরীক্ষক ও সেবা ক্যালকুলেটর চালু করুন",
    tag: "হিসাব",
  },
  {
    keys: ["Ctrl", "Enter"],
    description: "আবেদন ফর্মে দ্রুত ইনভয়েস চূড়ান্তকরণ ও সংরক্ষণ",
    tag: "ফর্ম এন্ট্রি",
  },
  {
    keys: ["F1"],
    description: "কীবোর্ড শর্টকাট ও সহায়তা চিটশিট দেখুন",
    tag: "সহায়তা",
  },
  {
    keys: ["Esc"],
    description: "যেকোনো খোলা পপ-আপ বা মোডাল বন্ধ করুন",
    tag: "নেভিগেশন",
  },
  {
    keys: ["Tab"],
    description: "ফর্মের পরবর্তী ইনপুট ফিল্ডে সরাসরি গমন",
    tag: "ডেটা এন্ট্রি",
  },
];

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="কীবোর্ড শর্টকাট ও দ্রুত কমান্ড"
      subtitle="মাউস স্পর্শ না করেই সিস্টেমের প্রধান কাজগুলো দ্রুত সম্পন্ন করুন"
      icon={<Keyboard className="w-5 h-5 text-white" />}
      maxWidth="lg"
    >
      <div className="space-y-3 font-kalpurush">
        <div className="grid grid-cols-1 gap-2.5">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-purple-50/50 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-800">
                  {item.description}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-[#902A8B] font-semibold">
                  {item.tag}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.keys.map((k, kIdx) => (
                  <React.Fragment key={kIdx}>
                    <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-2xs">
                      {k}
                    </kbd>
                    {kIdx < item.keys.length - 1 && (
                      <span className="text-xs text-gray-400 font-bold">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span>
            💡 <strong>টিপ:</strong> ফর্ম পূরণের সময় মাউস ছাড়া দ্রুত কাজ করার জন্য শুধুমাত্র <code>Tab</code> ও <code>Enter</code> ব্যবহার করুন।
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#902A8B] hover:bg-[#7b2276] text-white rounded-lg text-xs font-bold font-anek cursor-pointer transition"
          >
            বুঝেছি
          </button>
        </div>
      </div>
    </Modal>
  );
};
