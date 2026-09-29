import React, { useState, useMemo } from "react";
import {
  Calculator,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import {
  calculateServiceLine,
  calculateCustomServiceLine,
  calculateSubServiceLine,
  formatInvoiceSubtitle,
  CalculatedServiceLine,
} from "../utils/serviceCalculator";
import { useInstitutionSettings, ServiceSettingItem } from "../utils/institutionSettings";
import { moneyBn } from "./InvoicePrint";
import { toBanglaNumber } from "../utils/bengaliNumbers";
import { Modal } from "./common/Modal";

export const ServiceTestModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { settings } = useInstitutionSettings();
  const activeServices = useMemo(
    () => (settings.services || []).filter((s) => s.isActive),
    [settings.services]
  );

  // ডিফল্টভাবে ই-নামজারি বা প্রথম সক্রিয় সেবা বাছাই করা
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    const namjari = activeServices.find((s) => s.builtInType === "namjari" || s.id === "svc-namjari");
    return namjari?.id || activeServices[0]?.id || "";
  });

  // নামজারি স্পেসিফিক ইনপুট
  const [pages, setPages] = useState<number>(20);
  const [applicants, setApplicants] = useState<number>(4);

  // সাব-সার্ভিস স্পেসিফিক ইনপুট (যেমন: LD Tax, Miss Case)
  const [selectedSubServiceIds, setSelectedSubServiceIds] = useState<string[]>([]);
  const [manualGovtFee, setManualGovtFee] = useState<number>(0);

  // সাব-টাইটেল / ডেলিভারি অপশন ইনপুট (যেমন: Khatian, Mouza Map)
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string>("");

  // আবেদনের পরিমাণ / সংখ্যা (Quantity)
  const [quantity, setQuantity] = useState<number>(1);

  // নির্বাচিত সার্ভিস অবজেক্ট
  const currentService: ServiceSettingItem | undefined = useMemo(
    () => activeServices.find((s) => s.id === selectedServiceId),
    [activeServices, selectedServiceId]
  );

  // সার্ভিস পরিবর্তন হলে রিলেটেড স্টেট রিসেট বা প্রিসেট করা
  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const s = activeServices.find((item) => item.id === serviceId);
    if (!s) return;

    // রিসেট প্যারামিটারস
    setQuantity(1);
    setPages(20);
    setApplicants(4);

    if (s.subServices && s.subServices.length > 0) {
      // ডিফল্টভাবে প্রথম সাবসার্ভিস সিলেক্ট
      setSelectedSubServiceIds([s.subServices[0].id]);
      setManualGovtFee(s.govtFee || 0);
    } else {
      setSelectedSubServiceIds([]);
      setManualGovtFee(s.govtFee || 0);
    }

    if (s.subtitles && s.subtitles.length > 0) {
      setSelectedSubtitleId(s.subtitles[0].id);
    } else {
      setSelectedSubtitleId("");
    }
  };

  // সাবসার্ভিস চেকবক্স টগল
  const toggleSubService = (subId: string) => {
    setSelectedSubServiceIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  // লাইভ ফি ক্যালকুলেশন
  const calculation: CalculatedServiceLine = useMemo(() => {
    if (!currentService) {
      return {
        serviceName: "কোনো সেবা নির্বাচিত নয়",
        govtFee: 0,
        gatewayFee: 0,
        postalFee: 0,
        centerFee: 0,
        lineTotal: 0,
      };
    }

    // ১. বিল্ট-ইন নামজারি সেবা
    if (currentService.builtInType === "namjari" || currentService.id === "svc-namjari") {
      return calculateServiceLine({
        serviceType: "namjari",
        customTitle: currentService.serviceName,
        pages,
        applicants,
        quantity,
      });
    }

    // ২. অধীনস্ত সেবা (SubServices) সমৃদ্ধ সেবা (যেমন: LD Tax, Miss Case)
    if (currentService.subServices && currentService.subServices.length > 0) {
      return calculateSubServiceLine(
        currentService,
        manualGovtFee,
        selectedSubServiceIds,
        undefined,
        quantity
      );
    }

    // ৩. সাব-টাইটেল বা ডেলিভারি ভ্যারিয়েন্ট সমৃদ্ধ সেবা (যেমন: খতিয়ান, মৌজা ম্যাপ) বা সাধারণ সেবা
    const selectedSubtitle = currentService.subtitles?.find((sub) => sub.id === selectedSubtitleId);
    const postalOverride = selectedSubtitle?.postalFee !== undefined ? selectedSubtitle.postalFee : currentService.postalFee;

    const baseResult = calculateCustomServiceLine(
      currentService,
      undefined,
      postalOverride,
      quantity
    );

    if (selectedSubtitle) {
      baseResult.subText = selectedSubtitle.label;
    }

    return baseResult;
  }, [
    currentService,
    pages,
    applicants,
    manualGovtFee,
    selectedSubServiceIds,
    selectedSubtitleId,
    quantity,
  ]);

  const formattedSubText = useMemo(() => {
    return formatInvoiceSubtitle(
      calculation.serviceName,
      calculation.subText
    );
  }, [calculation.serviceName, calculation.subText]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>ভূমিসেবা ফি পরীক্ষক ও ক্যালকুলেটর</span>
          <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
            {toBanglaNumber(activeServices.length)}টি সেবা সক্রিয়
          </span>
        </div>
      }
      subtitle="সকল সেবার সরকারি ফি, ডাক মাশুল, গেটওয়ে এবং কেন্দ্র সেবা ফি যাচাই করুন"
      icon={
        <div className="p-1.5 bg-white/15 rounded-xl border border-white/20">
          <Calculator className="w-5 h-5 text-[#FFF200]" />
        </div>
      }
      maxWidth="2xl"
    >
      <div className="space-y-5 text-slate-800">
        {/* ১. সেবা নির্বাচন (Service Selector Dropdown & Quick Badges) */}
          <div>
            <label htmlFor="select-calculator-service" className="block text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#902A8B]" />
              <span>যাচাইয়ের জন্য সেবা বাছাই করুন:</span>
            </label>
            <div className="relative">
              <select
                id="select-calculator-service"
                value={selectedServiceId}
                onChange={(e) => handleSelectService(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border-2 border-purple-200 hover:border-[#902A8B] focus:border-[#902A8B] focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-gray-900 transition focus:outline-hidden cursor-pointer shadow-2xs"
              >
                {activeServices.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.serviceName}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Service Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {activeServices.map((svc) => {
                const isSelected = svc.id === selectedServiceId;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => handleSelectService(svc.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 border ${
                      isSelected
                        ? "bg-[#902A8B] text-white border-[#902A8B] shadow-2xs"
                        : "bg-gray-100 hover:bg-purple-50 text-gray-700 border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-[#FFF200]" />}
                    <span className="truncate max-w-[140px] sm:max-w-none">{svc.serviceName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ২. ডাইনামিক ইনপুট সেকশন (Service Parameters) */}
          {currentService && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-xs text-[#902A8B] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#37A448]" />
                  <span>সেবা প্যারামিটার ও বিবরণ</span>
                </span>
                <span className="text-[11px] text-gray-500 font-anek">
                  {currentService.builtInType === "namjari"
                    ? "ফর্মুলাভিত্তিক হিসাব"
                    : currentService.subServices && currentService.subServices.length > 0
                    ? `সাব-সার্ভিস (${currentService.subServiceFeeMode === "flat" ? "ফ্ল্যাট ফি" : "যোগফল মোড"})`
                    : "স্ট্যান্ডার্ড ফি"}
                </span>
              </div>

              {/* ক. ই-নামজারি স্পেসিফিক প্যারামিটার */}
              {(currentService.builtInType === "namjari" || currentService.id === "svc-namjari") && (
                <div className="space-y-3 bg-purple-50/60 p-3.5 rounded-xl border border-purple-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="input-test-pages" className="text-xs font-semibold text-gray-700">মোট পৃষ্ঠা সংখ্যা:</label>
                        <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-sm font-semibold">
                          ফ্রি ২০ পৃষ্ঠা
                        </span>
                      </div>
                      <input
                        id="input-test-pages"
                        type="number"
                        min="1"
                        max="200"
                        value={pages}
                        onChange={(e) => setPages(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                        className="w-full p-2 border border-purple-300 rounded-lg bg-white font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        {pages > 20 ? (
                          <span className="text-[#37A448] font-bold">
                            অতিরিক্ত {toBanglaNumber(pages - 20)} পৃষ্ঠা × ৳৩ = {toBanglaNumber((pages - 20) * 3)}৳
                          </span>
                        ) : (
                          "২০ পৃষ্ঠার বেশি হলে প্রতি পৃষ্ঠা ৳৩ যোগ হবে"
                        )}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="input-test-applicants" className="text-xs font-semibold text-gray-700">মোট আবেদনকারী:</label>
                        <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-sm font-semibold">
                          ফ্রি ৪ জন
                        </span>
                      </div>
                      <input
                        id="input-test-applicants"
                        type="number"
                        min="1"
                        max="50"
                        value={applicants}
                        onChange={(e) => setApplicants(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                        className="w-full p-2 border border-purple-300 rounded-lg bg-white font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        {applicants > 4 ? (
                          <span className="text-[#37A448] font-bold">
                            অতিরিক্ত {toBanglaNumber(applicants - 4)} জন × ৳১০ = {toBanglaNumber((applicants - 4) * 10)}৳
                          </span>
                        ) : (
                          "৪ জনের বেশি হলে প্রতিজন ৳১০ যোগ হবে"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* খ. সাব-সার্ভিস সমৃদ্ধ সেবা (যেমন: ভূমি উন্নয়ন কর বা মিস কেস) */}
              {currentService.subServices && currentService.subServices.length > 0 && (
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-gray-800">অধীনস্ত সেবাসমূহ বেছে নিন:</span>
                    <span className="text-[10px] bg-slate-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">
                      {currentService.subServiceFeeMode === "flat"
                        ? `ফ্ল্যাট কেন্দ্র ফি: ${moneyBn(currentService.centerFee)} ৳`
                        : "প্রতিটি ধাপের ফি যোগ হবে"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentService.subServices.map((sub) => {
                      const isChecked = selectedSubServiceIds.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                            isChecked
                              ? "bg-purple-50/80 border-[#902A8B] text-gray-900 font-bold"
                              : "bg-gray-50/60 border-gray-200 hover:bg-gray-100 text-gray-600"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSubService(sub.id)}
                              className="rounded text-[#902A8B] focus:ring-[#902A8B]"
                            />
                            <span>{sub.label}</span>
                          </div>
                          {currentService.subServiceFeeMode !== "flat" && (
                            <span className="text-[11px] text-[#37A448] font-anek">
                              +{moneyBn(sub.fee)} ৳
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {/* ম্যানুয়াল সরকারি ফি ইনপুট (যেমন ভূমি উন্নয়ন করের ক্ষেত্রে) */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label htmlFor="input-test-manual-govt-fee" className="text-xs font-semibold text-gray-700">
                      সরকারি ফি (প্রযোজ্য ক্ষেত্রে লিখুন):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        id="input-test-manual-govt-fee"
                        type="number"
                        min="0"
                        value={manualGovtFee}
                        onChange={(e) => setManualGovtFee(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                        className="w-28 p-1.5 border border-gray-300 rounded-lg bg-white text-right font-bold text-gray-800"
                        placeholder="০.০০"
                      />
                      <span className="text-xs text-gray-500">টাকা</span>
                    </div>
                  </div>
                </div>
              )}

              {/* গ. সাব-টাইটেল / ডেলিভারি অপশন (যেমন: খতিয়ান অনলাইন বনাম ডাকযোগে, মৌজা ম্যাপ) */}
              {currentService.subtitles && currentService.subtitles.length > 0 && (
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-gray-200">
                  <span className="font-semibold text-xs text-gray-800 block">
                    ডেলিভারি মাধ্যম / সাব-টাইটেল অপশন:
                  </span>
                  <div className="space-y-1.5">
                    {currentService.subtitles.map((sub) => {
                      const isSelected = selectedSubtitleId === sub.id;
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                            isSelected
                              ? "bg-purple-50/80 border-[#902A8B] text-[#902A8B] font-bold"
                              : "bg-gray-50/60 border-gray-200 hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="subtitle-option"
                              checked={isSelected}
                              onChange={() => setSelectedSubtitleId(sub.id)}
                              className="text-[#902A8B] focus:ring-[#902A8B]"
                            />
                            <span>{sub.label}</span>
                          </div>
                          {sub.postalFee !== undefined && sub.postalFee > 0 && (
                            <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-anek font-semibold">
                              ডাক মাশুল: {moneyBn(sub.postalFee)} ৳
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ঘ. আবেদনের পরিমাণ / সংখ্যা (Quantity) */}
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
                <div>
                  <span className="font-semibold text-xs text-gray-800 block">আবেদনের সংখ্যা (Quantity):</span>
                  <span className="text-[10px] text-gray-500">একত্রে একাধিক আবেদনের জন্য গুণিতক নির্ধারণ</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg border border-gray-300 transition cursor-pointer select-none"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-[#902A8B] font-anek">
                    {toBanglaNumber(quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg border border-gray-300 transition cursor-pointer select-none"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ৩. হিসাবের ফলাফল কার্ড (Live Calculation Breakdown Card) */}
          <div className="border-2 border-[#37A448] bg-gradient-to-b from-green-50/60 to-emerald-50/30 p-4 sm:p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-green-200 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#37A448]" />
                <h4 className="font-bold text-[#37A448] text-sm font-anek">হিসাবের ফলাফল বিবরণী</h4>
              </div>
              {quantity > 1 && (
                <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {toBanglaNumber(quantity)} টি আবেদনের মোট হিসাব
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-gray-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>সরকারি ফি (Govt Fee):</span>
                </span>
                <span className="font-bold text-gray-900 font-anek">{moneyBn(calculation.govtFee)} ৳</span>
              </div>

              {calculation.postalFee > 0 && (
                <div className="flex justify-between items-center text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span>সরকারি ডাক মাশুল:</span>
                  </span>
                  <span className="font-bold text-blue-800 font-anek">{moneyBn(calculation.postalFee)} ৳</span>
                </div>
              )}

              <div className="flex justify-between items-center text-gray-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>পেমেন্ট গেটওয়ে চার্জ (১%):</span>
                </span>
                <span className="font-bold text-gray-900 font-anek">{moneyBn(calculation.gatewayFee)} ৳</span>
              </div>

              <div className="flex justify-between items-center text-gray-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>কেন্দ্র সেবা ফি (LSFC Center Fee):</span>
                </span>
                <span className="font-bold text-[#37A448] font-anek">{moneyBn(calculation.centerFee)} ৳</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="border-t-2 border-dashed border-[#37A448]/40 pt-3 flex justify-between items-center font-bold text-base sm:text-lg text-[#902A8B]">
              <span className="font-anek">সর্বমোট প্রদেয় টাকা:</span>
              <span className="font-anek bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-2xs">
                {moneyBn(calculation.lineTotal)} ৳
              </span>
            </div>

            {/* Invoiced Subtitle Preview */}
            {formattedSubText && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-green-200 mt-2 flex items-start gap-2 text-[11px] text-gray-700">
                <Info className="w-3.5 h-3.5 text-[#37A448] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-800">ইনভয়েসে মুদ্রিত বিবরণী:</span>{" "}
                  <span className="text-[#902A8B] font-medium">{formattedSubText}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 -mx-5 -mb-5 mt-5 border-t border-gray-200 px-5 py-3.5 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-gray-500 hidden sm:block">
            * এই হিসাবটি সরাসরি সেন্টারের নির্ধারিত রুলস ও সেটিংস থেকে গণনাকৃত
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#902A8B] hover:bg-[#781f74] text-white rounded-xl text-xs font-bold font-anek flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs transition"
          >
            <span>সম্পন্ন ও বন্ধ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
    </Modal>
  );
};
