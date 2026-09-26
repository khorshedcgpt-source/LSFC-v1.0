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

// ==========================================
// 1. LocalUser Schema
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
