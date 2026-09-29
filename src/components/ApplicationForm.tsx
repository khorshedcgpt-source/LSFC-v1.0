import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FileText,
  CreditCard,
  Plus,
  Trash2,
  Printer,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { ConfirmDialog } from "./common/ConfirmDialog";
import { useToast } from "./common/Toast";
import {
  SERVICE_DEFINITIONS,
  calculateServiceLine,
  calculateCustomServiceLine,
  calculateSubServiceLine,
  CalculatedServiceLine,
} from "../utils/serviceCalculator";
import {
  cleanPhone,
} from "../utils/customerStore";
import {
  generateInvoiceNo,
  addInvoice,
  InvoiceRecord,
} from "../utils/invoiceStore";
import { toBanglaNumber, moneyBn, InvoicePrint } from "./InvoicePrint";
import { useInstitutionSettings, toInvoiceSettings, ServiceSettingItem } from "../utils/institutionSettings";
import { getLocalDateString } from "../utils/dateUtils";
import { PAYMENT_METHODS } from "../utils/paymentMethods";

// Sub-components
import { InvoiceStepper } from "./invoice/InvoiceStepper";
import { CustomerSection } from "./invoice/CustomerSection";
import { DraftNoticeBar } from "./invoice/DraftNoticeBar";
import { InvoiceSuccessModal } from "./invoice/InvoiceSuccessModal";

const DRAFT_STORAGE_KEY = "lsfc_invoice_form_draft";

