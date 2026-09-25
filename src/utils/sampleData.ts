import { readInvoices, addInvoice } from "./invoiceStore";
import { readCustomers } from "./customerStore";
import { readExpenses, writeExpenses, ExpenseRecord } from "./expenseStore";

/**
 * Seeds initial sample data on first run (if storage is empty).
 *
 * IMPORTANT: We use addInvoice() — not writeInvoices() — for seeding so that:
 *   1. Customer is auto-created via upsertCustomer() with a UUIDv7 id.
 *   2. invoice.customer.customerId is set to that UUID.
 *   3. Invoice gets its own UUID id (independent of invoiceNo).
 *   4. Historical fee snapshot logic runs identically to real invoices.
 */
export function seedInitialDataIfEmpty(): void {
  if (typeof window === "undefined") return;

  const existingInvoices = readInvoices();
  const existingCustomers = readCustomers();
  const existingExpenses = readExpenses();

  // ---------- Sample expenses (written directly — we need mixed statuses) ----------
  if (existingExpenses.length === 0) {
    const sampleExpenses: ExpenseRecord[] = [
      {
        id: "exp-sample-01",
        date: "2026-09-11",
        title: "এ৪ সাইজ প্রিন্টার কাগজ (২ রিম)",
        category: "stationery",
        amount: 850,
        paidBy: "ইন-চার্জ",
        notes: "নমুনা এন্ট্রি",
        voucherNumber: "৪১২",
        voucherIssuerName: "মেসার্স স্টেশনারি কর্নার",
        status: "approved",
        createdBy: "ইন-চার্জ",
        approvedBy: "ইন-চার্জ",
        approvedAt: "2026-09-11T10:05:00.000Z",
        createdAt: "2026-09-11T10:00:00.000Z",
      },
      {
        id: "exp-sample-02",
        date: "2026-09-12",
        title: "প্রিন্টার ব্ল্যাক টোনার রিফিল",
        category: "printing",
        amount: 450,
        paidBy: "ক্যাশ",
        notes: "ক্যানন এলবিপি প্রিন্টার",
        status: "approved",
        createdBy: "ইন-চার্জ",
        approvedBy: "ইন-চার্জ",
        approvedAt: "2026-09-12T14:35:00.000Z",
        createdAt: "2026-09-12T14:30:00.000Z",
      },
      {
        id: "exp-sample-03",
        date: "2026-09-13",
        title: "সেন্টারের মাসিক ব্রডব্যান্ড ইন্টারনেট বিল",
        category: "utility",
        amount: 800,
        paidBy: "বিকাশ",
        notes: "ঘোগাদহ অনলাইন নেটওয়ার্ক",
        status: "pending",
        createdBy: "অপারেটর",
        createdAt: "2026-09-13T16:00:00.000Z",
      },
    ];
    writeExpenses(sampleExpenses);
  }

  // ---------- Don't seed invoices/customers if any exist ----------
  if (existingInvoices.length > 0 || existingCustomers.length > 0) {
    return;
  }

  // ---------- Sample invoices ----------
  // addInvoice() prepends to the array, so we add oldest-first to end up with
  // the final display order matching the original sample [inv1, inv2, inv3].

  // (3/3) Oldest — 12 Sep
  addInvoice({
    invoiceNo: "12092601",
    customer: {
      fullName: "জনাব খোরশেদ আলম",
      mobile: "01855667788",
      nidNo: "1978229876543",
      address: "ইউনিয়ন পরিষদ গেইট সংলগ্ন, ঘোগাদহ, কুড়িগ্রাম",
    },
    lines: [
      {
        serviceName: "মৌজা ম্যাপ / নকশা",
        govtFee: 545,
        gatewayFee: 5.45,
        postalFee: 110,
        centerFee: 100,
        lineTotal: 760.45,
        subText: "(ডাকমাশুল ১১০/- সহ)",
        applicationTrackingNo: "MAP-GHOG-015",
      },
    ],
    total: 760.45,
    createdAt: "2026-09-12T15:20:00.000Z",
    applicationTrackingNo: "MAP-GHOG-015",
    status: "ACTIVE",
    paymentMethod: "নগদ (Cash)",
  });

  // (2/3) — 13 Sep 09:40
  addInvoice({
    invoiceNo: "13092602",
    customer: {
      fullName: "মোছা: ফাতেমা বেগম",
      mobile: "01911223344",
      nidNo: "5508123456",
      address: "মৌজা: ঘোগাদহ, জেএল নং: ১৫, কুড়িগ্রাম সদর",
    },
    lines: [
      {
        serviceName: "খতিয়ান / পর্চা আবেদন",
        govtFee: 120,
        gatewayFee: 1.2,
        postalFee: 40,
        centerFee: 100,
        lineTotal: 261.2,
        subText: "ডাকযোগে ডেলিভারি (ডাক মাশুল ৳৪০)",
        applicationTrackingNo: "KHT-RS-4421",
      },
      {
        serviceName: "ভূমি উন্নয়ন কর (LD Tax)",
        govtFee: 350,
        gatewayFee: 3.5,
        postalFee: 0,
        centerFee: 40,
        lineTotal: 393.5,
        subText: "অনলাইন দাখিলা দাখিল ও প্রিন্ট কপি সহ",
      },
    ],
    total: 654.7,
    createdAt: "2026-09-13T09:40:00.000Z",
    applicationTrackingNo: "KHT-RS-4421",
    status: "ACTIVE",
    paymentMethod: "বিকাশ (bKash)",
  });

  // (1/3) Newest — 13 Sep 08:15
  addInvoice({
    invoiceNo: "13092601",
    customer: {
      fullName: "মো: রফিকুল ইসলাম",
      mobile: "01723506664",
      nidNo: "1985491234567",
      address: "গ্রাম: ঘোগাদহ, ডাকঘর: ঘোগাদহ-৫৬০০, কুড়িগ্রাম সদর",
    },
    lines: [
      {
        serviceName: "ই-নামজারি আবেদন",
        govtFee: 70,
        gatewayFee: 0.7,
        postalFee: 0,
        centerFee: 270,
        lineTotal: 340.7,
        subText: "২০ পৃষ্ঠা স্ক্যান ও ৪ আবেদনকারী অন্তর্ভুক্ত",
        applicationTrackingNo: "NAM-2026-98124",
      },
    ],
    total: 340.7,
    createdAt: "2026-09-13T08:15:00.000Z",
    applicationTrackingNo: "NAM-2026-98124",
    status: "ACTIVE",
    paymentMethod: "নগদ (Cash)",
  });
}