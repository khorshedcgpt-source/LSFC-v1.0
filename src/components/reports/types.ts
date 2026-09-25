export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface ServiceSummaryRow {
  serviceName: string;
  count: number;
  govtFeeTotal: number;
  gatewayPostalFeeTotal: number;
  centerFeeTotal: number;
  grandTotal: number;
}

export interface CenterReportData {
  range: DateRange;
  totalInvoices: number;
  totalRevenue: number;
  govtTotal: number;
  centerTotal: number;
  gatewayPostalTotal: number;
  serviceBreakdown: ServiceSummaryRow[];
  generatedAt: string;
}