export const ApplicationForm: React.FC = () => {
  const { settings: institutionSettings } = useInstitutionSettings();
  const printSettings = toInvoiceSettings(institutionSettings);

  const activeServices: ServiceSettingItem[] = useMemo(() => {
    return [...(institutionSettings.services || [])]
      .filter((s) => s.isActive)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [institutionSettings.services]);

  const { showToast } = useToast();

  // Customer states
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [nidNo, setNidNo] = useState("");
  const [address, setAddress] = useState("");
  const [existingCustomerFound, setExistingCustomerFound] = useState(false);

  // Field validation submission errors (C-4)
  const [fieldErrors, setFieldErrors] = useState<{
    mobile?: string;
    fullName?: string;
    nidNo?: string;
    cart?: string;
  }>({});
  const [atRiskConfirmOpen, setAtRiskConfirmOpen] = useState(false);

  // Wrong data type real-time warnings
  const [mobileTypeError, setMobileTypeError] = useState<string | null>(null);
  const [nidTypeError, setNidTypeError] = useState<string | null>(null);
  const [nameTypeError, setNameTypeError] = useState<string | null>(null);

  // Active service selection
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number>(0);
  const [trackingNo, setTrackingNo] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState<number>(1);

  // Built-in / Namjari parameters
  const [pages, setPages] = useState<number>(20);
  const [applicants, setApplicants] = useState<number>(4);

  // SubServices parameters (e.g. LD Tax)
  const [manualGovtFee, setManualGovtFee] = useState<number>(0);
  const [selectedSubServiceIds, setSelectedSubServiceIds] = useState<string[]>([]);

  // Invoice cart & Payment
  const [cartLines, setCartLines] = useState<CalculatedServiceLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("নগদ (Cash)");
  const [customPaidAmount, setCustomPaidAmount] = useState<string>("");
  const [remainingMode, setRemainingMode] = useState<"due" | "waived">("due");

  // Draft recovery status (F-2)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Created invoice modal state & Success modal (F-3)
  const [createdInvoice, setCreatedInvoice] = useState<InvoiceRecord | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isInvoicePrintOpen, setIsInvoicePrintOpen] = useState(false);

  // F-2: Recover unsaved draft on initial mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.mobile || draft.fullName || (draft.cartLines && draft.cartLines.length > 0)) {
          if (draft.mobile) setMobile(draft.mobile);
          if (draft.fullName) setFullName(draft.fullName);
          if (draft.nidNo) setNidNo(draft.nidNo);
          if (draft.address) setAddress(draft.address);
          if (Array.isArray(draft.cartLines) && draft.cartLines.length > 0) {
            setCartLines(draft.cartLines);
          }
          if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
          if (draft.customPaidAmount) setCustomPaidAmount(draft.customPaidAmount);
          if (draft.remainingMode) setRemainingMode(draft.remainingMode);
          setIsDraftLoaded(true);
        }
      }
    } catch (e) {
      console.warn("Could not load draft", e);
    }
  }, []);

  // F-2: Autosave draft whenever state changes
  useEffect(() => {
    if (mobile || fullName || nidNo || address || cartLines.length > 0) {
      const draft = {
        mobile,
        fullName,
        nidNo,
        address,
        cartLines,
        paymentMethod,
        customPaidAmount,
        remainingMode,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (e) {
        console.warn("Could not save draft", e);
      }
    }
  }, [mobile, fullName, nidNo, address, cartLines, paymentMethod, customPaidAmount, remainingMode]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setMobile("");
    setFullName("");
    setNidNo("");
    setAddress("");
    setCartLines([]);
    setCustomPaidAmount("");
    setRemainingMode("due");
    setIsDraftLoaded(false);
    setFieldErrors({});
    setExistingCustomerFound(false);
    showToast("খসড়া মুছে নতুন ফর্ম প্রস্তুত করা হয়েছে।", "info");
  };

  // Selected Service configuration
  const effectiveSelectedId = selectedServiceId ?? activeServices[0]?.id ?? null;
  const selectedItem = activeServices.find((s) => s.id === effectiveSelectedId);
  const builtInType = selectedItem?.builtInType;
  const hasSubServices = (selectedItem?.subServices?.length ?? 0) > 0;

  const namjariHasExtraFeeBreakdown = builtInType === "namjari" && (pages > 20 || applicants > 4);
  const chosenSubtitleOption =
    !hasSubServices && !namjariHasExtraFeeBreakdown && selectedItem?.subtitles && selectedItem.subtitles.length > 0
      ? selectedItem.subtitles[selectedSubtitleIndex] ?? selectedItem.subtitles[0]
      : undefined;

  const safeQty = Math.max(1, Math.round(Number(serviceQuantity) || 1));

  const baseCalculation: CalculatedServiceLine | null = useMemo(() => {
    if (!selectedItem) return null;
    if (hasSubServices) {
      return calculateSubServiceLine(selectedItem, manualGovtFee, selectedSubServiceIds, trackingNo, safeQty);
    }
    if (builtInType) {
      return calculateServiceLine({
        serviceType: builtInType,
        customTitle:
          selectedItem.serviceName && selectedItem.serviceName !== SERVICE_DEFINITIONS[builtInType].nameBn
            ? selectedItem.serviceName
            : undefined,
        pages: builtInType === "namjari" ? pages : undefined,
        applicants: builtInType === "namjari" ? applicants : undefined,
        applicationTrackingNo: trackingNo,
        quantity: safeQty,
      });
    }
    return calculateCustomServiceLine(selectedItem, trackingNo, chosenSubtitleOption?.postalFee, safeQty);
  }, [
    selectedItem,
    hasSubServices,
    manualGovtFee,
    selectedSubServiceIds,
    trackingNo,
    safeQty,
    builtInType,
    pages,
    applicants,
    chosenSubtitleOption?.postalFee,
  ]);

  const isLdTax =
    selectedItem?.id === "svc-ld-tax" ||
    (selectedItem?.serviceName
      ? selectedItem.serviceName.includes("ভূমি উন্নয়ন কর") || selectedItem.serviceName.includes("LD Tax")
      : false);

  const currentCalculation: CalculatedServiceLine | null = useMemo(() => {
    if (!baseCalculation) return null;
    let sub = chosenSubtitleOption?.label || baseCalculation.subText;
    if (safeQty > 1) {
      if (isLdTax) {
        const tag = `${toBanglaNumber(safeQty)}টি হোল্ডিং`;
        sub = sub ? `${sub} – ${tag}` : `(${tag})`;
      } else if (builtInType !== "namjari") {
        const tag = `${toBanglaNumber(safeQty)}টি আবেদন`;
        sub = sub ? `${sub} – ${tag}` : `(${tag})`;
      }
    }
    return {
      ...baseCalculation,
      subText: sub || undefined,
    };
  }, [baseCalculation, chosenSubtitleOption, safeQty, isLdTax, builtInType]);

  // Validation Helpers
  const isCustomerValid = useMemo(() => {
    const cleanMob = cleanPhone(mobile);
    const validMob = cleanMob.length === 11 && cleanMob.startsWith("01");
    const validName = fullName.trim().length >= 2;
    return validMob && validName;
  }, [mobile, fullName]);

  // Visual Stepper Step Calculation (F-1)
  const currentStep = useMemo<1 | 2 | 3>(() => {
    if (!isCustomerValid) return 1;
    if (cartLines.length === 0) return 2;
    return 3;
  }, [isCustomerValid, cartLines.length]);

  const handleStepClick = (step: 1 | 2 | 3) => {
    if (step === 1) {
      document.getElementById("section-customer-info")?.scrollIntoView({ behavior: "smooth" });
    } else if (step === 2) {
      document.getElementById("section-services")?.scrollIntoView({ behavior: "smooth" });
    } else if (step === 3) {
      document.getElementById("section-payment-summary")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedSubtitleIndex(0);
    setTrackingNo("");
    setServiceQuantity(1);

    const s = activeServices.find((item) => item.id === serviceId);
    if (s?.builtInType === "namjari") {
      setPages(20);
      setApplicants(4);
    } else {
      setPages(1);
      setApplicants(1);
    }

    if (s?.subServices && s.subServices.length > 0) {
      setManualGovtFee(0);
      setSelectedSubServiceIds(s.subServices.map((sub) => sub.id));
    } else {
      setManualGovtFee(0);
      setSelectedSubServiceIds([]);
    }
  };

  const handleAddToCart = () => {
    if (!currentCalculation) return;
    if (currentCalculation.lineTotal <= 0 || currentCalculation.centerFee <= 0) {
      showToast("এই সেবার ফি শূন্য অথবা সঠিক নয়।", "error");
      return;
    }
    if (hasSubServices && selectedSubServiceIds.length === 0) {
      showToast("অন্তত একটি অধস্তন সেবা নির্বাচন করুন।", "error");
      return;
    }

    setCartLines((prev) => [...prev, currentCalculation]);
    setTrackingNo("");
    setServiceQuantity(1);
    setFieldErrors((prev) => ({ ...prev, cart: undefined }));
    showToast(`"${currentCalculation.serviceName}" ইনভয়েস কার্টে যুক্ত হয়েছে।`, "success");
  };

  const handleRemoveFromCart = (index: number) => {
    setCartLines((prev) => prev.filter((_, i) => i !== index));
    showToast("সেবা কার্ট থেকে অপসারণ করা হয়েছে।", "info");
  };

  // Cart Totals & Waterfall Allocations
  const cartTotal = useMemo(() => {
    return cartLines.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [cartLines]);

  const cartCenterTotal = useMemo(() => {
    return cartLines.reduce((sum, item) => sum + item.centerFee, 0);
  }, [cartLines]);

  const cartNonCenterTotal = useMemo(() => {
    return cartLines.reduce((sum, item) => sum + item.govtFee + (item.gatewayFee || 0) + (item.postalFee || 0), 0);
  }, [cartLines]);

  const numericPaid = customPaidAmount !== "" ? Math.max(0, Number(customPaidAmount) || 0) : cartTotal;
  const remainingGap = Math.max(0, cartTotal - numericPaid);
  const govtAdvanceAtRisk = numericPaid < cartNonCenterTotal;

  // Execute Invoice Generation
  const executeInvoiceGeneration = useCallback(() => {
    const finalPaid = Math.min(cartTotal, numericPaid);
    const finalDue = remainingMode === "due" ? Math.max(0, cartTotal - finalPaid) : 0;
    const finalDiscount = remainingMode === "waived" ? Math.max(0, cartTotal - finalPaid) : 0;

    let finalStatus: InvoiceRecord["paymentStatus"] = "PAID";
    if (finalDue > 0) {
      finalStatus = "PARTIAL";
    } else if (finalDiscount > 0) {
      finalStatus = "WAIVED";
    }

    const newInvoiceNo = generateInvoiceNo();

    const invoiceRecord: InvoiceRecord = {
      invoiceNo: newInvoiceNo,
      customer: {
        fullName: fullName.trim(),
        mobile: cleanPhone(mobile),
        nidNo: nidNo.trim() || undefined,
        address: address.trim() || undefined,
      },
      lines: cartLines,
      total: Math.round(cartTotal * 100) / 100,
      paidAmount: Math.round(finalPaid * 100) / 100,
      dueAmount: Math.round(finalDue * 100) / 100,
      discountAmount: Math.round(finalDiscount * 100) / 100,
      paymentStatus: finalStatus,
      paymentHistory:
        finalPaid > 0
          ? [
              {
                id: `pay-${Date.now()}`,
                amount: Math.round(finalPaid * 100) / 100,
                date: getLocalDateString(),
                receivedBy: paymentMethod,
                note: "প্রাথমিক জমা",
              },
            ]
          : [],
      createdAt: new Date().toISOString(),
      applicationTrackingNo: cartLines[0]?.applicationTrackingNo || undefined,
      status: "ACTIVE",
      paymentMethod,
    };

    const savedInvoice = addInvoice(invoiceRecord);
    setCreatedInvoice(savedInvoice);
    setIsSuccessModalOpen(true);
    showToast(`ইনভয়েস #${toBanglaNumber(newInvoiceNo)} সফলভাবে তৈরি ও সংরক্ষিত হয়েছে।`, "success");

    // Clear Draft from storage
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setIsDraftLoaded(false);

    // Reset inputs
    setCartLines([]);
    setMobile("");
    setFullName("");
    setNidNo("");
    setAddress("");
    setCustomPaidAmount("");
    setRemainingMode("due");
    setExistingCustomerFound(false);
    setFieldErrors({});
    setAtRiskConfirmOpen(false);
  }, [
    cartTotal,
    numericPaid,
    remainingMode,
    fullName,
    mobile,
    nidNo,
    address,
    cartLines,
    paymentMethod,
    showToast,
  ]);

  const handleCreateInvoice = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const errors: typeof fieldErrors = {};
      let firstInvalidId: string | null = null;

      const cleanMob = cleanPhone(mobile);
      if (!cleanMob) {
        errors.mobile = "অনুগ্রহ করে ভূমি মালিকের মোবাইল নম্বর লিখুন।";
        firstInvalidId = firstInvalidId || "input-customer-mobile";
      } else if (!cleanMob.startsWith("01") || cleanMob.length !== 11) {
        errors.mobile = "সঠিক মোবাইল নম্বর দিন (অবশ্যই 01 দিয়ে শুরু এবং ১১ ডিজিটের হতে হবে)।";
        firstInvalidId = firstInvalidId || "input-customer-mobile";
      }

      if (!fullName.trim()) {
        errors.fullName = "অনুগ্রহ করে ভূমি মালিকের পূর্ণ নাম লিখুন।";
        firstInvalidId = firstInvalidId || "input-customer-name";
      } else if (/[\d০-৯]/.test(fullName)) {
        errors.fullName = "ভূমি মালিকের নামে সংখ্যা গ্রহণযোগ্য নয়।";
        firstInvalidId = firstInvalidId || "input-customer-name";
      }

      if (cartLines.length === 0) {
        errors.cart = "ইনভয়েস তৈরি করার আগে অন্তত একটি সেবা কার্টে যুক্ত করুন।";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        if (firstInvalidId) {
          const el = document.getElementById(firstInvalidId);
          el?.focus();
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        showToast("ফর্মে কিছু ত্রুটি রয়েছে। লাল চিহ্নিত অংশগুলো সংশোধন করুন।", "error");
        return;
      }

      setFieldErrors({});

      if (govtAdvanceAtRisk) {
        setAtRiskConfirmOpen(true);
        return;
      }

      executeInvoiceGeneration();
    },
    [mobile, fullName, cartLines.length, govtAdvanceAtRisk, executeInvoiceGeneration, showToast]
  );

  // F-5: Global Ctrl+Enter shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleCreateInvoice();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCreateInvoice]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Visual Stepper (F-1) */}
      <InvoiceStepper
        currentStep={currentStep}
        onStepClick={handleStepClick}
        isCustomerValid={isCustomerValid}
        hasCartItems={cartLines.length > 0}
      />

      {/* Draft Notification Bar (F-2) */}
      {isDraftLoaded && <DraftNoticeBar onClearDraft={handleClearDraft} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (lg:col-span-7): Customer Info & Service Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Customer Info Box */}
          <div id="section-customer-info">
            <CustomerSection
              fullName={fullName}
              setFullName={setFullName}
              mobile={mobile}
              setMobile={setMobile}
              nidNo={nidNo}
              setNidNo={setNidNo}
              address={address}
              setAddress={setAddress}
              existingCustomerFound={existingCustomerFound}
              setExistingCustomerFound={setExistingCustomerFound}
              fieldErrors={fieldErrors}
              nameTypeError={nameTypeError}
              setNameTypeError={setNameTypeError}
              mobileTypeError={mobileTypeError}
              setMobileTypeError={setMobileTypeError}
              nidTypeError={nidTypeError}
              setNidTypeError={setNidTypeError}
            />
          </div>

          {/* Step 2: Service Configuration Box */}
          <div
            id="section-services"
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#902A8B] dark:text-purple-300 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base font-anek text-slate-900 dark:text-white leading-tight">
                  ধাপ ২: ভূমিসেবা নির্বাচন ও বিবরণ
                </h3>
                <p className="text-[11px] text-slate-400 font-kalpurush">
                  প্রয়োজনীয় সেবা কার্ডে ক্লিক করে পরিমাণ ও প্যারামিটার নির্ধারণ করুন
                </p>
              </div>
            </div>

            {/* Service Type Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {activeServices.map((item, idx) => {
                const isSelected = effectiveSelectedId === item.id;
                const def = item.builtInType ? SERVICE_DEFINITIONS[item.builtInType] : undefined;
                const itemHasSub = (item.subServices?.length ?? 0) > 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectService(item.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition relative flex flex-col justify-between ${
                      isSelected
                        ? "border-[#902A8B] bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-[#902A8B]/30 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 bg-white dark:bg-slate-800/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-1.5 mb-1.5">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold font-anek rounded-full shrink-0 ${
                            isSelected
                              ? "bg-[#902A8B] text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {toBanglaNumber(idx + 1)}
                        </span>
                        <p
                          className={`font-bold text-xs sm:text-sm line-clamp-2 leading-tight font-anek ${
                            isSelected ? "text-[#902A8B] dark:text-purple-300" : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {item.serviceName || def?.nameBn || "(নামহীন সেবা)"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-anek">
                      <span className="text-slate-500 dark:text-slate-400">
                        সরকারি: {itemHasSub ? "ম্যানুয়াল" : `${toBanglaNumber(item.govtFee)}৳`}
                      </span>
                      <span className="font-bold text-[#37A448]">
                        কেন্দ্র: {itemHasSub ? `${toBanglaNumber(item.subServices?.[0]?.fee || 20)}৳` : `${toBanglaNumber(item.centerFee)}৳`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Inputs Box per selected service */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-service-tracking" className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1">
                    আবেদন / কেস / ট্র্যাকিং নম্বর <span className="text-[10px] text-slate-400 font-normal">(ঐচ্ছিক)</span>
                  </label>
                  <input
                    id="input-service-tracking"
                    type="text"
                    placeholder="যেমন: NAM-2026-XXXXX"
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#902A8B]"
                  />
                </div>

                <div>
                  <label htmlFor="input-app-service-quantity" className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1">
                    {isLdTax ? "হোল্ডিংয়ের সংখ্যা / পরিমাণ" : "আবেদনের সংখ্যা / পরিমাণ"} (টি)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setServiceQuantity((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-l-xl border border-r-0 border-slate-300 dark:border-slate-600 transition text-sm cursor-pointer select-none"
                    >
                      -
                    </button>
                    <input
                      id="input-app-service-quantity"
                      type="number"
                      min="1"
                      max="100"
                      value={serviceQuantity}
                      onChange={(e) => setServiceQuantity(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                      className="w-full text-center px-2 py-2 text-sm font-bold text-[#902A8B] dark:text-purple-300 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-200"
                    />
                    <button
                      type="button"
                      onClick={() => setServiceQuantity((prev) => prev + 1)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-r-xl border border-l-0 border-slate-300 dark:border-slate-600 transition text-sm cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                {builtInType === "namjari" && (
                  <>
                    <div>
                      <label htmlFor="input-app-pages" className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1">
                        স্ক্যানকৃত পৃষ্ঠা সংখ্যা (২০ পৃষ্ঠা অন্তর্ভুক্ত)
                      </label>
                      <input
                        id="input-app-pages"
                        type="number"
                        min="1"
                        value={pages}
                        onChange={(e) => setPages(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 font-kalpurush">২০ পৃষ্ঠার অতিরিক্ত প্রতি পৃষ্ঠা ৩ ৳</p>
                    </div>

                    <div>
                      <label htmlFor="input-app-applicants" className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1">
                        আবেদনকারীর সংখ্যা (৪ জন অন্তর্ভুক্ত)
                      </label>
                      <input
                        id="input-app-applicants"
                        type="number"
                        min="1"
                        value={applicants}
                        onChange={(e) => setApplicants(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 font-kalpurush">৪ জনের অতিরিক্ত প্রতি জন ১০ ৳</p>
                    </div>
                  </>
                )}

                {hasSubServices && (
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="input-app-manual-govt-fee" className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1">
                        সরকারি ফি (টাকা)
                      </label>
                      <input
                        id="input-app-manual-govt-fee"
                        type="number"
                        min="0"
                        value={manualGovtFee}
                        onChange={(e) => setManualGovtFee(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1.5">
                        অধীনস্ত সেবা নির্বাচন:
                      </span>
                      <div className="space-y-1.5 font-kalpurush">
                        {selectedItem!.subServices!.map((sub) => (
                          <label key={sub.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSubServiceIds.includes(sub.id)}
                              onChange={(e) =>
                                setSelectedSubServiceIds((prev) =>
                                  e.target.checked ? [...prev, sub.id] : prev.filter((id) => id !== sub.id)
                                )
                              }
                              className="text-[#902A8B] rounded cursor-pointer"
                            />
                            {sub.label} ({toBanglaNumber(sub.fee)}৳)
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitle selection if available */}
              {!hasSubServices && (selectedItem?.subtitles?.length ?? 0) > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-2">
                    সাব-টাইটেল / ধরন নির্বাচন:
                  </span>
                  <div className="flex flex-wrap gap-3 font-kalpurush">
                    {selectedItem!.subtitles!.map((opt, idx) => (
                      <label key={opt.id} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="subtitlePreset"
                          checked={selectedSubtitleIndex === idx}
                          onChange={() => setSelectedSubtitleIndex(idx)}
                          className="text-[#902A8B] cursor-pointer"
                        />
                        {opt.label || "(খালি)"}
                        {!!opt.postalFee && (
                          <span className="text-[10px] text-slate-400">(ডাক মাশুল {toBanglaNumber(opt.postalFee)}৳)</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Service Calculation Preview & Add to Cart button */}
              {currentCalculation && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-3 text-xs font-kalpurush">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-600 dark:text-slate-400">
                        সরকারি ফি: <strong className="text-slate-800 dark:text-slate-200">{moneyBn(currentCalculation.govtFee)}৳</strong>
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        গেটওয়ে ফি: <strong className="text-slate-800 dark:text-slate-200">{moneyBn(currentCalculation.gatewayFee)}৳</strong>
                      </span>
                      {currentCalculation.postalFee > 0 && (
                        <span className="text-slate-600 dark:text-slate-400">
                          ডাক মাশুল: <strong className="text-slate-800 dark:text-slate-200">{moneyBn(currentCalculation.postalFee)}৳</strong>
                        </span>
                      )}
                      <span className="text-slate-600 dark:text-slate-400">
                        কেন্দ্র মাশুল: <strong className="text-[#37A448]">{moneyBn(currentCalculation.centerFee)}৳</strong>
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg border border-[#902A8B]/30 bg-purple-50 dark:bg-purple-950/60 text-[#902A8B] dark:text-purple-300 font-anek">
                        লাইন মোট: {moneyBn(currentCalculation.lineTotal)} ৳
                      </span>
                    </div>

                    <button
                      id="btn-add-service-to-cart"
                      type="button"
                      onClick={handleAddToCart}
                      disabled={currentCalculation.lineTotal <= 0 || currentCalculation.centerFee <= 0 || (hasSubServices && selectedSubServiceIds.length === 0)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs font-anek flex items-center gap-1.5 shadow-xs transition ${
                        currentCalculation.lineTotal <= 0 || currentCalculation.centerFee <= 0 || (hasSubServices && selectedSubServiceIds.length === 0)
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                          : "bg-[#902A8B] hover:bg-[#7a2276] text-white cursor-pointer"
                      }`}
                    >
                      <Plus className="w-4 h-4" /> ইনভয়েসে সেবা যুক্ত করুন
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-5): Sticky Invoice Summary & Finalize (F-1) */}
        <div id="section-payment-summary" className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#37A448] dark:text-emerald-300 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base font-anek text-slate-900 dark:text-white leading-tight">
                    ধাপ ৩: ইনভয়েস সারাংশ ও পরিশোধ
                  </h3>
                  <p className="text-[11px] text-slate-400 font-kalpurush">
                    নির্বাচিত সেবাসমূহ ও পেমেন্ট গ্রহণ
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold font-anek bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300">
                {toBanglaNumber(cartLines.length)}টি সেবা
              </span>
            </div>

            {/* Cart Error Message */}
            {fieldErrors.cart && (
              <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-1.5 font-medium animate-in fade-in font-kalpurush">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{fieldErrors.cart}</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="overflow-y-auto max-h-56 space-y-2 mb-4 pr-1">
              {cartLines.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl font-kalpurush">
                  কোনো সেবা নির্বাচন করা হয়নি। বাম পাশ থেকে সেবা যুক্ত করুন।
                </div>
              ) : (
                cartLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-start justify-between text-xs hover:bg-purple-50/30 transition font-kalpurush"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-[#902A8B] dark:text-purple-400 font-anek truncate">
                          {line.serviceName}
                        </p>
                        {line.quantity && line.quantity > 1 && (
                          <span className="bg-purple-100 dark:bg-purple-950/80 text-[#902A8B] dark:text-purple-300 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                            {toBanglaNumber(line.quantity)}টি
                          </span>
                        )}
                      </div>
                      {line.subText && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{line.subText}</p>}
                      {line.applicationTrackingNo && (
                        <p className="text-[10px] text-[#37A448]">ট্র্যাকিং: {line.applicationTrackingNo}</p>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-anek">
                        {moneyBn(line.lineTotal)} ৳
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(idx)}
                        aria-label="সেবা অপসারণ করুন"
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-4 font-kalpurush">
              <div className="flex justify-between">
                <span>মোট সরকারি ফি:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 font-anek">
                  {moneyBn(cartLines.reduce((a, b) => a + b.govtFee, 0))} ৳
                </span>
              </div>
              <div className="flex justify-between">
                <span>পেমেন্ট গেটওয়ে ফি:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 font-anek">
                  {moneyBn(cartLines.reduce((a, b) => a + (b.gatewayFee || 0), 0))} ৳
                </span>
              </div>
              {cartLines.some((b) => (b.postalFee || 0) > 0) && (
                <div className="flex justify-between">
                  <span>সরকারি ডাক মাশুল:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 font-anek">
                    {moneyBn(cartLines.reduce((a, b) => a + (b.postalFee || 0), 0))} ৳
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>কেন্দ্র সেবা মাশুল:</span>
                <span className="font-bold text-[#37A448] font-anek">
                  {moneyBn(cartCenterTotal)} ৳
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-base text-[#902A8B] dark:text-purple-300 font-anek">
                <span>সর্বমোট প্রদেয়:</span>
                <span>{moneyBn(cartTotal)} ৳</span>
              </div>
            </div>

            {/* Payment & Received Amount */}
            <div className="bg-purple-50/70 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/80 mb-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label htmlFor="input-app-custom-paid-amount" className="text-xs font-bold text-slate-800 dark:text-slate-200 font-anek">
                    ভূমি মালিক কর্তৃক পরিশোধিত টাকা (৳):
                  </label>
                  {customPaidAmount !== "" && (
                    <button
                      type="button"
                      onClick={() => setCustomPaidAmount("")}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 rounded-md text-[10px] font-bold font-anek cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> পূর্ণ টাকা রিসেট
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    id="input-app-custom-paid-amount"
                    type="number"
                    step="any"
                    min="0"
                    placeholder={`সর্বমোট প্রদেয়: ${cartTotal > 0 ? cartTotal : 0} ৳`}
                    value={customPaidAmount}
                    onChange={(e) => setCustomPaidAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-bold text-slate-900 dark:text-white border border-purple-300 dark:border-purple-700 rounded-xl bg-white dark:bg-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#902A8B]"
                  />
                  <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                    ৳
                  </span>
                </div>
              </div>

              {remainingGap > 0 && (
                <div className="pt-2 border-t border-purple-200 dark:border-purple-800/60 text-xs space-y-2 font-kalpurush">
                  <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2 rounded-lg text-amber-900 dark:text-amber-200 font-semibold text-xs">
                    <span>কম প্রদানকৃত অবশিষ্ট টাকা:</span>
                    <span className="font-bold text-sm font-anek">{moneyBn(remainingGap)} ৳</span>
                  </div>

                  {govtAdvanceAtRisk && (
                    <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 p-2.5 rounded-lg text-rose-800 dark:text-rose-300 text-[11px] leading-snug">
                      <span className="text-sm shrink-0">⚠️</span>
                      <span>
                        <strong>সতর্কবার্তা:</strong> এই {remainingMode === "waived" ? "মওকুফের" : "বকেয়ার"} পরিমাণ মোট কেন্দ্র-ফি
                        ({moneyBn(cartCenterTotal)} ৳)-এর চেয়ে বেশি — অর্থাৎ সরকারি ফি ও ডাক মাশুল
                        (মোট {moneyBn(cartNonCenterTotal)} ৳) এখনও সম্পূর্ণ ওঠেনি।
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block font-anek">
                      অবশিষ্ট টাকার ধরণ:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`flex flex-col gap-0.5 p-2 rounded-xl border text-xs cursor-pointer transition ${
                          remainingMode === "due"
                            ? "bg-amber-50/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700 font-bold"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="remainingMode"
                            checked={remainingMode === "due"}
                            onChange={() => setRemainingMode("due")}
                            className="text-[#902A8B] cursor-pointer"
                          />
                          <span className="font-bold">বাকি (Due)</span>
                        </div>
                        <span className="text-[10px] text-rose-600 font-normal ml-5">➔ সাময়িক রসিদ</span>
                      </label>

                      <label
                        className={`flex flex-col gap-0.5 p-2 rounded-xl border text-xs cursor-pointer transition ${
                          remainingMode === "waived"
                            ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700 font-bold"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="remainingMode"
                            checked={remainingMode === "waived"}
                            onChange={() => setRemainingMode("waived")}
                            className="text-[#37A448] cursor-pointer"
                          />
                          <span className="font-bold">মওকুফ (Waived)</span>
                        </div>
                        <span className="text-[10px] text-[#37A448] font-normal ml-5">➔ পূর্ণ পেইড রসিদ</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selector (F-6) */}
            <div className="mb-4">
              <label htmlFor="select-app-payment-method" className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-anek mb-1">
                পরিশোধের মাধ্যম
              </label>
              <select
                id="select-app-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-kalpurush focus:outline-none focus:ring-2 focus:ring-[#902A8B]"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.fullNameBn}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate & Print Invoice Button (F-5: Ctrl+Enter) */}
            <div className="space-y-1.5">
              <button
                id="btn-submit-generate-invoice"
                type="button"
                disabled={cartLines.length === 0}
                onClick={handleCreateInvoice}
                title={cartLines.length === 0 ? "কার্টে অন্তত একটি সেবা যুক্ত করুন" : "ইনভয়েস তৈরি ও প্রিন্ট করুন (Ctrl+Enter)"}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm font-anek flex items-center justify-center gap-2 shadow-sm transition transform active:scale-98 ${
                  cartLines.length === 0
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    : "bg-[#37A448] hover:bg-[#2d873a] text-white cursor-pointer hover:shadow"
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>ইনভয়েস তৈরি ও রসিদ প্রিন্ট করুন</span>
                <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 bg-black/20 text-white rounded font-mono font-bold ml-1">
                  Ctrl+Enter
                </kbd>
              </button>

              {cartLines.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center font-kalpurush">
                  * ইনভয়েস তৈরি করতে বাম পাশ থেকে অন্তত একটি সেবা কার্টে যোগ করুন
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* At-Risk Advance Confirmation Dialog */}
      <ConfirmDialog
        isOpen={atRiskConfirmOpen}
        title="বকেয়া ও সরকারি ফি ঝুঁকি সতর্কতা"
        message={
          <div className="space-y-2 font-kalpurush">
            <p className="font-semibold text-rose-700">
              পরিশোধিত টাকার অঙ্ক মোট সরকারি ও অন্যান্য ফির ({moneyBn(cartNonCenterTotal)} ৳) চেয়ে কম!
            </p>
            <p>
              ভূমি মালিকের কাছ থেকে নেওয়া টাকা সরকারি ফি কভার করছে না। কেন্দ্রকে নিজস্ব তহবিল থেকে অবশিষ্ট সরকারি ফি অগ্রিম প্রদান করতে হবে।
            </p>
            <p className="text-xs text-slate-500">
              আপনি কি নিশ্চিতভাবে এই ইনভয়েসটি তৈরি ও বকেয়া হিসেবে সংরক্ষণ করতে চান?
            </p>
          </div>
        }
        confirmLabel="হ্যাঁ, ইনভয়েস তৈরি করুন"
        cancelLabel="ফিরে যান ও সংশোধন করুন"
        variant="warning"
        onConfirm={() => {
          setAtRiskConfirmOpen(false);
          executeInvoiceGeneration();
        }}
        onCancel={() => setAtRiskConfirmOpen(false)}
      />

      {/* Invoice Success Post-Action Modal (F-3) */}
      <InvoiceSuccessModal
        invoice={isSuccessModalOpen ? createdInvoice : null}
        onClose={() => setIsSuccessModalOpen(false)}
        onPrintPreview={() => {
          setIsSuccessModalOpen(false);
          setIsInvoicePrintOpen(true);
        }}
        onNewInvoice={() => {
          setIsSuccessModalOpen(false);
          setCreatedInvoice(null);
          document.getElementById("input-customer-mobile")?.focus();
        }}
      />

      {/* Invoice Print & Vector PDF Modal */}
      {isInvoicePrintOpen && createdInvoice && (
        <InvoicePrint
          invoice={createdInvoice}
          onClose={() => {
            setIsInvoicePrintOpen(false);
            setCreatedInvoice(null);
          }}
          settings={printSettings}
        />
      )}
    </div>
  );
};
