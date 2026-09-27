import React, { useState, useMemo } from "react";
import {
  FileText,
  User,
  Phone,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Sparkles,
  MapPin,
  FileCheck2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  SERVICE_DEFINITIONS,
  calculateServiceLine,
  calculateCustomServiceLine,
  calculateSubServiceLine,
  CalculatedServiceLine,
} from "../utils/serviceCalculator";
import {
  cleanPhone,
  findCustomerByPhoneOrNid,
} from "../utils/customerStore";
import {
  generateInvoiceNo,
  addInvoice,
  InvoiceRecord,
} from "../utils/invoiceStore";
import { toBanglaNumber, moneyBn, InvoicePrint } from "./InvoicePrint";
import { useInstitutionSettings, toInvoiceSettings, ServiceSettingItem } from "../utils/institutionSettings";

export const ApplicationForm: React.FC = () => {
  const { settings: institutionSettings } = useInstitutionSettings();
  const printSettings = toInvoiceSettings(institutionSettings);

  // সেটিংসে সংরক্ষিত সব সক্রিয় সেবা (বিল্ট-ইন + কাস্টম), প্রদর্শনের ক্রম অনুযায়ী সাজানো —
  // এটাই একমাত্র সোর্স যা থেকে কার্ড-গ্রিড রেন্ডার হয়
  const activeServices: ServiceSettingItem[] = [...(institutionSettings.services || [])]
    .filter((s) => s.isActive)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  // Customer inputs
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [nidNo, setNidNo] = useState("");
  const [address, setAddress] = useState("");
  const [existingCustomerFound, setExistingCustomerFound] = useState(false);

  // Wrong data type real-time warnings
  const [mobileTypeError, setMobileTypeError] = useState<string | null>(null);
  const [nidTypeError, setNidTypeError] = useState<string | null>(null);
  const [nameTypeError, setNameTypeError] = useState<string | null>(null);

  // Active service selection — ServiceSettingItem.id দিয়ে ট্র্যাক করা হয় (বিল্ট-ইন হোক বা কাস্টম)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number>(0);
  const [trackingNo, setTrackingNo] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState<number>(1);

  // Service specific parameters (built-in সেবাগুলোর ডায়নামিক ইনপুটের জন্য)
  const [pages, setPages] = useState<number>(20);
  const [applicants, setApplicants] = useState<number>(4);

  // subServices কনফিগার করা যেকোনো সেবার জন্য জেনেরিক ইনপুট (যেমন: ভূমি উন্নয়ন কর)
  const [manualGovtFee, setManualGovtFee] = useState<number>(0);
  const [selectedSubServiceIds, setSelectedSubServiceIds] = useState<string[]>([]);

  // Invoice cart
  const [cartLines, setCartLines] = useState<CalculatedServiceLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("নগদ (Cash)");
  const [customPaidAmount, setCustomPaidAmount] = useState<string>("");
  const [remainingMode, setRemainingMode] = useState<"due" | "waived">("due");

  // Created invoice modal state
  const [createdInvoice, setCreatedInvoice] = useState<InvoiceRecord | null>(null);

  // প্রথম রেন্ডারে ডিফল্টভাবে প্রথম সক্রিয় সেবা নির্বাচিত থাকবে
  const effectiveSelectedId = selectedServiceId ?? activeServices[0]?.id ?? null;
  const selectedItem = activeServices.find((s) => s.id === effectiveSelectedId);
  const builtInType = selectedItem?.builtInType;
  const hasSubServices = (selectedItem?.subServices?.length ?? 0) > 0;

  // নামজারিতে অতিরিক্ত পৃষ্ঠা/আবেদনকারীর ফি-ভাঙন জরুরি তথ্য — সাব-টাইটেল প্রিসেট দিয়ে সেটা চাপা পড়তে দেওয়া হয় না
  const namjariHasExtraFeeBreakdown = builtInType === "namjari" && (pages > 20 || applicants > 4);
  const chosenSubtitleOption =
    !hasSubServices && !namjariHasExtraFeeBreakdown && selectedItem?.subtitles && selectedItem.subtitles.length > 0
      ? selectedItem.subtitles[selectedSubtitleIndex] ?? selectedItem.subtitles[0]
      : undefined;

  // Live preview calculation for the currently selected service — সাব-টাইটেল বাছাই করা থাকলে তার
  // postalFee (থাকলে) সরাসরি ক্যালকুলেটরে পাঠানো হয়, যাতে গেটওয়ে ফি (সরকারি+ডাক ফি-র উপর) সঠিকভাবে গণনা হয়
  const safeQty = Math.max(1, Math.round(Number(serviceQuantity) || 1));

  const baseCalculation: CalculatedServiceLine | null = !selectedItem
    ? null
    : hasSubServices
    ? calculateSubServiceLine(selectedItem, manualGovtFee, selectedSubServiceIds, trackingNo, safeQty)
    : builtInType
    ? calculateServiceLine({
        serviceType: builtInType,
        // সেটিংসে অ্যাডমিন শিরোনাম বদলালে সেটাই ব্যবহার হবে
        customTitle:
          selectedItem.serviceName && selectedItem.serviceName !== SERVICE_DEFINITIONS[builtInType].nameBn
            ? selectedItem.serviceName
            : undefined,
        pages,
        applicants,
        applicationTrackingNo: trackingNo,
        quantity: safeQty,
      })
    : calculateCustomServiceLine(selectedItem, trackingNo, chosenSubtitleOption?.postalFee, safeQty);

  const isLdTax =
    selectedItem?.id === "svc-ld-tax" ||
    (selectedItem?.serviceName ? selectedItem.serviceName.includes("ভূমি উন্নয়ন কর") || selectedItem.serviceName.includes("LD Tax") : false);

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

  // বাংলা ডিজিটকে ইংরেজিতে রূপান্তরের সহকারী ফাংশন
  const normalizeDigits = (str: string) => {
    const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return str.replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
  };

  // রিয়েল-টাইম মোবাইল নম্বর ভ্যালিডেশন
  const mobileValidation = useMemo(() => {
    const raw = mobile.trim();
    if (!raw) return { status: "idle", message: "", isValid: false };

    const normalized = normalizeDigits(raw);

    // কোনো অক্ষর বা বিশেষ চিহ্ন টাইপ করলে (Wrong data type)
    if (/[^\d]/.test(normalized)) {
      return {
        status: "error",
        message: "ভুল ডেটা টাইপ: মোবাইল নম্বরে শুধুমাত্র সংখ্যা লিখুন (অক্ষর বা চিহ্ন নয়)।",
        isValid: false,
      };
    }

    if (!normalized.startsWith("01")) {
      return {
        status: "error",
        message: "মোবাইল নম্বর অবশ্যই 01 দিয়ে শুরু হতে হবে।",
        isValid: false,
      };
    }

    if (normalized.length < 11) {
      return {
        status: "warning",
        message: `১১ ডিজিট পূর্ণ করুন (বর্তমান: ${toBanglaNumber(normalized.length)}/১১)`,
        isValid: false,
      };
    }

    if (normalized.length > 11) {
      return {
        status: "error",
        message: `১১ ডিজিটের বেশি গ্রহণযোগ্য নয় (বর্তমান: ${toBanglaNumber(normalized.length)} ডিজিট)`,
        isValid: false,
      };
    }

    return {
      status: "success",
      message: "সঠিক মোবাইল নম্বর (১১ ডিজিট)",
      isValid: true,
    };
  }, [mobile]);

  // রিয়েল-টাইম এনআইডি ভ্যালিডেশন
  const nidValidation = useMemo(() => {
    const raw = nidNo.trim();
    if (!raw) return { status: "idle", message: "", isValid: true };

    const normalized = normalizeDigits(raw);

    if (/[^\d]/.test(normalized)) {
      return {
        status: "error",
        message: "ভুল ডেটা টাইপ: এনআইডিতে কোনো অক্ষর বা বিশেষ চিহ্ন ব্যবহার করা যাবে না।",
        isValid: false,
      };
    }

    const len = normalized.length;
    if (len === 10) {
      return {
        status: "success",
        message: "সঠিক এনআইডি: স্মার্ট কার্ড (১০ ডিজিট)",
        isValid: true,
      };
    }
    if (len === 13) {
      return {
        status: "success",
        message: "সঠিক এনআইডি: পুরোনো ফরম্যাট (১৩ ডিজিট)",
        isValid: true,
      };
    }
    if (len === 17) {
      return {
        status: "success",
        message: "সঠিক এনআইডি: ১৭ ডিজিট ফরম্যাট",
        isValid: true,
      };
    }

    return {
      status: "warning",
      message: `এনআইডি অবশ্যই ১০, ১৩ বা ১৭ ডিজিট হতে হবে (বর্তমান: ${toBanglaNumber(len)} ডিজিট)`,
      isValid: false,
    };
  }, [nidNo]);

  // রিয়েল-টাইম নামের ভ্যালিডেশন (বাংলা বর্ণমালা ও প্রমিত বানান নিশ্চিতকরণ)
  const nameValidation = useMemo(() => {
    const raw = fullName.trim();
    if (!raw) return { status: "idle", message: "", isValid: false };

    // ১. কোনো ইংরেজি অক্ষর থাকা যাবে না
    if (/[a-zA-Z]/.test(raw)) {
      return {
        status: "error",
        message: "নাম অবশ্যই বাংলায় লিখতে হবে (যেমন: মো. খোরশেদ আলম বা মোছা. নুরিয়া ইয়াসমিন)। ইংরেজি অক্ষর গ্রহণযোগ্য নয়।",
        isValid: false,
      };
    }

    // ২. কোনো বাংলা বা ইংরেজি সংখ্যা থাকা যাবে না
    if (/[\d০-৯]/.test(raw)) {
      return {
        status: "error",
        message: "ভুল ডেটা টাইপ: ভূমি মালিকের নামের ঘরে কোনো সংখ্যা গ্রহণযোগ্য নয়।",
        isValid: false,
      };
    }

    // ৩. ন্যূনতম একটি বাংলা বর্ণ থাকতে হবে
    if (!/[\u0985-\u09B9\u09CE\u09DC-\u09DF]/.test(raw)) {
      return {
        status: "error",
        message: "অনুগ্রহ করে সঠিক বাংলা অক্ষরে নাম লিখুন।",
        isValid: false,
      };
    }

    return { status: "idle", message: "", isValid: true };
  }, [fullName]);

  // Customer lookup helper
  const checkCustomerLookup = (phoneVal: string) => {
    const cleaned = cleanPhone(phoneVal);
    if (cleaned.length >= 10) {
      const match = findCustomerByPhoneOrNid(cleaned);
      if (match) {
        setFullName(match.fullName || "");
        if (match.nidNo) setNidNo(match.nidNo);
        if (match.address) setAddress(match.address);
        setExistingCustomerFound(true);
        return;
      }
    }
    setExistingCustomerFound(false);
  };

  // মোবাইল ইনপুট: স্ট্রিং/বর্ণ বা চিহ্ন দিলে সাথে সাথে মুছে যাবে এবং ওয়ার্নিং দেখাবে
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const hasInvalid = /[^\d০-৯]/.test(val);

    if (hasInvalid) {
      setMobileTypeError("ভুল ডেটা টাইপ! মোবাইল নম্বরে অক্ষর বা চিহ্ন গ্রহণযোগ্য নয় — শুধুমাত্র সংখ্যা লিখুন।");
      const filtered = val.replace(/[^\d০-৯]/g, "").slice(0, 11);
      setMobile(filtered);
      checkCustomerLookup(filtered);
      return;
    }

    setMobileTypeError(null);
    const filtered = val.slice(0, 11);
    setMobile(filtered);
    checkCustomerLookup(filtered);
  };

  // এনআইডি ইনপুট: কোনো বর্ণ বা চিহ্ন দিলে সাথে সাথে মুছে যাবে এবং ওয়ার্নিং দেখাবে
  const handleNidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const hasInvalid = /[^\d০-৯]/.test(val);

    if (hasInvalid) {
      setNidTypeError("ভুল ডেটা টাইপ! এনআইডিতে কোনো অক্ষর গ্রহণযোগ্য নয় — শুধুমাত্র এনআইডি নম্বর লিখুন।");
      const filtered = val.replace(/[^\d০-৯]/g, "").slice(0, 17);
      setNidNo(filtered);
      return;
    }

    setNidTypeError(null);
    setNidNo(val.slice(0, 17));
  };

  // ভূমি মালিকের নাম ইনপুট: বাংলা বর্ণ, কারচিহ্ন, ডট (.), বিসর্গ/কোলন (ঃ/:), হাইফেন (-) ব্যতীত অন্য কিছু ফিল্টার হবে
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const hasNumbers = /[\d০-৯]/.test(val);
    const hasEnglish = /[a-zA-Z]/.test(val);

    if (hasNumbers) {
      setNameTypeError("ভুল ডেটা টাইপ! ভূমি মালিকের নামের ঘরে কোনো সংখ্যা গ্রহণযোগ্য নয় — শুধুমাত্র বাংলায় নাম লিখুন।");
      const filtered = val.replace(/[\d০-৯]/g, "");
      setFullName(filtered);
      return;
    }

    if (hasEnglish) {
      setNameTypeError("ভুল ডেটা টাইপ! নাম শুধুমাত্র বাংলায় লিখতে হবে (যেমন: মো. খোরশেদ আলম বা মোছা. নুরিয়া)।");
      const filtered = val.replace(/[a-zA-Z]/g, "");
      setFullName(filtered);
      return;
    }

    // ফিল্টার: শুধুমাত্র বাংলা ইউনিকোড, স্পেস, ডট, কোলন, বিসর্গ, হাইফেন
    const hasInvalidSymbols = /[^\u0980-\u09FF\s.:\-]/.test(val);
    if (hasInvalidSymbols) {
      setNameTypeError("অননুমোদিত চিহ্ন! শুধুমাত্র বাংলা অক্ষর, ডট (.), কোলন ও হাইফেন গ্রহণযোগ্য।");
      const filtered = val.replace(/[^\u0980-\u09FF\s.:\-]/g, "");
      setFullName(filtered);
      return;
    }

    setNameTypeError(null);
    setFullName(val);
  };

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    setSelectedSubtitleIndex(0);
    const item = activeServices.find((s) => s.id === id);
    if (item?.subServices && item.subServices.length > 0) {
      const defaultSub = item.subServices.find((s) => s.id === "online_submit") || item.subServices[0];
      setSelectedSubServiceIds([defaultSub.id]);
    } else {
      setSelectedSubServiceIds([]);
    }
    setServiceQuantity(1);
    setManualGovtFee(item?.subServices && item.subServices.length > 0 ? item.govtFee || 0 : 0);
  };

  const handleAddToCart = () => {
    if (!currentCalculation) return;

    if (currentCalculation.centerFee <= 0 || (hasSubServices && selectedSubServiceIds.length === 0)) {
      alert("সঠিক কেন্দ্র ফি নির্বাচন করুন");
      return;
    }

    if (currentCalculation.lineTotal <= 0) {
      alert("সঠিক কেন্দ্র ফি নির্বাচন করুন");
      return;
    }

    setCartLines((prev) => [...prev, currentCalculation]);
    setTrackingNo("");
    setServiceQuantity(1);
    if (hasSubServices) {
      const defaultSub = selectedItem?.subServices?.find((s) => s.id === "online_submit") || selectedItem?.subServices?.[0];
      setSelectedSubServiceIds(defaultSub ? [defaultSub.id] : []);
      setManualGovtFee(0);
    }
  };

  const handleRemoveFromCart = (index: number) => {
    setCartLines((prev) => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cartLines.reduce((acc, curr) => acc + curr.lineTotal, 0);
  const cartCenterTotal = cartLines.reduce((acc, curr) => acc + curr.centerFee, 0);
  const cartNonCenterTotal = Math.round((cartTotal - cartCenterTotal) * 100) / 100;
  const numericPaid =
    customPaidAmount !== ""
      ? Math.max(0, Number.parseFloat(customPaidAmount) || 0)
      : cartTotal;
  const remainingGap = Math.max(
    0,
    Math.round((cartTotal - numericPaid) * 100) / 100
  );
  // বকেয়া/মাফ — দুটোই কেন্দ্র-ফি অংশ থেকে কাটা হয়, তাই কোনোটাই মোট কেন্দ্র-ফি'র চেয়ে বেশি হতে পারবে না।
  // এর বেশি হলে মানে সরকারি/ডাক/গেটওয়ে ফি-এর অংশও অপরিশোধিত থেকে যাচ্ছে — এটাই "বকেয়া-অগ্রিম" ঝুঁকি।
  const govtAdvanceAtRisk = remainingGap > cartCenterTotal + 0.0001;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!mobile.trim() || !fullName.trim()) {
      alert("অনুগ্রহ করে ভূমি মালিকের নাম ও মোবাইল নম্বর লিখুন।");
      return;
    }

    // --- ভ্যালিডেশন লজিক ---
    if (!mobileValidation.isValid) {
      alert(mobileValidation.message || "সঠিক মোবাইল নম্বর দিন (অবশ্যই 01 দিয়ে শুরু এবং ১১ ডিজিটের হতে হবে)।");
      return;
    }

    if (nameValidation.status === "error" || !nameValidation.isValid) {
      alert(nameValidation.message || "ভূমি মালিকের নাম সঠিক বাংলা অক্ষরে লিখুন (কোনো ইংরেজি বা সংখ্যা গ্রহণযোগ্য নয়)।");
      return;
    }

    if (nidNo.trim() && !nidValidation.isValid) {
      alert(nidValidation.message || "সঠিক NID নম্বর দিন (১০, ১৩ বা ১৭ ডিজিট হতে হবে)।");
      return;
    }

    const cleanedMobile = cleanPhone(mobile);

    if (cartLines.length === 0) {
      alert("ইনভয়েস তৈরি করার আগে অন্তত একটি সেবা যুক্ত করুন।");
      return;
    }

    if (cartLines.some((l) => l.lineTotal <= 0 || l.centerFee <= 0)) {
      alert("সঠিক কেন্দ্র ফি নির্বাচন করুন");
      return;
    }

    // --- বকেয়া-অগ্রিম সতর্কতা ---
    // বকেয়া/মাফের পরিমাণ মোট কেন্দ্র-ফি'র বেশি হলে মানে সরকারি/ডাক/গেটওয়ে ফি অংশও অপরিশোধিত থেকে যাচ্ছে
    if (govtAdvanceAtRisk) {
      const proceed = confirm(
        `⚠️ সতর্কবার্তা: ভূমি মালিকের প্রদত্ত টাকা (${moneyBn(numericPaid)} ৳) দিয়ে সরকারি ফি, ডাক ফি ও গেটওয়ে ফি (মোট ${moneyBn(
          cartNonCenterTotal
        )} ৳) সম্পূর্ণ মেটানো যাচ্ছে না — কেন্দ্র-ফি'র চেয়ে বেশি ${remainingMode === "waived" ? "মাফ" : "বকেয়া"} থাকছে (${moneyBn(
          remainingGap
        )} ৳)। এর মানে সরকারি অগ্রিম মেটাতে কেন্দ্রকে নিজের টাকা থেকে দিতে হতে পারে।\n\nআপনি কি নিশ্চিতভাবে এভাবেই ইনভয়েস তৈরি করতে চান?`
      );
      if (!proceed) return;
    }

    let finalPaid = cartTotal;
    let finalDue = 0;
    let finalDiscount = 0;
    let finalStatus: "PAID" | "PARTIAL" | "WAIVED" = "PAID";

    if (customPaidAmount !== "") {
      if (numericPaid >= cartTotal) {
        finalPaid = cartTotal;
        finalDue = 0;
        finalDiscount = 0;
        finalStatus = "PAID";
      } else {
        finalPaid = numericPaid;
        if (remainingMode === "waived") {
          finalDue = 0;
          finalDiscount = remainingGap;
          finalStatus = "WAIVED";
        } else {
          finalDue = remainingGap;
          finalDiscount = 0;
          finalStatus = "PARTIAL";
        }
      }
    }

    const newInvoiceNo = generateInvoiceNo();
    const invoiceRecord: InvoiceRecord = {
      invoiceNo: newInvoiceNo,
      customer: {
        fullName: fullName.trim(),
        mobile: cleanedMobile,
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
                date: new Date().toISOString().slice(0, 10),
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

    // Reset Form
    setCartLines([]);
    setMobile("");
    setFullName("");
    setNidNo("");
    setAddress("");
    setCustomPaidAmount("");
    setRemainingMode("due");
    setExistingCustomerFound(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-[#902A8B]" />
              <h2 className="text-xl font-bold font-anek text-gray-800">
                নতুন ভূমিসেবা আবেদন ও ইনভয়েস তৈরি
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ভূমি মালিকের তথ্য এবং সঠিক সেবা নির্বাচন করে প্রমিত ভেক্টর পিডিএফ রসিদ প্রিন্ট করুন
            </p>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 text-[#902A8B] px-3 py-1.5 rounded-lg border border-purple-200 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-[#37A448]" />
            স্বয়ংক্রিয় গেটওয়ে ও প্রমিত ফি গণনা
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Customer Info & Service Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Box */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#902A8B]" />
                <h3 className="font-bold text-gray-800 font-anek text-base">ভূমি মালিকের তথ্য</h3>
              </div>
              {existingCustomerFound && (
                <span className="bg-green-100 text-[#37A448] text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> পূর্বে সংরক্ষিত ভূমি মালিক
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* মোবাইল নম্বর */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="input-customer-mobile" className="block text-xs font-semibold text-gray-700">
                    মোবাইল নম্বর <span className="text-red-500">*</span>
                  </label>
                  {mobile.trim() && (
                    <span
                      className={`text-[11px] font-bold font-anek ${
                        mobileValidation.isValid
                          ? "text-[#37A448]"
                          : "text-[#EC2324]"
                      }`}
                    >
                      {toBanglaNumber(normalizeDigits(mobile.trim()).length)}/১১ ডিজিট
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone
                    className={`w-4 h-4 absolute left-3 top-2.5 transition-colors ${
                      mobileValidation.isValid
                        ? "text-[#37A448]"
                        : mobileValidation.status !== "idle"
                        ? "text-[#EC2324]"
                        : "text-gray-400"
                    }`}
                  />
                  <input
                    id="input-customer-mobile"
                    type="text"
                    required
                    maxLength={11}
                    placeholder="017XXXXXXXX"
                    value={mobile}
                    onChange={handleMobileChange}
                    className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg transition-all duration-150 focus:outline-hidden ${
                      mobileTypeError
                        ? "border-2 border-[#EC2324] bg-red-50 text-gray-900 ring-2 ring-[#EC2324]/30"
                        : mobileValidation.isValid
                        ? "border-2 border-[#37A448] bg-emerald-50/25 text-gray-900 focus:ring-2 focus:ring-[#37A448]"
                        : mobileValidation.status !== "idle"
                        ? "border-2 border-[#EC2324] bg-red-50/25 text-gray-900 focus:ring-2 focus:ring-[#EC2324]"
                        : "border border-gray-300 focus:ring-2 focus:ring-[#902A8B]"
                    }`}
                  />
                  {mobileValidation.isValid && !mobileTypeError && (
                    <CheckCircle2 className="w-4 h-4 text-[#37A448] absolute right-3 top-2.5" />
                  )}
                  {(mobileTypeError || (mobileValidation.status !== "idle" && !mobileValidation.isValid)) && (
                    <AlertCircle className="w-4 h-4 text-[#EC2324] absolute right-3 top-2.5" />
                  )}
                </div>
                {mobileTypeError ? (
                  <p className="text-[11px] mt-1.5 font-bold text-[#EC2324] bg-red-50 border border-red-200 px-2 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{mobileTypeError}</span>
                  </p>
                ) : mobileValidation.status !== "idle" && (
                  <p
                    className={`text-[11px] mt-1 font-medium flex items-center gap-1 ${
                      mobileValidation.isValid
                        ? "text-[#37A448]"
                        : "text-[#EC2324]"
                    }`}
                  >
                    {mobileValidation.isValid ? (
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 shrink-0" />
                    )}
                    <span>{mobileValidation.message}</span>
                  </p>
                )}
              </div>

              {/* ভূমি মালিকের নাম */}
              <div>
                <label htmlFor="input-customer-name" className="block text-xs font-semibold text-gray-700 mb-1">
                  ভূমি মালিকের পূর্ণ নাম <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User
                    className={`w-4 h-4 absolute left-3 top-2.5 transition-colors ${
                      nameTypeError || nameValidation.status === "error"
                        ? "text-[#EC2324]"
                        : "text-gray-400"
                    }`}
                  />
                  <input
                    id="input-customer-name"
                    type="text"
                    required
                    placeholder="যেমন: মো: রফিকুল ইসলাম"
                    value={fullName}
                    onChange={handleNameChange}
                    className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg transition-all duration-150 focus:outline-hidden ${
                      nameTypeError
                        ? "border-2 border-[#EC2324] bg-red-50 text-gray-900 ring-2 ring-[#EC2324]/30"
                        : nameValidation.status === "error"
                        ? "border-2 border-[#EC2324] bg-red-50/25 text-gray-900 focus:ring-2 focus:ring-[#EC2324]"
                        : "border border-gray-300 focus:ring-2 focus:ring-[#902A8B]"
                    }`}
                  />
                  {(nameTypeError || nameValidation.status === "error") && (
                    <AlertCircle className="w-4 h-4 text-[#EC2324] absolute right-3 top-2.5" />
                  )}
                </div>
                {nameTypeError ? (
                  <p className="text-[11px] mt-1.5 font-bold text-[#EC2324] bg-red-50 border border-red-200 px-2 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{nameTypeError}</span>
                  </p>
                ) : nameValidation.status === "error" && (
                  <p className="text-[11px] mt-1 font-medium text-[#EC2324] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{nameValidation.message}</span>
                  </p>
                )}
              </div>

              {/* জাতীয় পরিচয়পত্র (NID) নম্বর */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="input-customer-nid" className="block text-xs font-semibold text-gray-700">
                    জাতীয় পরিচয়পত্র (NID) নম্বর
                  </label>
                  {nidNo.trim() && (
                    <span
                      className={`text-[11px] font-bold font-anek ${
                        nidValidation.isValid ? "text-[#37A448]" : "text-[#EC2324]"
                      }`}
                    >
                      {toBanglaNumber(normalizeDigits(nidNo.trim()).length)} ডিজিট
                    </span>
                  )}
                </div>
                <div className="relative">
                  <CreditCard
                    className={`w-4 h-4 absolute left-3 top-2.5 transition-colors ${
                      nidTypeError
                        ? "text-[#EC2324]"
                        : nidNo.trim() && nidValidation.isValid
                        ? "text-[#37A448]"
                        : nidValidation.status !== "idle" && !nidValidation.isValid
                        ? "text-[#EC2324]"
                        : "text-gray-400"
                    }`}
                  />
                  <input
                    id="input-customer-nid"
                    type="text"
                    maxLength={17}
                    placeholder="১০, ১৩ বা ১৭ ডিজিট"
                    value={nidNo}
                    onChange={handleNidChange}
                    className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg transition-all duration-150 focus:outline-hidden ${
                      nidTypeError
                        ? "border-2 border-[#EC2324] bg-red-50 text-gray-900 ring-2 ring-[#EC2324]/30"
                        : nidNo.trim() && nidValidation.isValid
                        ? "border-2 border-[#37A448] bg-emerald-50/25 text-gray-900 focus:ring-2 focus:ring-[#37A448]"
                        : nidValidation.status !== "idle" && !nidValidation.isValid
                        ? "border-2 border-[#EC2324] bg-red-50/25 text-gray-900 focus:ring-2 focus:ring-[#EC2324]"
                        : "border border-gray-300 focus:ring-2 focus:ring-[#902A8B]"
                    }`}
                  />
                  {nidNo.trim() && nidValidation.isValid && !nidTypeError && (
                    <CheckCircle2 className="w-4 h-4 text-[#37A448] absolute right-3 top-2.5" />
                  )}
                  {(nidTypeError || (nidValidation.status !== "idle" && !nidValidation.isValid)) && (
                    <AlertCircle className="w-4 h-4 text-[#EC2324] absolute right-3 top-2.5" />
                  )}
                </div>
                {nidTypeError ? (
                  <p className="text-[11px] mt-1.5 font-bold text-[#EC2324] bg-red-50 border border-red-200 px-2 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{nidTypeError}</span>
                  </p>
                ) : nidValidation.status !== "idle" && (
                  <p
                    className={`text-[11px] mt-1 font-medium flex items-center gap-1 ${
                      nidValidation.isValid ? "text-[#37A448]" : "text-[#EC2324]"
                    }`}
                  >
                    {nidValidation.isValid ? (
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 shrink-0" />
                    )}
                    <span>{nidValidation.message}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="input-customer-address" className="block text-xs font-medium text-gray-700 mb-1">
                  ঠিকানা / গ্রাম / মৌজা
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    id="input-customer-address"
                    type="text"
                    placeholder="গ্রাম, ইউনিয়ন, জেলা"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service Configuration Box */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <FileText className="w-5 h-5 text-[#902A8B]" />
              <h3 className="font-bold text-gray-800 font-anek text-base">ভূমিসেবা নির্বাচন ও বিবরণ</h3>
            </div>

            {/* Service Type Selection Grid — একই তালিকা থেকে বিল্ট-ইন ও কাস্টম উভয় সেবা রেন্ডার হয়; ছোট কার্ড, শুধু শিরোনাম ও ফি */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-6">
              {activeServices.map((item, idx) => {
                const isSelected = effectiveSelectedId === item.id;
                const def = item.builtInType ? SERVICE_DEFINITIONS[item.builtInType] : undefined;
                const itemHasSub = (item.subServices?.length ?? 0) > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectService(item.id)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition relative flex flex-col justify-between ${
                      isSelected
                        ? "border-[#902A8B] bg-purple-50/60 ring-2 ring-[#902A8B]/30 shadow-xs"
                        : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-1.5 mb-1">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold font-anek rounded-full shrink-0 ${
                            isSelected
                              ? "bg-[#902A8B] text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {toBanglaNumber(idx + 1)}
                        </span>
                        <p className={`font-bold text-xs sm:text-sm line-clamp-2 leading-tight ${isSelected ? "text-[#902A8B]" : "text-gray-800"}`}>
                          {item.serviceName || def?.nameBn || "(নামহীন সেবা)"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px] font-anek">
                      <span className="text-gray-500">
                        সরকারি: {itemHasSub ? "ম্যানুয়াল" : `${toBanglaNumber(item.govtFee)}৳`}
                      </span>
                      <span className="font-semibold text-[#37A448]">
                        কেন্দ্র: {itemHasSub ? `${toBanglaNumber(item.subServices?.[0]?.fee || 20)}৳/ধাপ` : `${toBanglaNumber(item.centerFee)}৳`}
                      </span>
                    </div>
                  </button>
                );
              })}

              {activeServices.length === 0 && (
                <p className="col-span-full text-xs text-gray-400 text-center py-6">
                  কোনো সক্রিয় সেবা পাওয়া যায়নি। সেটিংস থেকে অন্তত একটি সেবা সক্রিয় করুন।
                </p>
              )}
            </div>

            {/* Dynamic Inputs per selected service */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-service-tracking" className="block text-xs font-medium text-gray-700 mb-1">
                    আবেদন / কেস / ট্র্যাকিং নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    id="input-service-tracking"
                    type="text"
                    placeholder="যেমন: NAM-2026-XXXXX বা পর্চা নং"
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                  />
                </div>

                <div>
                  <label htmlFor="input-app-service-quantity" className="block text-xs font-medium text-gray-700 mb-1">
                    {isLdTax ? "হোল্ডিংয়ের সংখ্যা / পরিমাণ" : "আবেদনের সংখ্যা / পরিমাণ"} (টি)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setServiceQuantity((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-l-lg border border-r-0 border-gray-300 transition text-sm cursor-pointer select-none"
                      title="পরিমাণ কমান"
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
                      className="w-full text-center px-2 py-2 text-sm font-bold text-[#902A8B] border border-gray-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                    />
                    <button
                      type="button"
                      onClick={() => setServiceQuantity((prev) => prev + 1)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-r-lg border border-l-0 border-gray-300 transition text-sm cursor-pointer select-none"
                      title="পরিমাণ বাড়ান"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {serviceQuantity > 1 ? (
                      <span className="text-[#37A448] font-semibold">
                        {toBanglaNumber(serviceQuantity)} গুণ ফি সমন্বয় হচ্ছে
                      </span>
                    ) : (
                      "একাধিক আবেদনের ক্ষেত্রে সংখ্যা বৃদ্ধি করুন"
                    )}
                  </p>
                </div>

                {builtInType === "namjari" && (
                  <>
                    <div>
                      <label htmlFor="input-app-pages" className="block text-xs font-medium text-gray-700 mb-1">
                        স্ক্যানকৃত পৃষ্ঠা সংখ্যা (২০ পৃষ্ঠা ফ্রি)
                      </label>
                      <input
                        id="input-app-pages"
                        type="number"
                        min="1"
                        value={pages}
                        onChange={(e) => setPages(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                      />
                      <p className="text-[11px] text-gray-500 mt-0.5">২০ পৃষ্ঠার বেশি হলে প্রতি পৃষ্ঠা ৳৩</p>
                      {pages > 20 && (
                        <p className="text-[11px] text-[#902A8B] font-medium mt-0.5">
                          অতিরিক্ত পৃষ্ঠা: {toBanglaNumber(pages - 20)}টি (ফি: {toBanglaNumber((pages - 20) * 3)} ৳)
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="input-app-applicants" className="block text-xs font-medium text-gray-700 mb-1">
                        আবেদনকারীর সংখ্যা (৪ জন পর্যন্ত ফ্রি)
                      </label>
                      <input
                        id="input-app-applicants"
                        type="number"
                        min="1"
                        value={applicants}
                        onChange={(e) => setApplicants(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                      />
                      <p className="text-[11px] text-gray-500 mt-0.5">৪ জনের বেশি হলে প্রতি ব্যক্তি/আবেদনকারী ৳১০</p>
                      {applicants > 4 && (
                        <p className="text-[11px] text-[#902A8B] font-medium mt-0.5">
                          অতিরিক্ত ব্যক্তি: {toBanglaNumber(applicants - 4)}জন (ফি: {toBanglaNumber((applicants - 4) * 10)} ৳)
                        </p>
                      )}
                    </div>
                  </>
                )}

                {hasSubServices && (
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="input-app-manual-govt-fee" className="block text-xs font-medium text-gray-700 mb-1">
                        সরকারি ফি (মূল দাবি, টাকা)
                      </label>
                      <input
                        id="input-app-manual-govt-fee"
                        type="number"
                        min="0"
                        value={manualGovtFee}
                        onChange={(e) => setManualGovtFee(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                      />
                      <p className="text-[11px] text-gray-500 mt-0.5">এই টাকার অংকটি সরকারি ফি হিসেবে গণ্য হবে।</p>
                    </div>
                    <div>
                      <div className="block text-xs font-medium text-gray-700 mb-2">
                        অধীনস্ত সেবা নির্বাচন করুন (একাধিক নির্বাচনযোগ্য)
                      </div>
                      <div className="space-y-1.5">
                        {selectedItem!.subServices!.map((sub) => (
                          <label key={sub.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSubServiceIds.includes(sub.id)}
                              onChange={(e) =>
                                setSelectedSubServiceIds((prev) =>
                                  e.target.checked ? [...prev, sub.id] : prev.filter((id) => id !== sub.id)
                                )
                              }
                              className="text-[#902A8B] rounded-sm"
                            />
                            {sub.label} (৳{toBanglaNumber(sub.fee)})
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!hasSubServices && (selectedItem?.subtitles?.length ?? 0) > 0 && (
                  <div className="md:col-span-2">
                    <div className="block text-xs font-medium text-gray-700 mb-2">
                      সাব-টাইটেল নির্বাচন করুন
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedItem!.subtitles!.map((opt, idx) => (
                        <label
                          key={opt.id}
                          className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="subtitlePreset"
                            checked={selectedSubtitleIndex === idx}
                            onChange={() => setSelectedSubtitleIndex(idx)}
                            className="text-[#902A8B]"
                          />
                          {opt.label || "(খালি)"}
                          {!!opt.postalFee && (
                            <span className="text-[10px] text-gray-400">(ডাক মাশুল ৳{toBanglaNumber(opt.postalFee)})</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {!builtInType && !hasSubServices && !(selectedItem?.subtitles?.length) && selectedItem?.subText && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-600 bg-purple-50 p-2.5 rounded-md border border-purple-200">
                      {selectedItem.subText}
                    </p>
                  </div>
                )}
              </div>

              {/* Realtime Service Calculation Preview Box */}
              {currentCalculation && (
                <div className="border-t border-gray-200 pt-3 space-y-2.5 text-xs">
                  {(currentCalculation.centerFee <= 0 || (hasSubServices && selectedSubServiceIds.length === 0)) && (
                    <div className="w-full bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="font-semibold text-red-600">
                        সঠিক কেন্দ্র ফি নির্বাচন করুন
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-gray-600">
                        সরকারি ফি: <strong className="text-gray-800">{moneyBn(currentCalculation.govtFee)}৳</strong>
                      </span>
                      <span className="text-gray-600">
                        গেটওয়ে ফি: <strong className="text-gray-800">{moneyBn(currentCalculation.gatewayFee)}৳</strong>
                      </span>
                      {currentCalculation.postalFee > 0 && (
                        <span className="text-gray-600">
                          ডাক মাশুল: <strong className="text-gray-800">{moneyBn(currentCalculation.postalFee)}৳</strong>
                        </span>
                      )}
                      <span className="text-gray-600">
                        কেন্দ্র মাশুল: <strong className={currentCalculation.centerFee <= 0 ? "text-red-600 font-bold" : "text-[#37A448]"}>{moneyBn(currentCalculation.centerFee)}৳</strong>
                      </span>
                      <span
                        className={`text-sm font-bold px-2 py-0.5 rounded-sm border ${
                          currentCalculation.lineTotal <= 0 || currentCalculation.centerFee <= 0 || (hasSubServices && selectedSubServiceIds.length === 0)
                            ? "text-red-600 bg-red-50 border-red-300"
                            : "text-[#902A8B] bg-white border-[#902A8B]/30"
                        }`}
                      >
                        লাইন মোট: {moneyBn(currentCalculation.lineTotal)} ৳
                      </span>
                    </div>

                    <button
                      id="btn-add-service-to-cart"
                      type="button"
                      onClick={handleAddToCart}
                      disabled={currentCalculation.lineTotal <= 0 || currentCalculation.centerFee <= 0 || (hasSubServices && selectedSubServiceIds.length === 0)}
                      className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-xs transition ${
                        currentCalculation.lineTotal <= 0 || currentCalculation.centerFee <= 0 || (hasSubServices && selectedSubServiceIds.length === 0)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-75"
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

        {/* Right Column: Invoice Cart & Finalize */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#37A448]" />
                <h3 className="font-bold text-gray-800 font-anek text-base">ইনভয়েস সারাংশ</h3>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                {toBanglaNumber(cartLines.length)}টি আইটেম
              </span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto max-h-64 space-y-2 mb-4 pr-1">
              {cartLines.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs border border-dashed rounded-lg">
                  কোনো সেবা নির্বাচন করা হয়নি। বাম পাশ থেকে সেবা যুক্ত করুন।
                </div>
              ) : (
                cartLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between text-xs hover:bg-purple-50/30 transition"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-[#902A8B]">{line.serviceName}</p>
                        {line.quantity && line.quantity > 1 && (
                          <span className="bg-purple-100 text-[#902A8B] px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {toBanglaNumber(line.quantity)}টি
                          </span>
                        )}
                      </div>
                      {line.subText && <p className="text-[11px] text-gray-500 mt-0.5">{line.subText}</p>}
                      {line.applicationTrackingNo && (
                        <p className="text-[10px] text-[#37A448]">ট্র্যাকিং: {line.applicationTrackingNo}</p>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-bold text-gray-800">{moneyBn(line.lineTotal)} ৳</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(idx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-gray-200 pt-3 space-y-2 text-xs text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>মোট সরকারি ফি:</span>
                <span className="font-medium text-gray-800">
                  {moneyBn(cartLines.reduce((a, b) => a + b.govtFee, 0))} ৳
                </span>
              </div>
              <div className="flex justify-between">
                <span>পেমেন্ট গেটওয়ে ফি:</span>
                <span className="font-medium text-gray-800">
                  {moneyBn(cartLines.reduce((a, b) => a + (b.gatewayFee || 0), 0))} ৳
                </span>
              </div>
              {cartLines.some((b) => (b.postalFee || 0) > 0) && (
                <div className="flex justify-between">
                  <span>সরকারি ডাক মাশুল:</span>
                  <span className="font-medium text-gray-800">
                    {moneyBn(cartLines.reduce((a, b) => a + (b.postalFee || 0), 0))} ৳
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>কেন্দ্র সেবা মাশুল:</span>
                <span className="font-medium text-[#37A448]">
                  {moneyBn(cartLines.reduce((a, b) => a + b.centerFee, 0))} ৳
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base text-[#902A8B]">
                <span>সর্বমোট প্রদেয়:</span>
                <span className="font-anek">{moneyBn(cartTotal)} ৳</span>
              </div>
            </div>

            {/* Payment & Received Amount */}
            <div className="bg-purple-50/80 p-3.5 rounded-xl border-2 border-purple-200 mb-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label htmlFor="input-app-custom-paid-amount" className="text-xs font-bold text-gray-800 whitespace-nowrap">
                    ভূমি মালিক কর্তৃক পরিশোধিত টাকা (৳):
                  </label>
                  {customPaidAmount !== "" && (
                    <button
                      type="button"
                      onClick={() => setCustomPaidAmount("")}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 hover:bg-[#EC2324] text-[#EC2324] hover:text-white border border-[#EC2324] rounded-md text-[11px] font-bold font-anek shadow-xs transition-all duration-150 cursor-pointer active:scale-95 shrink-0"
                      title="পূর্বে ধার্যকৃত সর্বমোট পূর্ণ টাকা ফিরিয়ে আনুন"
                    >
                      <RotateCcw className="w-3 h-3 shrink-0" />
                      <span>পূর্ণ টাকা রিসেট</span>
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
                    className="w-full px-3.5 py-2 text-sm font-bold text-gray-900 border-2 border-purple-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#902A8B] focus:border-[#902A8B]"
                  />
                  <span className="absolute right-3 text-xs font-bold text-gray-500 pointer-events-none">
                    ৳
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  * ভূমি মালিক কম টাকা দিলে এখানে টাকার অঙ্ক লিখুন (যেমন: ৫৩০ এর স্থলে ৫০০)।
                </p>
              </div>

              {remainingGap > 0 && (
                <div className="pt-2.5 border-t border-purple-200 text-xs space-y-2">
                  <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-2 rounded-lg text-amber-900 font-semibold text-xs">
                    <span>কম প্রদানকৃত অবশিষ্ট টাকা:</span>
                    <span className="font-bold text-sm font-anek">{moneyBn(remainingGap)} ৳</span>
                  </div>

                  {govtAdvanceAtRisk && (
                    <div className="flex items-start gap-2 bg-red-50 border border-[#EC2324] p-2.5 rounded-lg text-red-800 text-[11px] leading-snug">
                      <span className="text-sm shrink-0">⚠️</span>
                      <span>
                        <strong>সতর্কবার্তা:</strong> এই {remainingMode === "waived" ? "মাফের" : "বকেয়ার"} পরিমাণ মোট কেন্দ্র-ফি
                        ({moneyBn(cartCenterTotal)} ৳)-এর চেয়ে বেশি — অর্থাৎ সরকারি ফি, ডাক ফি ও গেটওয়ে ফি
                        (মোট {moneyBn(cartNonCenterTotal)} ৳) এখনো সম্পূর্ণ আদায় হয়নি। সরকারি অগ্রিম মেটাতে কেন্দ্রকে
                        নিজের টাকা থেকে দিতে হতে পারে।
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-gray-700 block">অবশিষ্ট টাকার ধরণ ও রসিদ স্ট্যাটাস:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`flex flex-col gap-0.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                        remainingMode === "due"
                          ? "bg-amber-50/80 border-[#EC2324] text-red-900 font-bold ring-1 ring-[#EC2324]"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="remainingMode"
                            checked={remainingMode === "due"}
                            onChange={() => setRemainingMode("due")}
                            className="text-[#EC2324] cursor-pointer"
                          />
                          <span className="font-bold">বাকি (Due)</span>
                        </div>
                        <span className="text-[10px] text-red-600 font-normal ml-5">➔ সাময়িক রসিদ (Temporary)</span>
                      </label>

                      <label className={`flex flex-col gap-0.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                        remainingMode === "waived"
                          ? "bg-emerald-50/80 border-[#37A448] text-green-900 font-bold ring-1 ring-[#37A448]"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="remainingMode"
                            checked={remainingMode === "waived"}
                            onChange={() => setRemainingMode("waived")}
                            className="text-[#37A448] cursor-pointer"
                          />
                          <span className="font-bold">ছাড় / মওকুফ</span>
                        </div>
                        <span className="text-[10px] text-green-700 font-normal ml-5">➔ পেইড রসিদ (Paid)</span>
                      </label>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-600 bg-white/80 p-2 rounded border border-purple-100 leading-snug">
                    🛡️ <strong>কাউন্টার প্রটেকশন নীতি:</strong> রসিদে কোনো বকেয়া অংক উল্লেখ থাকবে না—কেবল পরিশোধিত টাকার পরিমাণ ({moneyBn(numericPaid)} ৳) এবং অবস্থা অনুযায়ী <strong>{remainingMode === "due" ? "সাময়িক রসিদ" : "সম্পূর্ণ পরিশোধিত"}</strong> স্ট্যাম্প মুদ্রিত হবে।
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <label htmlFor="select-app-payment-method" className="block text-xs font-medium text-gray-700 mb-1">পরিশোধের মাধ্যম</label>
              <select
                id="select-app-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
              >
                <option value="নগদ (Cash)">নগদ (Cash)</option>
                <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                <option value="রকেট (Rocket)">রকেট (Rocket)</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              id="btn-submit-generate-invoice"
              type="button"
              disabled={cartLines.length === 0}
              onClick={handleCreateInvoice}
              className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition ${
                cartLines.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#37A448] hover:bg-[#2e8a3d] text-white"
              }`}
            >
              <Printer className="w-4 h-4" /> ইনভয়েস তৈরি ও প্রিন্ট করুন
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Print & Vector PDF Modal */}
      {createdInvoice && (
        <InvoicePrint
          invoice={createdInvoice}
          onClose={() => setCreatedInvoice(null)}
          settings={printSettings}
        />
      )}
    </div>
  );
};
