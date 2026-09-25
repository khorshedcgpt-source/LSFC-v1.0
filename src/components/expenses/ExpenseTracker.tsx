import React, { useState } from "react";
import {
  Plus,
  Receipt,
  Trash2,
  Wallet,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  LogIn,
  UserCheck,
  ShieldAlert,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  useExpenses,
  addExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  ExpenseCategory,
  ExpenseRecord,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
} from "../../utils/expenseStore";
import { toBanglaNumber, moneyBn } from "../InvoicePrint";
import { useAuth, canManageSettings } from "../../utils/authStore";
import { LoginModal } from "../auth/LoginModal";

interface ToastNotification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  message: string;
}

export const ExpenseTracker: React.FC = () => {
  const { currentUser } = useAuth();
  const { expenses } = useExpenses();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("stationery");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [paidBy, setPaidBy] = useState("");
  const [voucherNumber, setVoucherNumber] = useState("");
  const [voucherIssuerName, setVoucherIssuerName] = useState("");
  const [notes, setNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = (message: string, type: ToastNotification["type"] = "success") => {
    const id = Date.now().toString();
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  };

  // Custom Modal States for In-App Actions (Strictly avoiding native confirm/prompt for iFrame stability)
  const [expenseToApprove, setExpenseToApprove] = useState<ExpenseRecord | null>(null);
  const [expenseToReject, setExpenseToReject] = useState<ExpenseRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);

  // Quick preset rejection reasons
  const PRESET_REJECTION_REASONS = [
    "ভাউচার কপি অনুপস্থিত বা অস্পষ্ট",
    "অননুমোদিত বা মাত্রাতিরিক্ত ব্যয়",
    "দ্বৈত এন্ট্রি (Duplicate Entry)",
    "ইনভয়েস/রসিদের সাথে তথ্যের অসঙ্গতি",
  ];

  // --- সাইন-ইন ছাড়া এন্ট্রি দেওয়া যাবে না (createdBy ট্র্যাক করার জন্য) ---
  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8 max-w-2xl mx-auto my-8 text-center font-kalpurush animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-purple-50 text-[#902A8B] border border-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Lock className="w-8 h-8 text-[#902A8B]" />
        </div>
        <h2 className="text-xl font-bold font-anek text-gray-900 mb-2">
          খরচ দেখতে/যোগ করতে সাইন-ইন প্রয়োজন
        </h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed max-w-lg mx-auto">
          ব্যয়ের হিসাব ও এপ্রুভাল ওয়ার্কফ্লো ট্র্যাক করার জন্য অপারেটর/ইন-চার্জ/অ্যাডমিন হিসেবে সাইন-ইন করুন।
        </p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-6 py-2.5 text-xs font-bold text-white bg-[#902A8B] hover:bg-[#7b2276] rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>সাইন-ইন করুন</span>
        </button>
        {showLoginModal && (
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  const isManager = canManageSettings(currentUser); // admin বা branch_incharge
  const actorName = currentUser.displayName || currentUser.username;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("অনুগ্রহ করে সঠিক খরচের পরিমাণ (টাকা) প্রদান করুন।");
      return;
    }
    if (!title.trim()) {
      setError("খরচের বিবরণ লিখুন।");
      return;
    }
    if (!voucherNumber.trim() || !voucherIssuerName.trim()) {
      setError("এপ্রুভালের জন্য ভাউচার নম্বর ও ভাউচার ইস্যুকারী প্রতিষ্ঠানের নাম আবশ্যক।");
      return;
    }

    const created = addExpense({
      title: title.trim(),
      category,
      amount: parsedAmount,
      date,
      paidBy: paidBy.trim() || undefined,
      voucherNumber: voucherNumber.trim(),
      voucherIssuerName: voucherIssuerName.trim(),
      notes: notes.trim() || undefined,
      createdBy: actorName,
    });

    // Reset form
    setTitle("");
    setAmount("");
    setPaidBy("");
    setVoucherNumber("");
    setVoucherIssuerName("");
    setNotes("");
    setShowAddForm(false);
    showToast(`"${created.title}" খরচের এন্ট্রি জমা হয়েছে (অপেক্ষমাণ)। ইন-চার্জ এটি যাচাই করে এপ্রুভ করবেন।`, "info");
  };

  // Perform Approve
  const confirmApprove = () => {
    if (!expenseToApprove) return;
    const success = approveExpense(expenseToApprove.id, actorName);
    if (success) {
      showToast(`"${expenseToApprove.title}" সফলভাবে এপ্রুভ করা হয়েছে। এটি পরিচালন ব্যয়ে ও নিট মুনাফায় যুক্ত হলো।`, "success");
    } else {
      showToast("খরচ এপ্রুভ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।", "error");
    }
    setExpenseToApprove(null);
  };

  // Perform Reject
  const confirmReject = () => {
    if (!expenseToReject) return;
    const reasonText = rejectionReason.trim() || undefined;
    const success = rejectExpense(expenseToReject.id, actorName, reasonText);
    if (success) {
      showToast(`"${expenseToReject.title}" বাতিল করা হয়েছে।`, "warning");
    } else {
      showToast("খরচ বাতিল করতে সমস্যা হয়েছে।", "error");
    }
    setExpenseToReject(null);
    setRejectionReason("");
  };

  // Perform Delete
  const confirmDelete = () => {
    if (!expenseToDelete) return;
    const success = deleteExpense(expenseToDelete.id);
    if (success) {
      showToast(`"${expenseToDelete.title}" খরচের রেকর্ড স্থায়ীভাবে মুছে ফেলা হয়েছে।`, "info");
    } else {
      showToast("খরচ মুছতে সমস্যা হয়েছে।", "error");
    }
    setExpenseToDelete(null);
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    return true;
  });

  const approvedTotal = filteredExpenses
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = expenses.filter((e) => e.status === "pending").length;
  const approvedCount = expenses.filter((e) => e.status === "approved").length;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-6 font-kalpurush relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : toast.type === "warning"
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : toast.type === "error"
                ? "bg-red-50 border-red-300 text-red-900"
                : "bg-purple-50 border-purple-300 text-purple-900"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : toast.type === "warning" ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : toast.type === "error" ? (
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#902A8B] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-semibold">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-black/5 rounded-md transition cursor-pointer text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold font-anek text-[#902A8B] flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              দৈনন্দিন খরচ ও ব্যয় ব্যবস্থাপনা (Expense Tracker)
            </h2>
            {isManager ? (
              <span className="bg-emerald-100 text-[#37A448] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                <UserCheck className="w-3.5 h-3.5" /> ইন-চার্জ / অ্যাডমিন মোড
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-700 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
                অপারেটর মোড (অনুমোদনের জন্য জমা দিন)
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isManager
              ? "ইন-চার্জ হিসেবে যে কোনো ব্যয়ের এন্ট্রি যাচাই করে এক ক্লিকে এপ্রুভ, বাতিল কিংবা স্থায়ীভাবে বাদ দিতে পারবেন।"
              : "ভাউচারসহ ব্যয়ের এন্ট্রি জমা দিন। ইন-চার্জ যাচাই করে এপ্রুভ দিলে তবেই এটি হিসাবে যুক্ত হবে।"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              {toBanglaNumber(pendingCount)} টি অপেক্ষমাণ
            </span>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-xs font-bold text-white bg-[#902A8B] hover:bg-[#7b2276] rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? "ফর্ম বন্ধ করুন" : "নতুন খরচ লিখুন"}</span>
          </button>
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-purple-50/40 border border-purple-100 rounded-xl p-5 space-y-4 animate-in fade-in duration-200"
        >
          <h3 className="text-xs font-bold font-anek text-[#902A8B] uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="w-4 h-4" />
            নতুন খরচের বিবরণ এন্ট্রি
          </h3>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                খরচের বিবরণ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: এ৪ কাগজ ২ রিম / প্রিন্টার টোনার"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                টাকার পরিমাণ (৳) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="যেমন: ৯৫০"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                খরচের খাত / ক্যাটাগরি <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                খরচের তারিখ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                ভাউচার নম্বর <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                placeholder="যেমন: V-2026-081"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                ভাউচার প্রদানকারী প্রতিষ্ঠান <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={voucherIssuerName}
                onChange={(e) => setVoucherIssuerName(e.target.value)}
                placeholder="যেমন: খন্দকার পেপার হাউস, কুড়িগ্রাম"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                পরিশোধকারী (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                placeholder="যেমন: হাবিবুর রহমান (ক্যাশ)"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                মন্তব্য / নোট (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="প্রয়োজনে অতিরিক্ত তথ্য লিখুন"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#902A8B] hover:bg-[#7b2276] rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>খরচ জমা দিন</span>
            </button>
          </div>
        </form>
      )}

      {/* KPI & Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">অনুমোদিত পরিচালন ব্যয়</span>
            <h3 className="text-xl font-bold font-anek text-[#902A8B] mt-0.5">
              {moneyBn(approvedTotal)} ৳
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              ফিল্টারকৃত মোট {toBanglaNumber(approvedCount)} টি এপ্রুভড রেকর্ড
            </p>
          </div>
          <div className="p-2.5 bg-purple-100 text-[#902A8B] rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">অপেক্ষমাণ এন্ট্রি</span>
            <h3 className="text-xl font-bold font-anek text-amber-700 mt-0.5">
              {toBanglaNumber(pendingCount)} টি
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              ইন-চার্জের অনুমোদনের অপেক্ষায়
            </p>
          </div>
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">মোট খরচের এন্ট্রি</span>
            <h3 className="text-xl font-bold font-anek text-gray-800 mt-0.5">
              {toBanglaNumber(expenses.length)} টি
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              সকল স্ট্যাটাস মিলিয়ে
            </p>
          </div>
          <div className="p-2.5 bg-gray-200 text-gray-700 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 border ${
              filterStatus === "all"
                ? "bg-[#902A8B] text-white border-[#902A8B]"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span>সকল</span>
            <span className="text-[10px] opacity-80">({toBanglaNumber(expenses.length)})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 border ${
              filterStatus === "pending"
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>অপেক্ষমাণ</span>
            <span className="text-[10px] opacity-80">({toBanglaNumber(pendingCount)})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("approved")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 border ${
              filterStatus === "approved"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>অনুমোদিত</span>
            <span className="text-[10px] opacity-80">({toBanglaNumber(approvedCount)})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("rejected")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 border ${
              filterStatus === "rejected"
                ? "bg-red-600 text-white border-red-600"
                : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>বাতিলকৃত</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">খাত নির্বাচন:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none"
          >
            <option value="all">সব খাত</option>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">কোনো খরচের এন্ট্রি পাওয়া যায়নি।</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-xs text-[#902A8B] font-bold hover:underline"
          >
            + নতুন খরচ লিখুন
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <th className="py-2.5 px-3">তারিখ</th>
                <th className="py-2.5 px-3">বিবরণ</th>
                <th className="py-2.5 px-3">খাত</th>
                <th className="py-2.5 px-3">ভাউচার তথ্য</th>
                <th className="py-2.5 px-3">এন্ট্রি প্রদানকারী</th>
                <th className="py-2.5 px-3">স্ট্যাটাস</th>
                <th className="py-2.5 px-3 text-right">পরিমাণ</th>
                {isManager && <th className="py-2.5 px-3 text-center">ইন-চার্জ একশন</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map((exp) => {
                const catMeta = EXPENSE_CATEGORY_LABELS[exp.category];
                const statusMeta = EXPENSE_STATUS_LABELS[exp.status];
                return (
                  <tr key={exp.id} className="hover:bg-purple-50/20 transition group">
                    <td className="py-2.5 px-3 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                      {exp.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-gray-900 block">{exp.title}</span>
                      {exp.notes && (
                        <span className="text-gray-400 text-[11px] block">{exp.notes}</span>
                      )}
                      {exp.status === "rejected" && exp.rejectionReason && (
                        <span className="text-red-500 text-[11px] block font-normal bg-red-50 px-1.5 py-0.5 rounded-sm mt-0.5">
                          বাতিলের কারণ: {exp.rejectionReason}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${catMeta.color}`}
                      >
                        {catMeta.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {exp.voucherNumber ? (
                        <>
                          <span className="text-gray-700 font-medium block">
                            নং: {toBanglaNumber(exp.voucherNumber)}
                          </span>
                          {exp.voucherIssuerName && (
                            <span className="text-gray-400 text-[11px] block">
                              {exp.voucherIssuerName}
                            </span>
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">
                      <span className="block text-gray-700">{exp.createdBy || exp.paidBy || "-"}</span>
                      {exp.status !== "pending" && exp.approvedBy && (
                        <span className="text-gray-400 text-[10px] block">
                          {exp.status === "approved" ? "অনুমোদন:" : "বাতিলকারী:"} {exp.approvedBy}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.color}`}
                      >
                        {exp.status === "approved" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {exp.status === "pending" && <Clock className="w-3 h-3 text-amber-600" />}
                        {exp.status === "rejected" && <XCircle className="w-3 h-3 text-red-600" />}
                        <span>{statusMeta.label}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-anek text-red-600 whitespace-nowrap text-sm">
                      {moneyBn(exp.amount)} ৳
                    </td>

                    {/* ইনচার্জ অ্যাকশন বাটনসমূহ */}
                    {isManager && (
                      <td className="py-2.5 px-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {exp.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => setExpenseToApprove(exp)}
                                title="এপ্রুভ করুন"
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>এপ্রুভ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setExpenseToReject(exp);
                                  setRejectionReason("");
                                }}
                                title="বাতিল করুন"
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <XCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>বাতিল</span>
                              </button>
                            </>
                          )}

                          {exp.status === "rejected" && (
                            <button
                              type="button"
                              onClick={() => setExpenseToApprove(exp)}
                              title="পুনরায় এপ্রুভ করুন"
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-[#902A8B] border border-purple-200 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>পুনরায় এপ্রুভ</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(exp)}
                            title="রেকর্ড মুছে ফেলুন"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-transparent hover:border-red-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* ১. কাস্টম এপ্রুভ মডাল (Custom In-App Approval Dialog) */}
      {/* ========================================================= */}
      {expenseToApprove && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm font-anek">ব্যয় এন্ট্রি অনুমোদন (Approve Expense)</h3>
              </div>
              <button
                onClick={() => setExpenseToApprove(null)}
                className="p-1 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-kalpurush">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">খরচের বিবরণ</span>
                    <h4 className="font-bold text-sm text-gray-900 mt-0.5">{expenseToApprove.title}</h4>
                  </div>
                  <span className="font-bold font-anek text-base text-red-600 bg-white px-2 py-0.5 rounded-lg border border-red-200">
                    {moneyBn(expenseToApprove.amount)} ৳
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-[11px] text-gray-600">
                  <div>
                    <span className="text-gray-400 block">খাত:</span>
                    <span className="font-semibold text-gray-800">
                      {EXPENSE_CATEGORY_LABELS[expenseToApprove.category].label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">ভাউচার নং:</span>
                    <span className="font-semibold text-gray-800">
                      {expenseToApprove.voucherNumber || "প্রযোজ্য নয়"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">প্রতিষ্ঠান:</span>
                    <span className="font-semibold text-gray-800">
                      {expenseToApprove.voucherIssuerName || "প্রযোজ্য নয়"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">এন্ট্রি করেছেন:</span>
                    <span className="font-semibold text-gray-800">
                      {expenseToApprove.createdBy || "স্টাফ"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p className="text-[11px] leading-relaxed">
                  এন্ট্রিটি এপ্রুভ করলে এটি অবিলম্বে অনুমোদিত পরিচালন ব্যয় হিসেবে নথিভুক্ত হবে এবং সার্বিক ড্যাশবোর্ড ও আর্থিক লেজারে নিট-মুনাফা থেকে বাদ যাবে।
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseToApprove(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  ফিরে যান
                </button>
                <button
                  type="button"
                  onClick={confirmApprove}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>হ্যাঁ, এপ্রুভ করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ২. কাস্টম রিজেক্ট মডাল (Custom In-App Rejection Dialog) */}
      {/* ========================================================= */}
      {expenseToReject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm font-anek">খরচ বাতিলকরণ (Reject Expense)</h3>
              </div>
              <button
                onClick={() => {
                  setExpenseToReject(null);
                  setRejectionReason("");
                }}
                className="p-1 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-kalpurush">
              <p className="text-gray-700">
                আপনি কি নিশ্চিতভাবে <strong className="text-gray-900">"{expenseToReject.title}"</strong> (৳{moneyBn(expenseToReject.amount)}) এন্ট্রিটি বাতিল করতে চান?
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  বাতিলের কারণ (ঐচ্ছিক / মন্তব্য):
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="যেমন: ভাউচার কপি অস্পষ্ট / সঠিক তথ্য পাওয়া যায়নি"
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white text-xs"
                />
              </div>

              {/* কুইক প্রিসেট কারণসমূহ */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-semibold block">কুইক সিলেক্ট কারণ:</span>
                <div className="flex flex-wrap gap-1">
                  {PRESET_REJECTION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-amber-50 hover:text-amber-800 text-gray-600 rounded-lg transition border border-gray-200 cursor-pointer"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setExpenseToReject(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  ফিরে যান
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>বাতিল নিশ্চিত করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ৩. কাস্টম ডিলিট মডাল (Custom In-App Delete Dialog) */}
      {/* ========================================================= */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm font-anek">রেকর্ড স্থায়ীভাবে মুছে ফেলা</h3>
              </div>
              <button
                onClick={() => setExpenseToDelete(null)}
                className="p-1 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-kalpurush">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-800">
                <p className="font-semibold text-xs mb-1">সতর্কতা: এই পদক্ষেপটি পরিবর্তনযোগ্য নয়!</p>
                <p className="text-[11px] text-red-700">
                  আপনি কি নিশ্চিতভাবে <strong className="font-bold">"{expenseToDelete.title}"</strong> (৳{moneyBn(expenseToDelete.amount)}) খরচের এন্ট্রিটি ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলতে চান?
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  না, বাতিল
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>মুছে ফেলুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
