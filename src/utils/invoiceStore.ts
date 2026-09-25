import { useState, useEffect, useCallback } from "react";
import { upsertCustomer, generateUUIDv7, DEFAULT_BRANCH_ID } from "./customerStore";

export interface InvoiceCustomer {
  customerId?: string;
  fullName: string;
  mobile: string;
  nidNo?: string;
  brnNo?: string;
  address?: string;
}

export interface InvoiceLine {
  serviceName: string;
  govtFee: number;
  gatewayFee?: number;
  postalFee?: number;
  centerFee: number;
  lineTotal: number;
  subText?: string;
  applicationTrackingNo?: string;
  quantity?: number;
}

export interface PaymentInstallment {
  id: string;
  amount: number; // কত টাকা জমা দেওয়া হলো
  date: string; // জমার তারিখ (YYYY-MM-DD)
  receivedBy?: string; // গ্রহণকারী কর্মী
  note?: string; // মন্তব্য
}

// --- কালেকশন Waterfall (v1.3) ---
// প্রতিটা কালেকশনের (initial payment + পরবর্তী বকেয়া আদায়) টাকা এই ক্রমে বণ্টন হয়:
// সরকারি ফি -> ডাক ফি -> গেটওয়ে ফি -> কেন্দ্র ফি (কারণ: সরকারি/ডাক/গেটওয়ে ফি অগ্রিম পরিশোধ করতে হয়)।
// শুধু centerPortion-ই প্রকৃত আয় (নিট-মুনাফায় গণনাযোগ্য) -- বাকি অংশ pass-through।
// বকেয়া টাকা কালেকশন না হওয়া পর্যন্ত তা আয় হিসেবে গণ্য হবে না -- তাই centerPortion
// কালেকশনের তারিখেই আয় হিসেবে যোগ হয়, ইনভয়েস তৈরির তারিখে নয়।
export interface InvoiceCollection {
  id: string;
  date: string; // যেদিন টাকা কালেকশন হলো (YYYY-MM-DD)
  amount: number; // এই কালেকশনে মোট প্রাপ্ত টাকা
  govtPortion: number;
  postalPortion: number;
  gatewayPortion: number;
  centerPortion: number; // শুধু এই অংশটাই নিট-মুনাফায়/আয়ে গণনা হবে
  receivedBy?: string;
  note?: string;
}

export interface InvoiceRecord {
  centerId?: string;
  districtId?: string;
  upazilaId?: string;
  id?: string; // স্থায়ী, গ্লোবালি-ইউনিক আইডি (UUID) -- ভবিষ্যতে multi-device/multi-branch সিংকের জন্য
  branchId?: string;
  invoiceNo: string; // Deterministic 8-char: DDMMYYSS -- মানুষের পড়ার জন্য, রসিদে ছাপা হয়, এখনো lookup-key হিসেবে ব্যবহৃত
  customer: InvoiceCustomer;
  lines: InvoiceLine[];
  total: number;
  paidAmount?: number; // ভূমি মালিক কর্তৃক পরিশোধিত মোট টাকা
  dueAmount?: number; // অবশিষ্ট পাওনা (যদি থাকে)
  discountAmount?: number; // বিশেষ ছাড় / মাফকৃত টাকা (শুধু কেন্দ্র-ফি অংশ থেকে কাটা হয়)
  paymentStatus?: "PAID" | "PARTIAL" | "WAIVED";
  paymentHistory?: PaymentInstallment[];
  collections?: InvoiceCollection[]; // waterfall-ভিত্তিক আয়-বণ্টনের অডিট ট্রেইল
  createdAt: string;
  applicationTrackingNo?: string;
  status?: "ACTIVE" | "VOIDED";
  paymentMethod?: string;
}

