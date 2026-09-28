import { useState, useEffect, useCallback } from "react";
import { upsertCustomer, generateUUIDv7, DEFAULT_BRANCH_ID } from "./customerStore";
import { invoiceRecordSchema } from "./backupSchema";
import { randomIdSuffix } from "./idGen";
import { addMoney, subtractMoney, toPaisa, toTaka } from "./money";
import { getLocalDateString } from "./dateUtils";

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
  amount: number; // কত টাকা জমা দেওয়া হলো
  date: string; // জমার তারিখ (YYYY-MM-DD)
  receivedBy?: string; // গ্রহণকারী কর্মী
  note?: string; // মন্তব্য
}

// --- কালেকশন Waterfall (v1.3) ---
// প্রতিটা কালেকশনের (initial payment + পরবর্তী বকেয়া আদায়) টাকা এই ক্রমে বণ্টন হয়:
// সরকারি ফি -> ডাক ফি -> গেটওয়ে ফি -> কেন্দ্র ফি।
// শুধু centerPortion-ই প্রকৃত আয় (নিট-মুনাফায় গণনাযোগ্য) -- বাকি অংশ pass-through।
export interface InvoiceCollection {
  id: string;
  date: string; // যেদিন টাকা কালেকশন হলো (YYYY-MM-DD)
  amount: number; // এই কালেকশনে মোট প্রাপ্ত টাকা
  govtPortion: number;
  postalPortion: number;
  gatewayPortion: number;
  centerPortion: number; // শুধু এই অংশটাই নিট-মুনাফায়/আয়ে গণনা হবে
  receivedBy?: string;
  note?: string;
}

export interface InvoiceRecord {
  centerId?: string;
  districtId?: string;
  upazilaId?: string;
  id?: string;
  branchId?: string;
  invoiceNo: string;
  customer: InvoiceCustomer;
  lines: InvoiceLine[];
  total: number;
  paidAmount?: number;
  dueAmount?: number;
  discountAmount?: number;
  paymentStatus?: "PAID" | "PARTIAL" | "WAIVED";
  paymentHistory?: PaymentInstallment[];
  collections?: InvoiceCollection[];
  createdAt: string;
  applicationTrackingNo?: string;
  status?: "ACTIVE" | "VOIDED";
  paymentMethod?: string;
}

// ইনভয়েসের লাইনগুলো থেকে সামগ্রিক ফি-টোটাল হিসাব
export function computeInvoiceFeeTotals(invoice: Pick<InvoiceRecord, "lines">): {
  govtTotal: number;
  postalTotal: number;
  gatewayTotal: number;
  centerTotal: number;
  nonCenterTotal: number;
} {
  const govtTotal = addMoney(...invoice.lines.map((l) => l.govtFee || 0));
  const postalTotal = addMoney(...invoice.lines.map((l) => l.postalFee || 0));
  const gatewayTotal = addMoney(...invoice.lines.map((l) => l.gatewayFee || 0));
  const centerTotal = addMoney(...invoice.lines.map((l) => l.centerFee || 0));
  return {
    govtTotal,
    postalTotal,
    gatewayTotal,
    centerTotal,
    nonCenterTotal: addMoney(govtTotal, postalTotal, gatewayTotal),
  };
}

