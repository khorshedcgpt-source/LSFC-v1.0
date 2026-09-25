import { InvoiceRecord } from "../../utils/invoiceStore";
import { CenterReportData, DateRange, ServiceSummaryRow } from "./types";

// UTF-8 BOM to guarantee proper Bengali font rendering in MS Excel
export function exportInvoicesToCsv(invoices: InvoiceRecord[], filename = "lsfc-invoices.csv"): void {
  const headers = [
    "Invoice No",
    "Date",
    "Customer Name",
    "Mobile",
    "NID",
    "Services",
    "Govt Fee",
    "Gateway/Postal Fee",
    "Center Fee",
    "Total BDT",
    "Status",
    "Payment Method",
  ];

  const rows = invoices.map((inv) => {
    const services = inv.lines.map((l) => l.serviceName).join(" + ");
    const govtFee = inv.lines.reduce((s, l) => s + l.govtFee, 0);
    const gwFee = inv.lines.reduce((s, l) => s + (l.gatewayFee || 0) + (l.postalFee || 0), 0);
    const centerFee = inv.lines.reduce((s, l) => s + l.centerFee, 0);

    return [
      `"${inv.invoiceNo}"`,
      `"${new Date(inv.createdAt).toLocaleDateString("en-GB")}"`,
      `"${inv.customer.fullName.replace(/"/g, '""')}"`,
      `"${inv.customer.mobile}"`,
      `"${inv.customer.nidNo || ""}"`,
      `"${services.replace(/"/g, '""')}"`,
      govtFee.toFixed(2),
      gwFee.toFixed(2),
      centerFee.toFixed(2),
      inv.total.toFixed(2),
      `"${inv.status || "ACTIVE"}"`,
      `"${inv.paymentMethod || "Cash"}"`,
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function compileCenterReport(invoices: InvoiceRecord[], range: DateRange): CenterReportData {
  const activeInvoices = invoices.filter((inv) => {
    if (inv.status === "VOIDED") return false;
    const dateStr = inv.createdAt.split("T")[0];
    if (range.startDate && dateStr < range.startDate) return false;
    if (range.endDate && dateStr > range.endDate) return false;
    return true;
  });

  let totalRevenue = 0;
  let govtTotal = 0;
  let centerTotal = 0;
  let gatewayPostalTotal = 0;

  const serviceMap: Record<string, ServiceSummaryRow> = {};

  for (const inv of activeInvoices) {
    // "মোট আদায়" মানে প্রকৃতপক্ষে গ্রহীত টাকা -- বকেয়া অংশ এখানে গণনা হবে না
    totalRevenue += inv.paidAmount !== undefined ? inv.paidAmount : inv.total;

    // waterfall-ভিত্তিক কালেকশন থেকে এই ইনভয়েসের প্রকৃত collected কেন্দ্র-ফি বের করা
    // (পুরনো ইনভয়েস, যাদের "collections" নেই, তাদের জন্য fallback: পুরো centerFee ধরা হয়)
    const invoiceCenterFeeTotal = inv.lines.reduce((s, l) => s + (l.centerFee || 0), 0);
    const invoiceCenterCollected =
      inv.collections && inv.collections.length > 0
        ? inv.collections.reduce((s, c) => s + (c.centerPortion || 0), 0)
        : invoiceCenterFeeTotal;
    centerTotal += invoiceCenterCollected;

    for (const line of inv.lines) {
      const g = line.govtFee || 0;
      const gw = (line.gatewayFee || 0) + (line.postalFee || 0);
      const t = line.lineTotal || 0;
      const lineCenterFee = line.centerFee || 0;
      // এই লাইনের ভাগে (centerFee অনুপাতে) কতটুকু centerPortion আসলে কালেকশন হয়েছে
      const lineCenterCollected =
        invoiceCenterFeeTotal > 0
          ? (lineCenterFee / invoiceCenterFeeTotal) * invoiceCenterCollected
          : 0;

      govtTotal += g;
      gatewayPostalTotal += gw;

      if (!serviceMap[line.serviceName]) {
        serviceMap[line.serviceName] = {
          serviceName: line.serviceName,
          count: 0,
          govtFeeTotal: 0,
          gatewayPostalFeeTotal: 0,
          centerFeeTotal: 0,
          grandTotal: 0,
        };
      }

      serviceMap[line.serviceName].count += 1;
      serviceMap[line.serviceName].govtFeeTotal += g;
      serviceMap[line.serviceName].gatewayPostalFeeTotal += gw;
      serviceMap[line.serviceName].centerFeeTotal += lineCenterCollected;
      serviceMap[line.serviceName].grandTotal += t;
    }
  }

  return {
    range,
    totalInvoices: activeInvoices.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    govtTotal: Math.round(govtTotal * 100) / 100,
    centerTotal: Math.round(centerTotal * 100) / 100,
    gatewayPostalTotal: Math.round(gatewayPostalTotal * 100) / 100,
    serviceBreakdown: Object.values(serviceMap).map((row) => ({
      ...row,
      centerFeeTotal: Math.round(row.centerFeeTotal * 100) / 100,
    })),
    generatedAt: new Date().toISOString(),
  };
}
