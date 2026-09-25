import { pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";

export async function downloadPureVectorPdf(documentElement: ReactElement, filename: string): Promise<void> {
  try {
    // Generate true vector PDF blob
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(documentElement as any).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (error) {
    console.error("Error generating vector PDF for download:", error);
    alert("পিডিএফ তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
  }
}

export async function openPdfInNewTab(documentElement: ReactElement): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(documentElement as any).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) {
    console.error("Error generating vector PDF for preview:", error);
    alert("পিডিএফ প্রিভিউ লোড করতে ব্যর্থ হয়েছে।");
  }
}

export function printElementById(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;
  window.print();
}
