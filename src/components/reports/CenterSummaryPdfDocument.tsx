import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { CenterReportData } from "./types";
import { CenterSettings } from "../../utils/institutionSettings";
import { PDF_COLORS, PDF_HEADER_STYLES, ensurePdfFontsRegistered } from "../../utils/pdfStandards";
import { toBanglaNumber, moneyBn } from "../../utils/bengaliNumbers";
import { bn, type Shaped } from "../../utils/banglaShaping/shapeTree";
import { ShapedText } from "./ShapedText";

ensurePdfFontsRegistered();

const styles = StyleSheet.create({
  ...PDF_HEADER_STYLES,
  page: {
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 28,
    fontFamily: "Kalpurush",
    fontSize: 9,
    color: PDF_COLORS.PRIMARY,
    backgroundColor: PDF_COLORS.WHITE,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: PDF_COLORS.PRIMARY,
    paddingBottom: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    marginBottom: 10,
    borderBottomWidth: 0.8,
    borderBottomColor: PDF_COLORS.PRIMARY,
    paddingBottom: 4,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: PDF_COLORS.PRIMARY,
    padding: 6,
    width: "23%",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 7.5,
    color: PDF_COLORS.PRIMARY,
    marginBottom: 2,
  },
  summaryVal: {
    fontFamily: "AnekBangla",
    fontWeight: 700,
    fontSize: 11,
    color: PDF_COLORS.SECONDARY,
  },
  table: {
    borderWidth: 1,
    borderColor: PDF_COLORS.PRIMARY,
    marginBottom: 14,
  },
  thRow: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.PRIMARY,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  thCell: {
    color: PDF_COLORS.WHITE,
    fontSize: 8,
  },
  trRow: {
    flexDirection: "row",
    borderBottomWidth: 0.8,
    borderBottomColor: PDF_COLORS.PRIMARY,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  colSl: { width: "8%", textAlign: "center" },
  colName: { width: "36%" },
  colCount: { width: "10%", textAlign: "center" },
  colGovt: { width: "15%", textAlign: "right" },
  colCenter: { width: "15%", textAlign: "right" },
  colTotal: { width: "16%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.WHITE,
    borderTopWidth: 1.2,
    borderTopColor: PDF_COLORS.PRIMARY,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 20,
    right: 20,
    borderTopWidth: 0.8,
    borderTopColor: PDF_COLORS.PRIMARY,
    paddingTop: 4,
    fontSize: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    color: PDF_COLORS.PRIMARY,
  },
});

/**
 * Every Bengali string in this document, as a data tree — mirrors the JSX
 * 1:1. Call this + shapeTree() BEFORE constructing <CenterSummaryPdfDocument>.
 */
export function buildCenterSummaryFields(data: CenterReportData, settings: CenterSettings) {
  const totalCount = data.serviceBreakdown.reduce((s, r) => s + r.count, 0);

  return {
    topGovt: bn(settings.topGovtTitle, "kalpurush", 8.5),
    brandTitle: bn(settings.orgNameBn, "anekBanglaBold", 18),
    reportTitle: bn("কেন্দ্রীয় আর্থিক ও সেবা সারাংশ বিবরণী", "anekBanglaBold", 12),

    metaPeriod: bn(
      `সময়কাল: ${data.range.startDate ? toBanglaNumber(data.range.startDate) : "শুরু"} হতে ${
        data.range.endDate ? toBanglaNumber(data.range.endDate) : "বর্তমান"
      }`,
      "kalpurush",
      8
    ),
    metaGenerated: bn(
      `তৈরির তারিখ: ${new Date(data.generatedAt).toLocaleDateString("bn-BD")}`,
      "kalpurush",
      8
    ),

    summaryInvoicesLabel: bn("মোট ইনভয়েস", "kalpurush", 7.5),
    summaryInvoicesVal: bn(`${toBanglaNumber(data.totalInvoices)} টি`, "anekBanglaBold", 11),
    summaryRevenueLabel: bn("মোট আদায়", "kalpurush", 7.5),
    summaryRevenueVal: bn(`${moneyBn(data.totalRevenue)} ৳`, "anekBanglaBold", 11),
    summaryGovtLabel: bn("সরকারি রাজস্ব ফি", "kalpurush", 7.5),
    summaryGovtVal: bn(`${moneyBn(data.govtTotal)} ৳`, "anekBanglaBold", 11),
    summaryCenterLabel: bn("কেন্দ্র সেবা মাশুল", "kalpurush", 7.5),
    summaryCenterVal: bn(`${moneyBn(data.centerTotal)} ৳`, "anekBanglaBold", 11),

    thSl: bn("নং", "kalpurush", 8),
    thName: bn("সেবার নাম", "kalpurush", 8),
    thCount: bn("আবেদন", "kalpurush", 8),
    thGovt: bn("সরকারি ফি", "kalpurush", 8),
    thCenter: bn("কেন্দ্র ফি", "kalpurush", 8),
    thTotal: bn("মোট আদায়", "kalpurush", 8),

    rows: data.serviceBreakdown.map((row, idx) => ({
      sl: bn(toBanglaNumber(idx + 1), "kalpurush", 8),
      name: bn(row.serviceName, "kalpurush", 8),
      count: bn(toBanglaNumber(row.count), "kalpurush", 8),
      govt: bn(`${moneyBn(row.govtFeeTotal)} ৳`, "kalpurush", 8),
      center: bn(`${moneyBn(row.centerFeeTotal)} ৳`, "kalpurush", 8),
      total: bn(`${moneyBn(row.grandTotal)} ৳`, "kalpurush", 8),
    })),

    totalRowSl: bn("মোট", "anekBanglaBold", 9),
    totalRowName: bn("সর্বমোট হিসাব", "anekBanglaBold", 9),
    totalRowCount: bn(toBanglaNumber(totalCount), "anekBanglaBold", 9),
    totalRowGovt: bn(`${moneyBn(data.govtTotal)} ৳`, "anekBanglaBold", 9),
    totalRowCenter: bn(`${moneyBn(data.centerTotal)} ৳`, "anekBanglaBold", 9),
    totalRowTotal: bn(`${moneyBn(data.totalRevenue)} ৳`, "anekBanglaBold", 9),

    footerOrgAddress: bn(`${settings.orgNameBn} - ${settings.address}`, "kalpurush", 7),
    // Only the word is shaped — the page numbers next to it are rendered as
    // plain <Text> inside the per-page `render` callback below, since Bengali
    // digits don't need complex shaping (no conjuncts/reordering) and
    // totalPages isn't known until react-pdf actually lays the pages out,
    // so it can't be pre-shaped.
    footerPageWord: bn("পৃষ্ঠা", "kalpurush", 7),
  };
}

export type CenterSummaryShapedFields = Shaped<ReturnType<typeof buildCenterSummaryFields>>;

export const CenterSummaryPdfDocument: React.FC<{
  data: CenterReportData;
  settings?: CenterSettings;
  shapedFields: CenterSummaryShapedFields;
}> = ({ data, shapedFields: f }) => {
  return (
    <Document title="Center-Financial-Summary">
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header}>
          <ShapedText run={f.topGovt} style={styles.topGovt} />
          <ShapedText run={f.brandTitle} style={styles.brandTitle} />
          <ShapedText run={f.reportTitle} style={styles.reportTitle} />
        </View>

        <View style={styles.metaRow}>
          <ShapedText run={f.metaPeriod} />
          <ShapedText run={f.metaGenerated} />
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <ShapedText run={f.summaryInvoicesLabel} style={styles.summaryLabel} />
            <ShapedText run={f.summaryInvoicesVal} style={styles.summaryVal} />
          </View>
          <View style={styles.summaryCard}>
            <ShapedText run={f.summaryRevenueLabel} style={styles.summaryLabel} />
            <ShapedText run={f.summaryRevenueVal} style={styles.summaryVal} />
          </View>
          <View style={styles.summaryCard}>
            <ShapedText run={f.summaryGovtLabel} style={styles.summaryLabel} />
            <ShapedText run={f.summaryGovtVal} style={styles.summaryVal} />
          </View>
          <View style={styles.summaryCard}>
            <ShapedText run={f.summaryCenterLabel} style={styles.summaryLabel} />
            <ShapedText run={f.summaryCenterVal} style={styles.summaryVal} />
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.thRow}>
            <ShapedText run={f.thSl} style={[styles.thCell, styles.colSl]} />
            <ShapedText run={f.thName} style={[styles.thCell, styles.colName]} />
            <ShapedText run={f.thCount} style={[styles.thCell, styles.colCount]} />
            <ShapedText run={f.thGovt} style={[styles.thCell, styles.colGovt]} />
            <ShapedText run={f.thCenter} style={[styles.thCell, styles.colCenter]} />
            <ShapedText run={f.thTotal} style={[styles.thCell, styles.colTotal]} />
          </View>

          {data.serviceBreakdown.map((_, idx) => {
            const r = f.rows[idx];
            return (
              <View key={idx} style={styles.trRow}>
                <ShapedText run={r.sl} style={styles.colSl} />
                <ShapedText run={r.name} style={styles.colName} />
                <ShapedText run={r.count} style={styles.colCount} />
                <ShapedText run={r.govt} style={styles.colGovt} />
                <ShapedText run={r.center} style={styles.colCenter} />
                <ShapedText run={r.total} style={[styles.colTotal, { color: PDF_COLORS.SECONDARY }]} />
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <ShapedText run={f.totalRowSl} style={styles.colSl} />
            <ShapedText run={f.totalRowName} style={styles.colName} />
            <ShapedText run={f.totalRowCount} style={styles.colCount} />
            <ShapedText run={f.totalRowGovt} style={styles.colGovt} />
            <ShapedText run={f.totalRowCenter} style={styles.colCenter} />
            <ShapedText run={f.totalRowTotal} style={[styles.colTotal, { color: PDF_COLORS.SECONDARY }]} />
          </View>
        </View>

        {/* Static parts (org/address, the word "পৃষ্ঠা") are plain `fixed` —
            they repeat identically on every page with no callback needed.
            Only the page-number digits actually change per page, so ONLY
            that piece uses a `render` callback, and it's a plain <Text>
            (no Svg/ShapedText inside a `render` callback — that combination
            is what caused "operations.forEach is not a function"). */}
        <View style={styles.footer} fixed>
          <ShapedText run={f.footerOrgAddress} />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ShapedText run={f.footerPageWord} />
            <Text
              style={{ fontSize: 7, color: PDF_COLORS.PRIMARY, marginLeft: 2 }}
              render={({ pageNumber, totalPages }: any) =>
                ` ${toBanglaNumber(pageNumber)} / ${toBanglaNumber(totalPages || 1)}`
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  );
};
