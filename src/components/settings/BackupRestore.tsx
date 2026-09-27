import React, { useState, useRef } from "react";
import { Download, Upload, RotateCcw, FileCheck, CheckCircle2 } from "lucide-react";
import {
  useInstitutionSettings,
  DEFAULT_INSTITUTION_SETTINGS,
} from "../../utils/institutionSettings";
import { readInvoices, writeInvoices } from "../../utils/invoiceStore";
import {
  readCustomers,
  readCustomersAtRest,
  writeCustomers,
} from "../../utils/customerStore";
import { readUsers } from "../../utils/authStore";
import { readExpenses, writeExpenses } from "../../utils/expenseStore";
import {
  backupSnapshotSchema,
  institutionSettingsPartialSchema,
} from "../../utils/backupSchema";

export const BackupRestore: React.FC = () => {
  const { settings, saveSettings } = useInstitutionSettings();
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResetDefaults = () => {
    if (confirm("আপনি কি নিশ্চিত যে সকল প্রাতিষ্ঠানিক তথ্য (সেবা ও ফি সহ) ডিফল্ট মানে রিসেট করতে চান?")) {
      saveSettings(DEFAULT_INSTITUTION_SETTINGS);
      setBackupMessage("সকল সেটিংস ডিফল্ট মানে রিসেট করা হয়েছে।");
      setTimeout(() => setBackupMessage(null), 4000);
    }
  };

  /** Shared download helper */
  const downloadJson = (payload: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  /** Builds the current full-system snapshot */
  const buildSnapshot = (type?: string) => {
    const invoices = readInvoices();
    const customers = readCustomersAtRest();
    // Security: Strip passwordHash and passwordSalt at the export boundary
    const users = readUsers().map(({ passwordHash, passwordSalt, ...safe }) => safe);
    const expenses = readExpenses();

    return {
      system: "LSFC Management System",
      version: "2.0.0",
      type: type || "manual",
      timestamp: new Date().toISOString(),
      security: {
        nidEncryption: "AES-GCM-256",
        deviceBound: true,
        note: "গ্রাহকদের জাতীয় পরিচয়পত্র (NID) নম্বরগুলো ইনস্টলেশন ডিভাইস কি (deviceKey) দ্বারা এনক্রিপ্ট করা। এই ব্যাকআপটি শুধুমাত্র যে কম্পিউটারে তৈরি করা হয়েছে সেখানেই ডিক্রিপ্ট হবে। অন্য কোনো ডিভাইসে রিস্টোর করলে NID নম্বরটি অপাঠ্য/ফাঁকা দেখাবে।",
      },
      counts: {
        invoices: invoices.length,
        customers: customers.length,
        users: users.length,
        expenses: expenses.length,
      },
      data: {
        institutionSettings: settings,
        invoices,
        customers,
        users,
        expenses,
      },
    };
  };

  const handleExportFullBackup = () => {
    const payload = buildSnapshot("manual");
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJson(payload, `LSFC-Complete-Backup-${dateStr}.json`);
    setBackupMessage("সম্পূর্ণ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে।");
    setTimeout(() => setBackupMessage(null), 4000);
  };

  /** Silent safety-net backup fired immediately before a restore overwrites data */
  const autoBackupBeforeRestore = () => {
    try {
      const payload = buildSnapshot("pre-restore-auto-backup");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      downloadJson(payload, `LSFC-AutoBackup-BeforeRestore-${timestamp}.json`);
    } catch (err) {
      console.warn("Auto-backup before restore failed:", err);
    }
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          alert("ব্যাকআপ ফাইলটি সঠিক JSON ফরম্যাটে নেই। অনুগ্রহ করে বৈধ ব্যাকআপ ফাইল নির্বাচন করুন।");
          return;
        }

        // ---------- 1. Complete format with 'data' container ----------
        if (parsed && typeof parsed === "object" && "data" in parsed) {
          const snapshotResult = backupSnapshotSchema.safeParse(parsed);
          if (!snapshotResult.success) {
            const errorDetails = snapshotResult.error.issues
              .slice(0, 3)
              .map((i) => `${i.path.join(" ➔ ")}: ${i.message}`)
              .join("; ");
            alert(`ব্যাকআপ ফাইলের স্কিমা ভ্যালিডেশনে ত্রুটি পাওয়া গেছে: ${errorDetails}`);
            return;
          }

          const { data } = snapshotResult.data;

          // Real counts computed from actual validated arrays — never self-reported metadata
          const realCounts = {
            invoices: Array.isArray(data.invoices) ? data.invoices.length : 0,
            customers: Array.isArray(data.customers) ? data.customers.length : 0,
            users: Array.isArray(data.users) ? data.users.length : 0,
            expenses: Array.isArray(data.expenses) ? data.expenses.length : 0,
          };

          const currentInvoices = readInvoices().length;
          const currentCustomers = readCustomers().length;
          const currentUsers = readUsers().length;
          const currentExpenses = readExpenses().length;

          // Security warning: notify admin that users are NOT restored from backup
          const userWarningLine =
            realCounts.users > 0
              ? `\n🔒 নিরাপত্তা সতর্কতা: ব্যাকআপ ফাইলের ব্যবহারকারী তথ্য রিস্টোর করা হবে না। নিরাপত্তা নিশ্চিত করতে বিদ্যমান ইউজার অ্যাকাউন্ট অপরিবর্তিত থাকবে; প্রয়োজনীয় কর্মী অ্যাকাউন্ট ইউজার ম্যানেজমেন্ট থেকে পুনরায় তৈরি করতে হবে।\n`
              : "";

          const confirmMsg =
            `⚠️ সতর্কতা: রিস্টোর করলে বর্তমান সব ডেটা প্রতিস্থাপিত হবে!\n\n` +
            `📦 ব্যাকআপ ফাইলে প্রাপ্ত প্রকৃত রেকর্ড:\n` +
            `  • ইনভয়েস: ${realCounts.invoices}টি\n` +
            `  • ভূমি মালিক: ${realCounts.customers}জন\n` +
            `  • খরচ: ${realCounts.expenses}টি\n\n` +
            `💾 বর্তমানে সিস্টেমে আছে:\n` +
            `  • ইনভয়েস: ${currentInvoices}টি\n` +
            `  • ভূমি মালিক: ${currentCustomers}জন\n` +
            `  • খরচ: ${currentExpenses}টি\n` +
            `  • ইউজার: ${currentUsers}জন\n` +
            `${userWarningLine}\n` +
            `নিরাপত্তার জন্য রিস্টোরের আগে বর্তমান অবস্থার একটি auto-backup ডাউনলোড হয়ে যাবে।\n\n` +
            `আপনি কি নিশ্চিতভাবে রিস্টোর করতে চান?`;

          if (!window.confirm(confirmMsg)) {
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }

          // Safety net: auto-backup current state before overwriting
          autoBackupBeforeRestore();

          // Restore strictly validated data WITHOUT any 'as any' casting
          if (data.institutionSettings) {
            saveSettings({
              ...DEFAULT_INSTITUTION_SETTINGS,
              ...data.institutionSettings,
            });
          }
          if (data.invoices) {
            writeInvoices(data.invoices);
          }
          if (data.customers) {
            writeCustomers(data.customers);
          }
          if (data.expenses) {
            writeExpenses(data.expenses);
          }

          const userNoticeText =
            realCounts.users > 0
              ? " (নিরাপত্তার স্বার্থে ইউজার অ্যাকাউন্ট রিস্টোর করা হয়নি, বিদ্যমান অ্যাকাউন্ট বহাল রয়েছে)"
              : "";

          setBackupMessage(
            `সফলভাবে রিস্টোর সম্পন্ন হয়েছে (${realCounts.invoices}টি ইনভয়েস, ${realCounts.customers} জন ভূমি মালিক, ${realCounts.expenses}টি খরচ রেকর্ড)${userNoticeText}।`
          );

          // রিস্টোরের পর ডিক্রিপশন ও মেমরি ক্যাশ নতুন স্টার্টআপের মতো ফ্রেশ করার জন্য স্বয়ংক্রিয় রিলোড
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
        // ---------- 2. Legacy settings-only format ----------
        else if (parsed && typeof parsed === "object" && "orgNameBn" in parsed) {
          const settingsResult = institutionSettingsPartialSchema.safeParse(parsed);
          if (!settingsResult.success) {
            const errorDetails = settingsResult.error.issues
              .slice(0, 3)
              .map((i) => i.message)
              .join("; ");
            alert(`পুরনো সেটিংস ফাইলের স্কিমা ভ্যালিডেশনে ত্রুটি: ${errorDetails}`);
            return;
          }

          const ok = window.confirm(
            "এটি একটি পুরনো সেটিংস-শুধু ব্যাকআপ ফাইল। শুধু প্রতিষ্ঠান সেটিংস রিস্টোর হবে (ইনভয়েস/ভূমি মালিক/খরচ অপরিবর্তিত থাকবে)। চালিয়ে যাবেন?"
          );
          if (!ok) {
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }

          saveSettings({
            ...DEFAULT_INSTITUTION_SETTINGS,
            ...settingsResult.data,
          });
          setBackupMessage("সেটিংস সফলভাবে রিস্টোর হয়েছে।");

          // প্রাতিষ্ঠানিক সেটিংসের পরিবর্তনসমূহ সিস্টেমে রেন্ডার করার জন্য রিলোড
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          alert("ব্যাকআপ ফাইলের গঠন সঠিক নয় (অবৈধ JSON বা অপরিচিত ফরম্যাট)।");
          return;
        }

        setTimeout(() => setBackupMessage(null), 6000);
      } catch (err) {
        console.error("Backup restore error:", err);
        alert("ব্যাকআপ ফাইলটি প্রক্রিয়াকরণে ত্রুটি ঘটেছে। অনুগ্রহ করে সঠিক JSON ফাইল নির্বাচন করুন।");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold font-anek text-gray-800">ব্যাকআপ ও রিস্টোর</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            সিস্টেমের প্রাতিষ্ঠানিক সেটিংস, সকল ভূমি মালিকের তালিকা এবং সকল ইনভয়েসের পূর্ণাঙ্গ ব্যাকআপ পরিচালনা করুন
          </p>
        </div>
        {backupMessage && (
          <span className="text-xs bg-green-100 text-[#37A448] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {backupMessage}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 font-anek text-sm border-b pb-3 mb-2 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600" /> সম্পূর্ণ সিস্টেম ডেটা ব্যাকআপ ও রিস্টোর
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          সিস্টেমের প্রাতিষ্ঠানিক সেটিংস, সকল ভূমি মালিকের তালিকা এবং সকল ইনভয়েসের পূর্ণাঙ্গ ব্যাকআপ ডাউনলোড করুন অথবা পূর্বের ব্যাকআপ ফাইল থেকে রিস্টোর করুন।
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleExportFullBackup}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-anek flex items-center gap-2 cursor-pointer shadow-xs transition"
          >
            <Download className="w-4 h-4" /> সম্পূর্ণ ব্যাকআপ ডাউনলোড (JSON)
          </button>

          <label className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-xs font-bold font-anek flex items-center gap-2 cursor-pointer shadow-xs transition">
            <Upload className="w-4 h-4" /> ব্যাকআপ ফাইল রিস্টোর করুন
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportBackupFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ml-auto"
          >
            <RotateCcw className="w-4 h-4" /> ডিফল্ট সেটিংসে রিসেট
          </button>
        </div>
      </div>
    </div>
  );
};