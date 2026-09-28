import { useState, useEffect, useCallback } from "react";
import type { ServiceType } from "./serviceCalculator";

export interface DisplayOptions {
  showLogoOnInvoice: boolean;
  showLogoOnReports: boolean;
  showAddress: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  showFacebook: boolean;
  showPhone: boolean;
  showTagline: boolean;
}

export interface SubServiceItem {
  id: string;
  label: string; // অধীনস্ত সেবার নাম (যেমন: "হোল্ডিং-এ আপত্তি দায়ের")
  fee: number; // এই অধীনস্ত সেবার নিজস্ব ফি (টাকা)
}

export interface SubtitleOption {
  id: string;
  label: string; // সাব-টাইটেল টেক্সট (যেমন: "(অনলাইন কপি)")
  postalFee?: number; // এই অপশন নির্বাচিত হলে সেবার postalFee এই মান দিয়ে override হয় (না দিলে ০ ধরা হয়)
}

export interface ServiceSettingItem {
  id: string;
  serviceName: string; // সেবার নাম
  govtFee: number; // সরকারি ফি — subServices কনফিগার করা থাকলে এই মান আবেদন ফর্মে ম্যানুয়াল ইনপুটের ডিফল্ট মান হিসেবে ব্যবহৃত হয়, নিজে গণনায় অংশ নেয় না
  gatewayFee: number; // গেটওয়ে ফি হার (%) — সরকারি ফি-র শতাংশ হিসেবে গণনা হয় (যেমন: ১ = ১%)
  postalFee: number; // ডাক মাশুল (বেস মান — subtitles-এর কোনো অপশনে postalFee দেওয়া থাকলে সেটি override করে)
  centerFee: number; // কেন্দ্র ফি — subServices কনফিগার করা থাকলে এই মান ব্যবহৃত হয় না, তখন নির্বাচিত অধীনস্ত সেবার ফি-যোগফলই কেন্দ্র ফি হয়
  subText?: string; // লিগ্যাসি একক সাব-টাইটেল (পুরনো সংরক্ষিত ডেটার সাথে সামঞ্জস্যের জন্য রাখা)
  subtitles?: SubtitleOption[]; // একাধিক প্রিসেট সাব-টাইটেল অপশন — আবেদন ফর্মে একটি বেছে নেওয়ার জন্য (single-select);
  // প্রতিটির নিজস্ব postalFee থাকতে পারে (যেমন: ডেলিভারি-পদ্ধতি অনুযায়ী ডাক মাশুল বদলানো)
  subServices?: SubServiceItem[]; // অধীনস্ত সেবাসমূহ — আবেদন ফর্মে চেকবক্স হিসেবে আসবে (multi-select), প্রতিটির নিজস্ব ফি কেন্দ্র-ফি-তে যোগ হয়
    subServiceFeeMode?: "sum" | "flat"; // subServices-এর fee কীভাবে গণনা হবে:
  // "sum" (default) = সব selected sub-service-এর fee যোগ (যেমন LD Tax)
  // "flat" = service.centerFee fixed, sub-services শুধু subtitle-এর জন্য (যেমন Miss Case)
  combinationOverrides?: Record<string, string>; // নির্দিষ্ট subService কম্বিনেশনের জন্য কাস্টম সাব-টাইটেল বাক্য;
  // key = নির্বাচিত subService id-গুলো বর্ণানুক্রমে সাজিয়ে "+" দিয়ে জোড়া (যেমন: "id1+id2"); না থাকলে ডিফল্ট জোড়া-লাগানো ব্যবহার হয়
  isActive: boolean; // সার্ভিস সক্রিয়/নিষ্ক্রিয় রাখার ফ্লাগ
  displayOrder: number; // ড্রপডাউন/তালিকায় প্রদর্শনের ক্রম
  builtInType?: ServiceType; // থাকলে এই এন্ট্রিটা সিস্টেমের বিশেষ-সূত্র সেবার (এখন শুধু namjari) সাথে যুক্ত —
  // এই সেবার ফি এখনও নিজস্ব হিসাব-লজিক (পৃষ্ঠা/আবেদনকারী-টায়ার) দিয়ে গণনা হয়, তবে সেটিংস থেকে এডিট করা যায় (পরিবর্তনের সময় নিশ্চিতকরণ জিজ্ঞাসা করা হয়)।
}

