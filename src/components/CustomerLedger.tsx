import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  FileText,
  Phone,
  CreditCard,
  MapPin,
  Printer,
  Ban,
  Eye,
  Coins,
  CheckCircle2,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useCustomers, cleanPhone } from "../utils/customerStore";
import { useInvoices, InvoiceRecord, recordDuePayment } from "../utils/invoiceStore";
import { toBanglaNumber, moneyBn, InvoicePrint } from "./InvoicePrint";
import { useInstitutionSettings, toInvoiceSettings } from "../utils/institutionSettings";

export const CustomerLedger: React.FC = () => {
  const { customers } = useCustomers();
  const { invoices, voidInvoice } = useInvoices();
  const { settings: _instSettings } = useInstitutionSettings();
  const settings = toInvoiceSettings(_instSettings);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<InvoiceRecord | null>(null);

  // Due collection modal state
  const [collectingInvoice, setCollectingInvoice] = useState<InvoiceRecord | null>(null);
  const [dueAmountInput, setDueAmountInput] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [receivedByInput, setReceivedByInput] = useState<string>("নগদ ক্যাশ");
  const [paymentNote, setPaymentNote] = useState<string>("বকেয়া কিস্তি আদায়");
  const [dueModalError, setDueModalError] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [filterOnlyDue, setFilterOnlyDue] = useState(false);

  // Set of customer phones that have active due
  const customersWithDuePhoneSet = useMemo(() => {
    const dueSet = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.status !== "VOIDED" && (inv.dueAmount ?? 0) > 0) {
        dueSet.add(cleanPhone(inv.customer.mobile));
      }
    });
    return dueSet;
  }, [invoices]);

  // Filter customers based on search query and due filter
  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (filterOnlyDue) {
      list = list.filter((c) => customersWithDuePhoneSet.has(cleanPhone(c.mobile)));
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((c) => {
      const nameMatch = c.fullName?.toLowerCase().includes(q);
      const phoneMatch = c.mobile?.includes(q);
      const nidMatch = c.nidNo?.includes(q);
      return nameMatch || phoneMatch || nidMatch;
    });
  }, [customers, searchQuery, filterOnlyDue, customersWithDuePhoneSet]);

  // Set default selected customer if none selected
  const activeCustomer = useMemo(() => {
    if (selectedCustomerId) {
      return customers.find((c) => c.id === selectedCustomerId || c.mobile === selectedCustomerId);
    }
    return filteredCustomers[0] || null;
  }, [customers, selectedCustomerId, filteredCustomers]);

  // Customer's invoice history
  const customerInvoices = useMemo(() => {
    if (!activeCustomer) return [];
    const activePhone = cleanPhone(activeCustomer.mobile);
    return invoices.filter((inv) => cleanPhone(inv.customer.mobile) === activePhone);
  }, [invoices, activeCustomer]);

  // Invoices of activeCustomer that have due
  const dueInvoices = useMemo(() => {
    return customerInvoices.filter(
      (inv) => inv.status !== "VOIDED" && (inv.dueAmount ?? 0) > 0
    );
  }, [customerInvoices]);

  // Financial summary for this customer
  const totalInvoiced = customerInvoices
    .filter((inv) => inv.status !== "VOIDED")
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPaid = customerInvoices
    .filter((inv) => inv.status !== "VOIDED")
    .reduce(
      (sum, inv) =>
        sum + (inv.paidAmount !== undefined ? inv.paidAmount : inv.total),
      0
    );

  const totalDue = customerInvoices
    .filter((inv) => inv.status !== "VOIDED")
    .reduce(
      (sum, inv) =>
        sum + (inv.dueAmount !== undefined ? inv.dueAmount : 0),
      0
    );

  const totalGovtFee = customerInvoices
    .filter((inv) => inv.status !== "VOIDED")
    .reduce((sum, inv) => sum + inv.lines.reduce((lSum, l) => lSum + l.govtFee, 0), 0);

  const totalCenterFee = customerInvoices
    .filter((inv) => inv.status !== "VOIDED")
    .reduce((sum, inv) => sum + inv.lines.reduce((lSum, l) => lSum + l.centerFee, 0), 0);

  const handleOpenCollectDue = (inv: InvoiceRecord) => {
    setCollectingInvoice(inv);
    setDueAmountInput(inv.dueAmount ? String(inv.dueAmount) : "");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setReceivedByInput("নগদ ক্যাশ");
    setPaymentNote("বকেয়া কিস্তি আদায়");
    setDueModalError(null);
  };

  const handleConfirmDuePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingInvoice) return;
    setDueModalError(null);
    const amount = Number.parseFloat(dueAmountInput);
    if (Number.isNaN(amount) || amount <= 0) {
      setDueModalError("সঠিক টাকার পরিমাণ লিখুন (০ থেকে বড় হতে হবে)।");
      return;
    }
    const currentDue = collectingInvoice.dueAmount ?? 0;
    if (amount > currentDue) {
      setDueModalError(`বাকি টাকার অতিরিক্ত (${moneyBn(amount)} ৳) জমা নেওয়া যাবে না। সর্বোচ্চ বকেয়া: ${moneyBn(currentDue)} ৳।`);
      return;
    }
    const res = recordDuePayment(collectingInvoice.invoiceNo, {
      amount,
      date: paymentDate,
      receivedBy: receivedByInput,
      note: paymentNote,
    });
    if (res.ok && res.invoice) {
      const updatedInv = res.invoice;
      setCollectingInvoice(null);
      setSuccessFeedback(
        `ইনভয়েস নং ${toBanglaNumber(updatedInv.invoiceNo)}-এর ${moneyBn(amount)} ৳ বকেয়া সফলভাবে জমা নেওয়া হয়েছে। অবশিষ্ট বকেয়া: ${moneyBn(updatedInv.dueAmount ?? 0)} ৳।`
      );
      // স্বয়ংক্রিয়ভাবে হালনাগাদকৃত ইনভয়েস প্রিভিউ ওপেন করা
      setViewInvoice(updatedInv);
      setTimeout(() => setSuccessFeedback(null), 5000);
    } else {
      setDueModalError(res.error || "বাকি টাকা জমা নেওয়া যায়নি।");
    }
  };

  const handleVoidInvoice = (invoiceNo: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে ইনভয়েস নং ${toBanglaNumber(invoiceNo)} বাতিল করতে চান?`)) {
      voidInvoice(invoiceNo);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#902A8B]" />
            <h2 className="text-xl font-bold font-anek text-gray-800">
              ভূমি মালিক খতিয়ান ও লেনদেন লেজার
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ভূমি মালিক অনুযায়ী পূর্ববর্তী সকল ভূমিসেবার ইনভয়েস ইতিহাস ও হিসাব বিবরণী
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Directory / Search */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col h-[750px]">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              ভূমি মালিক অনুসন্ধান (নাম / মোবাইল / এনআইডি)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
              />
            </div>
          </div>

          {/* Filter Tabs: All vs Due Only */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg mb-3">
            <button
              type="button"
              onClick={() => setFilterOnlyDue(false)}
              className={`flex-1 py-1.5 text-[11px] font-bold font-anek rounded-md transition cursor-pointer text-center ${
                !filterOnlyDue
                  ? "bg-white text-[#902A8B] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              সকল ({toBanglaNumber(customers.length)})
            </button>
            <button
              type="button"
              onClick={() => setFilterOnlyDue(true)}
              className={`flex-1 py-1.5 text-[11px] font-bold font-anek rounded-md transition cursor-pointer text-center flex items-center justify-center gap-1 ${
                filterOnlyDue
                  ? "bg-[#EC2324] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Coins className="w-3 h-3" />
              বকেয়া আছে ({toBanglaNumber(customersWithDuePhoneSet.size)})
            </button>
          </div>

          <p className="text-[11px] text-gray-400 mb-2 font-medium">
            মোট পাওয়া গেছে {toBanglaNumber(filteredCustomers.length)} জন ভূমি মালিক
          </p>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs border border-dashed rounded-lg">
                {filterOnlyDue ? "কোনো ভূমি মালিকের বকেয়া নেই।" : "কোনো ভূমি মালিক পাওয়া যায়নি।"}
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = activeCustomer?.id === c.id || activeCustomer?.mobile === c.mobile;
                const cInvs = invoices.filter(
                  (inv) => cleanPhone(inv.customer.mobile) === cleanPhone(c.mobile) && inv.status !== "VOIDED"
                );
                const cDue = cInvs.reduce((sum, inv) => sum + (inv.dueAmount ?? 0), 0);

                return (
                  <button
                    key={c.id || c.mobile}
                    type="button"
                    onClick={() => setSelectedCustomerId(c.id || c.mobile)}
                    className={`w-full text-left p-3 rounded-lg border transition cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? "border-[#902A8B] bg-purple-50/70 ring-1 ring-[#902A8B]"
                        : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-900">{c.fullName}</span>
                      <div className="flex items-center gap-1">
                        {cDue > 0 && (
                          <span className="text-[10px] bg-red-100 text-[#EC2324] font-bold px-1.5 py-0.5 rounded-full">
                            বাকি ৳{moneyBn(cDue)}
                          </span>
                        )}
                        <span className="text-[10px] bg-purple-100 text-[#902A8B] px-1.5 py-0.5 rounded-full font-medium">
                          {toBanglaNumber(cInvs.length)}টি
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{toBanglaNumber(c.mobile)}</span>
                    </div>
                    {c.address && (
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 truncate">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Customer Ledger Profile & Invoice Table */}
        <div className="lg:col-span-2 space-y-6">
          {activeCustomer ? (
            <>
              {/* Customer Profile Banner */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold font-anek text-gray-900">
                      {activeCustomer.fullName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#37A448]" />
                        {toBanglaNumber(activeCustomer.mobile)}
                      </span>
                      {activeCustomer.nidNo && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-[#902A8B]" />
                          NID: {toBanglaNumber(activeCustomer.nidNo)}
                        </span>
                      )}
                      {activeCustomer.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {activeCustomer.address}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 border border-[#902A8B] text-[#902A8B] hover:bg-purple-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> লেজার প্রিন্ট
                    </button>
                  </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3">
                    <span className="text-[11px] text-gray-600 block">মোট সেবা বিল</span>
                    <span className="text-base font-bold font-anek text-[#902A8B]">
                      {moneyBn(totalInvoiced)} ৳
                    </span>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3">
                    <span className="text-[11px] text-gray-600 block">মোট পরিশোধ/আদায়</span>
                    <span className="text-base font-bold font-anek text-[#37A448]">
                      {moneyBn(totalPaid)} ৳
                    </span>
                  </div>
                  <div className={`border rounded-lg p-3 flex flex-col justify-between ${totalDue > 0 ? "bg-amber-50/90 border-2 border-amber-400" : "bg-gray-50 border-gray-200"}`}>
                    <div>
                      <span className="text-[11px] text-gray-700 font-semibold block">মোট অবশিষ্ট বকেয়া</span>
                      <span className={`text-base font-bold font-anek ${totalDue > 0 ? "text-amber-900" : "text-gray-500"}`}>
                        {moneyBn(totalDue)} ৳
                      </span>
                    </div>
                    {totalDue > 0 && dueInvoices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenCollectDue(dueInvoices[0])}
                        className="mt-2 w-full py-1.5 px-2 bg-[#EC2324] hover:bg-red-700 text-white rounded text-[11px] font-bold font-anek flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                      >
                        <Coins className="w-3.5 h-3.5" /> বকেয়া আদায় করুন
                      </button>
                    )}
                  </div>
                  <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3">
                    <span className="text-[11px] text-gray-600 block">কেন্দ্র ও সরকারি ফি</span>
                    <span className="text-base font-bold font-anek text-blue-700">
                      {moneyBn(totalCenterFee)} ৳
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      সরকারি: {moneyBn(totalGovtFee)} ৳
                    </span>
                  </div>
                </div>
              </div>

              {/* Success Feedback Notification */}
              {successFeedback && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successFeedback}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessFeedback(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Active Due Alert & Direct Action Strip */}
              {totalDue > 0 && dueInvoices.length > 0 && (
                <div className="bg-linear-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 font-anek">
                        বকেয়া টাকা জমা নেওয়ার সুযোগ
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        এই ভূমি মালিকের {toBanglaNumber(dueInvoices.length)}টি ইনভয়েসে সর্বমোট <strong>{moneyBn(totalDue)} ৳</strong> বকেয়া রয়েছে। এখনই বকেয়া পরিশোধ আপডেট করে লেজারে হালনাগাদ করুন।
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenCollectDue(dueInvoices[0])}
                    className="px-4 py-2 bg-[#EC2324] hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <Coins className="w-4 h-4" /> বকেয়া পরিশোধ হালনাগাদ
                  </button>
                </div>
              )}

              {/* Transactions History */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800 font-anek text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#902A8B]" />
                    আবেদন ও ইনভয়েস হিস্ট্রি
                  </h4>
                  {dueInvoices.length > 0 && (
                    <span className="text-[11px] font-bold text-[#EC2324] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {toBanglaNumber(dueInvoices.length)}টিতে বকেয়া অবশিষ্ট
                    </span>
                  )}
                </div>

                {customerInvoices.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs border border-dashed rounded-lg">
                    এই ভূমি মালিকের জন্য কোনো ইনভয়েস তৈরি করা হয়নি।
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700">
                          <th className="p-2.5 rounded-l-lg">ইনভয়েস নং</th>
                          <th className="p-2.5">তারিখ</th>
                          <th className="p-2.5">সেবার বিবরণ</th>
                          <th className="p-2.5 text-right">সরকারি ফি</th>
                          <th className="p-2.5 text-right">কেন্দ্র ফি</th>
                          <th className="p-2.5 text-right">মোট বিল</th>
                          <th className="p-2.5 text-right">পরিশোধ ও বাকি</th>
                          <th className="p-2.5 text-center">অবস্থা</th>
                          <th className="p-2.5 text-center rounded-r-lg">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {customerInvoices.map((inv) => {
                          const isVoided = inv.status === "VOIDED";
                          const govtFee = inv.lines.reduce((s, l) => s + l.govtFee, 0);
                          const centerFee = inv.lines.reduce((s, l) => s + l.centerFee, 0);
                          const paid = inv.paidAmount !== undefined ? inv.paidAmount : inv.total;
                          const due = inv.dueAmount !== undefined ? inv.dueAmount : 0;

                          return (
                            <tr
                              key={inv.invoiceNo}
                              className={`hover:bg-gray-50 transition ${isVoided ? "opacity-60 bg-red-50/30" : ""}`}
                            >
                              <td className="p-2.5 font-bold text-[#902A8B]">
                                {toBanglaNumber(inv.invoiceNo)}
                              </td>
                              <td className="p-2.5 text-gray-500">
                                {new Date(inv.createdAt).toLocaleDateString("bn-BD")}
                              </td>
                              <td className="p-2.5 max-w-[180px]">
                                {inv.lines.map((l, i) => (
                                  <div key={i} className="truncate">
                                    • {l.serviceName}
                                  </div>
                                ))}
                              </td>
                              <td className="p-2.5 text-right font-medium">{moneyBn(govtFee)} ৳</td>
                              <td className="p-2.5 text-right font-medium text-[#37A448]">{moneyBn(centerFee)} ৳</td>
                              <td className="p-2.5 text-right font-bold text-gray-900">{moneyBn(inv.total)} ৳</td>
                              <td className="p-2.5 text-right">
                                <span className="font-semibold text-gray-800">{moneyBn(paid)} ৳</span>
                                {due > 0 ? (
                                  <span className="block text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1 py-0.5 rounded mt-0.5">
                                    বাকি: {moneyBn(due)} ৳
                                  </span>
                                ) : inv.discountAmount && inv.discountAmount > 0 ? (
                                  <span className="block text-[10px] text-purple-700 bg-purple-50 px-1 py-0.5 rounded mt-0.5">
                                    ছাড়: {moneyBn(inv.discountAmount)} ৳
                                  </span>
                                ) : (
                                  <span className="block text-[10px] text-[#37A448] font-medium mt-0.5">
                                    পরিশোধিত
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                {isVoided ? (
                                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    বাতিলকৃত
                                  </span>
                                ) : (
                                  <span className="bg-green-100 text-[#37A448] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    সক্রিয়
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    title="প্রিভিউ ও প্রিন্ট"
                                    onClick={() => setViewInvoice(inv)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  {due > 0 && !isVoided && (
                                    <button
                                      title="বাকি টাকা আদায় করুন"
                                      onClick={() => handleOpenCollectDue(inv)}
                                      className="flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold transition shadow-xs cursor-pointer"
                                    >
                                      <Coins className="w-3 h-3" /> বাকি আদায়
                                    </button>
                                  )}
                                  {!isVoided && (
                                    <button
                                      title="ইনভয়েস বাতিল করুন"
                                      onClick={() => handleVoidInvoice(inv.invoiceNo)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-12 text-center text-gray-400">
              বাম পাশের তালিকা থেকে যেকোনো ভূমি মালিক নির্বাচন করুন
            </div>
          )}
        </div>
      </div>

      {/* Invoice View Modal */}
      {viewInvoice && (
        <InvoicePrint
          invoice={viewInvoice}
          onClose={() => setViewInvoice(null)}
          settings={settings}
        />
      )}

      {/* Due Collection Modal */}
      {collectingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#902A8B] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base font-anek">বকেয়া / অবশিষ্ট টাকা আদায়</h3>
              </div>
              <button
                onClick={() => setCollectingInvoice(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmDuePayment} className="p-5 space-y-4">
              {/* Due Modal Error Banner */}
              {dueModalError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{dueModalError}</span>
                </div>
              )}

              {/* Invoice Switcher (if customer has multiple due invoices) */}
              {dueInvoices.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    বকেয়া ইনভয়েস নির্বাচন করুন:
                  </label>
                  <select
                    value={collectingInvoice.invoiceNo}
                    onChange={(e) => {
                      const selected = dueInvoices.find((i) => i.invoiceNo === e.target.value);
                      if (selected) handleOpenCollectDue(selected);
                    }}
                    className="w-full px-3 py-1.5 border border-purple-300 rounded-lg text-xs font-semibold text-gray-800 bg-purple-50/50 focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                  >
                    {dueInvoices.map((inv) => (
                      <option key={inv.invoiceNo} value={inv.invoiceNo}>
                        ইনভয়েস #{toBanglaNumber(inv.invoiceNo)} — বকেয়া {moneyBn(inv.dueAmount ?? 0)} ৳ ({inv.lines.map((l) => l.serviceName).join(", ")})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Invoice & Customer Info Box */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-purple-100 pb-1.5">
                  <span className="text-gray-600 font-medium">ইনভয়েস নং:</span>
                  <span className="font-bold text-[#902A8B]">{toBanglaNumber(collectingInvoice.invoiceNo)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-purple-100 pb-1.5">
                  <span className="text-gray-600 font-medium">ভূমি মালিক:</span>
                  <span className="font-semibold text-gray-900">{collectingInvoice.customer.fullName}</span>
                </div>
                <div className="flex justify-between items-center text-gray-700">
                  <span>মোট বিল:</span>
                  <span className="font-semibold">{moneyBn(collectingInvoice.total)} ৳</span>
                </div>
                <div className="flex justify-between items-center text-gray-700">
                  <span>পূর্বে পরিশোধিত:</span>
                  <span className="font-semibold">{moneyBn(collectingInvoice.paidAmount ?? collectingInvoice.total)} ৳</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-amber-900 bg-amber-100/70 px-2 py-1 rounded-md">
                  <span>বর্তমান অবশিষ্ট বকেয়া:</span>
                  <span className="font-anek">{moneyBn(collectingInvoice.dueAmount ?? 0)} ৳</span>
                </div>
              </div>

              {/* Payment History Log (if any) */}
              {collectingInvoice.paymentHistory && collectingInvoice.paymentHistory.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-[11px] space-y-1">
                  <span className="font-bold text-gray-700 block">পূর্ববর্তী জমার বিবরণ:</span>
                  {collectingInvoice.paymentHistory.map((h, i) => (
                    <div key={i} className="flex justify-between text-gray-600">
                      <span>• {new Date(h.date).toLocaleDateString("bn-BD")} ({h.note || h.receivedBy})</span>
                      <span className="font-semibold text-[#37A448]">{moneyBn(h.amount)} ৳</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  এখন জমার পরিমাণ (৳):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    max={collectingInvoice.dueAmount ?? 0}
                    value={dueAmountInput}
                    onChange={(e) => setDueAmountInput(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                  />
                  <button
                    type="button"
                    onClick={() => setDueAmountInput(String(collectingInvoice.dueAmount ?? 0))}
                    className="absolute right-2 top-2 text-[10px] bg-purple-100 hover:bg-purple-200 text-[#902A8B] px-2 py-0.5 rounded font-bold transition cursor-pointer"
                  >
                    সম্পূর্ণ টাকা
                  </button>
                </div>
              </div>

              {/* Date Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    আদায়ের তারিখ:
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    মাধ্যম / গ্রহণকারী:
                  </label>
                  <input
                    type="text"
                    value={receivedByInput}
                    onChange={(e) => setReceivedByInput(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                  />
                </div>
              </div>

              {/* Note Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  মন্তব্য / নোট (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  placeholder="যেমন: অবশিষ্ট কিস্তি পরিশোধ"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-[#902A8B]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCollectingInvoice(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#37A448] hover:bg-green-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> আদায় সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
