import React, { useState, useMemo } from "react";
import {
  FileText,
  DollarSign,
  Landmark,
  TrendingUp,
  Clock,
  Eye,
  Plus,
  Layers,
  Wallet,
  Coins,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Sparkles,
  Receipt,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useInvoices, InvoiceRecord, getInvoiceRealizedCenterFee } from "../utils/invoiceStore";
import { useExpenses, getApprovedExpenses } from "../utils/expenseStore";
import { toBanglaNumber, moneyBn, InvoicePrint } from "./InvoicePrint";
import { getPaymentMethodBadge } from "../utils/paymentMethods";
import { useInstitutionSettings, toInvoiceSettings } from "../utils/institutionSettings";
import { useAuth, canManageSettings, getRoleLabel } from "../utils/authStore";
import { getLocalDateString } from "../utils/dateUtils";

const PIE_COLORS = ["#902A8B", "#37A448", "#A855F7", "#10B981", "#EC4899", "#3B82F6", "#F59E0B"];

interface DashboardProps {
  onNavigateToForm: () => void;
  onNavigateToLedger?: () => void;
  onNavigateToSettings?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToForm,
  onNavigateToLedger,
  onNavigateToSettings,
}) => {
  const { invoices } = useInvoices();
  const { expenses } = useExpenses();
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role === "staff";
  const canSeeFinancials = canManageSettings(currentUser); // admin বা branch_incharge
  const { settings: _instSettings } = useInstitutionSettings();
  const settings = toInvoiceSettings(_instSettings);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [timeFilter, setTimeFilter] = useState<"today" | "7days" | "30days">("7days");
  const [backupDismissed, setBackupDismissed] = useState(false);

  const activeInvoices = useMemo(() => {
    return invoices.filter((i) => i.status !== "VOIDED");
  }, [invoices]);

  // E-4: 7-day Backup Alert Detection
  const backupNotice = useMemo(() => {
    try {
      const lastStr = localStorage.getItem("lsfc_backup_last_date");
      if (!lastStr) {
        return { isOverdue: true, text: "এখনো কোনো ডেটা ব্যাকআপ নেওয়া হয়নি।" };
      }
      const lastTime = new Date(lastStr).getTime();
      if (isNaN(lastTime)) {
        return { isOverdue: true, text: "ব্যাকআপের তারিখ যাচাই করা যায়নি।" };
      }
      const daysSince = Math.floor((Date.now() - lastTime) / (1000 * 60 * 60 * 24));
      if (daysSince >= 7) {
        return {
          isOverdue: true,
          text: `গত ${toBanglaNumber(daysSince)} দিন ধরে কোনো ব্যাকআপ সংরক্ষণ করা হয়নি।`,
        };
      }
      return { isOverdue: false, text: "" };
    } catch {
      return { isOverdue: false, text: "" };
    }
  }, []);

  // A-3: Dynamic active services count from settings
  const activeServicesCount = (_instSettings.services || []).filter((s) => s.isActive !== false).length;

  // E-2: Today's Summary calculations (Local date based)
  const todayStr = getLocalDateString(new Date());
  const todayInvoices = useMemo(() => {
    return activeInvoices.filter((inv) => getLocalDateString(inv.createdAt) === todayStr);
  }, [activeInvoices, todayStr]);

  const todayInvoiceCount = todayInvoices.length;
  const todayRevenue = todayInvoices.reduce(
    (sum, i) => sum + (i.paidAmount !== undefined ? i.paidAmount : i.total),
    0
  );

  // E-3: Total due and top due invoices
  const totalDuesAcrossAll = useMemo(() => {
    return activeInvoices.reduce((sum, inv) => {
      const due =
        inv.dueAmount !== undefined
          ? inv.dueAmount
          : Math.max(0, inv.total - (inv.paidAmount ?? inv.total));
      return sum + due;
    }, 0);
  }, [activeInvoices]);

  const topDueInvoices = useMemo(() => {
    return activeInvoices
      .map((inv) => {
        const calculatedDue =
          inv.dueAmount !== undefined
            ? inv.dueAmount
            : Math.max(0, inv.total - (inv.paidAmount ?? inv.total));
        return { ...inv, calculatedDue };
      })
      .filter((inv) => inv.calculatedDue > 0)
      .sort((a, b) => b.calculatedDue - a.calculatedDue)
      .slice(0, 5);
  }, [activeInvoices]);

  // Overall Totals
  const totalInvoicesCount = activeInvoices.length;
  const totalRevenue = activeInvoices.reduce(
    (sum, i) => sum + (i.paidAmount !== undefined ? i.paidAmount : i.total),
    0
  );
  const totalGovt = activeInvoices.reduce(
    (sum, i) =>
      sum +
      i.lines.reduce((lsum, l) => lsum + l.govtFee + (l.gatewayFee || 0) + (l.postalFee || 0), 0),
    0
  );
  const totalCenter = activeInvoices.reduce(
    (sum, i) => sum + getInvoiceRealizedCenterFee(i),
    0
  );

  // Financial Metrics
  const approvedExpenses = getApprovedExpenses(expenses);
  const totalExpense = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalCenter - totalExpense;

  // A-1: Time comparison logic
  const now = Date.now();
  const dayMs = 86400000;
  let currentStart = now - 7 * dayMs;
  let previousStart = now - 14 * dayMs;
  let previousEnd = currentStart;

  if (timeFilter === "today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    currentStart = today.getTime();
    previousEnd = currentStart;
    previousStart = currentStart - dayMs;
  } else if (timeFilter === "30days") {
    currentStart = now - 30 * dayMs;
    previousEnd = currentStart;
    previousStart = now - 60 * dayMs;
  }

  const currentPeriodInvoices = activeInvoices.filter((inv) => {
    const t = new Date(inv.createdAt).getTime();
    return t >= currentStart && t <= now;
  });

  const previousPeriodInvoices = activeInvoices.filter((inv) => {
    const t = new Date(inv.createdAt).getTime();
    return t >= previousStart && t < previousEnd;
  });

  const curInvCount = currentPeriodInvoices.length;
  const prevInvCount = previousPeriodInvoices.length;
  const curRevenue = currentPeriodInvoices.reduce(
    (sum, i) => sum + (i.paidAmount !== undefined ? i.paidAmount : i.total),
    0
  );
  const prevRevenue = previousPeriodInvoices.reduce(
    (sum, i) => sum + (i.paidAmount !== undefined ? i.paidAmount : i.total),
    0
  );
  const curCenter = currentPeriodInvoices.reduce(
    (sum, i) => sum + getInvoiceRealizedCenterFee(i),
    0
  );
  const prevCenter = previousPeriodInvoices.reduce(
    (sum, i) => sum + getInvoiceRealizedCenterFee(i),
    0
  );

  const getPercentageChange = (curr: number, prev: number): number | null => {
    if (prev <= 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const invoiceCountDiff = getPercentageChange(curInvCount, prevInvCount);
  const revenueDiff = getPercentageChange(curRevenue, prevRevenue);
  const centerDiff = getPercentageChange(curCenter, prevCenter);

  // Group by service for Donut chart (G-8)
  const serviceStats: Record<string, number> = {};
  for (const inv of activeInvoices) {
    for (const line of inv.lines) {
      serviceStats[line.serviceName] = (serviceStats[line.serviceName] || 0) + 1;
    }
  }

  const totalServiceLines = Object.values(serviceStats).reduce((a, b) => a + b, 0);
  const chartData = Object.entries(serviceStats).map(([name, count]) => ({
    name,
    count,
    percentage: totalServiceLines > 0 ? Math.round((count / totalServiceLines) * 100) : 0,
  }));

  // Daily revenue trend filtered by timeFilter
  const chartFilteredInvoices = activeInvoices.filter((inv) => {
    const t = new Date(inv.createdAt).getTime();
    return t >= currentStart;
  });

  const dailyStats: Record<string, { total: number; govt: number; timestamp: number; label: string }> = {};
  for (const inv of chartFilteredInvoices) {
    const dObj = new Date(inv.createdAt);
    const dateKey = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(dObj.getDate()).padStart(2, "0")}`;
    const dLabel = dObj.toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
    const govtPortion = inv.lines.reduce((g, l) => g + l.govtFee, 0);
    const collected = inv.paidAmount !== undefined ? inv.paidAmount : inv.total;

    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { total: 0, govt: 0, timestamp: dObj.getTime(), label: dLabel };
    }
    dailyStats[dateKey].total += collected;
    dailyStats[dateKey].govt += govtPortion;
  }

  const dailyChartData = Object.entries(dailyStats)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([, data]) => ({
      date: data.label,
      amount: Math.round(data.total),
      govt: Math.round(data.govt),
    }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* E-4: 7-day Backup Warning Banner (only if overdue and not dismissed) */}
      {backupNotice.isOverdue && !backupDismissed && canSeeFinancials && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-amber-900 dark:text-amber-200 text-sm font-anek">
                জরুরি ডেটা ব্যাকআপ সতর্কতা
              </h5>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5 font-kalpurush">
                {backupNotice.text} অপ্রত্যাশিত ডেটা ক্ষতি রোধে এখনই একটি ব্যাকআপ ফাইল সংরক্ষণ করুন।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {onNavigateToSettings && (
              <button
                type="button"
                onClick={onNavigateToSettings}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold font-anek flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                ব্যাকআপ নিন <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setBackupDismissed(true)}
              aria-label="বিজ্ঞপ্তি লুকান"
              className="p-1.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 rounded-lg hover:bg-amber-100/60 dark:hover:bg-amber-900/50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Action Header Bar (E-1: Primary action button with shortcut badge) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#902A8B] to-[#6d1f6a] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-anek text-slate-900 dark:text-white leading-tight">
                {isStaff ? "কাউন্টার ডেস্ক কার্যক্রম" : "ভূমিসেবা সহায়তা কেন্দ্র ড্যাশবোর্ড"}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#902A8B] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {getRoleLabel(currentUser?.role || "staff")}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-kalpurush mt-0.5">
              {settings.orgNameBn} • লাইসেন্স নং: {toBanglaNumber(settings.licenseNo)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onNavigateToForm}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-[#37A448] to-[#2d873a] hover:from-[#2e8b3c] hover:to-[#247030] text-white rounded-xl text-xs sm:text-sm font-bold font-anek flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow transition transform active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>নতুন আবেদন ও ইনভয়েস</span>
            <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 bg-black/20 text-white rounded font-mono font-bold ml-1">
              Ctrl+N
            </kbd>
          </button>
        </div>
      </div>

      {/* E-2: Row 1 = "আজকের সারাংশ" (Today's Summary - Visible to both Staff & In-Charge) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: আজকের ইনভয়েস */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-kalpurush flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#902A8B]" /> আজকের ইস্যুকৃত ইনভয়েস
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-anek text-slate-900 dark:text-white mt-1">
              {toBanglaNumber(todayInvoiceCount)} টি
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-kalpurush">
              আজকের দিনব্যাপী মোট চালানের সংখ্যা
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#902A8B] dark:text-purple-300 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: আজকের নগদ আদায় */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-kalpurush flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-[#37A448]" /> আজকের সংগৃহীত আদায়
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-anek text-[#37A448] mt-1">
              {moneyBn(todayRevenue)} ৳
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-kalpurush">
              আজ সরাসরি ক্যাশ/ডিজিটাল প্রাপ্তি
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#37A448] dark:text-emerald-300 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: মোট বকেয়া (Outstanding Dues) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-kalpurush flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> মোট অনাদায়ী বকেয়া
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-anek text-rose-600 dark:text-rose-400 mt-1">
              {moneyBn(totalDuesAcrossAll)} ৳
            </h3>
            {onNavigateToLedger ? (
              <button
                type="button"
                onClick={onNavigateToLedger}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-0.5 mt-0.5 cursor-pointer"
              >
                লেজারে বিস্তারিত দেখুন →
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-kalpurush">
                সকল চালানের মোট অপরিশোধিত অর্থ
              </span>
            )}
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Empty State Banner (E-5) */}
      {totalInvoicesCount === 0 && (
        <div className="bg-gradient-to-r from-purple-50/70 via-white to-emerald-50/60 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-8 border-2 border-dashed border-purple-200 dark:border-slate-700 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-purple-100 dark:bg-purple-900/50 text-[#902A8B] dark:text-purple-300 flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-anek text-slate-900 dark:text-white">
              এখনো কোনো ভূমিসেবা আবেদন নথিভুক্ত করা হয়নি
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 font-kalpurush">
              নাগরিককে ভূমিসেবা প্রদান করতে এবং ডিজিটাল চালান রসিদ তৈরি করতে নিচের বোতামে ক্লিক করে প্রথম আবেদনপত্র তৈরি করুন।
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToForm}
            className="px-5 py-2.5 bg-[#37A448] hover:bg-[#2e8b3c] text-white rounded-xl text-xs sm:text-sm font-bold font-anek inline-flex items-center gap-2 cursor-pointer shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> প্রথম ইনভয়েস তৈরি করুন (Ctrl+N)
          </button>
        </div>
      )}

      {/* B-3: In-Charge & Admin Full Financial & Analytics View */}
      {canSeeFinancials && (
        <>
          {/* Top Grid: Left Spotlight Center Card + Right KPI & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Spotlight Center Card */}
            <div className="lg:col-span-4 bg-gradient-to-b from-purple-50/40 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-3xl p-6 border-2 border-purple-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold font-anek text-slate-900 dark:text-white leading-tight">
                  ভূমিসেবা সহায়তা কেন্দ্র
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 font-kalpurush">
                  {settings.orgNameBn} ({settings.partnerOrg})
                </p>

                <div className="mt-3.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#37A448] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold shadow-2xs font-anek">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#37A448]" />
                    লাইসেন্স নং: {toBanglaNumber(settings.licenseNo)}
                  </span>
                </div>

                <div className="mt-6 space-y-3 text-xs border-t border-slate-100 dark:border-slate-800 pt-4 font-kalpurush">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">সরকারি ফি আদায়:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{moneyBn(totalGovt)} ৳</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">কেন্দ্র সেবা ফি আদায়:</span>
                    <span className="font-bold text-[#902A8B] dark:text-purple-400">{moneyBn(totalCenter)} ৳</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">সহায়তাপ্রাপ্ত সেবা:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {toBanglaNumber(activeServicesCount)}টি সক্রিয় সেবা
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onNavigateToForm}
                  className="w-full py-2.5 bg-[#37A448] hover:bg-[#2e8b3c] text-white rounded-xl text-xs font-bold font-anek flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
                >
                  <Plus className="w-4 h-4" /> নতুন ভূমিসেবা আবেদন
                </button>
              </div>
            </div>

            {/* Right Column: 3 KPI Cards + 2 Charts */}
            <div className="lg:col-span-8 flex flex-col gap-5 justify-between">
              {/* 3 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Card 1: ইস্যুকৃত ইনভয়েস */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-[#f8eff8] dark:bg-purple-950/60 text-[#902A8B] dark:text-purple-300 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    {invoiceCountDiff !== null && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          invoiceCountDiff >= 0
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                        }`}
                        title={`পূর্ববর্তী সমান সময়ের তুলনায় (${timeFilter === "today" ? "গতকাল" : timeFilter === "7days" ? "পূর্ববর্তী ৭ দিন" : "পূর্ববর্তী ৩০ দিন"})`}
                      >
                        {invoiceCountDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {invoiceCountDiff > 0 ? "+" : ""}
                        {toBanglaNumber(invoiceCountDiff)}%
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-kalpurush">
                      মোট ইস্যুকৃত ইনভয়েস
                    </span>
                    <h3 className="text-xl font-bold font-anek text-slate-900 dark:text-white mt-0.5">
                      {toBanglaNumber(totalInvoicesCount)} টি
                    </h3>
                  </div>
                </div>

                {/* Card 2: মোট ভূমি মালিক আদায় */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-[#eef2ff] dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    {revenueDiff !== null && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          revenueDiff >= 0
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                        }`}
                        title={`পূর্ববর্তী সমান সময়ের তুলনায় (${timeFilter === "today" ? "গতকাল" : timeFilter === "7days" ? "পূর্ববর্তী ৭ দিন" : "পূর্ববর্তী ৩০ দিন"})`}
                      >
                        {revenueDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {revenueDiff > 0 ? "+" : ""}
                        {toBanglaNumber(revenueDiff)}%
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-kalpurush">
                      মোট ভূমি মালিক আদায়
                    </span>
                    <h3 className="text-xl font-bold font-anek text-[#902A8B] dark:text-purple-400 mt-0.5">
                      {moneyBn(totalRevenue)} ৳
                    </h3>
                  </div>
                </div>

                {/* Card 3: কেন্দ্রের মোট ফি (আয়) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-[#ecfdf5] dark:bg-emerald-950/60 text-[#37A448] dark:text-emerald-300 flex items-center justify-center">
                      <Landmark className="w-4 h-4" />
                    </div>
                    {centerDiff !== null && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          centerDiff >= 0
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                        }`}
                        title={`পূর্ববর্তী সমান সময়ের তুলনায় (${timeFilter === "today" ? "গতকাল" : timeFilter === "7days" ? "পূর্ববর্তী ৭ দিন" : "পূর্ববর্তী ৩০ দিন"})`}
                      >
                        {centerDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {centerDiff > 0 ? "+" : ""}
                        {toBanglaNumber(centerDiff)}%
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-kalpurush">
                      কেন্দ্রের মোট ফি (আয়)
                    </span>
                    <h3 className="text-xl font-bold font-anek text-[#37A448] mt-0.5">
                      {moneyBn(totalCenter)} ৳
                    </h3>
                  </div>
                </div>
              </div>

              {/* Row 2: Bar Chart + Donut Chart */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
                {/* Bar Chart (md:col-span-7) */}
                <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 font-anek text-xs flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#902A8B]" /> দৈনিক আদায় ট্রেন্ড (টাকা)
                    </h4>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setTimeFilter("today")}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          timeFilter === "today"
                            ? "bg-white dark:bg-slate-700 text-[#902A8B] dark:text-purple-300 shadow-2xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        আজ
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeFilter("7days")}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          timeFilter === "7days"
                            ? "bg-white dark:bg-slate-700 text-[#902A8B] dark:text-purple-300 shadow-2xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        ৭ দিন
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeFilter("30days")}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          timeFilter === "30days"
                            ? "bg-white dark:bg-slate-700 text-[#902A8B] dark:text-purple-300 shadow-2xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        ৩০ দিন
                      </button>
                    </div>
                  </div>
                  {dailyChartData.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <TrendingUp className="w-7 h-7 text-slate-300 dark:text-slate-600 mb-1.5 stroke-1" />
                      <p className="font-medium text-slate-500 dark:text-slate-400">নির্বাচিত সময়ে কোনো লেনদেন নেই</p>
                      <span className="text-[10px] text-slate-400 mt-0.5">ইনভয়েস পরিশোধ হলে দৈনিক চার্ট দৃশ্যমান হবে</span>
                    </div>
                  ) : (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(val: any, name: any) => [
                              moneyBn(val) + " ৳",
                              name === "amount" ? "মোট আদায়" : "সরকারি ফি",
                            ]}
                          />
                          <Bar dataKey="amount" fill="#902A8B" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="govt" fill="#37A448" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Donut Chart with clean legends (md:col-span-5) (G-8) */}
                <div className="md:col-span-5 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 font-anek text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#37A448]" /> সেবা বণ্টন ও অনুপাত
                    </h4>
                  </div>
                  {chartData.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <Layers className="w-7 h-7 text-slate-300 dark:text-slate-600 mb-1.5 stroke-1" />
                      <p className="font-medium text-slate-500 dark:text-slate-400">এখনো কোনো আবেদন নেই</p>
                      <span className="text-[10px] text-slate-400 mt-0.5">নতুন সেবা আবেদন তৈরি হলে এখানে বণ্টন দেখাবে</span>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-between gap-2">
                      <div className="w-1/2 h-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={36}
                              outerRadius={56}
                              paddingAngle={3}
                            >
                              {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              formatter={(val: any, name: any) => [
                                toBanglaNumber(val) + " টি আবেদন",
                                name,
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Clean Legend list (G-8) */}
                      <div className="w-1/2 max-h-40 overflow-y-auto space-y-1.5 pr-1 text-[11px] font-kalpurush">
                        {chartData.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between gap-1 leading-tight">
                            <span className="flex items-center gap-1.5 truncate text-slate-600 dark:text-slate-300">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                              />
                              <span className="truncate">{item.name}</span>
                            </span>
                            <span className="font-bold font-anek text-slate-800 dark:text-slate-100 shrink-0">
                              {toBanglaNumber(item.percentage)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financials Row: Operating Expenses & Net Center Profit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-kalpurush">
                  মোট পরিচালন ব্যয় (অনুমোদিত)
                </span>
                <h3 className="text-xl font-bold font-anek text-rose-600 dark:text-rose-400 mt-0.5">
                  {moneyBn(totalExpense)} ৳
                </h3>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-kalpurush">
                  কেন্দ্রের সর্বমোট নিট মুনাফা
                </span>
                <h3 className={`text-xl font-bold font-anek mt-0.5 ${netProfit >= 0 ? "text-[#37A448]" : "text-rose-600"}`}>
                  {moneyBn(netProfit)} ৳
                </h3>
              </div>
              <div
                className={`p-3 rounded-2xl ${
                  netProfit >= 0
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-[#37A448]"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-600"
                }`}
              >
                <Coins className="w-5 h-5" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Two-Column Lower Section: Top Due List (E-3) + Recent Invoices Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (lg:col-span-5): Top Due Customers Widget (E-3) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900 dark:text-white font-anek text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> শীর্ষ বকেয়া তালিকা
            </h4>
            {onNavigateToLedger && (
              <button
                type="button"
                onClick={onNavigateToLedger}
                className="text-xs font-bold text-[#902A8B] dark:text-purple-400 hover:underline cursor-pointer"
              >
                সব দেখুন →
              </button>
            )}
          </div>

          {topDueInvoices.length === 0 ? (
            <div className="py-8 text-center space-y-2 border border-dashed border-emerald-200 dark:border-emerald-800/60 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/20">
              <CheckCircle2 className="w-8 h-8 text-[#37A448] mx-auto" />
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 font-anek">
                কোনো অনাদায়ী বকেয়া নেই!
              </p>
              <p className="text-[10px] text-slate-400 font-kalpurush">
                সকল সেবাগ্রহীতার চালান সম্পূর্ণ পরিশোধিত।
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topDueInvoices.map((inv) => (
                <div
                  key={inv.invoiceNo}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate font-kalpurush">
                        {inv.customer.fullName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        #{toBanglaNumber(inv.invoiceNo)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-kalpurush">
                      মোবাইল: {toBanglaNumber(inv.customer.mobile)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-anek">
                        {moneyBn(inv.calculatedDue)} ৳ বাকি
                      </span>
                    </div>
                    {onNavigateToLedger && (
                      <button
                        type="button"
                        onClick={onNavigateToLedger}
                        className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-[#FAF0F9] text-[#902A8B] dark:text-purple-300 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-bold font-anek cursor-pointer transition"
                      >
                        আদায়
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (lg:col-span-7): Recent Invoices Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900 dark:text-white font-anek text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#902A8B]" /> সাম্প্রতিক ইনভয়েস ও রসিদ
            </h4>
            <span className="text-xs text-slate-400 font-kalpurush">সর্বশেষ ৫টি</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-kalpurush">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200/70 dark:border-slate-700 font-anek">
                  <th scope="col" className="p-2.5 rounded-l-xl">ইনভয়েস নং</th>
                  <th scope="col" className="p-2.5">ভূমি মালিক</th>
                  <th scope="col" className="p-2.5">তারিখ</th>
                  <th scope="col" className="p-2.5 text-right">মোট টাকা</th>
                  <th scope="col" className="p-2.5 text-center">মাধ্যম</th>
                  <th scope="col" className="p-2.5 text-center rounded-r-xl">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeInvoices.slice(0, 5).map((inv) => (
                  <tr key={inv.invoiceNo} className="hover:bg-purple-50/20 dark:hover:bg-slate-800/50 transition">
                    <td className="p-2.5 font-bold text-[#902A8B] dark:text-purple-400 font-mono">
                      #{toBanglaNumber(inv.invoiceNo)}
                    </td>
                    <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {inv.customer.fullName}
                    </td>
                    <td className="p-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="p-2.5 text-right font-bold text-[#37A448] whitespace-nowrap font-anek">
                      {moneyBn(inv.total)} ৳
                    </td>
                    <td className="p-2.5 text-center">
                      {(() => {
                        const badge = getPaymentMethodBadge(inv.paymentMethod);
                        return (
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border font-anek ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        aria-label={`ইনভয়েস #${toBanglaNumber(inv.invoiceNo)} রসিদ দেখুন`}
                        className="px-2.5 py-1 bg-[#FAF0F9] dark:bg-purple-950/60 text-[#902A8B] dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer border border-purple-200/60 dark:border-purple-800 font-anek"
                      >
                        <Eye className="w-3 h-3" /> রসিদ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Modal Preview */}
      {selectedInvoice && (
        <InvoicePrint
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          settings={settings}
        />
      )}
    </div>
  );
};
