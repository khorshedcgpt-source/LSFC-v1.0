import { useState, useEffect, useCallback } from "react";
import { readInstitutionSettings } from "./institutionSettings";

// ফেজ-১ (MVP) একটা মাত্র ব্র্যাঞ্চে চলবে — তাই এখন একটাই স্থির মান ব্যবহার হচ্ছে।
// v1.0-এ প্রকৃত ব্র্যাঞ্চ-এনটিটি এলে এটা সেখান থেকে ডাইনামিকভাবে আসবে; ততক্ষণ
// প্রতিটা রেকর্ডে branchId রাখা থাকলে তখন migration লাগবে না, শুধু মান বসবে।
export const DEFAULT_BRANCH_ID = "branch-default";

export interface CustomerRecord {
  centerId?: string;
  districtId?: string;
  upazilaId?: string;
  id: string;
  customerNumber?: string; // Human-readable Unique ID: LSFC55495202-260042
  branchId?: string;
  fullName: string;
  mobile: string;
  nidNo?: string;
  brnNo?: string;
  address?: string;
  notes?: string;
  status?: "ACTIVE" | "ARCHIVED";
  createdDate?: string;
  updatedAt?: string;
}

export const STORAGE_KEY_CUSTOMERS = "lsfc.customers";
export const CUSTOMERS_UPDATED_EVENT = "lsfc:customers-updated";

// Helper to convert Bengali digits to standard ASCII digits
export function convertBanglaToAscii(str: string): string {
  if (!str) return "";
  const bnToEnMap: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
  };
  return str.replace(/[০-৯]/g, (match) => bnToEnMap[match] || match);
}

// Normalize Bangladeshi phone number
export function cleanPhone(phone: string | undefined | null): string {
  if (!phone) return "";
  let digits = convertBanglaToAscii(String(phone)).replace(/\D/g, "");
  // Remove leading country code +88 or 88 if present
  if (digits.startsWith("880") && digits.length >= 13) {
    digits = digits.slice(2);
  }
  return digits;
}

// Normalize NID
export function cleanNid(nid: string | undefined | null): string {
  if (!nid) return "";
  return convertBanglaToAscii(String(nid)).replace(/\D/g, "");
}

// Read customers from localStorage
export function readCustomers(): CustomerRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading customers from storage:", error);
    return [];
  }
}

// Write customers to localStorage and dispatch event
export function writeCustomers(customers: CustomerRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    window.dispatchEvent(new CustomEvent(CUSTOMERS_UPDATED_EVENT));
  } catch (error) {
    console.error("Error saving customers to storage:", error);
  }
}

/**
 * Builds the fixed prefix for this center's customer unique IDs.
 * Format: LSFC + [division:2][district:2][upazila:2] + [license:2] + "-" + [YY:2]
 * Example: LSFC55495202-26
 */
export function buildCustomerNumberPrefix(): string {
  const settings = readInstitutionSettings();
  const division = convertBanglaToAscii(settings.geoDivisionCode || "55")
    .replace(/\D/g, "")
    .padStart(2, "0")
    .slice(-2);
  const district = convertBanglaToAscii(settings.geoDistrictCode || "49")
    .replace(/\D/g, "")
    .padStart(2, "0")
    .slice(-2);
  const upazila = convertBanglaToAscii(settings.geoUpazilaCode || "52")
    .replace(/\D/g, "")
    .padStart(2, "0")
    .slice(-2);
  const license = convertBanglaToAscii(settings.licenseNo || "02")
    .replace(/\D/g, "")
    .padStart(2, "0")
    .slice(-2);
  const year = String(new Date().getFullYear()).slice(-2);

  return `LSFC${division}${district}${upazila}${license}-${year}`;
}

/**
 * Generates the next human-readable customer unique ID for this center.
 * Format: LSFC[div:2][dist:2][upazila:2][license:2]-[YY:2][serial:4+]
 * Example: LSFC55495202-260042
 *
 * Serial resets each year. If a year exceeds 9,999 customers,
 * the serial naturally grows to 5 digits.
 */
export function generateCustomerNumber(): string {
  const prefix = buildCustomerNumberPrefix();
  const customers = readCustomers();

  let maxSerial = 0;
  for (const c of customers) {
    if (c.customerNumber && c.customerNumber.startsWith(prefix)) {
      const serialStr = c.customerNumber.slice(prefix.length);
      const serialNum = parseInt(serialStr, 10);
      if (!isNaN(serialNum) && serialNum > maxSerial) {
        maxSerial = serialNum;
      }
    }
  }

  const nextSerial = String(maxSerial + 1).padStart(4, "0");
  return `${prefix}${nextSerial}`;
}

/**
 * Assigns customerNumber to any existing customers who don't have one.
 * Runs once on app startup. Returns number of customers migrated.
 */
export function migrateCustomerNumbers(): number {
  const customers = readCustomers();
  const needsMigration = customers.some((c) => !c.customerNumber);
  if (!needsMigration) return 0;

  const prefix = buildCustomerNumberPrefix();

  let maxSerial = 0;
  for (const c of customers) {
    if (c.customerNumber && c.customerNumber.startsWith(prefix)) {
      const n = parseInt(c.customerNumber.slice(prefix.length), 10);
      if (!isNaN(n) && n > maxSerial) maxSerial = n;
    }
  }

  let migrated = 0;
  const updated = customers.map((c) => {
    if (c.customerNumber) return c;
    maxSerial += 1;
    migrated += 1;
    return {
      ...c,
      customerNumber: `${prefix}${String(maxSerial).padStart(4, "0")}`,
    };
  });

  if (migrated > 0) {
    writeCustomers(updated);
  }
  return migrated;
}

