import { toBanglaNumber } from "./bengaliNumbers";
import type { ServiceSettingItem } from "./institutionSettings";

export type ServiceType = "namjari";

export interface ServiceInput {
  serviceType: ServiceType;
  customTitle?: string;
  pages?: number;
  applicants?: number;
  applicationTrackingNo?: string;
  quantity?: number;
}

export interface CalculatedServiceLine {
  serviceName: string;
  govtFee: number;
  gatewayFee: number;
  postalFee: number;
  centerFee: number;
  lineTotal: number;
  subText?: string;
  applicationTrackingNo?: string;
  quantity?: number;
}

export const SERVICE_DEFINITIONS: Record<
  ServiceType,
  {
    code: ServiceType;
    nameBn: string;
    nameEn: string;
    descriptionBn: string;
    defaultGovtFee: number;
    defaultCenterFee: number;
  }
> = {
  namjari: {
    code: "namjari",
    nameBn: "ই-নামজারি আবেদন",
    nameEn: "e-Namjari (Mutation)",
    descriptionBn:
      "রেকর্ড সংশোধন ও জমাভাগ আবেদন (২০ পৃষ্ঠা স্ক্যান ও ৪ আবেদনকারী অন্তর্ভুক্ত)",
    defaultGovtFee: 70,
    defaultCenterFee: 270,
  },
};

export function calculateServiceLine(input: ServiceInput): CalculatedServiceLine {
  let govtFee = 0;
  let postalFee = 0;
  let centerFee = 0;
  let subText = "";
  let serviceName = "";

  const qty = Math.max(1, Math.round(Number(input.quantity) || 1));

  // Exhaustive switch: every supported serviceType has its own case.
  // No silent fallback to a default service — if TypeScript's type union
  // ever grows without this switch being updated, the `never` assignment
  // in the default branch will fail compilation, which is intentional.
  switch (input.serviceType) {
    case "namjari": {
      serviceName = SERVICE_DEFINITIONS.namjari.nameBn;
      govtFee = 70 * qty;
      const pages = input.pages !== undefined ? Number(input.pages) : 20;
      const applicants = input.applicants !== undefined ? Number(input.applicants) : 4;

      const extraPages = Math.max(0, pages - 20) * 3;
      const extraApplicants = Math.max(0, applicants - 4) * 10;
      centerFee = (270 + extraPages + extraApplicants) * qty;

      const breakdownParts: string[] = [];
      if (qty > 1) {
        breakdownParts.push(`${toBanglaNumber(qty)}টি আবেদন`);
      }
      if (pages > 20) {
        breakdownParts.push(
          `অতিরিক্ত পৃষ্ঠা: ${toBanglaNumber(pages - 20)}টি (৳${toBanglaNumber(extraPages)})`
        );
      }
      if (applicants > 4) {
        breakdownParts.push(
          `অতিরিক্ত ব্যক্তি: ${toBanglaNumber(applicants - 4)}জন (৳${toBanglaNumber(extraApplicants)})`
        );
      }
      subText =
        breakdownParts.length > 0
          ? `(${breakdownParts.join(", ")})`
          : "(২০ পৃষ্ঠা স্ক্যান ও ৪ আবেদনকারী অন্তর্ভুক্ত)";
      break;
    }
    default: {
      // Exhaustiveness guard — TypeScript will error here if ServiceType
      // gains a new member without a corresponding case above.
      const _exhaustive: never = input.serviceType;
      throw new Error(
        `[serviceCalculator] Unsupported serviceType: ${String(_exhaustive)}`
      );
    }
  }

  // গেটওয়ে ফি: সরকারি ফি + ডাক মাশুল — এই দুটোর সম্মিলিত অঙ্কের উপর ১%
  const gatewayFee = Math.round((govtFee + postalFee) * 0.01 * 100) / 100;
  const lineTotal = Math.round((govtFee + gatewayFee + postalFee + centerFee) * 100) / 100;

  return {
    serviceName: input.customTitle || serviceName,
    govtFee,
    gatewayFee,
    postalFee,
    centerFee,
    lineTotal,
    subText: subText || undefined,
    applicationTrackingNo: input.applicationTrackingNo?.trim() || undefined,
    quantity: qty > 1 ? qty : undefined,
  };
}