// ইনভয়েসের লাইনগুলো থেকে সামগ্রিক (লাইন-বাই-লাইন নয়, পুরো ইনভয়েস একত্রে) ফি-টোটাল হিসাব
export function computeInvoiceFeeTotals(invoice: Pick<InvoiceRecord, "lines">): {
  govtTotal: number;
  postalTotal: number;
  gatewayTotal: number;
  centerTotal: number;
  nonCenterTotal: number;
} {
  const govtTotal = invoice.lines.reduce((sum, l) => sum + (l.govtFee || 0), 0);
  const postalTotal = invoice.lines.reduce((sum, l) => sum + (l.postalFee || 0), 0);
  const gatewayTotal = invoice.lines.reduce((sum, l) => sum + (l.gatewayFee || 0), 0);
  const centerTotal = invoice.lines.reduce((sum, l) => sum + (l.centerFee || 0), 0);
  return {
    govtTotal,
    postalTotal,
    gatewayTotal,
    centerTotal,
    nonCenterTotal: govtTotal + postalTotal + gatewayTotal,
  };
}

/**
 * নতুন কালেকশনের টাকা waterfall অনুযায়ী বণ্টন করা: সরকারি ফি -> ডাক ফি -> গেটওয়ে ফি -> কেন্দ্র ফি।
 * আগের কালেকশনগুলোয় ইতিমধ্যে কতটুকু প্রতিটি খাতে জমা হয়েছে তা বিবেচনা করে বাকি ধারণক্ষমতা বের করা হয়।
 * মাফকৃত (discountAmount) টাকা শুধু কেন্দ্র-ফি অংশের ধারণক্ষমতা থেকে কাটা হয় (cap) -- সরকারি/ডাক/গেটওয়ে অংশ কখনো প্রভাবিত হয় না।
 */
export function allocateCollectionWaterfall(
  invoice: Pick<InvoiceRecord, "lines" | "collections" | "discountAmount">,
  incomingAmount: number
): { govtPortion: number; postalPortion: number; gatewayPortion: number; centerPortion: number } {
  const { govtTotal, postalTotal, gatewayTotal, centerTotal } = computeInvoiceFeeTotals(invoice);
  const pastCollections = invoice.collections || [];

  const collectedGovt = pastCollections.reduce((s, c) => s + (c.govtPortion || 0), 0);
  const collectedPostal = pastCollections.reduce((s, c) => s + (c.postalPortion || 0), 0);
  const collectedGateway = pastCollections.reduce((s, c) => s + (c.gatewayPortion || 0), 0);
  const collectedCenter = pastCollections.reduce((s, c) => s + (c.centerPortion || 0), 0);

  const waivedFromCenter = Math.min(invoice.discountAmount || 0, centerTotal);
  const centerCapacityTotal = Math.max(0, centerTotal - waivedFromCenter);

  let remaining = Math.max(0, incomingAmount);

  const take = (capacity: number) => {
    const portion = Math.min(remaining, Math.max(0, capacity));
    remaining = Math.round((remaining - portion) * 100) / 100;
    return Math.round(portion * 100) / 100;
  };

  const govtPortion = take(govtTotal - collectedGovt);
  const postalPortion = take(postalTotal - collectedPostal);
  const gatewayPortion = take(gatewayTotal - collectedGateway);
  let centerPortion = take(centerCapacityTotal - collectedCenter);

  // ওভারপেমেন্ট (স্বাভাবিকভাবে হওয়ার কথা না, কিন্তু নিরাপত্তার জন্য) -- অবশিষ্ট থাকলে কেন্দ্র-ফি'তে যোগ
  if (remaining > 0) {
    centerPortion = Math.round((centerPortion + remaining) * 100) / 100;
  }

  return { govtPortion, postalPortion, gatewayPortion, centerPortion };
}

/**
 * Waterfall নিয়ম অনুযায়ী একটি ইনভয়েস থেকে প্রকৃতপক্ষে সংগৃহীত কেন্দ্র ফি (realized center fee) বের করে:
 * ১. যদি collections অ্যারে থাকে, তবে প্রতিটি কালেকশনের centerPortion-এর যোগফল নেওয়া হয়।
 * ২. যদি collections না থাকে (যেমন: পুরনো রেকর্ড), তবে paidAmount-এর ওপর allocateCollectionWaterfall চালানো হয়।
 * ৩. যদি paidAmount = 0 বা বকেয়া থাকে, তবে সংগৃহীত কেন্দ্র ফি কঠোরভাবে ০ (Zero) হবে।
 * ৪. কোনো মাফ (waived/discountAmount) থাকলে তা শুধু কেন্দ্র ফি থেকে বাদ যায়।
 */