// একটি নির্দিষ্ট কালেকশন পেমেন্টকে সরকারি/ডাক/গেটওয়ে/কেন্দ্র ফি-র ক্রমানুসারে বণ্টন
export function allocateCollectionWaterfall(
  invoice: Pick<InvoiceRecord, "lines" | "collections">,
  newPaymentAmount: number
): {
  govtPortion: number;
  postalPortion: number;
  gatewayPortion: number;
  centerPortion: number;
} {
  const totals = computeInvoiceFeeTotals(invoice);
  const prior = (invoice.collections || []).reduce(
    (acc, c) => ({
      govtPaisa: acc.govtPaisa + toPaisa(c.govtPortion || 0),
      postalPaisa: acc.postalPaisa + toPaisa(c.postalPortion || 0),
      gatewayPaisa: acc.gatewayPaisa + toPaisa(c.gatewayPortion || 0),
      centerPaisa: acc.centerPaisa + toPaisa(c.centerPortion || 0),
    }),
    { govtPaisa: 0, postalPaisa: 0, gatewayPaisa: 0, centerPaisa: 0 }
  );

  let remainingPaisa = Math.max(0, toPaisa(newPaymentAmount));

  const neededGovtPaisa = Math.max(0, toPaisa(totals.govtTotal) - prior.govtPaisa);
  const govtPortionPaisa = Math.min(remainingPaisa, neededGovtPaisa);
  remainingPaisa -= govtPortionPaisa;

  const neededPostalPaisa = Math.max(0, toPaisa(totals.postalTotal) - prior.postalPaisa);
  const postalPortionPaisa = Math.min(remainingPaisa, neededPostalPaisa);
  remainingPaisa -= postalPortionPaisa;

  const neededGatewayPaisa = Math.max(0, toPaisa(totals.gatewayTotal) - prior.gatewayPaisa);
  const gatewayPortionPaisa = Math.min(remainingPaisa, neededGatewayPaisa);
  remainingPaisa -= gatewayPortionPaisa;

  const neededCenterPaisa = Math.max(0, toPaisa(totals.centerTotal) - prior.centerPaisa);
  const centerPortionPaisa = Math.min(remainingPaisa, neededCenterPaisa);

  return {
    govtPortion: toTaka(govtPortionPaisa),
    postalPortion: toTaka(postalPortionPaisa),
    gatewayPortion: toTaka(gatewayPortionPaisa),
    centerPortion: toTaka(centerPortionPaisa),
  };
}

// কোনো ইনভয়েস থেকে আজ পর্যন্ত প্রকৃতপক্ষে কত টাকা কেন্দ্র-ফি (আয়) আদায় হয়েছে
export function getInvoiceRealizedCenterFee(invoice: InvoiceRecord): number {
  if (invoice.collections && invoice.collections.length > 0) {
    return invoice.collections.reduce((sum, c) => addMoney(sum, c.centerPortion || 0), 0);
  }
  const totals = computeInvoiceFeeTotals(invoice);
  const effectivePaid =
    invoice.paidAmount !== undefined
      ? invoice.paidAmount
      : invoice.paymentStatus === "PAID"
      ? invoice.total
      : 0;
  const nonCenterTotal = addMoney(totals.govtTotal, totals.postalTotal, totals.gatewayTotal);
  const centerRealized = Math.max(0, subtractMoney(effectivePaid, nonCenterTotal));
  return Math.min(centerRealized, totals.centerTotal);
}

export const LSFC_INVOICES_KEY = "lsfc.invoices";
export const LSFC_INVOICES_UPDATED_EVENT = "lsfc:invoices-updated";

// =========================================================================
// AUDIT LOGGING FOR HARD DELETIONS (lsfc.auditLog)
// =========================================================================

export interface InvoiceAuditLogEntry {
  id: string;
  action: "DELETE_INVOICE";
  timestamp: string;
  deletedBy: string;
  invoiceNo: string;
  previousInvoiceData: InvoiceRecord;
  reason?: string;
}

export const STORAGE_KEY_AUDIT_LOG = "lsfc.auditLog";
export const AUDIT_LOG_CAPACITY = 500;

/**
 * ARCHITECTURAL DECISION & AUDIT TRAIL INTEGRITY:
 * Time-based automated silent deletion was explicitly evaluated and REJECTED.
 * In government land service facilitation (LSFC), audit records must remain
 * immutable and permanent for legal transparency and administrative audits.
 * Therefore, when active localStorage reaches the 500-entry capacity, the
 * oldest excess records are exported to a downloadable JSON archive before
 * being pruned from localStorage. If the archive download fails, pruning is
 * aborted so zero records are lost silently.
 */
function downloadAuditArchive(entries: InvoiceAuditLogEntry[], filename: string): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  try {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error("Failed to trigger audit log archive download:", err);
    return false;
  }
}

