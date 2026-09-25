import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
} from "lucide-react";
import { useInvoices } from "../../utils/invoiceStore";
import { useInstitutionSettings, toInvoiceSettings } from "../../utils/institutionSettings";
import { compileCenterReport, exportInvoicesToCsv } from "./reportUtils";
import { CenterSummaryPdfDocument, buildCenterSummaryFields } from "./CenterSummaryPdfDocument";
import { shapeTree } from "../../utils/banglaShaping/shapeTree";
import { downloadPureVectorPdf } from "../../utils/printPdfUtils";
import { toBanglaNumber, moneyBn } from "../InvoicePrint";

export const CenterSummaryReportView: React.FC = () => {
  const { invoices } = useInvoices();
  const { settings: _instSettings } = useInstitutionSettings();
  const settings = toInvoiceSettings(_instSettings);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const reportData = useMemo(() => {
    return compileCenterReport(invoices, { startDate, endDate });
  }, [invoices, startDate, endDate]);

  const handleDownloadPdf = async () => {
    try {
      setIsPdfLoading(true);
      const fields = buildCenterSummaryFields(reportData, settings);
      const shapedFields = await shapeTree(fields);
      await downloadPureVectorPdf(
        <CenterSummaryPdfDocument data={reportData} settings={settings} shapedFields={shapedFields} />,
        `Center-Summary-${Date.now()}`
      );
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleExportCsv = () => {
    exportInvoicesToCsv(invoices, `LSFC-Invoices-${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Filter and Action Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-700">শুরুর তারিখ:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-800 focus:ring-1 focus:ring-[#902A8B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">শেষ তারিখ:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-800 focus:ring-1 focus:ring-[#902A8B]"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-[#902A8B] hover:underline font-medium cursor-pointer"
            >
              ফিল্টার রিসেট
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#37A448]" /> এক্সেল (CSV) এক্সপোর্ট
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isPdfLoading}
            className="px-3.5 py-1.5 bg-[#902A8B] hover:bg-[#7a2276] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
          >
            <Download className="w-4 h-4" /> {isPdfLoading ? "পিডিএফ প্রস্তুত হচ্ছে..." : "ভেক্টর পিডিএফ ডাউনলোড"}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
          <span className="text-xs text-gray-500 font-medium block mb-1">মোট আবেদন সংখ্যা</span>
          <span className="text-2xl font-bold font-anek text-gray-900">
            {toBanglaNumber(reportData.totalInvoices)} টি
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
          <span className="text-xs text-gray-500 font-medium block mb-1">সর্বমোট আদায়</span>
          <span className="text-2xl font-bold font-anek text-[#902A8B]">
            {moneyBn(reportData.totalRevenue)} ৳
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
          <span className="text-xs text-gray-500 font-medium block mb-1">সরকারি রাজস্ব ও ডাক ফি</span>
          <span className="text-2xl font-bold font-anek text-blue-700">
            {moneyBn(reportData.govtTotal + reportData.gatewayPostalTotal)} ৳
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
          <span className="text-xs text-gray-500 font-medium block mb-1">কেন্দ্রের নিজস্ব আয়</span>
          <span className="text-2xl font-bold font-anek text-[#37A448]">
            {moneyBn(reportData.centerTotal)} ৳
          </span>
        </div>
      </div>

      {/* Service Breakdown Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#902A8B]" />
            <h3 className="font-bold text-gray-900 font-anek text-base">সেবাভিত্তিক আয় ও আবেদনের বিবরণ</h3>
          </div>
          <span className="text-xs text-gray-400">
            {toBanglaNumber(reportData.serviceBreakdown.length)} প্রকার সেবা
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#902A8B] text-white">
                <th className="p-3 text-center w-12 rounded-l-lg">নং</th>
                <th className="p-3">সেবার নাম</th>
                <th className="p-3 text-center">আবেদন সংখ্যা</th>
                <th className="p-3 text-right">সরকারি ফি</th>
                <th className="p-3 text-right">গেটওয়ে ও ডাক</th>
                <th className="p-3 text-right">কেন্দ্র ফি</th>
                <th className="p-3 text-right rounded-r-lg">মোট আদায়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.serviceBreakdown.map((row, idx) => (
                <tr key={idx} className="hover:bg-purple-50/20 transition">
                  <td className="p-3 text-center font-medium text-gray-600">
                    {toBanglaNumber(idx + 1)}
                  </td>
                  <td className="p-3 font-semibold text-gray-900">{row.serviceName}</td>
                  <td className="p-3 text-center font-bold text-gray-800">
                    {toBanglaNumber(row.count)}
                  </td>
                  <td className="p-3 text-right text-gray-600">{moneyBn(row.govtFeeTotal)} ৳</td>
                  <td className="p-3 text-right text-gray-600">{moneyBn(row.gatewayPostalFeeTotal)} ৳</td>
                  <td className="p-3 text-right text-[#37A448] font-semibold">{moneyBn(row.centerFeeTotal)} ৳</td>
                  <td className="p-3 text-right font-bold text-[#902A8B]">{moneyBn(row.grandTotal)} ৳</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-[#902A8B]">
                <td colSpan={2} className="p-3">সর্বমোট</td>
                <td className="p-3 text-center">
                  {toBanglaNumber(reportData.serviceBreakdown.reduce((s, r) => s + r.count, 0))}
                </td>
                <td className="p-3 text-right">{moneyBn(reportData.govtTotal)} ৳</td>
                <td className="p-3 text-right">{moneyBn(reportData.gatewayPostalTotal)} ৳</td>
                <td className="p-3 text-right text-[#37A448]">{moneyBn(reportData.centerTotal)} ৳</td>
                <td className="p-3 text-right text-[#902A8B] text-sm font-anek">
                  {moneyBn(reportData.totalRevenue)} ৳
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