/**
 * প্রতিষ্ঠান সেটিংস থেকে যোগ করা কাস্টম সেবার জন্য ফি হিসাব।
 * এখানে `gatewayFee` ইনপুটকে টাকা হিসেবে না ধরে, সরকারি ফি-র উপর শতাংশ (%) হিসেবে ধরা হয়
 * — অর্থাৎ ServiceSettingItem.gatewayFee = 1 মানে (সরকারি ফি + ডাক মাশুল)-এর ১%।
 */
export function calculateCustomServiceLine(
  item: ServiceSettingItem,
  applicationTrackingNo?: string,
  postalFeeOverride?: number,
  quantity: number = 1
): CalculatedServiceLine {
  const qty = Math.max(1, Math.round(Number(quantity) || 1));
  const baseGovt = Math.max(0, Number(item.govtFee) || 0);
  const govtFee = baseGovt * qty;
  const gatewayPercent = Math.max(0, Number(item.gatewayFee) || 0);
  const basePostal =
    postalFeeOverride !== undefined
      ? Math.max(0, Number(postalFeeOverride) || 0)
      : Math.max(0, Number(item.postalFee) || 0);
  const postalFee = basePostal * qty;
  // গেটওয়ে ফি: (সরকারি ফি + ডাক মাশুল)-এর উপর হার প্রয়োগ হয়
  const gatewayFee =
    Math.round((govtFee + postalFee) * (gatewayPercent / 100) * 100) / 100;
  const baseCenter = Math.max(0, Number(item.centerFee) || 0);
  const centerFee = baseCenter * qty;
  const lineTotal = Math.round((govtFee + gatewayFee + postalFee + centerFee) * 100) / 100;

  return {
    serviceName: item.serviceName,
    govtFee,
    gatewayFee,
    postalFee,
    centerFee,
    lineTotal,
    subText: item.subText?.trim() || undefined,
    applicationTrackingNo: applicationTrackingNo?.trim() || undefined,
    quantity: qty > 1 ? qty : undefined,
  };
}

/**
 * একাধিক subService id থেকে combinationOverrides-এর জন্য একটি স্থির (deterministic) কী তৈরি করে —
 * id-গুলো বর্ণানুক্রমে সাজিয়ে "+" দিয়ে জোড়া দেওয়া হয়, যাতে নির্বাচনের ক্রম যাই হোক কী একই থাকে।
 */
export function buildSubServiceCombinationKey(ids: string[]): string {
  return [...ids].sort((a, b) => a.localeCompare(b)).join("+");
}

/**
 * নির্বাচিত subService লেবেলগুলো থেকে ডিফল্ট (override না থাকলে ব্যবহৃত) সাব-টাইটেল বাক্য তৈরি করে।
 * একটি হলে হুবহু সেটাই; একাধিক হলে শেষটার আগে "ও", বাকিগুলো কমা দিয়ে জোড়া।
 */