export function readAuditLog(): InvoiceAuditLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOG);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read audit log:", err);
    return [];
  }
}

/**
 * Writes audit entries to localStorage capped at 500 entries.
 * When the cap is exceeded, excess oldest entries are archived as a JSON
 * file download first, and pruned only upon successful download.
 * Returns true on successful write, false on failure.
 */
export function writeAuditLog(entries: InvoiceAuditLogEntry[]): boolean {
  if (typeof window === "undefined") return false;

  let entriesToStore = entries;

  if (entries.length > AUDIT_LOG_CAPACITY) {
    const entriesToKeep = entries.slice(0, AUDIT_LOG_CAPACITY);
    const excessEntriesToArchive = entries.slice(AUDIT_LOG_CAPACITY);

    const dateStr = getLocalDateString();
    const filename = `LSFC-AuditLog-Archive-${dateStr}.json`;

    const downloadSuccess = downloadAuditArchive(excessEntriesToArchive, filename);
    if (!downloadSuccess) {
      console.warn(
        "Audit log archive download failed; aborting pruning to preserve immutable records."
      );
    } else {
      entriesToStore = entriesToKeep;
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY_AUDIT_LOG, JSON.stringify(entriesToStore));
    return true;
  } catch (err) {
    console.error("Failed to write audit log to localStorage (e.g. quota exceeded):", err);
    return false;
  }
}

/**
 * Deep-clone helper to prevent reference sharing between the live object
 * and the audit record.
 */
function deepClone<T>(obj: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(obj);
    } catch {
      // fallback in case of non-cloneable objects
    }
  }
  return JSON.parse(JSON.stringify(obj));
}

export interface DeleteStoredInvoiceOptions {
  _adminOnly: true;
  deletedBy: string;
  reason?: string;
}

/**
 * Hard delete — strictly reserved for admin cleanup.
 *
 * NOTE: The `_adminOnly: true` flag is an accidental-misuse guard only,
 * intended to prevent unintentional invocation from standard UI flows;
 * it is NOT cryptographically secure client-side authorization enforcement.
 * Real enforcement requires a secure server-side role check, which will
 * be implemented in a future phase.
 */
export function deleteStoredInvoice(
  invoiceNo: string,
  options: DeleteStoredInvoiceOptions
): boolean {
  // FIX A: Explicit guard requiring _adminOnly: true
  if (!options || options._adminOnly !== true) {
    throw new Error(
      "অননুমোদিত অপারেশন: ইনভয়েস স্থায়ীভাবে মুছে ফেলার জন্য '_adminOnly: true' বিকল্পটি আবশ্যক।"
    );
  }

  // FIX E: Require deletedBy string from caller without any authStore dependency
  if (!options.deletedBy || !options.deletedBy.trim()) {
    throw new Error(
      "অডিট ট্রেইলের জন্য ডিলিটকারী ইউজারের নাম (deletedBy) আবশ্যক।"
    );
  }

  const invoices = readInvoices();
  const target = invoices.find((inv) => inv.invoiceNo === invoiceNo);
  if (!target) return false;

  // FIX D: Deep clone previousInvoiceData to prevent reference sharing
  const clonedTarget = deepClone(target);

  const auditEntry: InvoiceAuditLogEntry = {
    id: `audit-${Date.now()}-${randomIdSuffix(4)}`,
    action: "DELETE_INVOICE",
    timestamp: new Date().toISOString(),
    deletedBy: options.deletedBy.trim(),
    invoiceNo: target.invoiceNo,
    previousInvoiceData: clonedTarget,
    reason: options.reason,
  };

  // FIX B: Order of operations — write audit log entry first, verify success before removing invoice
  const currentLogs = readAuditLog();
  const writeSuccess = writeAuditLog([auditEntry, ...currentLogs]);

  // If writeAuditLog returns false (e.g. quota exceeded), abort delete entirely
  if (!writeSuccess) {
    console.error(
      `[AuditLog] Failed to persist audit log entry for invoice ${invoiceNo}. Invoice deletion aborted.`
    );
    return false;
  }

  // Only remove invoice from storage AFTER audit log write is confirmed successful
  const filtered = invoices.filter((inv) => inv.invoiceNo !== invoiceNo);
  writeInvoices(filtered);
  return true;
}

