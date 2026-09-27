import { z } from "zod";
import type { LocalUser, UserRole, UserScope } from "./authStore";
import type { CustomerRecord } from "./customerStore";
import type {
  InvoiceCustomer,
  InvoiceLine,
  PaymentInstallment,
  InvoiceCollection,
  InvoiceRecord,
} from "./invoiceStore";
import type { ExpenseCategory, ExpenseStatus, ExpenseRecord } from "./expenseStore";
import type {
  DisplayOptions,
  SubServiceItem,
  SubtitleOption,
  ServiceSettingItem,
  InstitutionSettings,
} from "./institutionSettings";
import type { ServiceType } from "./serviceCalculator";

// ==========================================
// 1. User Schemas
// ==========================================
export const userRoleSchema: z.ZodType<UserRole> = z.enum(["staff", "branch_incharge", "admin"]);

export const userScopeSchema: z.ZodType<UserScope> = z.object({
  level: z.enum(["branch", "all"]),
  id: z.string(),
});

export const localUserSchema: z.ZodType<LocalUser> = z.object({
  id: z.string().min(1, { message: "ব্যবহারকারী আইডি আবশ্যক" }),
  username: z.string().min(1, { message: "ইউজারনেম আবশ্যক" }),
  displayName: z.string().min(1, { message: "নাম আবশ্যক" }),
  role: userRoleSchema,
  scope: userScopeSchema,
  branchId: z.string(),
  passwordHash: z.string(),
  passwordSalt: z.string(),
  hashAlgorithm: z
    .enum(["pbkdf2-sha256-600k", "pbkdf2-sha256-100k", "legacy-sha256"])
    .optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

// ==========================================
// 2. Customer Schema
// ==========================================
export const customerRecordSchema: z.ZodType<CustomerRecord> = z.object({
  centerId: z.string().optional(),
  districtId: z.string().optional(),
  upazilaId: z.string().optional(),
  id: z.string().min(1, { message: "গ্রাহক আইডি আবশ্যক" }),
  customerNumber: z.string().optional(),
  branchId: z.string().optional(),
  fullName: z.string().min(1, { message: "গ্রাহকের নাম আবশ্যক" }),
  mobile: z.string().min(1, { message: "মোবাইল নম্বর আবশ্যক" }),
  nidNo: z.string().optional(),
  brnNo: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  createdDate: z.string().optional(),
  updatedAt: z.string().optional(),
});

// ==========================================
// 3. Invoice Schemas
// ==========================================
export const invoiceCustomerSchema: z.ZodType<InvoiceCustomer> = z.object({
  customerId: z.string().optional(),
  fullName: z.string().min(1, { message: "গ্রাহকের নাম আবশ্যক" }),
  mobile: z.string().min(1, { message: "মোবাইল নম্বর আবশ্যক" }),
  nidNo: z.string().optional(),
  brnNo: z.string().optional(),
  address: z.string().optional(),
});

export const invoiceLineSchema: z.ZodType<InvoiceLine> = z.object({
  serviceName: z.string().min(1, { message: "সেবার নাম আবশ্যক" }),
  govtFee: z.number({ message: "সরকারি ফি সংখ্যা হতে হবে" }),
  gatewayFee: z.number().optional(),
  postalFee: z.number().optional(),
  centerFee: z.number({ message: "কেন্দ্র ফি সংখ্যা হতে হবে" }),
  lineTotal: z.number({ message: "মোট ফি সংখ্যা হতে হবে" }),
  subText: z.string().optional(),
  applicationTrackingNo: z.string().optional(),
  quantity: z.number().optional(),
});

export const paymentInstallmentSchema: z.ZodType<PaymentInstallment> = z.object({
  id: z.string(),
  amount: z.number(),
  date: z.string(),
  receivedBy: z.string().optional(),
  note: z.string().optional(),
});

export const invoiceCollectionSchema: z.ZodType<InvoiceCollection> = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number(),
  govtPortion: z.number(),
  postalPortion: z.number(),
  gatewayPortion: z.number(),
  centerPortion: z.number(),
  receivedBy: z.string().optional(),
  note: z.string().optional(),
});

export const invoiceRecordSchema: z.ZodType<InvoiceRecord> = z.object({
  centerId: z.string().optional(),
  districtId: z.string().optional(),
  upazilaId: z.string().optional(),
  id: z.string().optional(),
  branchId: z.string().optional(),
  invoiceNo: z.string().min(1, { message: "ইনভয়েস নম্বর আবশ্যক" }),
  customer: invoiceCustomerSchema,
  lines: z.array(invoiceLineSchema).min(1, { message: "ইনভয়েসে অন্তত একটি সেবা লাইন থাকতে হবে" }),
  total: z.number({ message: "ইনভয়েসের মোট সংখ্যা হতে হবে" }),
  paidAmount: z.number().optional(),
  dueAmount: z.number().optional(),
  discountAmount: z.number().optional(),
  paymentStatus: z.enum(["PAID", "PARTIAL", "WAIVED"]).optional(),
  paymentHistory: z.array(paymentInstallmentSchema).optional(),
  collections: z.array(invoiceCollectionSchema).optional(),
  createdAt: z.string().min(1, { message: "ইনভয়েস তৈরির তারিখ আবশ্যক" }),
  applicationTrackingNo: z.string().optional(),
  status: z.enum(["ACTIVE", "VOIDED"]).optional(),
  paymentMethod: z.string().optional(),
});

// ==========================================
// 4. Expense Schemas
// ==========================================
export const expenseCategorySchema: z.ZodType<ExpenseCategory> = z.enum([
  "stationery",
  "printing",
  "utility",
  "rent",
  "entertainment",
  "maintenance",
  "salary",
  "other",
]);

