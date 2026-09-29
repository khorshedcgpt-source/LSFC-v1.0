import React from "react";
import { BookOpen, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useInstitutionSettings, DEFAULT_INSTITUTION_SETTINGS, ServiceSettingItem } from "../../utils/institutionSettings";
import { toBanglaNumber } from "../../utils/bengaliNumbers";
import { Modal } from "../common/Modal";

export const DeveloperDocsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { settings } = useInstitutionSettings();

  const activeServices: ServiceSettingItem[] = [
    ...(settings.services && settings.services.length > 0
      ? settings.services
      : DEFAULT_INSTITUTION_SETTINGS.services),
  ]
    .filter((s) => s.isActive)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const renderServiceFeeDetails = (svc: ServiceSettingItem) => {
    const govtFee = svc.govtFee ?? 0;
    const postalFee = svc.postalFee ?? 0;
    const centerFee = svc.centerFee ?? 0;
    const gatewayFee =
      svc.gatewayFee !== undefined && svc.gatewayFee > 0
        ? svc.gatewayFee
        : (govtFee + postalFee) > 0
        ? Math.round((govtFee + postalFee) * 0.01 * 100) / 100
        : 0;

    if (svc.id === "svc-namjari" || svc.builtInType === "namjari") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি কোর্ট ও নোটিশ ফি:</span> ৳{toBanglaNumber(govtFee)}</p>
          {gatewayFee > 0 && (
            <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> ৳{toBanglaNumber(gatewayFee.toFixed(2))}</p>
          )}
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(centerFee)} (২০ পৃষ্ঠা ও ৪ আবেদনকারী পর্যন্ত)</p>
          <p className="text-[11px] text-gray-500">• অতিরিক্ত পৃষ্ঠা: ৳৩/পৃষ্ঠা, অতিরিক্ত আবেদনকারী: ৳১০/জন</p>
        </div>
      );
    }
    if (svc.id === "svc-tax") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি কর:</span> জমির পরিমাণ, ধরন ও বকেয়া বছর অনুযায়ী অনলাইন হিসাব</p>
          <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> সরকারি নিয়মানুযায়ী প্রযোজ্য</p>
          {svc.subServices && svc.subServices.length > 0 && (
            <div className="bg-purple-50/70 p-2 rounded-lg border border-purple-100 text-[11px] space-y-0.5 mt-1.5">
              <p className="font-semibold text-[#902A8B]">কেন্দ্র সেবা মাশুল ধাপসমূহ:</p>
              {svc.subServices.map((sub) => (
                <p key={sub.id}>• {sub.label}: ৳{toBanglaNumber(sub.fee)}</p>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (svc.id === "svc-khatian") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি ফি:</span> ৳{toBanglaNumber(govtFee)} (অনলাইন/কাউন্টার কপি)</p>
          {gatewayFee > 0 && (
            <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> ৳{toBanglaNumber(gatewayFee.toFixed(2))}</p>
          )}
          {postalFee > 0 && (
            <p>• <span className="font-semibold">ডাকযোগে বিতরণ মাশুল:</span> ৳{toBanglaNumber(postalFee)} (শুধুমাত্র ডাকযোগে ডেলিভারি নিলে)</p>
          )}
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(centerFee)}</p>
        </div>
      );
    }
    if (svc.id === "svc-dcr") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি ডিসিআর ফি:</span> ৳{toBanglaNumber(govtFee)}</p>
          {gatewayFee > 0 && (
            <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> ৳{toBanglaNumber(gatewayFee.toFixed(2))}</p>
          )}
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(centerFee)}</p>
        </div>
      );
    }
    if (svc.id === "svc-miss-case") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি ফি:</span> {govtFee > 0 ? `৳${toBanglaNumber(govtFee)}` : "৳০ (প্রযোজ্য নয়)"}</p>
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(centerFee)} (ফ্ল্যাট ফি)</p>
          {svc.subServices && svc.subServices.length > 0 && (
            <div className="bg-purple-50/70 p-2 rounded-lg border border-purple-100 text-[11px] space-y-0.5 mt-1.5">
              <p className="font-semibold text-[#902A8B]">সংশোধনের আওতাভুক্ত বিষয়সমূহ:</p>
              {svc.subServices.map((sub) => (
                <p key={sub.id}>• {sub.label}</p>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (svc.id === "svc-mouza") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি ফি:</span> ৳{toBanglaNumber(govtFee)}</p>
          {postalFee > 0 && (
            <p>• <span className="font-semibold">সরকারি ডাক মাশুল:</span> ৳{toBanglaNumber(postalFee)} (ডাকযোগে ডেলিভারি হলে)</p>
          )}
          {gatewayFee > 0 && (
            <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> ৳{toBanglaNumber(gatewayFee.toFixed(2))}</p>
          )}
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(centerFee)}</p>
        </div>
      );
    }
    if (svc.id === "svc-citizen-profile") {
      return (
        <div className="text-xs space-y-1 text-gray-700">
          <p>• <span className="font-semibold">সরকারি ফি:</span> {govtFee > 0 ? `৳${toBanglaNumber(govtFee)}` : "৳০ (সরকারি কোনো ফি নেই)"}</p>
          <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(centerFee)}</p>
          <p className="text-[11px] text-gray-500">• সেবা আওতা: এনআইডি ভেরিফিকেশন, প্রোফাইল তৈরি ও ওটিপি সংযোগ</p>
        </div>
      );
    }
    return (
      <div className="text-xs space-y-1 text-gray-700">
        <p>• <span className="font-semibold">সরকারি ফি:</span> {govtFee > 0 ? `৳${toBanglaNumber(govtFee)}` : "প্রযোজ্য নয় (৳০)"}</p>
        {gatewayFee > 0 && <p>• <span className="font-semibold">১% গেটওয়ে ফি:</span> ৳{toBanglaNumber(gatewayFee.toFixed(2))}</p>}
        {postalFee > 0 && <p>• <span className="font-semibold">ডাক মাশুল:</span> ৳{toBanglaNumber(postalFee)}</p>}
        <p>• <span className="font-semibold text-[#37A448]">কেন্দ্র সেবা ফি:</span> ৳{toBanglaNumber(centerFee)}</p>
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="সিস্টেম নীতিমালা ও অনুমোদিত ফি চার্ট"
      subtitle="অনুমোদিত সরকারি ফি, কেন্দ্র সেবা মাশুল ও নীতিমালার বিবরণী"
      icon={<BookOpen className="w-5 h-5 text-[#FFF200]" />}
      maxWidth="3xl"
    >
      <div className="space-y-4 text-gray-700 leading-relaxed font-kalpurush">
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
    </Modal>
  );
};
