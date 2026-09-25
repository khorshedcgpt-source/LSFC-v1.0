import React, { useState, useMemo } from "react";
import { Search, Download, Printer } from "lucide-react";
import { useCustomers, cleanPhone } from "../../utils/customerStore";
import { useInvoices } from "../../utils/invoiceStore";
import { useInstitutionSettings, toInvoiceSettings } from "../../utils/institutionSettings";
import { CustomerStatementPdfDocument, buildCustomerStatementFields } from "./CustomerStatementPdfDocument";
import { shapeTree } from "../../utils/banglaShaping/shapeTree";
import { downloadPureVectorPdf } from "../../utils/printPdfUtils";
import { toBanglaNumber, moneyBn } from "../InvoicePrint";

export const CustomerStatementView: React.FC = () => {
  const { customers } = useCustomers();
  const { invoices } = useInvoices();
  const { settings: _instSettings } = useInstitutionSettings();
  const settings = toInvoiceSettings(_instSettings);

  const [search, setSearch] = useState("");
  const [selectedMobile, setSelectedMobile] = useState<string>("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.fullName.toLowerCase().includes(q) || c.mobile.includes(q)
    );
  }, [customers, search]);

  const activeCustomer = useMemo(() => {
    if (selectedMobile) {
      return customers.find((c) => cleanPhone(c.mobile) === cleanPhone(selectedMobile));
    }
    return filtered[0] || null;
  }, [customers, selectedMobile, filtered]);

  const customerInvoices = useMemo(() => {
    if (!activeCustomer) return [];
    return invoices.filter(
      (inv) => cleanPhone(inv.customer.mobile) === cleanPhone(activeCustomer.mobile)
    );
  }, [invoices, activeCustomer]);

  // Download the statement PDF (browser save-as)
  const handleDownloadPdf = async () => {
    if (!activeCustomer) return;
    try {
      setIsPdfLoading(true);
      // Shape every Bengali string BEFORE constructing the PDF document
      // element — CustomerStatementPdfDocument itself must stay synchronous.
      const fields = buildCustomerStatementFields(activeCustomer, customerInvoices, settings);
      const shapedFields = await shapeTree(fields);

      await downloadPureVectorPdf(
        <CustomerStatementPdfDocument
          customer={activeCustomer}
          invoices={customerInvoices}
          settings={settings}
          shapedFields={shapedFields}
        />,
        `Statement-${activeCustomer.mobile}`
      );
    } catch (err) {
      console.error("Failed to generate statement PDF:", err);
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Open the same vector PDF in a new tab for clean A4 printing
  const handlePrintStatement = async () => {
    if (!activeCustomer) return;
    try {
      setIsPdfLoading(true);
      // Same pattern as handleDownloadPdf, but instead of downloading we
      // open the vector PDF in a new tab. The user prints directly from
      // the PDF viewer — guaranteeing A4 layout, correct Bengali shaping,
      // and clean page breaks instead of the browser's default HTML print.
      const fields = buildCustomerStatementFields(activeCustomer, customerInvoices, settings);
      const shapedFields = await shapeTree(fields);

      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(
        <CustomerStatementPdfDocument
          customer={activeCustomer}
          invoices={customerInvoices}
          settings={settings}
          shapedFields={shapedFields}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);

      const win = window.open(url, "_blank");
      if (!win) {
        // Popup blocked — fall back to download
        const a = document.createElement("a");
        a.href = url;
        a.download = `Statement-${activeCustomer.mobile}.pdf`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Print statement via PDF failed:", err);
      alert("পিডিএফ তৈরি করতে সমস্যা হয়েছে।");
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ভূমি মালিকের নাম বা মোবাইল..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#902A8B]"
          />
        </div>

        {activeCustomer && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintStatement}
              disabled={isPdfLoading}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> প্রিন্ট (PDF)
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfLoading}
              className="px-3.5 py-1.5 bg-[#902A8B] hover:bg-[#7a2276] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <Download className="w-4 h-4" /> {isPdfLoading ? "পিডিএফ প্রস্তুত হচ্ছে..." : "স্টেটমেন্ট পিডিএফ"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer list selector */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 max-h-[600px] overflow-y-auto space-y-2">
          <h4 className="text-xs font-bold text-gray-700 mb-2">ভূমি মালিক তালিকা</h4>
          {filtered.map((c) => {
            const isSelected = activeCustomer?.mobile === c.mobile;
            return (
              <button
                key={c.id || c.mobile}
                onClick={() => setSelectedMobile(c.mobile)}
                className={`w-full text-left p-2.5 rounded-lg border transition cursor-pointer text-xs ${
                  isSelected
                    ? "border-[#902A8B] bg-purple-50 text-[#902A8B] font-semibold"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div>{c.fullName}</div>
                <div className="text-[11px] text-gray-400 font-normal">{toBanglaNumber(c.mobile)}</div>
              </button>
            );
          })}
        </div>

        {/* Statement Report View */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
          {activeCustomer ? (
            <>
              <div className="border-b border-gray-200 pb-4 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 font-anek">{activeCustomer.fullName}</h3>
                  <p className="text-xs text-gray-500">মোবাইল: {toBanglaNumber(activeCustomer.mobile)}</p>
                  {activeCustomer.address && (
                    <p className="text-xs text-gray-400">{activeCustomer.address}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">মোট আবেদন:</span>
                  <p className="font-bold text-base text-[#902A8B]">{toBanglaNumber(customerInvoices.length)} টি</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-2.5">ইনভয়েস নং</th>
                      <th className="p-2.5">তারিখ</th>
                      <th className="p-2.5">সেবাসমূহ</th>
                      <th className="p-2.5 text-right">সরকারি ফি</th>
                      <th className="p-2.5 text-right">মোট টাকা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customerInvoices.map((inv) => (
                      <tr key={inv.invoiceNo} className="hover:bg-gray-50">
                        <td className="p-2.5 font-bold text-[#902A8B]">{toBanglaNumber(inv.invoiceNo)}</td>
                        <td className="p-2.5 text-gray-500">{new Date(inv.createdAt).toLocaleDateString("bn-BD")}</td>
                        <td className="p-2.5">{inv.lines.map((l) => l.serviceName).join(", ")}</td>
                        <td className="p-2.5 text-right">
                          {moneyBn(inv.lines.reduce((s, l) => s + l.govtFee, 0))} ৳
                        </td>
                        <td className="p-2.5 text-right font-bold text-[#37A448]">{moneyBn(inv.total)} ৳</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 font-bold">
                      <td colSpan={3} className="p-2.5">মোট বিল</td>
                      <td className="p-2.5 text-right">
                        {moneyBn(
                          customerInvoices.reduce(
                            (s, inv) => s + inv.lines.reduce((ls, l) => ls + l.govtFee, 0),
                            0
                          )
                        )}{" "}
                        ৳
                      </td>
                      <td className="p-2.5 text-right text-[#902A8B]">
                        {moneyBn(customerInvoices.reduce((s, inv) => s + inv.total, 0))} ৳
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-400 text-xs">
              ভূমি মালিক নির্বাচন করুন
            </div>
          )}
        </div>
      </div>
    </div>
  );
};