// RFC 9562 compliant UUIDv7 generator
export function generateUUIDv7(): string {
  const now = Date.now();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Timestamp in big-endian 48 bits (6 bytes)
  bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
  bytes[1] = Math.floor(now / 0x100000000) & 0xff;
  bytes[2] = Math.floor(now / 0x1000000) & 0xff;
  bytes[3] = Math.floor(now / 0x10000) & 0xff;
  bytes[4] = Math.floor(now / 0x100) & 0xff;
  bytes[5] = now & 0xff;

  // Version 7: 0111xxxx
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // Variant: 10xxxxxx
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Find customer by mobile or NID (returns first match, preferring NID match)
export function findCustomerByPhoneOrNid(query: string, name?: string): CustomerRecord | undefined {
  if (!query) return undefined;
  const customers = readCustomers();
  const cleaned = convertBanglaToAscii(query).replace(/\D/g, "");
  if (!cleaned) return undefined;

  // First check if matching by NID (NID is globally unique per person)
  const nidMatch = customers.find((c) => {
    const cNid = cleanNid(c.nidNo);
    return cNid && cNid === cleaned;
  });
  if (nidMatch) return nidMatch;

  // If name is provided, match by phone AND matching name
  if (name && name.trim()) {
    const normTarget = normalizeCustomerName(name);
    const exactNameMatch = customers.find((c) => {
      const cPhone = cleanPhone(c.mobile);
      return cPhone === cleaned && normalizeCustomerName(c.fullName) === normTarget;
    });
    if (exactNameMatch) return exactNameMatch;
  }

  // Fallback: match by phone
  return customers.find((c) => cleanPhone(c.mobile) === cleaned);
}

// Find all customers registered with a given phone number (supports shared family phones)
export function findCustomersByPhone(phone: string): CustomerRecord[] {
  const cleaned = cleanPhone(phone);
  if (!cleaned) return [];
  const customers = readCustomers();
  return customers.filter((c) => cleanPhone(c.mobile) === cleaned);
}

// Helper to normalize Bengali names for matching
export function normalizeCustomerName(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .replace(/[।.,:;_\-\s]+/g, " ")
    .replace(/^জনাব(\/জনাবা)?\s*/i, "")
    .toLowerCase();
}

// Upsert a customer record
export function upsertCustomer(record: Omit<CustomerRecord, "id"> & { id?: string }): CustomerRecord {
  const customers = readCustomers();
  const phone = cleanPhone(record.mobile);
  const nid = cleanNid(record.nidNo);
  const normName = normalizeCustomerName(record.fullName);

  let existingIndex = -1;

  if (record.id) {
    // 1. Direct ID match
    existingIndex = customers.findIndex((c) => c.id === record.id);
  } else if (nid) {
    // 2. NID match (personally unique)
    existingIndex = customers.findIndex((c) => cleanNid(c.nidNo) === nid);
  } else if (phone && normName) {
    // 3. Shared phone support: same phone AND same person name
    existingIndex = customers.findIndex((c) => {
      const cPhone = cleanPhone(c.mobile);
      const cName = normalizeCustomerName(c.fullName);
      return cPhone === phone && cName === normName;
    });
  }

  const now = new Date().toISOString();
  let updatedRecord: CustomerRecord;

  if (existingIndex >= 0) {
    const existing = customers[existingIndex];
    updatedRecord = {
      ...existing,
      ...record,
      id: existing.id, // Keep permanent ID intact
      customerNumber: existing.customerNumber || generateCustomerNumber(),
      branchId: existing.branchId || DEFAULT_BRANCH_ID,
      mobile: phone || existing.mobile,
      nidNo: nid || existing.nidNo,
      fullName: record.fullName.trim() || existing.fullName,
      address: record.address?.trim() || existing.address,
      updatedAt: now,
    };
    customers[existingIndex] = updatedRecord;
  } else {
    // New customer with RFC 9562 UUIDv7 + human-readable customerNumber
    updatedRecord = {
      ...record,
      id: generateUUIDv7(),
      customerNumber: record.customerNumber || generateCustomerNumber(),
      branchId: record.branchId || DEFAULT_BRANCH_ID,
      mobile: phone,
      nidNo: nid || undefined,
      fullName: record.fullName.trim(),
      address: record.address?.trim() || "",
      status: "ACTIVE",
      createdDate: now,
      updatedAt: now,
    };
    customers.unshift(updatedRecord);
  }

  writeCustomers(customers);
  return updatedRecord;
}

// Custom hook for subscribing to customers state
export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerRecord[]>(readCustomers);

  const refresh = useCallback(() => {
    setCustomers(readCustomers());
  }, []);

  useEffect(() => {
    const handleUpdate = () => refresh();
    window.addEventListener(CUSTOMERS_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(CUSTOMERS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  return { customers, refresh, upsertCustomer };
}