export function readInvoices(): InvoiceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LSFC_INVOICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const result = invoiceRecordSchema.array().safeParse(parsed);
    if (!result.success) {
      console.error("InvoiceRecord schema validation failed:", result.error);
      return [];
    }
    return result.data;
  } catch (err) {
    console.error("Failed to read invoices from localStorage:", err);
    return [];
  }
}

/**
 * Splits a string into its leading non-digit portion and trailing digit portion,
 * without relying on backtracking-prone regex like /^(.*?)(\d+)$/.
 * Returns null if the string has no trailing digits or is entirely digits.
 */
function splitTrailingDigits(value: string): { base: string; digits: string } | null {
  let i = value.length;
  while (i > 0) {
    const code = value.charCodeAt(i - 1);
    if (code < 48 || code > 57) break;
    i--;
  }
  if (i === value.length || i === 0) return null;
  return { base: value.slice(0, i), digits: value.slice(i) };
}

/**
 * Increments an invoice number sequence by 1.
 * Supports standard DDMMYYSS format as well as generic suffix numbers.
 */
export function incrementInvoiceNo(invoiceNo: string): string {
  if (/^\d{6}\d+$/.test(invoiceNo)) {
    const prefix = invoiceNo.slice(0, 6);
    const seqStr = invoiceNo.slice(6);
    const seq = Number.parseInt(seqStr, 10);
    const nextSeq = Number.isNaN(seq) ? 1 : seq + 1;
    const padLength = Math.max(2, seqStr.length);
    return `${prefix}${String(nextSeq).padStart(padLength, "0")}`;
  }

  const split = splitTrailingDigits(invoiceNo);
  if (split) {
    const nextNum = Number.parseInt(split.digits, 10) + 1;
    return `${split.base}${String(nextNum).padStart(split.digits.length, "0")}`;
  }

  return `${invoiceNo}-1`;
}

export function writeInvoices(invoices: InvoiceRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    // Duplicate-check safety net: before saving, re-check that no existing record
    // already has that exact invoiceNo. If a collision is found, increment and retry (up to 5 attempts).
    const seen = new Set<string>();
    const sanitized = invoices.map((inv) => {
      const invNo = inv.invoiceNo;
      if (!invNo) return inv;

      if (seen.has(invNo)) {
        console.warn(`Duplicate invoiceNo collision detected for "${invNo}". Resolving...`);
        let resolvedNo = invNo;
        let success = false;
        for (let attempt = 1; attempt <= 5; attempt++) {
          resolvedNo = incrementInvoiceNo(resolvedNo);
          if (!seen.has(resolvedNo)) {
            console.warn(`Duplicate invoiceNo resolved to "${resolvedNo}" on attempt ${attempt}`);
            success = true;
            break;
          }
        }
        if (!success) {
          console.error(`Failed to resolve duplicate invoiceNo "${invNo}" after 5 attempts!`);
        }
        seen.add(resolvedNo);
        return { ...inv, invoiceNo: resolvedNo };
      }

      seen.add(invNo);
      return inv;
    });

    localStorage.setItem(LSFC_INVOICES_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent(LSFC_INVOICES_UPDATED_EVENT));
  } catch (err) {
    console.error("Failed to write invoices to localStorage:", err);
  }
}