export const expenseStatusSchema: z.ZodType<ExpenseStatus> = z.enum([
  "pending",
  "approved",
  "rejected",
]);

export const expenseRecordSchema: z.ZodType<ExpenseRecord> = z.object({
  centerId: z.string().optional(),
  districtId: z.string().optional(),
  upazilaId: z.string().optional(),
  id: z.string().min(1, { message: "খরচ আইডি আবশ্যক" }),
  date: z.string().min(1, { message: "খরচের তারিখ আবশ্যক" }),
  title: z.string().min(1, { message: "খরচের বিবরণ আবশ্যক" }),
  category: expenseCategorySchema,
  amount: z.number({ message: "খরচের পরিমাণ সংখ্যা হতে হবে" }),
  paidBy: z.string().optional(),
  notes: z.string().optional(),
  voucherNumber: z.string().optional(),
  voucherIssuerName: z.string().optional(),
  status: expenseStatusSchema,
  createdBy: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  createdAt: z.string().min(1, { message: "এন্ট্রির সময় আবশ্যক" }),
});

// ==========================================
// 5. Institution Settings Schemas
// ==========================================
export const displayOptionsSchema: z.ZodType<DisplayOptions> = z.object({
  showLogoOnInvoice: z.boolean(),
  showLogoOnReports: z.boolean(),
  showAddress: z.boolean(),
  showEmail: z.boolean(),
  showWebsite: z.boolean(),
  showFacebook: z.boolean(),
  showPhone: z.boolean(),
  showTagline: z.boolean(),
});

export const subServiceItemSchema: z.ZodType<SubServiceItem> = z.object({
  id: z.string(),
  label: z.string(),
  fee: z.number(),
});

export const subtitleOptionSchema: z.ZodType<SubtitleOption> = z.object({
  id: z.string(),
  label: z.string(),
  postalFee: z.number().optional(),
});

export const serviceTypeSchema: z.ZodType<ServiceType> = z.literal("namjari");

export const serviceSettingItemSchema: z.ZodType<ServiceSettingItem> = z.object({
  id: z.string(),
  serviceName: z.string(),
  govtFee: z.number(),
  gatewayFee: z.number(),
  postalFee: z.number(),
  centerFee: z.number(),
  subText: z.string().optional(),
  subtitles: z.array(subtitleOptionSchema).optional(),
  subServices: z.array(subServiceItemSchema).optional(),
  subServiceFeeMode: z.enum(["sum", "flat"]).optional(),
  combinationOverrides: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean(),
  displayOrder: z.number(),
  builtInType: serviceTypeSchema.optional(),
});

export const institutionSettingsObjectSchema = z.object({
  logoUrl: z.string(),
  ministryLogoUrl: z.string(),
  licensingAuthority: z.string(),
  orgNameBn: z.string().min(1, { message: "প্রতিষ্ঠানের নাম (বাংলায়) আবশ্যক" }),
  orgNameEn: z.string(),
  licenseNo: z.string(),
  partnerOrg: z.string(),
  email: z.string(),
  website: z.string(),
  socialMedia: z.string(),
  mobile: z.string(),
  alternativePhone: z.string(),
  contactPerson: z.string(),
  citizenPortalPassword: z.string(),
  addressBn: z.string(),
  addressEn: z.string(),
  district: z.string(),
  upazila: z.string(),
  unionMunicipality: z.string(),
  geoDivisionCode: z.string(),
  geoDistrictCode: z.string(),
  geoUpazilaCode: z.string(),
  officeHours: z.string(),
  weeklyHoliday: z.string(),
  taglineBn: z.string(),
  taglineEn: z.string(),
  inchargeSignatureUrl: z.string(),
  displayOptions: displayOptionsSchema,
  services: z.array(serviceSettingItemSchema),
});

export const institutionSettingsSchema: z.ZodType<InstitutionSettings> = institutionSettingsObjectSchema;

// FIX B: Partial schema for robust restore compatibility with older backups
export const institutionSettingsPartialSchema = institutionSettingsObjectSchema.partial();

// ==========================================
// 6. Complete Backup Schemas
// ==========================================
export const exportedUserSchema = z
  .object({
    id: z.string().optional(),
    username: z.string().optional(),
    displayName: z.string().optional(),
    role: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough();

export interface BackupData {
  institutionSettings?: Partial<InstitutionSettings>;
  invoices?: InvoiceRecord[];
  customers?: CustomerRecord[];
  users?: Array<Record<string, unknown>>;
  expenses?: ExpenseRecord[];
}

export const backupDataSchema: z.ZodType<BackupData> = z.object({
  institutionSettings: institutionSettingsPartialSchema.optional(),
  invoices: z.array(invoiceRecordSchema).optional(),
  customers: z.array(customerRecordSchema).optional(),
  users: z.array(z.record(z.string(), z.unknown())).optional(),
  expenses: z.array(expenseRecordSchema).optional(),
});

export interface BackupSnapshot {
  system?: string;
  version?: string;
  type?: string;
  timestamp?: string;
  counts?: {
    invoices?: number;
    customers?: number;
    users?: number;
    expenses?: number;
  };
  data: BackupData;
}

export const backupSnapshotSchema: z.ZodType<BackupSnapshot> = z.object({
  system: z.string().optional(),
  version: z.string().optional(),
  type: z.string().optional(),
  timestamp: z.string().optional(),
  counts: z
    .object({
      invoices: z.number().optional(),
      customers: z.number().optional(),
      users: z.number().optional(),
      expenses: z.number().optional(),
    })
    .optional(),
  data: backupDataSchema,
});
