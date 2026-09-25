import React, { useState } from "react";
import { X, BookOpen, ShieldCheck, CheckCircle2, Copy, Check, Sparkles, Code2 } from "lucide-react";
import { LSFC_PROJECT_DOCUMENTATION } from "../../utils/projectDocumentation";

export const DeveloperDocsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai_prompt" | "policy">("ai_prompt");

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(LSFC_PROJECT_DOCUMENTATION);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = LSFC_PROJECT_DOCUMENTATION;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-[#902A8B] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#FFF200]" />
            <div>
              <h3 className="font-bold text-sm sm:text-base font-anek leading-tight">
                প্রজেক্ট ডকুমেন্টেশন ও এআই এজেন্ট প্রম্পট
              </h3>
              <p className="text-[11px] text-purple-100 font-kalpurush">
                এআই এজেন্ট বা নতুন ডেভেলপারকে দেওয়ার জন্য প্রস্তুত বিবরণী
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar with One-Click Copy */}
        <div className="bg-purple-50/80 border-b border-purple-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-purple-200">
            <button
              onClick={() => setActiveTab("ai_prompt")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === "ai_prompt"
                  ? "bg-[#902A8B] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>এআই প্রম্পট</span>
            </button>
            <button
              onClick={() => setActiveTab("policy")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === "policy"
                  ? "bg-[#902A8B] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>নীতিমালা ও ফি</span>
            </button>
          </div>

          {/* Prominent One-Click Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-[#37A448] hover:bg-[#2e8b3c] text-white active:scale-95"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>সফলভাবে কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>এক ক্লিকে সম্পূর্ণ প্রম্পট কপি করুন</span>
              </>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-gray-700 leading-relaxed font-kalpurush">
          {copied && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                ক্লিপবোর্ডে সম্পূর্ণ প্রজেক্ট ডকুমেন্টেশন কপি করা হয়েছে। এখন যে কোনো এআই চ্যাট বা এজেন্টে সরাসরি পেস্ট (Ctrl+V) করতে পারেন।
              </span>
            </div>
          )}

          {activeTab === "ai_prompt" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-[11px] font-mono">lsfc-agent-prompt.md</span>
                <span className="text-[11px] text-gray-400">ক্লিক করে কপি বা নিচে স্ক্রোল করে পড়তে পারেন</span>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto max-h-[50vh] border border-slate-800 selection:bg-[#902A8B] selection:text-white">
                {LSFC_PROJECT_DOCUMENTATION}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <section className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h4 className="font-bold text-sm text-[#902A8B] mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#37A448]" />
                  ১. সরকারি লাইসেন্স ও আইনি ভিত্তি
                </h4>
                <p>
                  ভূমিসেবা সহায়তা কেন্দ্র (LSFC) গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত একটি ফ্রন্ট-ডেস্ক উদ্যোগ।
                  লাইসেন্স নং ০২, পরিচালনায় খন্দকার কম্পিউটার্স। নাগরিকগণ যাতে সরকারি পোর্টালের সঠিক সেবা পেতে পারেন,
                  সেজন্য সরকারি ফি, ১% পেমেন্ট গেটওয়ে ফি এবং নির্ধারিত সেবা মাশুল অনুসারে ভেক্টর পিডিএফ রসিদ প্রদান করা বাধ্যতামূলক।
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-sm text-gray-900 border-b pb-1">২. অনুমোদিত সরকারি ও কেন্দ্র ফি চার্ট</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border p-3 rounded-xl bg-gray-50">
                    <p className="font-bold text-[#902A8B]">ই-নামজারি (Mutation)</p>
                    <p>• সরকারি কোর্ট ফি ও নোটিশ ফি: ৳৭০</p>
                    <p>• ১% গেটওয়ে ফি: ৳০.৭০</p>
                    <p>• কেন্দ্র সেবা ফি: ৳২৭০ (২০ পৃষ্ঠা ও ৪ আবেদনকারী পর্যন্ত)</p>
                    <p>• অতিরিক্ত পৃষ্ঠা: ৳৩/পৃষ্ঠা, অতিরিক্ত আবেদনকারী: ৳১০/জন</p>
                  </div>

                  <div className="border p-3 rounded-xl bg-gray-50">
                    <p className="font-bold text-[#902A8B]">খতিয়ান / পর্চা আবেদন</p>
                    <p>• সরকারি ফি: ৳১২০</p>
                    <p>• ডাক ফি: ৳৪০ (যদি ডাকযোগে ডেলিভারি হয়)</p>
                    <p>• কেন্দ্র সেবা ফি: ৳১০০</p>
                  </div>

                  <div className="border p-3 rounded-xl bg-gray-50">
                    <p className="font-bold text-[#902A8B]">মৌজা ম্যাপ / নকশা</p>
                    <p>• সরকারি ফি: ৳৫৪৫</p>
                    <p>• সরকারি ডাক মাশুল: ৳১১০</p>
                    <p>• ১% গেটওয়ে ফি: ৳৫.৪৫</p>
                    <p>• কেন্দ্র সেবা ফি: ৳১০০ (মোট ৳৭৬০.৪৫)</p>
                  </div>

                  <div className="border p-3 rounded-xl bg-gray-50">
                    <p className="font-bold text-[#902A8B]">ভূমি উন্নয়ন কর (LD Tax)</p>
                    <p>• করের পরিমাণ: জমির প্রকার অনুযায়ী পরিবর্তনশীল</p>
                    <p>• কেন্দ্র দাখিলা ফি: ৳২০ (অনলাইন) বা ৳৪০ (প্রিন্ট কপি সহ)</p>
                  </div>
                </div>
              </section>

              <section className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-bold text-sm text-[#37A448] mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  ৩. গ্লোবাল পিডিএফ ও বাংলা ফন্ট স্ট্যান্ডার্ড
                </h4>
                <p>
                  এই প্রজেক্টের সকল পিডিএফ pure vector text-based (কোনো স্ক্রিনশট বা ক্যানভাস ইমেজ নয়)।
                  টাইটেল ও ব্র্যান্ডিং-এর জন্য <strong>Anek Bangla (Bold 700)</strong> এবং বডি টেক্সট, টেবিল ও তথ্যের জন্য
                  <strong>Kalpurush (400)</strong> ব্যবহার করা হয়েছে।
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
