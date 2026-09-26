// src/utils/banglaShaping/invoiceTextFields.ts
//
// One place that lists every Bengali string that appears in
// VectorPdfDocument, together with which font/size it needs to be shaped
// at. VectorPdfDocument itself no longer computes any text — it just reads
// from the (already-shaped) result of shapeInvoiceTextFields() and renders
// <ShapedText> for each field. This keeps "what text, what font, what
// size" in exactly one spot instead of scattered across 35+ <Text> calls.

import type { InvoiceRecord } from "../invoiceStore";
import type { CenterSettings } from "../institutionSettings";
import { cleanPhone, findCustomerByPhoneOrNid } from "../customerStore";
import { fixBanglaText } from "../banglaLayout";
import { toBanglaNumber, moneyBn, numberToBanglaWords } from "../bengaliNumbers";
import { formatInvoiceSubtitle } from "../serviceCalculator";
import { shapeRun, type ShapedRun } from "./shapeRun";

export type BnFont = "kalpurush" | "anekBangla" | "anekBanglaBold";

// Matches the .ttf files already in public/fonts.
export const BN_FONT_URLS: Record<BnFont, string> = {
  kalpurush: "/fonts/Kalpurush.ttf",
  anekBangla: "/fonts/AnekBangla-Regular.ttf",
  anekBanglaBold: "/fonts/AnekBangla-Bold.ttf",
};

export interface BnFieldSpec {
  text: string;
  font: BnFont;
  size: number;
}

function bn(text: string, font: BnFont, size: number): BnFieldSpec {
  return { text: fixBanglaText(text), font, size };
}

export interface InvoiceLineFields {
  sl: BnFieldSpec;
  service: BnFieldSpec;
  sub?: BnFieldSpec;
  govt: BnFieldSpec;
  gateway: BnFieldSpec;
  center: BnFieldSpec;
  total: BnFieldSpec;
}

export interface InvoiceTextFields {
  topGovt: BnFieldSpec;
  brandTitle: BnFieldSpec;
  tagline?: BnFieldSpec;
  subHeaderLeft: BnFieldSpec;
  contactMobile: BnFieldSpec;
  contactEmail: BnFieldSpec;
  metaInvoiceNoLabel: BnFieldSpec;
  metaInvoiceNoVal: BnFieldSpec;
  metaDateLabel: BnFieldSpec;
  metaDateVal: BnFieldSpec;
  metaTimeVal: BnFieldSpec;
  metaTrackingLabel?: BnFieldSpec;
  metaTrackingVal?: BnFieldSpec;
  metaCustomerLabel: BnFieldSpec;
  metaCustomerVal: BnFieldSpec;
  metaMobileLabel: BnFieldSpec;
  metaMobileVal: BnFieldSpec;
  metaUniqueIdLabel?: BnFieldSpec;
  metaUniqueIdVal?: BnFieldSpec;
  metaDateOnlyLabel: BnFieldSpec;
  metaDateOnlyVal: BnFieldSpec;
  metaTimeOnlyLabel: BnFieldSpec;
  metaTimeOnlyVal: BnFieldSpec;
  thSl: BnFieldSpec;
  thService: BnFieldSpec;
  thGovt: BnFieldSpec;
  thGateway: BnFieldSpec;
  thCenter: BnFieldSpec;
  thTotal: BnFieldSpec;
  lines: InvoiceLineFields[];
  totalGovtLabel: BnFieldSpec;
  totalGovtVal: BnFieldSpec;
  totalGatewayLabel?: BnFieldSpec;
  totalGatewayVal?: BnFieldSpec;
  totalPostalLabel?: BnFieldSpec;
  totalPostalVal?: BnFieldSpec;
  totalCenterLabel: BnFieldSpec;
  totalCenterVal: BnFieldSpec;
  grandTotalLabel: BnFieldSpec;
  grandTotalVal: BnFieldSpec;
  paidAmountLabel?: BnFieldSpec;
  paidAmountVal?: BnFieldSpec;
  dueAmountLabel?: BnFieldSpec;
  dueAmountVal?: BnFieldSpec;
  stampText: BnFieldSpec;
  stampNote?: BnFieldSpec;
  stampNoteLine1?: BnFieldSpec;
  stampNoteLine2?: BnFieldSpec;
  inWords: BnFieldSpec;
  signCustomer: BnFieldSpec;
  signAuthority: BnFieldSpec;
  footerAddress: BnFieldSpec;
  footerUser: BnFieldSpec;
  footerWebsite: BnFieldSpec;
}