export interface InstitutionSettings {
  // Identity
  logoUrl: string;
  ministryLogoUrl: string;
  licensingAuthority: string;
  orgNameBn: string;
  orgNameEn: string;
  licenseNo: string;
  partnerOrg: string;

  // Contact
  email: string;
  website: string;
  socialMedia: string;
  mobile: string;
  alternativePhone: string;
  contactPerson: string;

  // Citizen Portal
  citizenPortalPassword: string;

  // Address
  addressBn: string;
  addressEn: string;
  district: string;
  upazila: string;
  unionMunicipality: string;

  // Government Geo-Coding (Customer Number prefix)
  geoDivisionCode: string; // e.g. "55" = Rangpur
  geoDistrictCode: string; // e.g. "49" = Kurigram
  geoUpazilaCode: string; // e.g. "52" = Kurigram Sadar

  // Operation
  officeHours: string;
  weeklyHoliday: string;

  // Tagline
  taglineBn: string;
  taglineEn: string;

  // Signatures
  inchargeSignatureUrl: string;

  // Display toggles
  displayOptions: DisplayOptions;

  // Services
  services: ServiceSettingItem[];
}

export const STORAGE_KEY_INSTITUTION = "lsfc.institutionSettings";
export const STORAGE_KEY_LEGACY = "lsfc-center-settings";
export const INSTITUTION_SETTINGS_EVENT = "lsfc:institution-settings-updated";

