export type PaymentMethodType = "CASH" | "BKASH" | "NAGAD" | "BANK";

export interface PaymentMethodOption {
  id: string; // Stored in invoice.paymentMethod
  key: PaymentMethodType;
  labelBn: string;
  fullNameBn: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "নগদ (Cash)",
    key: "CASH",
    labelBn: "নগদ",
    fullNameBn: "নগদ (Cash)",
  },
  {
    id: "বিকাশ (bKash)",
    key: "BKASH",
    labelBn: "বিকাশ",
    fullNameBn: "বিকাশ (bKash)",
  },
  {
    id: "নগদ / এমএফএস (Nagad)",
    key: "NAGAD",
    labelBn: "এমএফএস",
    fullNameBn: "নগদ / এমএফএস (Nagad)",
  },
  {
    id: "ব্যাংক (Bank)",
    key: "BANK",
    labelBn: "ব্যাংক",
    fullNameBn: "ব্যাংক চালান / পে-অর্ডার",
  },
];

export function getPaymentMethodBadge(methodStr?: string): {
  label: string;
  className: string;
} {
  const norm = (methodStr || "").toLowerCase();
  if (norm.includes("bkash") || norm.includes("বিকাশ")) {
    return {
      label: "বিকাশ",
      className: "bg-pink-50 text-[#D12053] border-pink-200",
    };
  }
  if (norm.includes("bank") || norm.includes("ব্যাংক")) {
    return {
      label: "ব্যাংক",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }
  if (norm.includes("nagad") || norm.includes("উপায়") || norm.includes("rocket") || norm.includes("রকেট") || norm.includes("mfs")) {
    return {
      label: "এমএফএস",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }
  // Default: Cash (নগদ)
  return {
    label: "নগদ",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}