export function getInvoiceRealizedCenterFee(
  invoice: Pick<InvoiceRecord, "lines" | "collections" | "discountAmount" | "paidAmount" | "dueAmount" | "total" | "status">
): number {
  if (invoice.status === "VOIDED") return 0;

  // ১. কালেকশন হিস্ট্রি থাকলে সরাসরি সংগৃহীত centerPortion-এর যোগফল
  if (invoice.collections && invoice.collections.length > 0) {
    return invoice.collections.reduce((sum, c) => sum + (c.centerPortion || 0), 0);
  }

  // ২. কালেকশন না থাকলে প্রকৃত পরিশোধিত টাকার ওপর ওয়াটারফল সিমুলেশন
  const paid = invoice.paidAmount !== undefined 
    ? invoice.paidAmount 
    : (invoice.dueAmount === 0 ? invoice.total : 0);

  if (paid <= 0) return 0;

  // govt -> postal -> gateway -> center ক্রমে বরাদ্দ
  const allocation = allocateCollectionWaterfall(
    { lines: invoice.lines, collections: [], discountAmount: invoice.discountAmount },
    paid
  );
  return allocation.centerPortion || 0;
}

export const STORAGE_KEY_INVOICES = "lsfc.invoices";
export const LSFC_INVOICES_UPDATED_EVENT = "lsfc:invoices-updated";

// Deterministic Invoice Number generator: DDMMYYSS
// অপরিবর্তিত রাখা হয়েছে — একাধিক ব্র্যাঞ্চ চালু হলে (v1.0) এখানে branchCode-প্রিফিক্স
// যোগ করতে হবে, কিন্তু MVP একক-ব্র্যাঞ্চে এই স্কিমই যথেষ্ট ও নিরাপদ।
export function generateInvoiceNo(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const prefix = `${day}${month}${year}`;

  const invoices = readInvoices();
  const todayInvoices = invoices.filter((inv) => inv.invoiceNo.startsWith(prefix));

  let maxSeq = 0;
  for (const inv of todayInvoices) {
    const seqStr = inv.invoiceNo.slice(6);
    const seqNum = parseInt(seqStr, 10);
    if (!isNaN(seqNum) && seqNum > maxSeq) {
      maxSeq = seqNum;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(2, "0");
  return `${prefix}${nextSeq}`;
}

export function readInvoices(): InvoiceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading invoices from storage:", error);
    return [];
  }
}

export function writeInvoices(invoices: InvoiceRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    window.dispatchEvent(new CustomEvent(LSFC_INVOICES_UPDATED_EVENT));
  } catch (error) {
    console.error("Error writing invoices to storage:", error);
  }
}

export function addInvoice(invoice: InvoiceRecord): InvoiceRecord {
  const invoices = readInvoices();
  // Ensure customer profile is recorded/updated
  const savedCustomer = upsertCustomer({
    fullName: invoice.customer.fullName,
    mobile: invoice.customer.mobile,
    nidNo: invoice.customer.nidNo,
    address: invoice.customer.address,
  });

  // id/branchId না থাকলে (পুরনো caller কোড থেকে এলে) এখানেই বসিয়ে দেওয়া হয়,
  // যাতে caller-দের এখনই বদলাতে না হয়
  const completeInvoice: InvoiceRecord = {
    ...invoice,
    id: invoice.id || generateUUIDv7(),
    branchId: invoice.branchId || DEFAULT_BRANCH_ID,
    customer: {
      ...invoice.customer,
      customerId: invoice.customer.customerId || savedCustomer.id,
    },
  };

  // প্রাথমিক জমার টাকা waterfall অনুযায়ী বণ্টন করে প্রথম কালেকশন এন্ট্রি তৈরি (caller থেকে
  // collections না এলে) -- এতে "কালেকশন না হওয়া পর্যন্ত আয় গণ্য হবে না" নীতিটা শুরু থেকেই বজায় থাকে
  if (!completeInvoice.collections && (completeInvoice.paidAmount || 0) > 0) {
    const portions = allocateCollectionWaterfall(completeInvoice, completeInvoice.paidAmount || 0);
    completeInvoice.collections = [
      {
        id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: (completeInvoice.createdAt || new Date().toISOString()).slice(0, 10),
        amount: completeInvoice.paidAmount || 0,
        ...portions,
        receivedBy: completeInvoice.paymentMethod,
        note: "প্রাথমিক জমা",
      },
    ];
  }

  const updatedInvoices = [completeInvoice, ...invoices];
  writeInvoices(updatedInvoices);
  return completeInvoice;
}

