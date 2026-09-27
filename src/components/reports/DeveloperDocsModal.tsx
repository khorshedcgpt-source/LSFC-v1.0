import React, { useState } from "react";
import { X, BookOpen, ShieldCheck, CheckCircle2, Copy, Check, Sparkles, Code2 } from "lucide-react";
import { LSFC_PROJECT_DOCUMENTATION } from "../../utils/projectDocumentation";
import { useInstitutionSettings, DEFAULT_INSTITUTION_SETTINGS, ServiceSettingItem } from "../../utils/institutionSettings";
import { toBanglaNumber } from "../../utils/bengaliNumbers";

export const DeveloperDocsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai_prompt" | "policy">("policy");
  const { settings } = useInstitutionSettings();

  const activeServices: ServiceSettingItem[] = [
    ...(settings.services && settings.services.length > 0
      ? settings.services
      : DEFAULT_INSTITUTION_SETTINGS.services),
  ]
    .filter((s) => s.isActive)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const renderServiceFeeDetails = (svc: ServiceSettingItem) => {
    if (svc.id === "svc-namjari" || svc.builtInType === "namjari") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি কোর্ট ও নোটিশ ফি:</span> ৳{toBanglaNumber(svc.govtFee || 70)}</p>
          <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> ৳০.৭০</p>
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(svc.centerFee)} (২০ পৃষ্ঠা ও ৪ আবেদনকারী পর্যন্ত)</p>
          <p className="text-[11px] text-gray-500">• অতিরিক্ত পৃষ্ঠা: ৳৩/পৃষ্ঠা, অতিরিক্ত আবেদনকারী: ৳১০/জন</p>
        </div>
      );
    }
    if (svc.id === "svc-tax") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি কর:</span> জমির পরিমাণ, ধরন ও বকেয়া বছর অনুযায়ী অনলাইন হিসাব</p>
          <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> সরকারি নিয়মানুযায়ী প্রযোজ্য</p>
          <div className="bg-purple-50/70 p-2 rounded-lg border border-purple-100 text-[11px] space-y-0.5 mt-1.5">
            <p className="font-semibold text-[#902A8B]">কেন্দ্র সেবা মাশুল ধাপসমূহ:</p>
            {svc.subServices?.map((sub) => (
              <p key={sub.id}>• {sub.label}: ৳{toBanglaNumber(sub.fee)}</p>
            ))}
          </div>
        </div>
      );
    }
    if (svc.id === "svc-khatian") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি ফি:</span> ৳{toBanglaNumber(svc.govtFee || 120)} (অনলাইন/কাউন্টার কপি)</p>
          <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> ৳১.২০</p>
          <p>• <span className="font-semibold">ডাকযোগে বিতরণ মাশুল:</span> ৳৪০ (শুধুমাত্র ডাকযোগে ডেলিভারি নিলে)</p>
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(svc.centerFee || 100)}</p>
        </div>
      );
    }
    if (svc.id === "svc-dcr") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি ডিসিআর ফি:</span> ৳{toBanglaNumber(svc.govtFee || 1100)}</p>
          <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> ৳১১.০০</p>
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(svc.centerFee || 100)}</p>
        </div>
      );
    }
    if (svc.id === "svc-miss-case") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি ফি:</span> ৳০ (প্রযোজ্য নয়)</p>
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(svc.centerFee || 100)} (ফ্ল্যাট ফি)</p>
          <div className="bg-purple-50/70 p-2 rounded-lg border border-purple-100 text-[11px] space-y-0.5 mt-1.5">
            <p className="font-semibold text-[#902A8B]">সংশোধনের আওতাভুক্ত বিষয়সমূহ:</p>
            {svc.subServices?.map((sub) => (
              <p key={sub.id}>• {sub.label}</p>
            ))}
          </div>
        </div>
      );
    }
    if (svc.id === "svc-mouza") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি ফি:</span> ৳{toBanglaNumber(svc.govtFee || 545)}</p>
          <p>• <span className="font-semibold">সরকারি ডাক মাশুল:</span> ৳১১০ (ডাকযোগে ডেলিভারি হলে)</p>
          <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> ৳৫.৪৫</p>
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(svc.centerFee || 100)}</p>
        </div>
      );
    }
    if (svc.id === "svc-citizen-profile") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি ফি:</span> ৳০ (সরকারি কোনো ফি নেই)</p>
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(svc.centerFee || 50)}</p>
          <p className="text-[11px] text-gray-500">• সেবা আওতা: এনআইডি ভেরিফিকেশন, প্রোফাইল তৈরি ও ওটিপি সংযোগ</p>
        </div>
      );
    }
    return (
      <div className="text-xs space-y-1 text-gray-700">
        <p>• <span className="font-semibold">সরকারি ফি:</span> {svc.govtFee > 0 ? `৳${toBanglaNumber(svc.govtFee)}` : "প্রযোজ্য নয় (৳০)"}</p>
        {svc.gatewayFee > 0 && <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> প্রযোজ্য</p>}
        {svc.postalFee > 0 && <p>• <span className="font-semibold">ডাক মাশুল:</span> ৳{toBanglaNumber(svc.postalFee)}</p>}
        <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(svc.centerFee)}</p>
        {svc.subServices && svc.subServices.length > 0 && (
          <div className="bg-purple-50/70 p-2 rounded-lg border border-purple-100 text-[11px] space-y-0.5 mt-1.5">
            <p className="font-semibold text-[#902A8B]">সাব-সেবাসমূহ:</p>
            {svc.subServices.map((sub) => (
              <p key={sub.id}>• {sub.label} {sub.fee > 0 ? `(৳${toBanglaNumber(sub.fee)})` : ""}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

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
                  ভূমিসেবা সহায়তা কেন্দ্র (LSFC) গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের ভূমি মন্ত্রণালয় অনুমোদিত একটি ফ্রন্ট-ডেস্ক উদ্যোগ।
                  অনুমোদনপত্র নং {toBanglaNumber(settings.licenseNo || "০২")}, পরিচালনায়: {settings.partnerOrg || "খন্দকার কম্পিউটার্স"}।
                  নাগরিকগণ যাতে সরকারি পোর্টালের সঠিক সেবা পেতে পারেন, সেজন্য নির্ধারিত সরকারি ফি, ১% গেটওয়ে ফি এবং সরকার অনুমোদিত কেন্দ্র সেবা মাশুল অনুসারে নিখুঁত ভেক্টর পিডিএফ রসিদ প্রদান করা হয়।
                </p>
              </section>

              <section className="space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1">
                  <h4 className="font-bold text-sm text-gray-900">
                    ২. অনুমোদিত সরকারি ও কেন্দ্র ফি চার্ট (সিস্টেমে বিদ্যমান সকল সেবা)
                  </h4>
                  <span className="text-[11px] text-[#902A8B] font-semibold">
                    মোট {toBanglaNumber(activeServices.length)}টি সেবা তালিকাভুক্ত
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  * নতুন আবেদন ও ইনভয়েস মেনুর সেবাকার্ডের ক্রমিক নম্বর (১ থেকে {toBanglaNumber(activeServices.length)}) হুবহু নিচে প্রদর্শিত হয়েছে:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeServices.map((item, idx) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 p-3.5 rounded-xl bg-gray-50/80 hover:bg-white hover:border-purple-300 transition shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start gap-2 mb-2 pb-1.5 border-b border-gray-100">
                          <span className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold font-anek rounded-full bg-[#902A8B] text-white shrink-0 mt-0.5">
                            {toBanglaNumber(idx + 1)}
                          </span>
                          <p className="font-bold text-xs sm:text-sm text-[#902A8B] leading-tight">
                            {item.serviceName}
                          </p>
                        </div>
                        {renderServiceFeeDetails(item)}
                      </div>
                    </div>
                  ))}

                  {activeServices.length === 0 && (
                    <p className="col-span-full text-center text-gray-400 py-6 text-xs">
                      কোনো সেবা সক্রিয় নেই।
                    </p>
                  )}
                </div>
              </section>

              <section className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-bold text-sm text-[#37A448] mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  ৩. গ্লোবাল পিডিএফ ও বাংলা ফন্ট স্ট্যান্ডার্ড
                </h4>
                <p>
                  এই প্রজেক্টের সকল ইনভয়েস ও রিপোর্ট pure vector SVG text-based (কোনো ক্যানভাস বা রাস্টার ইমেজ নয়)।
                  যুক্তাক্ষরের নিখুঁত গঠনে HarfBuzz WASM টেক্সট শেপিং ব্যবহার করা হয়।
                  টাইটেল ও ব্র্যান্ডিং-এর জন্য <strong>Anek Bangla (Bold 700)</strong> এবং বিবরণী ও লেজারের তথ্যের জন্য <strong>Kalpurush (400)</strong> সুনির্দিষ্ট রয়েছে।
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
