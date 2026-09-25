import React, { useState, useRef } from "react";
import { Download, Upload, RotateCcw, FileCheck, CheckCircle2 } from "lucide-react";
import {
  useInstitutionSettings,
  DEFAULT_INSTITUTION_SETTINGS,
} from "../../utils/institutionSettings";
import { readInvoices, writeInvoices } from "../../utils/invoiceStore";
import { readCustomers, writeCustomers } from "../../utils/customerStore";
import { readUsers, writeUsers } from "../../utils/authStore";
import { readExpenses, writeExpenses } from "../../utils/expenseStore";

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
    const customers = readCustomers();
    const users = readUsers();
    const expenses = readExpenses();
    return {
      system: "LSFC Management System",
      version: "2.0.0",
      type: type || "manual",
      timestamp: new Date().toISOString(),
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
        const parsed = JSON.parse(event.target?.result as string);

        // ---------- Complete format ----------
        if (parsed.data) {
          const backupCounts = parsed.counts || {};
          const currentInvoices = readInvoices().length;
          const currentCustomers = readCustomers().length;
          const currentUsers = readUsers().length;
          const currentExpenses = readExpenses().length;

          const inComing = {
            invoices: backupCounts.invoices ?? parsed.data.invoices?.length ?? 0,
            customers: backupCounts.customers ?? parsed.data.customers?.length ?? 0,
            users: backupCounts.users ?? parsed.data.users?.length ?? 0,
            expenses: backupCounts.expenses ?? parsed.data.expenses?.length ?? 0,
          };

          const confirmMsg =
            `⚠️ সতর্কতা: রিস্টোর করলে বর্তমান সব ডেটা প্রতিস্থাপিত হবে!\n\n` +
            `📦 ব্যাকআপে আছে:\n` +
            `  • ইনভয়েস: ${inComing.invoices}টি\n` +
            `  • ভূমি মালিক: ${inComing.customers}জন\n` +
            `  • ইউজার: ${inComing.users}জন\n` +
            `  • খরচ: ${inComing.expenses}টি\n\n` +
            `💾 বর্তমানে আছে:\n` +
            `  • ইনভয়েস: ${currentInvoices}টি\n` +
            `  • ভূমি মালিক: ${currentCustomers}জন\n` +
            `  • ইউজার: ${currentUsers}জন\n` +
            `  • খরচ: ${currentExpenses}টি\n\n` +
            `নিরাপত্তার জন্য রিস্টোরের আগে বর্তমান অবস্থার একটি auto-backup ডাউনলোড হয়ে যাবে।\n\n` +
            `আপনি কি নিশ্চিতভাবে রিস্টোর করতে চান?`;

          if (!window.confirm(confirmMsg)) {
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }

          // Safety net: auto-backup current state before overwriting
          autoBackupBeforeRestore();

          // Perform restore
          if (parsed.data.institutionSettings) {
            saveSettings(parsed.data.institutionSettings);
          }
          if (Array.isArray(parsed.data.invoices)) {
            writeInvoices(parsed.data.invoices);
          }
          if (Array.isArray(parsed.data.customers)) {
            writeCustomers(parsed.data.customers);
          }
          if (Array.isArray(parsed.data.users)) {
            writeUsers(parsed.data.users);
          }
          if (Array.isArray(parsed.data.expenses)) {
            writeExpenses(parsed.data.expenses);
          }

          setBackupMessage(
            `সফলভাবে রিস্টোর সম্পন্ন হয়েছে (${inComing.invoices}টি ইনভয়েস, ${inComing.customers} জন ভূমি মালিক, ${inComing.users} জন ইউজার, ${inComing.expenses}টি খরচ রেকর্ড)।`
          );
        }
        // ---------- Legacy settings-only format ----------
        else if (parsed.orgNameBn) {
          const ok = window.confirm(
            "এটি একটি পুরনো সেটিংস-শুধু ব্যাকআপ ফাইল। শুধু প্রতিষ্ঠান সেটিংস রিস্টোর হবে (ইনভয়েস/ভূমি মালিক/খরচ অপরিবর্তিত থাকবে)। চালিয়ে যাবেন?"
          );
          if (!ok) {
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
          saveSettings(parsed);
          setBackupMessage("সেটিংস সফলভাবে রিস্টোর হয়েছে।");
        } else {
          throw new Error("Invalid backup format");
        }

        setTimeout(() => setBackupMessage(null), 5000);
      } catch (err) {
        alert("ব্যাকআপ ফাইলটি ত্রুটিপূর্ণ বা অবৈধ। অনুগ্রহ করে সঠিক JSON ফাইল নির্বাচন করুন।");
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
}