export function deleteStoredInvoice(invoiceNo: string): void {
  const invoices = readInvoices();
  const filtered = invoices.filter((inv) => inv.invoiceNo !== invoiceNo);
  writeInvoices(filtered);
}

export function voidInvoice(invoiceNo: string): void {
  const invoices = readInvoices();
  const updated = invoices.map((inv) => {
    if (inv.invoiceNo === invoiceNo) {
      return { ...inv, status: "VOIDED" as const };
    }
    return inv;
  });
  writeInvoices(updated);
}

/**
 * পরবর্তীতে বকেয়া বা অবশিষ্ট টাকা জমা নেওয়া ও অডিট হিস্ট্রি সংরক্ষণ
 */
export function recordDuePayment(
  invoiceNo: string,
  payment: {
    amount: number;
    date?: string;
    receivedBy?: string;
    note?: string;
  }
): { ok: boolean; invoice?: InvoiceRecord; error?: string } {
  const invoices = readInvoices();
  const index = invoices.findIndex((inv) => inv.invoiceNo === invoiceNo);
  if (index === -1) return { ok: false, error: "ইনভয়েস পাওয়া যায়নি।" };

  const target = invoices[index];
  const currentPaid = target.paidAmount !== undefined ? target.paidAmount : target.total;
  const currentDue = target.dueAmount !== undefined ? target.dueAmount : 0;

  if (payment.amount <= 0) {
    return { ok: false, error: "সঠিক টাকার পরিমাণ দিন।" };
  }

  const newPaid = Math.round((currentPaid + payment.amount) * 100) / 100;
  const newDue = Math.max(0, Math.round((currentDue - payment.amount) * 100) / 100);
  const paymentDate = payment.date || new Date().toISOString().slice(0, 10);

  const installment: PaymentInstallment = {
    id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    amount: payment.amount,
    date: paymentDate,
    receivedBy: payment.receivedBy,
    note: payment.note,
  };

  // waterfall: এই কিস্তির টাকা আগে সরকারি/ডাক/গেটওয়ে ফি মেটাবে, বাকিটা কেন্দ্র-ফি (আয়) --
  // এবং centerPortion আজকের (কালেকশনের) তারিখেই আয় হিসেবে গণ্য হবে, ইনভয়েস-তারিখে নয়
  const portions = allocateCollectionWaterfall(target, payment.amount);
  const collectionEntry: InvoiceCollection = {
    id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: paymentDate,
    amount: payment.amount,
    ...portions,
    receivedBy: payment.receivedBy,
    note: payment.note,
  };

  const updatedInvoice: InvoiceRecord = {
    ...target,
    paidAmount: newPaid,
    dueAmount: newDue,
    paymentStatus: newDue === 0 ? "PAID" : "PARTIAL",
    paymentHistory: [...(target.paymentHistory || []), installment],
    collections: [...(target.collections || []), collectionEntry],
  };

  invoices[index] = updatedInvoice;
  writeInvoices(invoices);
  return { ok: true, invoice: updatedInvoice };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(readInvoices);

  const refresh = useCallback(() => {
    setInvoices(readInvoices());
  }, []);

  useEffect(() => {
    const handleUpdate = () => refresh();
    window.addEventListener(LSFC_INVOICES_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(LSFC_INVOICES_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  return { invoices, refresh, addInvoice, deleteInvoice: deleteStoredInvoice, voidInvoice };
}
