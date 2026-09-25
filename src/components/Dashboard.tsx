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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useInvoices, InvoiceRecord, getInvoiceRealizedCenterFee } from "../utils/invoiceStore";
import { useExpenses, getApprovedExpenses } from "../utils/expenseStore";
import { toBanglaNumber, moneyBn, InvoicePrint } from "./InvoicePrint";
import { useInstitutionSettings, toInvoiceSettings } from "../utils/institutionSettings";
import { useAuth, canManageSettings } from "../utils/authStore";

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
  // "মোট ভূমি মালিক আদায়" মানে যা প্রকৃতপক্ষে আদায় হয়েছে — বকেয়া অংশ এখানে গণনা হবে না
  const totalRevenue = activeInvoices.reduce(
    (sum, i) => sum + (i.paidAmount !== undefined ? i.paidAmount : i.total),
    0
  );
  const totalGovt = activeInvoices.reduce(
    (sum, i) => sum + i.lines.reduce((lsum, l) => lsum + l.govtFee + (l.gatewayFee || 0) + (l.postalFee || 0), 0),
    0
  );
  // waterfall-ভিত্তিক centerPortion — শুধু প্রকৃত কালেকশন থেকে আয় গণনা হবে, বকেয়া অংশ নয়
  const totalCenter = activeInvoices.reduce(
    (sum, i) => sum + getInvoiceRealizedCenterFee(i),
    0
  );

  // Total operating expenses & Net Profit — শুধু "approved" এন্ট্রি গণনা হবে
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
  const dailyStats: Record<string, number> = {};
  for (const inv of activeInvoices) {
    const d = new Date(inv.createdAt).toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
    dailyStats[d] = (dailyStats[d] || 0) + inv.total;
  }
  const dailyChartData = Object.entries(dailyStats).map(([date, amount]) => ({
    date,
    amount: Math.round(amount),
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Action */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-anek text-gray-800">
            {settings.orgNameBn} — সার্বিক ড্যাশবোর্ড
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {settings.topGovtTitle} | লাইসেন্স নং: {toBanglaNumber(settings.licenseNo)} ({settings.partnerOrg})
          </p>
        </div>
        <button
          onClick={onNavigateToForm}
          className="px-4 py-2.5 bg-[#902A8B] hover:bg-[#7a2276] text-white rounded-lg text-xs font-bold font-anek flex items-center gap-2 cursor-pointer shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> নতুন ভূমিসেবা আবেদন
        </button>
      </div>

      {/* KPI Cards */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${
          canSeeFinancials ? "xl:grid-cols-6" : "xl:grid-cols-4"
        }`}
      >
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">ইস্যুকৃত ইনভয়েস</span>
            <h3 className="text-xl font-bold font-anek text-gray-900 mt-0.5">
              {toBanglaNumber(totalInvoicesCount)} টি
            </h3>
          </div>
          <div className="p-2.5 bg-purple-50 text-[#902A8B] rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">মোট ভূমি মালিক আদায়</span>
            <h3 className="text-xl font-bold font-anek text-[#902A8B] mt-0.5">
              {moneyBn(totalRevenue)} ৳
            </h3>
          </div>
          <div className="p-2.5 bg-purple-50 text-[#902A8B] rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">সরকারি ফি ও ডাক</span>
            <h3 className="text-xl font-bold font-anek text-blue-700 mt-0.5">
              {moneyBn(totalGovt)} ৳
            </h3>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">কেন্দ্রের মোট ফি (আয়)</span>
            <h3 className="text-xl font-bold font-anek text-[#37A448] mt-0.5">
              {moneyBn(totalCenter)} ৳
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-[#37A448] rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* ব্যয় ও নিট-মুনাফা শুধু ইন-চার্জ/অ্যাডমিন দেখবেন — staff-এর জন্য গোপন */}
        {canSeeFinancials && (
          <>
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-500 font-medium">মোট পরিচালন ব্যয় (এপ্রুভড)</span>
                <h3 className="text-xl font-bold font-anek text-red-600 mt-0.5">
                  {moneyBn(totalExpense)} ৳
                </h3>
              </div>
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-500 font-medium">কেন্দ্রের নিট মুনাফা</span>
                <h3
                  className={`text-xl font-bold font-anek mt-0.5 ${
                    netProfit >= 0 ? "text-[#37A448]" : "text-red-600"
                  }`}
                >
                  {moneyBn(netProfit)} ৳
                </h3>
              </div>
              <div
                className={`p-2.5 rounded-xl ${
                  netProfit >= 0 ? "bg-emerald-50 text-[#37A448]" : "bg-red-50 text-red-600"
                }`}
              >
                <Coins className="w-5 h-5" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Popularity Bar Chart */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 font-anek text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#902A8B]" /> সেবার আবেদন সংখ্যা
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => [toBanglaNumber(val) + " টি", "আবেদন"]}
                />
                <Bar dataKey="count" fill="#902A8B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Revenue Trend */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 font-anek text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#37A448]" /> তারিখভিত্তিক আদায় ট্রেন্ড (টাকা)
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => [moneyBn(val) + " ৳", "মোট আদায়"]}
                />
                <Bar dataKey="amount" fill="#37A448" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-800 font-anek text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#902A8B]" /> সাম্প্রতিক ইনভয়েস ও রসিদ সমূহ
          </h4>
          <span className="text-xs text-gray-400">সর্বশেষ ৫টি</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-2.5 rounded-l-lg">ইনভয়েস নং</th>
                <th className="p-2.5">ভূমি মালিক</th>
                <th className="p-2.5">মোবাইল</th>
                <th className="p-2.5">তারিখ</th>
                <th className="p-2.5 text-right">মোট টাকা</th>
                <th className="p-2.5 text-center">মাধ্যম</th>
                <th className="p-2.5 text-center rounded-r-lg">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activeInvoices.slice(0, 5).map((inv) => (
                <tr key={inv.invoiceNo} className="hover:bg-gray-50 transition">
                  <td className="p-2.5 font-bold text-[#902A8B]">
                    {toBanglaNumber(inv.invoiceNo)}
                  </td>
                  <td className="p-2.5 font-medium text-gray-800">{inv.customer.fullName}</td>
                  <td className="p-2.5 text-gray-500">{toBanglaNumber(inv.customer.mobile)}</td>
                  <td className="p-2.5 text-gray-500">
                    {new Date(inv.createdAt).toLocaleDateString("bn-BD")}
                  </td>
                  <td className="p-2.5 text-right font-bold text-[#37A448]">{moneyBn(inv.total)} ৳</td>
                  <td className="p-2.5 text-center text-gray-600">{inv.paymentMethod || "নগদ"}</td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1 bg-purple-50 text-[#902A8B] hover:bg-purple-100 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> রসিদ দেখুন
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