export function buildDefaultCombinationLabel(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} ও ${labels[labels.length - 1]}`;
}

/**
 * "অধীনস্ত সেবা" (subServices) কনফিগার করা সেবার জন্য ফি হিসাব — যেকোনো সেবাতেই প্রযোজ্য
 * (namjari/khatian/mouza-এর বিশেষ ফর্মুলার বাইরে, এবং কাস্টম ফ্ল্যাট-ফি সেবারও বাইরে)।
 * সরকারি ফি এখানে সবসময় ম্যানুয়াল ইনপুট; কেন্দ্র ফি = নির্বাচিত subService-গুলোর ফি-যোগফল × quantity;
 * সাব-টাইটেল = combinationOverrides-এ হুবহু মিল থাকলে সেই কাস্টম বাক্য, না থাকলে ডিফল্ট জোড়া-লাগানো।
 */
export function calculateSubServiceLine(
  item: ServiceSettingItem,
  manualGovtFee: number,
  selectedSubServiceIds: string[],
  applicationTrackingNo?: string,
  quantity: number = 1
): CalculatedServiceLine {
  const qty = Math.max(1, Math.round(Number(quantity) || 1));
  const govtFee = Math.max(0, Number(manualGovtFee) || 0);
  const gatewayPercent = Math.max(0, Number(item.gatewayFee) || 0);
  const postalFee = Math.max(0, Number(item.postalFee) || 0) * qty;
  // গেটওয়ে ফি: (সরকারি ফি + ডাক মাশুল)-এর উপর হার প্রয়োগ হয়
  const gatewayFee =
    Math.round((govtFee + postalFee) * (gatewayPercent / 100) * 100) / 100;

  const allSubServices = item.subServices || [];
  const selected = allSubServices.filter((s) => selectedSubServiceIds.includes(s.id));

  // Fee calculation mode:
  //   "sum"  (default) — নির্বাচিত প্রতিটি sub-service-এর নিজস্ব fee যোগ হয়
  //   "flat"           — service.centerFee fixed; sub-services শুধু subtitle-এর জন্য
  let baseCenterFee: number;
  if (item.subServiceFeeMode === "flat") {
    baseCenterFee = Math.max(0, Number(item.centerFee) || 0);
  } else {
    baseCenterFee = selected.reduce((sum, s) => sum + (Number(s.fee) || 0), 0);
  }
  const centerFee = baseCenterFee * qty;

  const key = buildSubServiceCombinationKey(selected.map((s) => s.id));
  const override = item.combinationOverrides?.[key];
  const subText =
    selected.length > 0
      ? override || buildDefaultCombinationLabel(selected.map((s) => s.label))
      : undefined;

  const lineTotal = Math.round((govtFee + gatewayFee + postalFee + centerFee) * 100) / 100;

  return {
    serviceName: item.serviceName,
    govtFee,
    gatewayFee,
    postalFee,
    centerFee,
    lineTotal,
    subText,
    applicationTrackingNo: applicationTrackingNo?.trim() || undefined,
    quantity: qty > 1 ? qty : undefined,
  };
}

/**
 * Ensures all invoice subtitles are wrapped in brackets `(...)`
 * and monetary figures are ONLY shown for Namjari (Mutation) services.
 *
 * All regexes here are written as linear-time patterns (flat character
 * classes, no nested/ambiguous quantifiers) to satisfy SonarQube S5843
 * "super-linear backtracking". Specifically, `\s` is never placed inside a
 * character class that is adjacent to a separate `\s*` — that overlap is
 * what triggers exponential backtracking on pathological inputs.
 */
export function formatInvoiceSubtitle(
  serviceName: string,
  rawSub?: string
): string | undefined {
  if (!rawSub) return undefined;
  let s = rawSub.trim();
  if (!s) return undefined;

  // Replace unsupported bullet glyphs with standard dash
  s = s.replace(/[\u2022\u25AA\u25CF\u00B7]/g, "–");

  const isNamjari =
    serviceName.includes("নামজারি") ||
    serviceName.toLowerCase().includes("namjari") ||
    serviceName.toLowerCase().includes("mutation");

  if (isNamjari) {
    s = toBanglaNumber(s);
  } else {
    // Strip monetary figures from non-namjari services.
    // Each pattern uses a single explicit "\s*" adjacent to a character
    // class that does NOT contain "\s" — no ambiguity, no backtracking.
    s = s
      .replace(/\(?\s*ডাক\s*মাশুল\s*[৳Tk.\d০-৯/-]*\)?/gi, "")
      .replace(/\(?\s*ডাক\s*ফি\s*[৳Tk.\d০-৯/-]*অন্তর্ভুক্ত\s*\)?/gi, "")
      .replace(/\(?\s*[৳Tk.]\s*[\d০-৯,.]*\)?/gi, "")
      .replace(/\(?\s*[\d০-৯,.]+\s*টাকা\s*\)?/gi, "")
      .trim();
  }

  // Remove all nested or mismatched brackets to prevent ((...))
  s = s.replace(/^\(+/, "").replace(/\)+$/, "").trim();
  s = s
    .replace(/\)\s*–\s*/g, " – ")
    .replace(/\)\s*,\s*/g, ", ")
    .replace(/\)\s+/g, " – ");
  s = s.replace(/\(/g, "").replace(/\)/g, "").trim();

  // Normalize multi-spaces
  s = s.replace(/\s+/g, " ");

  if (!s) return undefined;
  return `(${s})`;
}