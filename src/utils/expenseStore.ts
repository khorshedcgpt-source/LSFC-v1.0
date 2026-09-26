import { useState, useEffect, useCallback } from "react";
import { expenseRecordSchema } from "./schemas";

export type ExpenseCategory =
  | "stationery" // কাগজ, খাতা, স্ট্যাপলার
  | "printing" // প্রিন্টার কালি, টোনার, ড্রাম
  | "utility" // ইন্টারনেট, বিদ্যুৎ, পানি
  | "rent" // সেন্টারের দোকান বা অফিস ভাড়া
  | "entertainment" // চা, নাস্তা ও অতিথি আপ্যায়ন
  | "maintenance" // কম্পিউটার, স্ক্যানার ও ফার্নিচার মেরামত
  | "salary" // স্টাফ/অপারেটর বেতন বা হাতখরচ
  | "other"; // অন্যান্য সাধারণ ব্যয়

// এপ্রুভাল ওয়ার্কফ্লো: staff এন্ট্রি দেয় (pending), ইনচার্জ/অ্যাডমিন approve/reject করেন।
// শুধু "approved" এন্ট্রিই আয়-ব্যয় লেজার/টোটাল/নিট-মুনাফায় গণনা হবে।
export type ExpenseStatus = "pending" | "approved" | "rejected";

export interface ExpenseRecord {
  centerId?: string;
  districtId?: string;
  upazilaId?: string;
  id: string; // ইউনিক আইডি
  date: string; // YYYY-MM-DD
  title: string; // খরচের বিবরণ (যেমন: এ৪ কাগজ ২ রিম)
  category: ExpenseCategory;
  amount: number; // টাকার পরিমাণ
  paidBy?: string; // যিনি খরচ পরিশোধ করেছেন
  notes?: string; // অতিরিক্ত মন্তব্য

  // --- ভাউচার ও এপ্রুভাল ওয়ার্কফ্লো (v1.1) ---
  voucherNumber?: string; // ভাউচার নম্বর
  voucherIssuerName?: string; // যে প্রতিষ্ঠান ভাউচার ইস্যু করেছে
  status: ExpenseStatus;
  createdBy?: string; // এন্ট্রি যিনি দিয়েছেন (staff/incharge/admin display name)
  approvedBy?: string; // যিনি এপ্রুভ/রিজেক্ট করেছেন
  approvedAt?: string; // ISO স্ট্রিং
  rejectionReason?: string; // reject করলে কারণ (ঐচ্ছিক)

  createdAt: string; // ISO স্ট্রিং
}

export const EXPENSE_CATEGORY_LABELS: Record<
  ExpenseCategory,
  { label: string; color: string }
> = {
  stationery: { label: "কাগজ ও স্টেশনারি", color: "bg-blue-50 text-blue-700 border-blue-200" },
  printing: { label: "প্রিন্টার কালি ও টোনার", color: "bg-purple-50 text-purple-700 border-purple-200" },
  utility: { label: "ইন্টারনেট ও বিদ্যুৎ", color: "bg-amber-50 text-amber-700 border-amber-200" },
  rent: { label: "অফিস/দোকান ভাড়া", color: "bg-red-50 text-red-700 border-red-200" },
  entertainment: { label: "চা-নাস্তা ও আপ্যায়ন", color: "bg-orange-50 text-orange-700 border-orange-200" },
  maintenance: { label: "যন্ত্রপাতি ও মেরামত", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  salary: { label: "কর্মী বেতন ও সম্মানী", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  other: { label: "অন্যান্য খরচ", color: "bg-gray-50 text-gray-700 border-gray-200" },
};

export const EXPENSE_STATUS_LABELS: Record<
  ExpenseStatus,
  { label: string; color: string }
> = {
  pending: { label: "অপেক্ষমাণ (এপ্রুভাল প্রয়োজন)", color: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "এপ্রুভড", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "বাতিল", color: "bg-red-50 text-red-700 border-red-200" },
};

export const STORAGE_KEY_EXPENSES = "lsfc.expenses";
export const LSFC_EXPENSES_UPDATED_EVENT = "lsfc:expenses-updated";

/**
 * লোকাল স্টোরেজ থেকে সব খরচের তালিকা পড়া।
 * পুরনো (এপ্রুভাল-ওয়ার্কফ্লো আসার আগের) রেকর্ডে status না থাকলে,
 * সেগুলোকে ইতিমধ্যে-গণনা-হওয়া হিসেবে "approved" ধরে নেওয়া হয় (migration/backward-compat)।
 */
export function readExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const prepared = Array.isArray(parsed)
      ? parsed.map((e: any) => (e && typeof e === "object" ? { ...e, status: e.status ?? "approved" } : e))
      : parsed;
    const result = expenseRecordSchema.array().safeParse(prepared);
    if (!result.success) {
      console.error("ExpenseRecord schema validation failed:", result.error);
      return [];
    }
    // তারিখ অনুযায়ী সর্বশেষ খরচ আগে সাজানো
    return result.data.sort(
      (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );
  } catch (err) {
    console.error("Failed to read expenses from localStorage:", err);
    return [];
  }
}

/**
 * লোকাল স্টোরেজে খরচের তালিকা সংরক্ষণ ও ইভেন্ট ডিসপ্যাচ
 */
export function writeExpenses(expenses: ExpenseRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(LSFC_EXPENSES_UPDATED_EVENT));
    }
  } catch (err) {
    console.error("Failed to write expenses to localStorage:", err);
  }
}

