import React from "react";
import { User, Layers, CreditCard, Check } from "lucide-react";

export interface InvoiceStepperProps {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
  isCustomerValid: boolean;
  hasCartItems: boolean;
}

export const InvoiceStepper: React.FC<InvoiceStepperProps> = ({
  currentStep,
  onStepClick,
  isCustomerValid,
  hasCartItems,
}) => {
  const steps = [
    {
      number: 1 as const,
      title: "ভূমি মালিকের তথ্য",
      subtitle: "নাম, মোবাইল ও এনআইডি",
      icon: User,
      isDone: isCustomerValid,
    },
    {
      number: 2 as const,
      title: "সেবা ও পরিমাপ",
      subtitle: "সেবা বাছাই ও কার্ট",
      icon: Layers,
      isDone: hasCartItems,
    },
    {
      number: 3 as const,
      title: "পরিশোধ ও রসিদ",
      subtitle: "টাকা গ্রহণ ও চালান",
      icon: CreditCard,
      isDone: false,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 shadow-xs">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
        {steps.map((s) => {
          const isActive = currentStep === s.number;
          const isDone = s.isDone;
          const IconComp = s.icon;

          return (
            <button
              key={s.number}
              type="button"
              onClick={() => onStepClick(s.number)}
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl transition text-left cursor-pointer border ${
                isActive
                  ? "bg-purple-50/80 dark:bg-purple-950/40 border-[#902A8B]/40 dark:border-purple-700/60 shadow-2xs"
                  : isDone
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  : "bg-slate-50/60 dark:bg-slate-800/40 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80"
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isActive
                    ? "bg-[#902A8B] text-white shadow-2xs"
                    : isDone
                    ? "bg-[#37A448] text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <IconComp className="w-3.5 h-3.5" />}
              </div>

              <div className="min-w-0 flex-1 hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    ০{s.number}.
                  </span>
                  <span
                    className={`text-xs font-bold font-anek truncate ${
                      isActive
                        ? "text-[#902A8B] dark:text-purple-300"
                        : isDone
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-kalpurush truncate">
                  {s.subtitle}
                </p>
              </div>

              <div className="sm:hidden text-[11px] font-bold font-anek truncate text-slate-700 dark:text-slate-200">
                {s.title.split(" ")[0]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
