// src/utils/bengaliNumbers.ts
//
// Extracted from components/InvoicePrint.tsx so both the PDF text-field
// builder (utils/banglaShaping/invoiceTextFields.ts) and InvoicePrint.tsx
// itself can import these without creating a circular import between the
// two files. InvoicePrint.tsx re-exports these names for backward
// compatibility with any other file that imports them from there.

export function toBanglaNumber(
  num: number | string | undefined | null
): string {
  if (num === undefined || num === null) return "";

  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

  return num
    .toString()
    .replace(/\d/g, (d) => bnDigits[Number.parseInt(d, 10)]);
}

export function moneyBn(val: number | undefined | null): string {
  if (val === undefined || val === null) return "০";
  return toBanglaNumber(val.toLocaleString("en-US"));
}

const BANGLA_WORDS_1_TO_99 = [
  "", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ",
  "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোল", "সতেরো", "আঠারো", "উনিশ", "বিশ",
  "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আঠাশ", "উনত্রিশ", "ত্রিশ",
  "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁইত্রিশ", "আটত্রিশ", "উনচল্লিশ", "চল্লিশ",
  "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "উনপঞ্চাশ", "পঞ্চাশ",
  "একান্ন", "বায়ান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "উনষাট", "ষাট",
  "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "উনসত্তর", "সত্তর",
  "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "উনআশি", "আশি",
  "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "আটাশি", "উননব্বই", "নব্বই",
  "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই"
];

function convertUnder1000ToBanglaWords(n: number): string {
  const parts: string[] = [];
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;

  if (hundred > 0) {
    parts.push((BANGLA_WORDS_1_TO_99[hundred] || "") + "শত");
  }
  if (remainder > 0) {
    parts.push(BANGLA_WORDS_1_TO_99[remainder] || "");
  }
  return parts.filter(Boolean).join(" ");
}

function convertIntegerToBanglaWords(n: number): string {
  if (n === 0) return "";
  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const remainder = n;

  if (crore > 0) {
    parts.push(convertIntegerToBanglaWords(crore) + " কোটি");
  }
  if (lakh > 0) {
    parts.push((BANGLA_WORDS_1_TO_99[lakh] || convertIntegerToBanglaWords(lakh)) + " লক্ষ");
  }
  if (thousand > 0) {
    parts.push((BANGLA_WORDS_1_TO_99[thousand] || convertIntegerToBanglaWords(thousand)) + " হাজার");
  }
  if (remainder > 0) {
    parts.push(convertUnder1000ToBanglaWords(remainder));
  }

  return parts.filter(Boolean).join(" ");
}

export function numberToBanglaWords(num: number | undefined | null): string {
  if (num === null || num === undefined || Number.isNaN(Number(num)) || Number(num) === 0) {
    return "শূন্য টাকা মাত্র";
  }

  const absNum = Math.abs(Number(num));
  const integerPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - integerPart) * 100);

  const integerWords = convertIntegerToBanglaWords(integerPart);
  const decimalWords = decimalPart > 0 ? (BANGLA_WORDS_1_TO_99[decimalPart] || "") : "";

  let result = "";
  if (integerWords && decimalWords) {
    result = `${integerWords} টাকা ${decimalWords} পয়সা মাত্র`;
  } else if (integerWords) {
    result = `${integerWords} টাকা মাত্র`;
  } else if (decimalWords) {
    result = `${decimalWords} পয়সা মাত্র`;
  } else {
    result = "শূন্য টাকা মাত্র";
  }

  return result.trim();
}