export const DEFAULT_INSTITUTION_SETTINGS: InstitutionSettings = {
  logoUrl: "",
  ministryLogoUrl: "",
  licensingAuthority: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত",
  orgNameBn: "ভূমিসেবা সহায়তা কেন্দ্র",
  orgNameEn: "Land Services Facilitating Center (LSFC)",
  licenseNo: "০২",
  partnerOrg: "খন্দকার কম্পিউটার্স",

  email: "info.kclbd@gmail.com",
  website: "https://land.gov.bd",
  socialMedia: "https://facebook.com/lsfc.ghogadaha",
  mobile: "01723506664",
  alternativePhone: "01912345678",
  contactPerson: "মো. খোরশেদ আলম",

  citizenPortalPassword: "",

  addressBn: "ইউনিয়ন পরিষদ গেইট, ঘোগাদহ, কুড়িগ্রাম-৫৬০০",
  addressEn: "Union Parishad Gate, Ghogadaha, Kurigram-5600",
  district: "কুড়িগ্রাম",
  upazila: "কুড়িগ্রাম সদর",
  unionMunicipality: "ঘোগাদহ ইউনিয়ন পরিষদ",

  geoDivisionCode: "55",
  geoDistrictCode: "49",
  geoUpazilaCode: "52",

  officeHours: "সকাল ৯:০০ - বিকাল ৫:০০ (শনিবার - বৃহস্পতিবার)",
  weeklyHoliday: "শুক্রবার ও সরকারি ছুটির দিন",

  taglineBn: "স্মার্ট ভূমিসেবায় আপনার বিশ্বস্ত সহযোগী",
  taglineEn: "Citizen-Centric Smart Land Services Facilitation",

  inchargeSignatureUrl: "",

  displayOptions: {
    showLogoOnInvoice: true,
    showLogoOnReports: true,
    showAddress: true,
    showEmail: true,
    showWebsite: true,
    showFacebook: true,
    showPhone: true,
    showTagline: true,
  },

  services: [
    {
      id: "svc-citizen-profile",
      serviceName: "নাগরিক প্রোফাইল নিবন্ধন",
      govtFee: 0,
      gatewayFee: 0,
      postalFee: 0,
      centerFee: 50,
      subtitles: [],
      isActive: true,
      displayOrder: 1,
    },
    {
      id: "svc-tax",
      serviceName: "ভূমি উন্নয়ন কর (LD Tax)",
      govtFee: 0,
      gatewayFee: 1,
      postalFee: 0,
      centerFee: 0,
      subtitles: [],
      subServices: [
        { id: "holding_objection", label: "হোল্ডিং-এ আপত্তি দায়ের", fee: 20 },
        { id: "online_submit", label: "অনলাইনে কর জমা", fee: 20 },
        { id: "print_copy", label: "দাখিলার প্রিন্ট কপি", fee: 20 },
      ],
      combinationOverrides: {
        "holding_objection+online_submit": "হোল্ডিং-এ আপত্তি দায়ের এবং অনলাইনে কর জমা",
        "holding_objection+online_submit+print_copy": "হোল্ডিং আপত্তি, অনলাইনে কর জমা ও দাখিলা প্রিন্ট",
      },
      isActive: true,
      displayOrder: 2,
    },
    {
      id: "svc-namjari",
      builtInType: "namjari",
      serviceName: "মিউটেশন/জমাখারিজ/জমাএকত্রিকরণ-এর আবেদন",
      govtFee: 70,
      gatewayFee: 1,
      postalFee: 0,
      centerFee: 270,
      subtitles: [],
      isActive: true,
      displayOrder: 3,
    },
    {
      id: "svc-khatian",
      serviceName: "খতিয়ান/পর্চা প্রাপ্তির আবেদন",
      govtFee: 120,
      gatewayFee: 1,
      postalFee: 0,
      centerFee: 100,
      subtitles: [
        { id: "khatian-online", label: "(অনলাইন কপি)" },
        { id: "khatian-counter", label: "(সার্টিফাইড কপি — অফিস কাউন্টারে ডেলিভারি)" },
        { id: "khatian-post", label: "(সার্টিফাইড কপি — ডাকযোগে বিতরণ)", postalFee: 40 },
      ],
      isActive: true,
      displayOrder: 4,
    },
    {
      id: "svc-dcr",
      serviceName: "ডিসিআর ফি জমা",
      govtFee: 1100,
      gatewayFee: 1,
      postalFee: 0,
      centerFee: 100,
      subtitles: [],
      isActive: true,
      displayOrder: 5,
    },
     {
      id: "svc-miss-case",
      serviceName: "মিস কেস আবেদন",
      govtFee: 0,
      gatewayFee: 1,
      postalFee: 0,
      centerFee: 100,
      subServiceFeeMode: "flat",
      subtitles: [],
      subServices: [
        { id: "miss_dag", label: "দাগ নম্বর সংশোধন", fee: 0 },
        { id: "miss_name", label: "নাম সংশোধন", fee: 0 },
        { id: "miss_share", label: "অংশ / হিস্যা সংশোধন", fee: 0 },
      ],
      combinationOverrides: {
        "miss_dag": "দাগ নম্বর সংশোধন",
        "miss_name": "নাম সংশোধন",
        "miss_share": "অংশ / হিস্যা সংশোধন",
        "miss_dag+miss_name": "দাগ ও নাম সংশোধন",
        "miss_dag+miss_share": "দাগ ও অংশ/হিস্যা সংশোধন",
        "miss_name+miss_share": "নাম ও অংশ/হিস্যা সংশোধন",
        "miss_dag+miss_name+miss_share": "দাগ, নাম ও অংশ/হিস্যা সংশোধন",
      },
      isActive: true,
      displayOrder: 6,
    },
    {
      id: "svc-mouza",
      serviceName: "মৌজা ম্যাপ/নকশা আবেদন",
      govtFee: 545,
      gatewayFee: 1,
      postalFee: 0,
      centerFee: 100,
      subtitles: [
        { id: "mouza-post", label: "(ডাকযোগে ডেলিভারি)", postalFee: 110 },
        { id: "mouza-counter", label: "(ভূমি ভবন, তেজগাঁও কাউন্টার হতে ডেলিভারি)" },
      ],
      isActive: true,
      displayOrder: 7,
    },
  ],
};

// Backward-compatibility interface for existing Invoice components
export interface CenterSettings {
  topGovtTitle: string;
  orgNameBn: string;
  orgNameEn: string;
  licenseNo: string;
  partnerOrg: string;
  mobile: string;
  email: string;
  website: string;
  socialMedia: string;
  logoUrl: string;
  ministryLogoUrl?: string;
  inchargeSignatureUrl: string;
  address: string;
  footerAddressText: string;
  footerNoticeText: string;
  footerSocialText: string;
  taglineBn?: string;
  displayOptions?: DisplayOptions;
  citizenPortalPassword?: string;
}

export function toInvoiceSettings(inst: InstitutionSettings): CenterSettings {
  return {
    topGovtTitle: inst.licensingAuthority,
    orgNameBn: inst.orgNameBn,
    orgNameEn: inst.orgNameEn,
    licenseNo: inst.licenseNo,
    partnerOrg: inst.partnerOrg,
    mobile: inst.mobile,
    email: inst.email,
    website: inst.website,
    socialMedia: inst.socialMedia,
    logoUrl: inst.logoUrl,
    ministryLogoUrl: inst.ministryLogoUrl,
    inchargeSignatureUrl: inst.inchargeSignatureUrl,
    address: inst.addressBn,
    footerAddressText: `${inst.addressBn} | হেল্পলাইন: ${inst.mobile}`,
    footerNoticeText: "রসিদটি ভবিষ্যতে ট্র্যাকিং ও অনলাইন ডাউনলোডের জন্য সংরক্ষণ করুন",
    footerSocialText: inst.website || inst.socialMedia,
    taglineBn: inst.taglineBn,
    displayOptions: inst.displayOptions,
    citizenPortalPassword: inst.citizenPortalPassword,
  };
}

