import { useState } from "react";
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
import { useInstitutionSettings, toInvoiceSettings } from "../utils/institutionSettings";
import { useAuth, canManageSettings } from "../utils/authStore";

const PIE_COLORS = ["#902A8B", "#37A448", "#A855F7", "#10B981", "#EC4899", "#3B82F6"];

export const Dashboard: React.FC<{ onNavigateToForm: () => void }> = ({ onNavigateToForm }) => {
  const { invoices } = useInvoices();
  const { expenses } = useExpenses();
  const { currentUser } = useAuth();
  const canSeeFinancials = canManageSettings(currentUser); // admin বা branch_incharge — staff নয়
  const { settings: _instSettings } = useInstitutionSettings();
  const settings = toInvoiceSettings(_instSettings);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const activeInvoices = invoices.filter((i) => i.status !== "VOIDED");

  const totalInvoicesCount = activeInvoices.length;
  // "মোট ভূমি মালিক আদায়" মানে যা প্রকৃতপক্ষে আদায় হয়েছে
  const totalRevenue = activeInvoices.reduce(
    (sum, i) => sum + (i.paidAmount !== undefined ? i.paidAmount : i.total),
    0
  );
  const totalGovt = activeInvoices.reduce(
    (sum, i) => sum + i.lines.reduce((lsum, l) => lsum + l.govtFee + (l.gatewayFee || 0) + (l.postalFee || 0), 0),
    0
  );
  const totalCenter = activeInvoices.reduce(
    (sum, i) => sum + getInvoiceRealizedCenterFee(i),
    0
  );

  // Total operating expenses & Net Profit
  const approvedExpenses = getApprovedExpenses(expenses);
  const totalExpense = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalCenter - totalExpense;

  // Group by service for chart
  const serviceStats: Record<string, number> = {};
  for (const inv of activeInvoices) {
    for (const line of inv.lines) {
      serviceStats[line.serviceName] = (serviceStats[line.serviceName] || 0) + 1;
    }
  }

  const chartData = Object.entries(serviceStats).map(([name, count]) => ({
    name,
    count,
  }));

  // Daily revenue trend (last 7 recorded dates)
  const dailyStats: Record<string, { total: number; govt: number }> = {};
  for (const inv of activeInvoices) {
    const d = new Date(inv.createdAt).toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
    const govtPortion = inv.lines.reduce((g, l) => g + l.govtFee, 0);
    if (!dailyStats[d]) {
      dailyStats[d] = { total: 0, govt: 0 };
    }
    dailyStats[d].total += inv.total;
    dailyStats[d].govt += govtPortion;
  }
  const dailyChartData = Object.entries(dailyStats).map(([date, data]) => ({
    date,
    amount: Math.round(data.total),
    govt: Math.round(data.govt),
  }));

  return (
    <div className="space-y-6">
      {/* Top Grid: Left Spotlight Center Card + Right KPI & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Spotlight Center Card (Matching reference UI) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-purple-50/40 via-white to-emerald-50/30 rounded-3xl p-6 border-2 border-purple-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold font-anek text-slate-900 leading-tight">
              ভূমিসেবা সহায়তা কেন্দ্র
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {settings.orgNameBn} ({settings.partnerOrg})
            </p>

            <div className="mt-3.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#37A448] border border-emerald-200 text-xs font-bold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#37A448]" />
                লাইসেন্স নং: {toBanglaNumber(settings.licenseNo)}
              </span>
            </div>

            <div className="mt-6 space-y-3 text-xs border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">সরকারি ফি আদায়:</span>
                <span className="font-bold text-blue-600">{moneyBn(totalGovt)} ৳</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">সহায়তাপ্রাপ্ত সেবা:</span>
                <span className="font-bold text-slate-800">১০+ প্রকার সরকারি সেবা</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">লাইসেন্সিং কর্তৃপক্ষ:</span>
                <span className="font-bold text-slate-800 truncate max-w-[150px] text-right">
                  {_instSettings.licensingAuthority}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">হেল্পলাইন:</span>
                <span className="font-bold text-[#902A8B]">{toBanglaNumber(settings.mobile)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">অফিস সময়:</span>
                <span className="font-bold text-slate-700">{_instSettings.officeHours}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
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
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/70 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-full bg-[#f8eff8] text-[#902A8B] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ArrowUpRight className="w-3 h-3" /> ২২%
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[11px] text-slate-500 font-medium">ইস্যুকৃত ইনভয়েস</span>
                <h3 className="text-xl font-bold font-anek text-slate-900 mt-0.5">
                  {toBanglaNumber(totalInvoicesCount)} টি
                </h3>
              </div>
            </div>

            {/* Card 2: মোট ভূমি মালিক আদায় */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/70 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-full bg-[#eef2ff] text-indigo-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ArrowUpRight className="w-3 h-3" /> ১৮%
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[11px] text-slate-500 font-medium">মোট ভূমি মালিক আদায়</span>
                <h3 className="text-xl font-bold font-anek text-[#902A8B] mt-0.5">
                  {moneyBn(totalRevenue)} ৳
                </h3>
              </div>
            </div>

            {/* Card 3: কেন্দ্রের মোট ফি (আয়) */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/70 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-full bg-[#ecfdf5] text-[#37A448] flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ArrowUpRight className="w-3 h-3" /> ১৩%
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[11px] text-slate-500 font-medium">কেন্দ্রের মোট ফি (আয়)</span>
                <h3 className="text-xl font-bold font-anek text-[#37A448] mt-0.5">
                  {moneyBn(totalCenter)} ৳
                </h3>
              </div>
            </div>
          </div>

          {/* Row 2: Bar Chart + Donut Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
            {/* Bar Chart (md:col-span-7) */}
            <div className="md:col-span-7 bg-white rounded-2xl shadow-xs border border-slate-200/70 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 font-anek text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#902A8B]" /> দৈনিক আদায় ট্রেন্ড (টাকা)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                  সর্বশেষ ৭ দিন ▾
                </span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any, name: any) => [moneyBn(val) + " ৳", name === "amount" ? "মোট আদায়" : "সরকারি ফি"]}
                    />
                    <Bar dataKey="amount" fill="#902A8B" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="govt" fill="#37A448" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart (md:col-span-5) */}
            <div className="md:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200/70 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 font-anek text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#37A448]" /> সেবা বণ্টন
                </h4>
              </div>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.length > 0 ? chartData : [{ name: "ই-নামজারি", count: 4 }, { name: "খতিয়ান", count: 3 }, { name: "মৌজা ম্যাপ", count: 2 }]}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={3}
                    >
                      {(chartData.length > 0 ? chartData : [{ name: "ই-নামজারি", count: 4 }, { name: "খতিয়ান", count: 3 }, { name: "মৌজা ম্যাপ", count: 2 }]).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any, name: any) => [toBanglaNumber(val) + " টি আবেদন", name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financials Row (if canSeeFinancials: admin/in-charge) */}
      {canSeeFinancials && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/70 p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">মোট পরিচালন ব্যয় (এপ্রুভড)</span>
              <h3 className="text-xl font-bold font-anek text-red-600 mt-0.5">
                {moneyBn(totalExpense)} ৳
              </h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/70 p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">কেন্দ্রের নিট মুনাফা</span>
              <h3 className={`text-xl font-bold font-anek mt-0.5 ${netProfit >= 0 ? "text-[#37A448]" : "text-red-600"}`}>
                {moneyBn(netProfit)} ৳
              </h3>
            </div>
            <div className={`p-3 rounded-2xl ${netProfit >= 0 ? "bg-emerald-50 text-[#37A448]" : "bg-red-50 text-red-600"}`}>
              <Coins className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Invoices Table (Matching Reference UI) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/70 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-800 font-anek text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#902A8B]" /> সাম্প্রতিক ইনভয়েস ও রসিদ
          </h4>
          <span className="text-xs text-slate-400">সর্বশেষ ৫টি</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/70">
                <th className="p-3 rounded-l-xl">ইনভয়েস নং</th>
                <th className="p-3">ভূমি মালিক</th>
                <th className="p-3">মোবাইল</th>
                <th className="p-3">তারিখ</th>
                <th className="p-3 text-right">মোট টাকা</th>
                <th className="p-3 text-center">মাধ্যম</th>
                <th className="p-3 text-center rounded-r-xl">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeInvoices.slice(0, 5).map((inv) => (
                <tr key={inv.invoiceNo} className="hover:bg-purple-50/20 transition">
                  <td className="p-3 font-bold text-[#902A8B]">
                    {toBanglaNumber(inv.invoiceNo)}
                  </td>
                  <td className="p-3 font-medium text-slate-800">{inv.customer.fullName}</td>
                  <td className="p-3 text-slate-500">{toBanglaNumber(inv.customer.mobile)}</td>
                  <td className="p-3 text-slate-500">
                    {new Date(inv.createdAt).toLocaleDateString("bn-BD")}
                  </td>
                  <td className="p-3 text-right font-bold text-[#37A448]">{moneyBn(inv.total)} ৳</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      inv.paymentMethod === "bKash" || inv.paymentMethod === "বিকাশ"
                        ? "bg-pink-50 text-pink-600 border border-pink-200"
                        : "bg-emerald-50 text-[#37A448] border border-emerald-200"
                    }`}>
                      {inv.paymentMethod || "নগদ"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1 bg-[#FAF0F9] text-[#902A8B] hover:bg-purple-100 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer border border-purple-200/60"
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

      {/* Invoice Modal */}
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