/**
 * নতুন খরচ যুক্ত করা — সবসময় "pending" হিসেবে তৈরি হয় (ইনচার্জ/অ্যাডমিন যাচাই সাপেক্ষে)
 */
export function addExpense(
  expense: Omit<ExpenseRecord, "id" | "createdAt" | "status" | "approvedBy" | "approvedAt" | "rejectionReason">
): ExpenseRecord {
  const expenses = readExpenses();
  const newRecord: ExpenseRecord = {
    ...expense,
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  expenses.unshift(newRecord);
  writeExpenses(expenses);
  return newRecord;
}

/**
 * বিদ্যমান খরচ আপডেট করা (শুধুমাত্র ইনচার্জ/অ্যাডমিন — UI-লেয়ারে নিয়ন্ত্রিত)
 */
export function updateExpense(
  id: string,
  updatedData: Partial<Omit<ExpenseRecord, "id" | "createdAt">>
): boolean {
  const expenses = readExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) return false;

  expenses[index] = {
    ...expenses[index],
    ...updatedData,
  };

  writeExpenses(expenses);
  return true;
}

/**
 * খরচ মুছে ফেলা (শুধুমাত্র ইনচার্জ/অ্যাডমিন — UI-লেয়ারে নিয়ন্ত্রিত)
 */
export function deleteExpense(id: string): boolean {
  const expenses = readExpenses();
  const filtered = expenses.filter((e) => e.id !== id);
  if (filtered.length === expenses.length) return false;

  writeExpenses(filtered);
  return true;
}

/**
 * ইনচার্জ/অ্যাডমিন কর্তৃক এন্ট্রি এপ্রুভ করা — এরপরই লেজার/টোটালে গণনা হবে
 */
export function approveExpense(id: string, approverName: string): boolean {
  const expenses = readExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) return false;

  expenses[index] = {
    ...expenses[index],
    status: "approved",
    approvedBy: approverName,
    approvedAt: new Date().toISOString(),
    rejectionReason: undefined,
  };

  writeExpenses(expenses);
  return true;
}

/**
 * ইনচার্জ/অ্যাডমিন কর্তৃক এন্ট্রি বাতিল/reject করা
 */
export function rejectExpense(id: string, approverName: string, reason?: string): boolean {
  const expenses = readExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) return false;

  expenses[index] = {
    ...expenses[index],
    status: "rejected",
    approvedBy: approverName,
    approvedAt: new Date().toISOString(),
    rejectionReason: reason,
  };

  writeExpenses(expenses);
  return true;
}

/**
 * শুধু এপ্রুভড এন্ট্রি ফিল্টার — ড্যাশবোর্ড/নিট-মুনাফা ক্যালকুলেশনে ব্যবহারের জন্য
 */
export function getApprovedExpenses(expenses: ExpenseRecord[]): ExpenseRecord[] {
  return expenses.filter((e) => e.status === "approved");
}

/**
 * রিয়েল-টাইম রিঅ্যাক্ট হুক
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(readExpenses);

  const refresh = useCallback(() => {
    setExpenses(readExpenses());
  }, []);

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener(LSFC_EXPENSES_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(LSFC_EXPENSES_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  return { expenses, refresh };
}