export function formatOwnerName(rawName: string): string {
  const trimmed = (rawName || "").trim();
  if (!trimmed) return "জনাব";
  if (/^জনাব(\/জনাবা)?[\s:]/i.test(trimmed) || trimmed.startsWith("জনাব")) {
    return trimmed;
  }
  return `জনাব ${trimmed}`;
}

/**
 * Mirrors the original VectorPdfDocument JSX 1:1 (same conditionals, same
 * text, same font/size per style), just expressed as data instead of JSX.
 */
export function buildInvoiceTextFields(
  invoice: InvoiceRecord,
  settings: CenterSettings
): InvoiceTextFields {
  const display = settings.displayOptions || {
    showLogoOnInvoice: true,
    showAddress: true,
    showEmail: true,
    showWebsite: true,
    showFacebook: true,
    showPhone: true,
    showTagline: true,
  };

  const govtTotal = invoice.lines.reduce((acc, curr) => acc + (curr.govtFee || 0), 0);
  const gatewayTotal = invoice.lines.reduce((acc, curr) => acc + (curr.gatewayFee || 0), 0);
  const postalTotal = invoice.lines.reduce((acc, curr) => acc + (curr.postalFee || 0), 0);
  const centerTotal = invoice.lines.reduce((acc, curr) => acc + (curr.centerFee || 0), 0);

  const invoiceDateObj = new Date(invoice.createdAt);
  const formattedDate = invoiceDateObj.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  let formattedTime = invoiceDateObj.toLocaleTimeString("bn-BD", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  formattedTime = formattedTime.replace(/AM/i, "পূর্বাহ্ন").replace(/PM/i, "অপরাহ্ন");

  const cleanMob = cleanPhone(invoice.customer.mobile);
  const linkedCustomer = findCustomerByPhoneOrNid(
    invoice.customer.mobile,
    invoice.customer.fullName
  );
  const uniqueId = linkedCustomer?.customerNumber || "";

  return {
    topGovt: bn(settings.topGovtTitle, "kalpurush", 7.5),
    brandTitle: bn(settings.orgNameBn, "anekBanglaBold", 14),
    tagline:
      display.showTagline && settings.taglineBn
        ? bn(settings.taglineBn, "kalpurush", 7.5)
        : undefined,
    subHeaderLeft: bn(
      `পরিচালনায়: ${settings.partnerOrg} (অনুমতিপত্র নম্বর: ${toBanglaNumber(settings.licenseNo || "০২")})`,
      "kalpurush",
      7.2
    ),
    contactMobile: bn(toBanglaNumber(settings.mobile || "01723506664"), "kalpurush", 7.2),
    contactEmail: bn(settings.email || "info.kclbd@gmail.com", "kalpurush", 7.2),

    metaInvoiceNoLabel: bn("ইনভয়েস নং:", "kalpurush", 8),
    metaInvoiceNoVal: bn(toBanglaNumber(invoice.invoiceNo), "kalpurush", 8),
    metaDateLabel: bn("তারিখ ও সময়:", "kalpurush", 8),
    metaDateVal: bn(formattedDate, "kalpurush", 8),
    metaTimeVal: bn(`সময়: ${formattedTime}`, "kalpurush", 7.2),

    metaDateOnlyLabel: bn("তারিখ:", "kalpurush", 8),
    metaDateOnlyVal: bn(formattedDate, "kalpurush", 8),
    metaTimeOnlyLabel: bn("সময়:", "kalpurush", 8),
    metaTimeOnlyVal: bn(formattedTime, "kalpurush", 8),

    metaTrackingLabel: invoice.applicationTrackingNo ? bn("ট্র্যাকিং নং:", "kalpurush", 8) : undefined,
    metaTrackingVal: invoice.applicationTrackingNo
      ? bn(toBanglaNumber(invoice.applicationTrackingNo), "kalpurush", 8)
      : undefined,
    metaCustomerLabel: bn("ভূমি মালিকের নাম:", "kalpurush", 8),
    metaCustomerVal: bn(formatOwnerName(invoice.customer.fullName), "kalpurush", 8),
    metaMobileLabel: bn("মোবাইল নম্বর:", "kalpurush", 8),
    metaMobileVal: bn(toBanglaNumber(invoice.customer.mobile), "kalpurush", 8),
    metaUniqueIdLabel: uniqueId ? bn("ইউনিক আইডি:", "kalpurush", 8) : undefined,
    metaUniqueIdVal: uniqueId ? bn(uniqueId, "kalpurush", 8) : undefined,

    thSl: bn("নং", "kalpurush", 7.5),
    thService: bn("সেবার বিবরণ", "kalpurush", 7.5),
    thGovt: bn("সরকারি ফি", "kalpurush", 7.5),
    thGateway: bn("গেটওয়ে ফি", "kalpurush", 7.5),
    thCenter: bn("কেন্দ্র ফি", "kalpurush", 7.5),
    thTotal: bn("মোট টাকা", "kalpurush", 7.5),

    lines: invoice.lines.map((line, idx) => {
      const formattedSub = formatInvoiceSubtitle(line.serviceName, line.subText);
      return {
        sl: bn(toBanglaNumber(idx + 1), "kalpurush", 8),
        service: bn(line.serviceName, "kalpurush", 8),
        sub: formattedSub ? bn(formattedSub, "kalpurush", 6.5) : undefined,
        govt: bn(moneyBn(line.govtFee), "kalpurush", 8),
        gateway: bn(moneyBn(line.gatewayFee || 0), "kalpurush", 8),
        center: bn(moneyBn(line.centerFee), "kalpurush", 8),
        total: bn(moneyBn(line.lineTotal), "kalpurush", 8),
      };
    }),

    totalGovtLabel: bn("মোট সরকারি ফি:", "kalpurush", 8),
    totalGovtVal: bn(`${moneyBn(govtTotal)} ৳`, "kalpurush", 8),
    totalGatewayLabel:
      gatewayTotal > 0 ? bn("পেমেন্ট গেটওয়ে ফি:", "kalpurush", 8) : undefined,
    totalGatewayVal:
      gatewayTotal > 0 ? bn(`${moneyBn(gatewayTotal)} ৳`, "kalpurush", 8) : undefined,
    totalPostalLabel:
      postalTotal > 0 ? bn("সরকারি ডাক মাশুল:", "kalpurush", 8) : undefined,
    totalPostalVal:
      postalTotal > 0 ? bn(`${moneyBn(postalTotal)} ৳`, "kalpurush", 8) : undefined,
    totalCenterLabel: bn("কেন্দ্র ফি:", "kalpurush", 8),
    totalCenterVal: bn(`${moneyBn(centerTotal)} ৳`, "kalpurush", 8),
    grandTotalLabel: bn("সর্বমোট প্রদেয়:", "kalpurush", 8.5),
    grandTotalVal: bn(`${moneyBn(invoice.total)} ৳`, "kalpurush", 8.5),
    paidAmountLabel: bn("পরিশোধিত টাকার পরিমাণ:", "kalpurush", 8),
    paidAmountVal: bn(
      `${moneyBn(invoice.paidAmount !== undefined ? invoice.paidAmount : invoice.total)} ৳`,
      "kalpurush",
      8
    ),
    dueAmountLabel: undefined,
    dueAmountVal: undefined,

    stampText:
      (invoice.dueAmount !== undefined && invoice.dueAmount > 0) || invoice.paymentStatus === "PARTIAL"
        ? bn("সাময়িক রসিদ (TEMPORARY)", "anekBanglaBold", 8.5)
        : bn("সম্পূর্ণ পরিশোধিত (PAID)", "anekBanglaBold", 8.5),
    stampNote:
      (invoice.dueAmount !== undefined && invoice.dueAmount > 0) || invoice.paymentStatus === "PARTIAL"
        ? bn("এটি সাময়িক রসিদ। অবশিষ্ট পরিশোধ সাপেক্ষে চূড়ান্ত রসিদ ও মূল সেবা ডেলিভারি প্রদান করা হবে।", "kalpurush", 6.2)
        : undefined,
    stampNoteLine1:
      (invoice.dueAmount !== undefined && invoice.dueAmount > 0) || invoice.paymentStatus === "PARTIAL"
        ? bn("এটি সাময়িক রসিদ। অবশিষ্ট পরিশোধ সাপেক্ষে", "kalpurush", 6.2)
        : undefined,
    stampNoteLine2:
      (invoice.dueAmount !== undefined && invoice.dueAmount > 0) || invoice.paymentStatus === "PARTIAL"
        ? bn("চূড়ান্ত রসিদ ও মূল সেবা ডেলিভারি প্রদান করা হবে।", "kalpurush", 6.2)
        : undefined,

    inWords: bn(
      invoice.paidAmount !== undefined && invoice.paidAmount < invoice.total
        ? `কথায়: ${numberToBanglaWords(invoice.paidAmount)} (পরিশোধিত)`
        : `কথায়: ${numberToBanglaWords(invoice.total)}`,
      "kalpurush",
      8
    ),

    signCustomer: bn("ভূমি মালিকের স্বাক্ষর", "kalpurush", 7.5),
    signAuthority: bn("কর্তৃপক্ষের স্বাক্ষর", "kalpurush", 7.5),

    footerAddress: bn(display.showAddress ? settings.address : "ঘোগাদহ, কুড়িগ্রাম", "kalpurush", 6.5),
    footerUser: bn(
      settings.citizenPortalPassword
        ? `ডিফল্ট ইউজার: ${cleanMob} | পাসওয়ার্ড: ${settings.citizenPortalPassword}`
        : `ডিফল্ট ইউজার: ${cleanMob} | পোর্টাল: ${settings.website || "land.gov.bd"}`,
      "kalpurush",
      8.0
    ),
    footerWebsite: bn(settings.website || "land.gov.bd", "kalpurush", 6.5),
  };
}

// ---------------------------------------------------------------------
// Shaping
// ---------------------------------------------------------------------

export interface ShapedInvoiceLineFields {
  sl: ShapedRun;
  service: ShapedRun;
  sub?: ShapedRun;
  govt: ShapedRun;
  gateway: ShapedRun;
  center: ShapedRun;
  total: ShapedRun;
}

export interface ShapedInvoiceTextFields {
  topGovt: ShapedRun;
  brandTitle: ShapedRun;
  tagline?: ShapedRun;
  subHeaderLeft: ShapedRun;
  contactMobile: ShapedRun;
  contactEmail: ShapedRun;
  metaInvoiceNoLabel: ShapedRun;
  metaInvoiceNoVal: ShapedRun;
  metaDateLabel: ShapedRun;
  metaDateVal: ShapedRun;
  metaTimeVal: ShapedRun;
  metaTrackingLabel?: ShapedRun;
  metaTrackingVal?: ShapedRun;
  metaCustomerLabel: ShapedRun;
  metaCustomerVal: ShapedRun;
  metaMobileLabel: ShapedRun;
  metaMobileVal: ShapedRun;
  metaUniqueIdLabel?: ShapedRun;
  metaUniqueIdVal?: ShapedRun;
  metaDateOnlyLabel?: ShapedRun;
  metaDateOnlyVal?: ShapedRun;
  metaTimeOnlyLabel?: ShapedRun;
  metaTimeOnlyVal?: ShapedRun;
  thSl: ShapedRun;
  thService: ShapedRun;
  thGovt: ShapedRun;
  thGateway: ShapedRun;
  thCenter: ShapedRun;
  thTotal: ShapedRun;
  lines: ShapedInvoiceLineFields[];
  totalGovtLabel: ShapedRun;
  totalGovtVal: ShapedRun;
  totalGatewayLabel?: ShapedRun;
  totalGatewayVal?: ShapedRun;
  totalPostalLabel?: ShapedRun;
  totalPostalVal?: ShapedRun;
  totalCenterLabel: ShapedRun;
  totalCenterVal: ShapedRun;
  grandTotalLabel: ShapedRun;
  grandTotalVal: ShapedRun;
  paidAmountLabel?: ShapedRun;
  paidAmountVal?: ShapedRun;
  dueAmountLabel?: ShapedRun;
  dueAmountVal?: ShapedRun;
  stampText: ShapedRun;
  stampNote?: ShapedRun;
  stampNoteLine1?: ShapedRun;
  stampNoteLine2?: ShapedRun;
  inWords: ShapedRun;
  signCustomer: ShapedRun;
  signAuthority: ShapedRun;
  footerAddress: ShapedRun;
  footerUser: ShapedRun;
  footerWebsite: ShapedRun;
}

function shapeSpec(spec: BnFieldSpec): Promise<ShapedRun>;
function shapeSpec(spec: BnFieldSpec | undefined): Promise<ShapedRun | undefined>;
async function shapeSpec(spec: BnFieldSpec | undefined): Promise<ShapedRun | undefined> {
  if (!spec) return undefined;
  return shapeRun(spec.text, BN_FONT_URLS[spec.font], spec.size);
}

/**
 * Shapes every field (in parallel). Call this BEFORE constructing
 * <VectorPdfDocument>, then pass the result in as the `shapedFields` prop —
 * VectorPdfDocument itself stays fully synchronous.
 */
export async function shapeInvoiceTextFields(
  fields: InvoiceTextFields
): Promise<ShapedInvoiceTextFields> {
  const [
    topGovt, brandTitle, tagline, subHeaderLeft, contactMobile, contactEmail,
    metaInvoiceNoLabel, metaInvoiceNoVal, metaDateLabel, metaDateVal, metaTimeVal,
    metaDateOnlyLabel, metaDateOnlyVal, metaTimeOnlyLabel, metaTimeOnlyVal,
    metaTrackingLabel, metaTrackingVal, metaCustomerLabel, metaCustomerVal,
    metaMobileLabel, metaMobileVal, metaUniqueIdLabel, metaUniqueIdVal,
    thSl, thService, thGovt, thGateway, thCenter, thTotal,
    totalGovtLabel, totalGovtVal, totalGatewayLabel, totalGatewayVal,
    totalPostalLabel, totalPostalVal,
    totalCenterLabel, totalCenterVal, grandTotalLabel, grandTotalVal,
    paidAmountLabel, paidAmountVal,
    dueAmountLabel, dueAmountVal,
    stampText, stampNote, stampNoteLine1, stampNoteLine2,
    inWords, signCustomer, signAuthority, footerAddress, footerUser, footerWebsite,
    lines,
  ] = await Promise.all([
    shapeSpec(fields.topGovt),
    shapeSpec(fields.brandTitle),
    shapeSpec(fields.tagline),
    shapeSpec(fields.subHeaderLeft),
    shapeSpec(fields.contactMobile),
    shapeSpec(fields.contactEmail),
    shapeSpec(fields.metaInvoiceNoLabel),
    shapeSpec(fields.metaInvoiceNoVal),
    shapeSpec(fields.metaDateLabel),
    shapeSpec(fields.metaDateVal),
    shapeSpec(fields.metaTimeVal),
    shapeSpec(fields.metaDateOnlyLabel),
    shapeSpec(fields.metaDateOnlyVal),
    shapeSpec(fields.metaTimeOnlyLabel),
    shapeSpec(fields.metaTimeOnlyVal),
    shapeSpec(fields.metaTrackingLabel),
    shapeSpec(fields.metaTrackingVal),
    shapeSpec(fields.metaCustomerLabel),
    shapeSpec(fields.metaCustomerVal),
    shapeSpec(fields.metaMobileLabel),
    shapeSpec(fields.metaMobileVal),
    shapeSpec(fields.metaUniqueIdLabel),
    shapeSpec(fields.metaUniqueIdVal),
    shapeSpec(fields.thSl),
    shapeSpec(fields.thService),
    shapeSpec(fields.thGovt),
    shapeSpec(fields.thGateway),
    shapeSpec(fields.thCenter),
    shapeSpec(fields.thTotal),
    shapeSpec(fields.totalGovtLabel),
    shapeSpec(fields.totalGovtVal),
    shapeSpec(fields.totalGatewayLabel),
    shapeSpec(fields.totalGatewayVal),
    shapeSpec(fields.totalPostalLabel),
    shapeSpec(fields.totalPostalVal),
    shapeSpec(fields.totalCenterLabel),
    shapeSpec(fields.totalCenterVal),
    shapeSpec(fields.grandTotalLabel),
    shapeSpec(fields.grandTotalVal),
    shapeSpec(fields.paidAmountLabel),
    shapeSpec(fields.paidAmountVal),
    shapeSpec(fields.dueAmountLabel),
    shapeSpec(fields.dueAmountVal),
    shapeSpec(fields.stampText),
    shapeSpec(fields.stampNote),
    shapeSpec(fields.stampNoteLine1),
    shapeSpec(fields.stampNoteLine2),
    shapeSpec(fields.inWords),
    shapeSpec(fields.signCustomer),
    shapeSpec(fields.signAuthority),
    shapeSpec(fields.footerAddress),
    shapeSpec(fields.footerUser),
    shapeSpec(fields.footerWebsite),
    Promise.all(
      fields.lines.map(
        async (line): Promise<ShapedInvoiceLineFields> => ({
          sl: await shapeSpec(line.sl),
          service: await shapeSpec(line.service),
          sub: await shapeSpec(line.sub),
          govt: await shapeSpec(line.govt),
          gateway: await shapeSpec(line.gateway),
          center: await shapeSpec(line.center),
          total: await shapeSpec(line.total),
        })
      )
    ),
  ]);

  return {
    topGovt, brandTitle, tagline, subHeaderLeft, contactMobile, contactEmail,
    metaInvoiceNoLabel, metaInvoiceNoVal, metaDateLabel, metaDateVal, metaTimeVal,
    metaDateOnlyLabel, metaDateOnlyVal, metaTimeOnlyLabel, metaTimeOnlyVal,
    metaTrackingLabel, metaTrackingVal, metaCustomerLabel, metaCustomerVal,
    metaMobileLabel, metaMobileVal, metaUniqueIdLabel, metaUniqueIdVal,
    thSl, thService, thGovt, thGateway, thCenter, thTotal,
    lines,
    totalGovtLabel, totalGovtVal, totalGatewayLabel, totalGatewayVal,
    totalPostalLabel, totalPostalVal,
    totalCenterLabel, totalCenterVal, grandTotalLabel, grandTotalVal,
    paidAmountLabel, paidAmountVal,
    dueAmountLabel, dueAmountVal,
    stampText, stampNote, stampNoteLine1, stampNoteLine2,
    inWords, signCustomer, signAuthority, footerAddress, footerUser, footerWebsite,
  };
}