export function readInstitutionSettings(): InstitutionSettings {
  if (typeof window === "undefined") return DEFAULT_INSTITUTION_SETTINGS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_INSTITUTION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.taglineBn || parsed.taglineBn === "স্মার্ট ভূমিসেবা, ঘরে বসেই সমাধান ও নাগরিক সহায়তা") {
        parsed.taglineBn = DEFAULT_INSTITUTION_SETTINGS.taglineBn;
      }
      if (parsed.citizenPortalPassword === "Ab*12345") {
        parsed.citizenPortalPassword = "";
      }
      if (!parsed.contactPerson || parsed.contactPerson.includes("হাবিবুর রহমান")) {
        parsed.contactPerson = DEFAULT_INSTITUTION_SETTINGS.contactPerson;
      }
      const currentBuiltInTypes = new Set(
        DEFAULT_INSTITUTION_SETTINGS.services.map((d) => d.builtInType).filter(Boolean)
      );
      const existingServices: ServiceSettingItem[] = (
        Array.isArray(parsed.services) ? parsed.services : []
      )
        // যে বিল্ট-ইন সেবা কোডবেস থেকে সরিয়ে ফেলা হয়েছে (যেমন: হোল্ডিং, ওয়ারিশান), তা আগের সংরক্ষিত
        // ডেটা থেকেও স্বয়ংক্রিয়ভাবে বাদ যাবে — কাস্টম (builtInType ছাড়া) এন্ট্রি অক্ষত থাকবে
        .filter((s: ServiceSettingItem) => !s.builtInType || currentBuiltInTypes.has(s.builtInType))
        .map((s: ServiceSettingItem) => ({
          ...s,
          // লিগ্যাসি subtitles: string[] থাকলে SubtitleOption[]-এ রূপান্তর করা হয় (postalFee ছাড়া)
          subtitles: Array.isArray(s.subtitles)
            ? s.subtitles.map((t: unknown, idx: number) =>
                typeof t === "string" ? { id: `st-legacy-${idx}`, label: t } : t
              )
            : [],
          subServices: Array.isArray(s.subServices) ? s.subServices : [],
          combinationOverrides: s.combinationOverrides && typeof s.combinationOverrides === "object" ? s.combinationOverrides : {},
        }));
      const existingBuiltInTypes = new Set(
        existingServices.map((s) => s.builtInType).filter(Boolean)
      );
      const missingBuiltIns = DEFAULT_INSTITUTION_SETTINGS.services.filter(
        (d) => d.builtInType && !existingBuiltInTypes.has(d.builtInType)
      );

      // namjari সহ সব ৭টি স্ট্যান্ডার্ড সেবা যাতে পুরনো সংরক্ষিত ডেটাতেও অক্ষত ও সঠিক ক্রমে থাকে
      let mergedServices: ServiceSettingItem[] = [...existingServices, ...missingBuiltIns];
      const standardIds = [
        "svc-citizen-profile",
        "svc-tax",
        "svc-namjari",
        "svc-khatian",
        "svc-dcr",
        "svc-miss-case",
        "svc-mouza",
      ];
      standardIds.forEach((id) => {
        const existingIdx = mergedServices.findIndex((s) => s.id === id);
        const def = DEFAULT_INSTITUTION_SETTINGS.services.find((d) => d.id === id);
        if (def) {
          if (existingIdx === -1) {
            mergedServices.push(def);
          } else {
            // স্ট্যান্ডার্ড ক্রম ও কাঠামোগত অপশনগুলো সিঙ্ক করা
            mergedServices[existingIdx] = {
              ...def,
              ...mergedServices[existingIdx],
              displayOrder: def.displayOrder,
              serviceName: mergedServices[existingIdx].serviceName?.trim() || def.serviceName,
              subServices:
                def.subServices && (!mergedServices[existingIdx].subServices || mergedServices[existingIdx].subServices?.length === 0)
                  ? def.subServices
                  : mergedServices[existingIdx].subServices,
              subtitles:
                def.subtitles && (!mergedServices[existingIdx].subtitles || mergedServices[existingIdx].subtitles?.length === 0)
                  ? def.subtitles
                  : mergedServices[existingIdx].subtitles,
              combinationOverrides:
                def.combinationOverrides && Object.keys(mergedServices[existingIdx].combinationOverrides || {}).length === 0
                  ? def.combinationOverrides
                  : mergedServices[existingIdx].combinationOverrides,
            };
          }
        }
      });

      // একবার-মাত্র migration: পুরনো data-তে miss-case-এ flat mode নেই — সেট করে দেওয়া
      mergedServices = mergedServices.map((s) => {
        if (s.id === "svc-miss-case" && !s.subServiceFeeMode) {
          return {
            ...s,
            subServiceFeeMode: "flat" as const,
            centerFee: s.centerFee && s.centerFee > 0 ? s.centerFee : 100,
            subServices: (s.subServices || []).map((sub) => ({ ...sub, fee: 0 })),
          };
        }
        if (s.id === "svc-namjari" && (s.serviceName === "মিউটেশন/জমাখারিজ/জমাএকত্রিকরণ (ই-নামজারি)" || s.serviceName === "ই-নামজারি আবেদন")) {
          return {
            ...s,
            serviceName: "মিউটেশন/জমাখারিজ/জমাএকত্রিকরণ-এর আবেদন",
          };
        }
        return s;
      });

      return {
        ...DEFAULT_INSTITUTION_SETTINGS,
        ...parsed,
        displayOptions: {
          ...DEFAULT_INSTITUTION_SETTINGS.displayOptions,
          ...(parsed.displayOptions || {}),
        },
        services: mergedServices,
      };
    }

    // Migration from legacy lsfc-center-settings
    const legacyRaw = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacyRaw) {
      const leg = JSON.parse(legacyRaw);
      const migrated: InstitutionSettings = {
        ...DEFAULT_INSTITUTION_SETTINGS,
        licensingAuthority: leg.topGovtTitle || DEFAULT_INSTITUTION_SETTINGS.licensingAuthority,
        orgNameBn: leg.orgNameBn || DEFAULT_INSTITUTION_SETTINGS.orgNameBn,
        orgNameEn: leg.orgNameEn || DEFAULT_INSTITUTION_SETTINGS.orgNameEn,
        licenseNo: leg.licenseNo || DEFAULT_INSTITUTION_SETTINGS.licenseNo,
        partnerOrg: leg.partnerOrg || DEFAULT_INSTITUTION_SETTINGS.partnerOrg,
        mobile: leg.mobile || DEFAULT_INSTITUTION_SETTINGS.mobile,
        email: leg.email || DEFAULT_INSTITUTION_SETTINGS.email,
        website: leg.website || DEFAULT_INSTITUTION_SETTINGS.website,
        socialMedia: leg.socialMedia || DEFAULT_INSTITUTION_SETTINGS.socialMedia,
        logoUrl: leg.logoUrl || DEFAULT_INSTITUTION_SETTINGS.logoUrl,
        inchargeSignatureUrl: leg.inchargeSignatureUrl || DEFAULT_INSTITUTION_SETTINGS.inchargeSignatureUrl,
        addressBn: leg.address || DEFAULT_INSTITUTION_SETTINGS.addressBn,
      };
      saveInstitutionSettings(migrated);
      return migrated;
    }
  } catch (err) {
    console.error("Error reading institution settings:", err);
  }

  return DEFAULT_INSTITUTION_SETTINGS;
}

export function saveInstitutionSettings(settings: InstitutionSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_INSTITUTION, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(INSTITUTION_SETTINGS_EVENT));
  } catch (err) {
    console.error("Error saving institution settings:", err);
  }
}

// Backward-compatible alias functions
export function readSettings(): CenterSettings {
  return toInvoiceSettings(readInstitutionSettings());
}

export const defaultSettings: CenterSettings = toInvoiceSettings(DEFAULT_INSTITUTION_SETTINGS);

export function useInstitutionSettings() {
  const [settings, setSettings] = useState<InstitutionSettings>(readInstitutionSettings);

  const refresh = useCallback(() => {
    setSettings(readInstitutionSettings());
  }, []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(INSTITUTION_SETTINGS_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(INSTITUTION_SETTINGS_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  return { settings, saveSettings: saveInstitutionSettings, refresh };
}