import React, { useState } from "react";
import {
  Plus,
  Receipt,
  Trash2,
  Calendar,
  Wallet,
  Tag,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  LogIn,
  FileBadge2,
} from "lucide-react";
import {
  useExpenses,
  addExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  ExpenseCategory,
  ExpenseRecord,
  ExpenseStatus,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
} from "../../utils/expenseStore";
import { toBanglaNumber, moneyBn } from "../InvoicePrint";
import { useAuth, canManageSettings } from "../../utils/authStore";
import { LoginModal } from "../auth/LoginModal";

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

    addExpense({
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
  };

  const handleDelete = (id: string, expTitle: string) => {
    if (confirm(`আপনি কি "${expTitle}" খরচের রেকর্ডটি মুছে ফেলতে চান?`)) {
      deleteExpense(id);
    }
  };

  const handleApprove = (id: string, expTitle: string) => {
    if (confirm(`"${expTitle}" এন্ট্রিটি এপ্রুভ করবেন? এপ্রুভ হলে এটি আয়-ব্যয় লেজার ও নিট-মুনাফায় গণনা হবে।`)) {
      approveExpense(id, actorName);
    }
  };

  const handleReject = (id: string, expTitle: string) => {
    const reason = window.prompt(`"${expTitle}" এন্ট্রিটি বাতিল করার কারণ লিখুন (ঐচ্ছিক):`, "");
    if (reason === null) return; // ব্যবহারকারী বাতিল করেছেন prompt
    rejectExpense(id, actorName, reason.trim() || undefined);
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

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-6 font-kalpurush">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold font-anek text-[#902A8B] flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            দৈনন্দিন খরচ ও ব্যয় ব্যবস্থাপনা (Expense Tracker)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isManager
              ? "স্টাফদের জমাকৃত ব্যয় এন্ট্রি যাচাই করে এপ্রুভ/বাতিল করুন। শুধু এপ্রুভড এন্ট্রিই নিট-মুনাফায় গণনা হয়।"
              : "ভাউচারসহ ব্যয়ের এন্ট্রি জমা দিন। ইন-চার্জ যাচাই করে এপ্রুভ দিলে তবেই এটি হিসাবে যুক্ত হবে।"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
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
                প্রদানকারী / কর্মী
              </label>
              <input
                type="text"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                placeholder="যেমন: ক্যাশ / ইন-চার্জ"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                মন্তব্য (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="অতিরিক্ত তথ্য"
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
                placeholder="যেমন: ৪১২"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                ভাউচার ইস্যুকারী প্রতিষ্ঠানের নাম <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={voucherIssuerName}
                onChange={(e) => setVoucherIssuerName(e.target.value)}
                placeholder="যেমন: মেসার্স স্টেশনারি কর্নার"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>
          </div>

          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-blue-700 text-[11px]">
            <FileBadge2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              এই এন্ট্রি জমা দেওয়ার পর <strong>"অপেক্ষমাণ"</strong> অবস্থায় থাকবে। কেন্দ্রের ইন-চার্জ/অ্যাডমিন যাচাই করে এপ্রুভ দিলে তবেই এটি হিসাবে যুক্ত হবে।
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-purple-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-bold text-white bg-[#902A8B] hover:bg-[#7b2276] rounded-lg transition cursor-pointer shadow-xs"
            >
              খরচ জমা দিন
            </button>
          </div>
        </form>
      )}

      {/* Filter and Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="w-4 h-4 text-gray-500" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1 bg-white outline-none focus:ring-1 focus:ring-[#902A8B]"
          >
            <option value="all">সকল খাতের খরচ</option>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, meta]) => (
              <option key={k} value={k}>
                {meta.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1 bg-white outline-none focus:ring-1 focus:ring-[#902A8B]"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            {Object.entries(EXPENSE_STATUS_LABELS).map(([k, meta]) => (
              <option key={k} value={k}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        {/* টোটাল আর্থিক অংক শুধু ইন-চার্জ/অ্যাডমিন দেখবেন */}
        {isManager && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-gray-600 font-medium">এপ্রুভড খাতে মোট ব্যয়:</span>
            <span className="text-sm font-bold font-anek text-red-600 bg-red-50 border border-red-200 px-3 py-0.5 rounded-lg">
              {moneyBn(approvedTotal)} ৳
            </span>
          </div>
        )}
      </div>

      {/* Expense List Table */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-xs">কোনো ব্যয়ের রেকর্ড পাওয়া যায়নি।</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-y border-gray-200 text-gray-600 font-bold font-anek">
              <tr>
                <th className="py-2.5 px-3">তারিখ</th>
                <th className="py-2.5 px-3">খরচের বিবরণ</th>
                <th className="py-2.5 px-3">খাত</th>
                <th className="py-2.5 px-3">ভাউচার</th>
                <th className="py-2.5 px-3">এন্ট্রিকারী</th>
                <th className="py-2.5 px-3">স্ট্যাটাস</th>
                <th className="py-2.5 px-3 text-right">পরিমাণ (৳)</th>
                {isManager && <th className="py-2.5 px-3 text-center">অ্যাকশন</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map((exp: ExpenseRecord) => {
                const catMeta =
                  EXPENSE_CATEGORY_LABELS[exp.category] ||
                  EXPENSE_CATEGORY_LABELS.other;
                const statusMeta =
                  EXPENSE_STATUS_LABELS[(exp.status as ExpenseStatus) || "approved"];

                return (
                  <tr key={exp.id} className="hover:bg-gray-50/50 align-top">
                    <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {toBanglaNumber(exp.date)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">
                      {exp.title}
                      {exp.notes && (
                        <span className="text-gray-400 text-[11px] block font-normal">
                          {exp.notes}
                        </span>
                      )}
                      {exp.status === "rejected" && exp.rejectionReason && (
                        <span className="text-red-500 text-[11px] block font-normal">
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
                      {exp.createdBy || exp.paidBy || "-"}
                      {exp.status !== "pending" && exp.approvedBy && (
                        <span className="text-gray-400 text-[11px] block">
                          {exp.status === "approved" ? "এপ্রুভ:" : "বাতিল:"} {exp.approvedBy}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.color}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-anek text-red-600 whitespace-nowrap">
                      {moneyBn(exp.amount)} ৳
                    </td>
                    {isManager && (
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          {exp.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(exp.id, exp.title)}
                                title="এপ্রুভ করুন"
                                className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(exp.id, exp.title)}
                                title="বাতিল করুন"
                                className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(exp.id, exp.title)}
                            title="মুছে ফেলুন"
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
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
    </div>
  );
};
