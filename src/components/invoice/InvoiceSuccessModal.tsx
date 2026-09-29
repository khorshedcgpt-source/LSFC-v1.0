import { CheckCircle2, Printer, Plus, User, Phone } from "lucide-react";
import { InvoiceRecord } from "../../utils/invoiceStore";
import { toBanglaNumber, moneyBn } from "../InvoicePrint";
import { Modal } from "../common/Modal";

export interface InvoiceSuccessModalProps {
  invoice: InvoiceRecord | null;
  onPrintPreview: () => void;
  onNewInvoice: () => void;
  onClose: () => void;
}

export const InvoiceSuccessModal: React.FC<InvoiceSuccessModalProps> = ({
  invoice,
  onPrintPreview,
  onNewInvoice,
  onClose,
}) => {
  if (!invoice) return null;

  const due =
    invoice.dueAmount !== undefined
      ? invoice.dueAmount
      : Math.max(0, invoice.total - (invoice.paidAmount ?? invoice.total));

  return (
    <Modal
      isOpen={Boolean(invoice)}
      onClose={onClose}
      title="ইনভয়েস সফলভাবে সম্পন্ন হয়েছে"
      maxWidth="md"
    >
      <div className="space-y-5 text-center font-kalpurush">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#37A448] flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="text-xl font-bold font-anek text-slate-900 dark:text-white">
            চালান সফলভাবে নথিভুক্ত হয়েছে!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ইনভয়েস নম্বর: <span className="font-mono font-bold text-[#902A8B] dark:text-purple-400">#{toBanglaNumber(invoice.invoiceNo)}</span>
          </p>
        </div>

        {/* Invoice Summary Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 text-left text-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> ভূমি মালিক:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {invoice.customer.fullName}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> মোবাইল:
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {toBanglaNumber(invoice.customer.mobile)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">মোট ধার্যকৃত ফি:</span>
            <span className="font-bold text-slate-900 dark:text-white font-anek text-sm">
              {moneyBn(invoice.total)} ৳
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">পরিশোধিত অর্থ:</span>
            <span className="font-bold text-[#37A448] font-anek">
              {moneyBn(invoice.paidAmount ?? invoice.total)} ৳
            </span>
          </div>

          {due > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold">
              <span>বকেয়া অবশিষ্ট:</span>
              <span className="font-anek">{moneyBn(due)} ৳</span>
            </div>
          )}
        </div>

        {/* Action Buttons (F-3) */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onPrintPreview}
            className="w-full py-2.5 bg-[#37A448] hover:bg-[#2d873a] text-white rounded-xl text-xs sm:text-sm font-bold font-anek flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>চালান রসিদ প্রিন্ট ও PDF সংরক্ষণ</span>
          </button>

          <button
            type="button"
            onClick={onNewInvoice}
            className="w-full py-2.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#902A8B] dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs sm:text-sm font-bold font-anek flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>আরেকটি নতুন ইনভয়েস তৈরি করুন</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