export function addStoredInvoice(invoice: InvoiceRecord): InvoiceRecord {
  const invoices = readInvoices();
  const globalId = invoice.id || generateUUIDv7();
  const branchId = invoice.branchId || DEFAULT_BRANCH_ID;

  // Safety net: re-check that no existing record already has that exact invoiceNo
  let finalInvoiceNo = invoice.invoiceNo;
  const existingNumbers = new Set(invoices.map((inv) => inv.invoiceNo));

  if (existingNumbers.has(finalInvoiceNo)) {
    console.warn(`Duplicate invoiceNo collision detected: "${finalInvoiceNo}". Resolving...`);
    let resolved = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      finalInvoiceNo = incrementInvoiceNo(finalInvoiceNo);
      if (!existingNumbers.has(finalInvoiceNo)) {
        console.warn(`Collision resolved on attempt ${attempt}: new invoiceNo "${finalInvoiceNo}"`);
        resolved = true;
        break;
      }
    }
    if (!resolved) {
      console.error(`Failed to resolve duplicate invoiceNo "${invoice.invoiceNo}" after 5 attempts!`);
    }
  }

  let customerId = invoice.customer.customerId;
  if (!customerId) {
    const upserted = upsertCustomer({
      fullName: invoice.customer.fullName,
      mobile: invoice.customer.mobile,
      nidNo: invoice.customer.nidNo,
      brnNo: invoice.customer.brnNo,
      address: invoice.customer.address,
      branchId,
    });
    customerId = upserted.id;
  }

  const completeInvoice: InvoiceRecord = {
    ...invoice,
    invoiceNo: finalInvoiceNo,
    id: globalId,
    branchId,
    customer: {
      ...invoice.customer,
      customerId,
    },
    paidAmount: invoice.paidAmount !== undefined ? invoice.paidAmount : invoice.total,
    dueAmount: invoice.dueAmount !== undefined ? invoice.dueAmount : 0,
    discountAmount: invoice.discountAmount !== undefined ? invoice.discountAmount : 0,
    paymentStatus: invoice.paymentStatus || "PAID",
    paymentHistory: invoice.paymentHistory || [],
    collections: invoice.collections || [],
  };

  const initialPaid = completeInvoice.paidAmount || 0;
  if (
    initialPaid > 0 &&
    (!completeInvoice.collections || completeInvoice.collections.length === 0)
  ) {
    const dateStr = completeInvoice.createdAt
      ? getLocalDateString(completeInvoice.createdAt)
      : getLocalDateString();
    const portions = allocateCollectionWaterfall(completeInvoice, initialPaid);
    completeInvoice.collections = [
      {
        id: `col-init-${Date.now()}`,
        date: dateStr,
        amount: initialPaid,
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

  const newPaid = addMoney(currentPaid, payment.amount);
  const newDue = Math.max(0, subtractMoney(currentDue, payment.amount));
  const paymentDate = payment.date || getLocalDateString();

  const installment: PaymentInstallment = {
    id: `pay-${Date.now()}-${randomIdSuffix(4)}`,
    amount: payment.amount,
    date: paymentDate,
    receivedBy: payment.receivedBy,
    note: payment.note,
  };

  const portions = allocateCollectionWaterfall(target, payment.amount);
  const collectionEntry: InvoiceCollection = {
    id: `col-${Date.now()}-${randomIdSuffix(4)}`,
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
    collections: [...(target.collections || []), collectionRef(collectionEntry)],
  };

  invoices[index] = updatedInvoice;
  writeInvoices(invoices);
  return { ok: true, invoice: updatedInvoice };
}

function collectionRef(c: InvoiceCollection): InvoiceCollection {
  return c;
}

/**
 * TODO(Phase 2): This read-max-then-increment pattern is NOT safe for
 * multi-device or multi-center concurrent writes. Replace with a database
 * sequence before enabling cloud sync.
 */
export function generateInvoiceNo(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const prefix = `${dd}${mm}${yy}`;

  const invoices = readInvoices();
  let maxSeq = 0;
  for (const inv of invoices) {
    if (inv.invoiceNo && inv.invoiceNo.startsWith(prefix)) {
      const seqStr = inv.invoiceNo.slice(prefix.length);
      const seq = Number.parseInt(seqStr, 10);
      if (!Number.isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(2, "0");
  return `${prefix}${nextSeq}`;
}

export const addInvoice = addStoredInvoice;

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

  return { invoices, refresh, addInvoice, voidInvoice };
}