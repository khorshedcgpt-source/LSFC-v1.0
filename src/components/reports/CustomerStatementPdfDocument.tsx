import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { CustomerRecord } from "../../utils/customerStore";
import { InvoiceRecord } from "../../utils/invoiceStore";
import { CenterSettings, readSettings } from "../../utils/institutionSettings";
import { PDF_COLORS, PDF_HEADER_STYLES, ensurePdfFontsRegistered } from "../../utils/pdfStandards";
import { toBanglaNumber, moneyBn } from "../../utils/bengaliNumbers";
import { bn, type Shaped } from "../../utils/banglaShaping/shapeTree";
import { formatOwnerName } from "../../utils/banglaShaping/invoiceTextFields";
import { ShapedText, ShapedTextWrap } from "./ShapedText";

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
    marginBottom: 10,
    alignItems: "center",
  },
  customerBox: {
    borderWidth: 1,
    borderColor: PDF_COLORS.PRIMARY,
    padding: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  table: {
    borderWidth: 1,
    borderColor: PDF_COLORS.PRIMARY,
    marginBottom: 12,
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
  colInv: { width: "16%" },
  colDate: { width: "16%" },
  colServices: { width: "32%" },
  colGovt: { width: "14%", textAlign: "right" },
  colTotal: { width: "14%", textAlign: "right" },
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
 * 1:1. Call this + shapeTree() BEFORE constructing <CustomerStatementPdfDocument>.
 */
export function buildCustomerStatementFields(
  customer: CustomerRecord,
  invoices: InvoiceRecord[],
  settings: CenterSettings
) {
  const activeInvoices = invoices.filter((inv) => inv.status !== "VOIDED");
  const totalAmount = activeInvoices.reduce((s, inv) => s + inv.total, 0);
  const totalGovt = activeInvoices.reduce(
    (s, inv) => s + inv.lines.reduce((ls, l) => ls + l.govtFee, 0),
    0
  );

  return {
    topGovt: bn(settings.topGovtTitle, "kalpurush", 8.5),
    brandTitle: bn(settings.orgNameBn, "anekBanglaBold", 18),
    reportTitle: bn("ভূমি মালিক ভূমিসেবা স্টেটমেন্ট ও লেজার", "anekBanglaBold", 12),

    nameLine: bn(`নাম: ${formatOwnerName(customer.fullName)}`, "anekBanglaBold", 11),
    mobileLine: bn(`মোবাইল: ${toBanglaNumber(customer.mobile)}`, "kalpurush", 9),
    customerNumberLine: customer.customerNumber
      ? bn(`ইউনিক আইডি: ${customer.customerNumber}`, "kalpurush", 9)
      : undefined,
    addressLine: customer.address
      ? bn(`ঠিকানা: ${customer.address}`, "kalpurush", 8)
      : undefined,

    totalInvoicesLine: bn(`মোট আবেদন: ${toBanglaNumber(activeInvoices.length)} টি`, "kalpurush", 9),
    totalAmountLine: bn(`মোট প্রদেয়: ${moneyBn(totalAmount)} ৳`, "anekBanglaBold", 9),
    totalGovtLine: bn(`সরকারি ফি: ${moneyBn(totalGovt)} ৳`, "kalpurush", 9),

    thSl: bn("নং", "kalpurush", 8),
    thInv: bn("ইনভয়েস নং", "kalpurush", 8),
    thDate: bn("তারিখ", "kalpurush", 8),
    thServices: bn("সেবাসমূহ", "kalpurush", 8),
    thGovt: bn("সরকারি ফি", "kalpurush", 8),
    thTotal: bn("মোট টাকা", "kalpurush", 8),

    rows: activeInvoices.map((inv, idx) => {
      const govt = inv.lines.reduce((s, l) => s + l.govtFee, 0);
      return {
        sl: bn(toBanglaNumber(idx + 1), "kalpurush", 8),
        inv: bn(toBanglaNumber(inv.invoiceNo), "kalpurush", 8),
        date: bn(new Date(inv.createdAt).toLocaleDateString("bn-BD"), "kalpurush", 8),
        // One chip per service name (with a trailing comma baked in, except
        // the last) instead of one long joined string — lets ShapedTextWrap
        // wrap them onto multiple lines and grow the row height, instead of
        // one long <Svg> that would overflow/clip. See ShapedText.tsx.
        services: inv.lines.map((l, i) =>
          bn(l.serviceName + (i < inv.lines.length - 1 ? "," : ""), "kalpurush", 8)
        ),
        govt: bn(`${moneyBn(govt)} ৳`, "kalpurush", 8),
        total: bn(`${moneyBn(inv.total)} ৳`, "kalpurush", 8),
      };
    }),

    footerOrgAddress: bn(`${settings.orgNameBn} - ${settings.address}`, "kalpurush", 7),
    // Only the word is shaped — page numbers stay as plain <Text> in the
    // per-page `render` callback (see CenterSummaryPdfDocument.tsx for why).
    footerPageWord: bn("পৃষ্ঠা", "kalpurush", 7),
  };
}

export type CustomerStatementShapedFields = Shaped<ReturnType<typeof buildCustomerStatementFields>>;

export const CustomerStatementPdfDocument: React.FC<{
  customer: CustomerRecord;
  invoices: InvoiceRecord[];
  settings?: CenterSettings;
  shapedFields: CustomerStatementShapedFields;
}> = ({ customer, invoices, settings = readSettings(), shapedFields: f }) => {
  const activeInvoices = invoices.filter((inv) => inv.status !== "VOIDED");

  return (
    <Document title={`Statement-${customer.mobile}`}>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header}>
          {Boolean(
            (settings.displayOptions?.showLogoOnReports !== false && settings.logoUrl) ||
            settings.ministryLogoUrl
          ) ? (
            <View style={styles.headerTopRow}>
              <View style={styles.logoSlot}>
                {settings.displayOptions?.showLogoOnReports !== false && settings.logoUrl ? (
                  <Image src={settings.logoUrl} style={styles.logoImage} />
                ) : null}
              </View>
              <View style={styles.headerCenterCol}>
                <ShapedText run={f.topGovt} style={styles.topGovt} />
                <ShapedText run={f.brandTitle} style={styles.brandTitle} />
                <ShapedText run={f.reportTitle} style={styles.reportTitle} />
              </View>
              <View style={styles.logoSlotRight}>
                {settings.ministryLogoUrl ? (
                  <Image src={settings.ministryLogoUrl} style={styles.logoImage} />
                ) : null}
              </View>
            </View>
          ) : (
            <>
              <ShapedText run={f.topGovt} style={styles.topGovt} />
              <ShapedText run={f.brandTitle} style={styles.brandTitle} />
              <ShapedText run={f.reportTitle} style={styles.reportTitle} />
            </>
          )}
        </View>

        <View style={styles.customerBox}>
          <View>
            <ShapedText run={f.nameLine} />
            <ShapedText run={f.mobileLine} />
            {f.customerNumberLine && <ShapedText run={f.customerNumberLine} />}
            {f.addressLine && <ShapedText run={f.addressLine} style={{ marginTop: 1 }} />}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <ShapedText run={f.totalInvoicesLine} />
            <ShapedText run={f.totalAmountLine} />
            <ShapedText run={f.totalGovtLine} />
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.thRow}>
            <ShapedText run={f.thSl} style={[styles.thCell, styles.colSl]} />
            <ShapedText run={f.thInv} style={[styles.thCell, styles.colInv]} />
            <ShapedText run={f.thDate} style={[styles.thCell, styles.colDate]} />
            <ShapedText run={f.thServices} style={[styles.thCell, styles.colServices]} />
            <ShapedText run={f.thGovt} style={[styles.thCell, styles.colGovt]} />
            <ShapedText run={f.thTotal} style={[styles.thCell, styles.colTotal]} />
          </View>

          {activeInvoices.map((_, idx) => {
            const r = f.rows[idx];
            return (
              <View key={idx} style={styles.trRow}>
                <ShapedText run={r.sl} style={styles.colSl} />
                <ShapedText run={r.inv} style={styles.colInv} />
                <ShapedText run={r.date} style={styles.colDate} />
                <ShapedTextWrap runs={r.services} style={styles.colServices} />
                <ShapedText run={r.govt} style={styles.colGovt} />
                <ShapedText run={r.total} style={[styles.colTotal, { color: PDF_COLORS.SECONDARY }]} />
              </View>
            );
          })}
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
