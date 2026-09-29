import React, { useState, useMemo, useRef, useEffect } from "react";
import { User, Phone, CreditCard, MapPin, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { toBanglaNumber, toAsciiNumber } from "../../utils/bengaliNumbers";
import { useCustomers, CustomerRecord, cleanPhone } from "../../utils/customerStore";

export interface CustomerSectionProps {
  fullName: string;
  setFullName: (val: string) => void;
  mobile: string;
  setMobile: (val: string) => void;
  nidNo: string;
  setNidNo: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  existingCustomerFound: boolean;
  setExistingCustomerFound: (val: boolean) => void;
  fieldErrors: {
    fullName?: string;
    mobile?: string;
    nidNo?: string;
  };
  nameTypeError: string | null;
  setNameTypeError: (val: string | null) => void;
  mobileTypeError: string | null;
  setMobileTypeError: (val: string | null) => void;
  nidTypeError: string | null;
  setNidTypeError: (val: string | null) => void;
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({
  fullName,
  setFullName,
  mobile,
  setMobile,
  nidNo,
  setNidNo,
  address,
  setAddress,
  existingCustomerFound,
  setExistingCustomerFound,
  fieldErrors,
  nameTypeError,
  setNameTypeError,
  mobileTypeError,
  setMobileTypeError,
  nidTypeError,
  setNidTypeError,
}) => {
  const { customers } = useCustomers();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        suggestionContainerRef.current &&
        !suggestionContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter existing customers for auto-suggestion (F-4)
  const customerSuggestions = useMemo(() => {
    const qMobile = mobile.trim();
    const qName = fullName.trim().toLowerCase();
    if (qMobile.length < 3 && qName.length < 2) return [];

    return customers
      .filter((c) => {
        const matchPhone = qMobile.length >= 3 && cleanPhone(c.mobile).includes(cleanPhone(qMobile));
        const matchName = qName.length >= 2 && c.fullName.toLowerCase().includes(qName);
        return matchPhone || matchName;
      })
      .slice(0, 5);
  }, [customers, mobile, fullName]);

  const handleSelectCustomer = (customer: CustomerRecord) => {
    setFullName(customer.fullName);
    setMobile(customer.mobile);
    if (customer.nidNo) setNidNo(customer.nidNo);
    if (customer.address) setAddress(customer.address);
    setExistingCustomerFound(true);
    setShowSuggestions(false);
  };

  // Convert Bengali numbers in Mobile field automatically (F-4)
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const ascii = toAsciiNumber(raw);
    const cleaned = ascii.replace(/[^\d+]/g, "");

    // Validation warning
    if (raw && !/^[\d+০-৯\s-]+$/.test(raw)) {
      setMobileTypeError("মোবাইল নম্বরে শুধুমাত্র সংখ্যা ব্যবহার করুন");
    } else {
      setMobileTypeError(null);
    }

    setMobile(cleaned);
    setShowSuggestions(true);

    // Auto detect existing customer
    if (cleaned.length >= 11) {
      const match = customers.find((c) => cleanPhone(c.mobile) === cleanPhone(cleaned));
      if (match) {
        setFullName(match.fullName);
        if (match.nidNo) setNidNo(match.nidNo);
        if (match.address) setAddress(match.address);
        setExistingCustomerFound(true);
      }
    }
  };

  // Convert Bengali numbers in NID field automatically
  const handleNidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const ascii = toAsciiNumber(raw);
    const cleaned = ascii.replace(/[^\d]/g, "");

    if (raw && !/^[\d০-৯]+$/.test(raw)) {
      setNidTypeError("জাতীয় পরিচয়পত্র নম্বরে শুধু সংখ্যা গ্রহণযোগ্য");
    } else {
      setNidTypeError(null);
    }

    setNidNo(cleaned);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Check if user accidentally typed digits in name
    if (/[\d০-৯]/.test(val)) {
      setNameTypeError("নামে সংখ্যা গ্রহণযোগ্য নয়, শুধুমাত্র বাংলা বা ইংরেজি অক্ষর ব্যবহার করুন");
    } else {
      setNameTypeError(null);
    }
    setFullName(val);
    setShowSuggestions(true);
  };

  return (
    <div
      ref={suggestionContainerRef}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#902A8B] dark:text-purple-300 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base font-anek text-slate-900 dark:text-white leading-tight">
              ধাপ ১: সেবাগ্রহীতা বা ভূমি মালিকের তথ্য
            </h3>
            <p className="text-[11px] text-slate-400 font-kalpurush">
              মোবাইল নম্বর ও নাম ইনপুট দিন (বাংলা বা ইংরেজি দুই মাধ্যমেই গ্রহণ করা হবে)
            </p>
          </div>
        </div>

        {existingCustomerFound && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#37A448] border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-anek">
            <CheckCircle2 className="w-3.5 h-3.5" /> বিদ্যমান গ্রাহক রেকর্ড
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
        {/* Mobile Input with Auto-suggestion dropdown (F-4) */}
        <div className="relative">
          <label
            htmlFor="input-customer-mobile"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1"
          >
            মোবাইল নম্বর <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="input-customer-mobile"
              type="text"
              value={mobile}
              onChange={handleMobileChange}
              onFocus={() => setShowSuggestions(true)}
              placeholder="০১৭১XXXXXXXX"
              aria-invalid={Boolean(fieldErrors.mobile || mobileTypeError)}
              aria-describedby={
                fieldErrors.mobile ? "mobile-error" : mobileTypeError ? "mobile-type-error" : undefined
              }
              className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border font-mono transition focus:outline-none focus:ring-2 ${
                fieldErrors.mobile || mobileTypeError
                  ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-300"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-purple-200 focus:border-[#902A8B]"
              }`}
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Error messages */}
          {fieldErrors.mobile && (
            <p id="mobile-error" className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-kalpurush">
              <AlertCircle className="w-3 h-3 shrink-0" /> {fieldErrors.mobile}
            </p>
          )}
          {mobileTypeError && (
            <p id="mobile-type-error" className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-kalpurush">
              <AlertCircle className="w-3 h-3 shrink-0" /> {mobileTypeError}
            </p>
          )}

          {/* Autocomplete Suggestions dropdown (F-4) */}
          {showSuggestions && customerSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-700 rounded-xl shadow-lg z-30 overflow-hidden font-kalpurush">
              <div className="px-3 py-1.5 bg-purple-50/70 dark:bg-slate-800 text-[10px] font-bold text-[#902A8B] dark:text-purple-300 border-b border-purple-100 dark:border-slate-700 flex items-center gap-1">
                <Search className="w-3 h-3" /> বিদ্যমান তালিকা থেকে দ্রুত নির্বাচন করুন:
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                {customerSuggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full px-3 py-2 text-left hover:bg-purple-50/40 dark:hover:bg-slate-800/80 transition flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {c.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        মোবাইল: {toBanglaNumber(c.mobile)}
                      </div>
                    </div>
                    {c.address && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                        {c.address}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Full Name Input */}
        <div>
          <label
            htmlFor="input-customer-name"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1"
          >
            ভূমি মালিকের নাম <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="input-customer-name"
              type="text"
              value={fullName}
              onChange={handleNameChange}
              placeholder="যেমন: খন্দকার আক্তারুজ্জামান"
              aria-invalid={Boolean(fieldErrors.fullName || nameTypeError)}
              aria-describedby={
                fieldErrors.fullName ? "name-error" : nameTypeError ? "name-type-error" : undefined
              }
              className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border transition focus:outline-none focus:ring-2 font-kalpurush ${
                fieldErrors.fullName || nameTypeError
                  ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-300"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-purple-200 focus:border-[#902A8B]"
              }`}
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {fieldErrors.fullName && (
            <p id="name-error" className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-kalpurush">
              <AlertCircle className="w-3 h-3 shrink-0" /> {fieldErrors.fullName}
            </p>
          )}
          {nameTypeError && (
            <p id="name-type-error" className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-kalpurush">
              <AlertCircle className="w-3 h-3 shrink-0" /> {nameTypeError}
            </p>
          )}
        </div>

        {/* NID Input (Optional) */}
        <div>
          <label
            htmlFor="input-customer-nid"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1"
          >
            জাতীয় পরিচয়পত্র / এনআইডি নম্বর <span className="text-[10px] text-slate-400 font-normal">(ঐচ্ছিক)</span>
          </label>
          <div className="relative">
            <input
              id="input-customer-nid"
              type="text"
              value={nidNo}
              onChange={handleNidChange}
              placeholder="১০, ১৩ বা ১৭ ডিজিটের এনআইডি"
              aria-invalid={Boolean(fieldErrors.nidNo || nidTypeError)}
              aria-describedby={
                fieldErrors.nidNo ? "nid-error" : nidTypeError ? "nid-type-error" : undefined
              }
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#902A8B]"
            />
            <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>
          {fieldErrors.nidNo && (
            <p id="nid-error" className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-kalpurush">
              <AlertCircle className="w-3 h-3 shrink-0" /> {fieldErrors.nidNo}
            </p>
          )}
          {nidTypeError && (
            <p id="nid-type-error" className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-kalpurush">
              <AlertCircle className="w-3 h-3 shrink-0" /> {nidTypeError}
            </p>
          )}
        </div>

        {/* Address Input (Optional) */}
        <div>
          <label
            htmlFor="input-customer-address"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1"
          >
            ঠিকানা / গ্রাম / এলাকা <span className="text-[10px] text-slate-400 font-normal">(ঐচ্ছিক)</span>
          </label>
          <div className="relative">
            <input
              id="input-customer-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="গ্রাম, ডাকঘর, উপজেলা"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-kalpurush focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#902A8B]"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
