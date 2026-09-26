import React, { useState } from "react";
import { Document, Page, View, StyleSheet, Image, Svg, Path } from "@react-pdf/renderer";
import { Phone, Mail } from "lucide-react";
import { InvoiceRecord } from "../utils/invoiceStore";
import { CenterSettings, readSettings } from "../utils/institutionSettings";
import { PDF_COLORS, ensurePdfFontsRegistered } from "../utils/pdfStandards";
import { downloadPureVectorPdf } from "../utils/printPdfUtils";
import { ShapedText } from "./reports/ShapedText";
import {
  buildInvoiceTextFields,
  shapeInvoiceTextFields,
  formatOwnerName,
  type ShapedInvoiceTextFields,
} from "../utils/banglaShaping/invoiceTextFields";
import { toBanglaNumber, moneyBn, numberToBanglaWords } from "../utils/bengaliNumbers";
import { formatInvoiceSubtitle } from "../utils/serviceCalculator";
import { cleanPhone, findCustomerByPhoneOrNid } from "../utils/customerStore";
import { LsfcVectorLogo, LsfcOfficialSeal } from "./LsfcVectorLogo";

ensurePdfFontsRegistered();

// Re-exported for backward compatibility with any other file that was
// importing these from InvoicePrint.tsx directly. The actual definitions
// now live in utils/bengaliNumbers.ts (moved there to avoid a circular
// import with utils/banglaShaping/invoiceTextFields.ts).
export { toBanglaNumber, moneyBn, numberToBanglaWords };

const styles = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingBottom: 25,
    paddingHorizontal: 22,
    fontSize: 8.5,
    fontFamily: "Kalpurush",
    backgroundColor: PDF_COLORS.WHITE,
    color: PDF_COLORS.PRIMARY,
    lineHeight: 1.4,
  },
  headerBox: {
    borderBottomWidth: 1.5,
    borderBottomColor: PDF_COLORS.PRIMARY,
    paddingBottom: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 2,
  },
  logoSlot: {
    width: 36,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logoSlotRight: {
    width: 36,
    height: 36,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerCenterCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  logoImage: {
    width: 34,
    height: 34,
    objectFit: "contain",
  },
  topGovt: {
    fontSize: 7.5,
    color: PDF_COLORS.SECONDARY,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
    marginBottom: 2,
  },
  brandTitle: {
    fontSize: 14,
    fontFamily: "AnekBangla",
    fontWeight: 700,
    color: PDF_COLORS.PRIMARY,
    lineHeight: 1.3,
    textAlign: "center",
  },
  tagline: {
    fontSize: 7.5,
    color: PDF_COLORS.PRIMARY,
    marginTop: 1,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
  },
  subHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 4,
    paddingTop: 2,
    borderTopWidth: 0.5,
    borderTopColor: "#EAD6E8",
  },
  subHeaderLeft: {
    color: PDF_COLORS.PRIMARY,
    fontFamily: "Kalpurush",
    fontSize: 7.2,
    lineHeight: 1.2,
  },
  subHeaderContacts: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactIcon: {
    width: 6.5,
    height: 6.5,
    marginTop: 0.5,
  },
  contactText: {
    color: PDF_COLORS.SECONDARY,
    fontFamily: "Kalpurush",
    fontSize: 7.2,
    marginLeft: 2.5,
    lineHeight: 1.2,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FBF7FC",
    padding: 6,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#EAD6E8",
  },
  metaColumn: {
    width: "48%",
  },
  metaColumnLeft: {
    width: "53%",
  },
  metaColumnRight: {
    width: "45%",
    alignItems: "flex-end",
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  metaRowLeft: {
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "center",
  },
  metaRowRight: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
    alignItems: "center",
  },
  metaLabel: {
    width: 65,
    fontSize: 8,
    color: PDF_COLORS.PRIMARY,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
  },
  metaLabelLeft: {
    width: 72,
    fontSize: 8,
    color: PDF_COLORS.PRIMARY,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
  },
  metaVal: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
    color: PDF_COLORS.PRIMARY,
  },
  metaValLeft: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
    color: PDF_COLORS.PRIMARY,
  },
  metaLabelRight: {
    fontSize: 8,
    color: PDF_COLORS.PRIMARY,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
    marginRight: 4,
  },
  metaValRight: {
    fontSize: 8,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
    color: PDF_COLORS.PRIMARY,
    textAlign: "right",
  },
  metaValCol: {
    flex: 1,
    flexDirection: "column",
  },
  metaValText: {
    fontSize: 8,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
    color: PDF_COLORS.PRIMARY,
  },
  metaTimeText: {
    fontSize: 7.2,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
    color: PDF_COLORS.PRIMARY,
    marginTop: 2,
  },
  table: {
    width: "100%",
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.PRIMARY,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.PRIMARY,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  thText: {
    color: PDF_COLORS.WHITE,
    fontSize: 7.5,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#EAD6E8",
    paddingVertical: 3.5,
    paddingHorizontal: 4,
  },
  colSl: { width: "6%", textAlign: "center" },
  colService: { width: "44%", paddingRight: 4 },
  colGovt: { width: "12.5%", textAlign: "right" },
  colGateway: { width: "12.5%", textAlign: "right" },
  colCenter: { width: "12.5%", textAlign: "right" },
  colTotal: { width: "12.5%", textAlign: "right" },
  cellText: {
    fontSize: 8,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
    color: PDF_COLORS.PRIMARY,
  },
  subText: {
    fontSize: 6.5,
    color: PDF_COLORS.PRIMARY,
    opacity: 0.75,
    marginTop: 1,
    fontFamily: "Kalpurush",
    lineHeight: 1.2,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  stampCol: {
    width: "47%",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 3,
    paddingRight: 6,
  },
  stampBox: {
    borderWidth: 1.2,
    borderRadius: 3,
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    alignSelf: "flex-start",
  },
  stampText: {
    fontSize: 8.5,
    fontFamily: "AnekBangla",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  stampNoteText: {
    fontSize: 6.2,
    fontFamily: "Kalpurush",
    color: PDF_COLORS.PRIMARY,
    lineHeight: 1.25,
  },
  totalBox: {
    width: "51%",
    borderWidth: 0.5,
    borderColor: PDF_COLORS.PRIMARY,
    padding: 5,
    backgroundColor: "#FBF7FC",
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    fontSize: 8,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
  },
  grandTotalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.PRIMARY,
    paddingTop: 3,
    marginTop: 2,
  },
  grandTotalText: {
    fontSize: 8.5,
    fontFamily: "Kalpurush",
    color: PDF_COLORS.SECONDARY,
    lineHeight: 1.3,
  },
  inWordsBox: {
    backgroundColor: "#F4FAF5",
    padding: 5,
    borderRadius: 3,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: PDF_COLORS.SECONDARY,
  },
  inWordsText: {
    fontSize: 8,
    color: PDF_COLORS.SECONDARY,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
  },
  signSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
    paddingHorizontal: 15,
  },
  signBox: {
    alignItems: "center",
    width: 120,
    justifyContent: "flex-end",
  },
  signAreaPlaceholder: {
    height: 24,
  },
  signLine: {
    borderTopWidth: 0.8,
    borderTopColor: PDF_COLORS.PRIMARY,
    width: "100%",
    paddingTop: 3,
    textAlign: "center",
    fontSize: 7.5,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
    color: PDF_COLORS.PRIMARY,
  },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 20,
    right: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#EAD6E8",
    paddingTop: 3,
    fontSize: 6.5,
    flexDirection: "row",
    justifyContent: "space-between",
    color: PDF_COLORS.PRIMARY,
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
  },
  footerText: {
    fontFamily: "Kalpurush",
    lineHeight: 1.3,
    fontSize: 6.5,
    color: PDF_COLORS.PRIMARY,
  },
  footerUserBadge: {
    backgroundColor: "#F4FAF5",
    borderWidth: 0.6,
    borderColor: PDF_COLORS.SECONDARY,
    borderRadius: 3,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    alignSelf: "center",
  },
  footerUserText: {
    fontFamily: "Kalpurush",
    lineHeight: 1.2,
    fontSize: 8.0,
    color: PDF_COLORS.SECONDARY,
  },
});

/**
 * Pure PDF template. Renders ONLY from pre-shaped data (`shapedFields`) —
 * it does no Bengali text processing itself, so it stays fully
 * synchronous. Build `shapedFields` with:
 *
 *   const fields = buildInvoiceTextFields(invoice, settings);
 *   const shapedFields = await shapeInvoiceTextFields(fields);
 *
 * BEFORE constructing this element (see handleDownloadVectorPdf below).
 */
export const VectorPdfDocument: React.FC<{
  invoice: InvoiceRecord;
  settings?: CenterSettings;
  shapedFields: ShapedInvoiceTextFields;
}> = ({ invoice, settings = readSettings(), shapedFields: f }) => {
  const isCompact = invoice.lines.length >= 5;
  const isUltraCompact = invoice.lines.length >= 8;
  const isDueTemporary =
    (invoice.dueAmount !== undefined && invoice.dueAmount > 0) ||
    invoice.paymentStatus === "PARTIAL";

  return (
    <Document title={`Invoice-${invoice.invoiceNo}`}>
      <Page
        size="A5"
        orientation="portrait"
        style={[
          styles.page,
          isUltraCompact
            ? { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22 }
            : isCompact
            ? { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24 }
            : undefined,
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.headerBox,
            isUltraCompact
              ? { marginBottom: 3, paddingBottom: 3 }
              : isCompact
              ? { marginBottom: 5, paddingBottom: 4 }
              : undefined,
          ]}
        >
          {Boolean(
            (settings.displayOptions?.showLogoOnInvoice !== false && settings.logoUrl) ||
            settings.ministryLogoUrl
          ) ? (
            <View style={styles.headerTopRow}>
              <View style={styles.logoSlot}>
                {settings.displayOptions?.showLogoOnInvoice !== false && settings.logoUrl ? (
                  <Image src={settings.logoUrl} style={styles.logoImage} />
                ) : null}
              </View>
              <View style={styles.headerCenterCol}>
                <ShapedText run={f.topGovt} style={styles.topGovt} />
                <ShapedText run={f.brandTitle} style={styles.brandTitle} />
                {f.tagline && <ShapedText run={f.tagline} style={styles.tagline} />}
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
              {f.tagline && <ShapedText run={f.tagline} style={styles.tagline} />}
            </>
          )}

          <View style={styles.subHeaderRow}>
            <ShapedText run={f.subHeaderLeft} style={styles.subHeaderLeft} />
            <View style={styles.subHeaderContacts}>
              <View style={styles.contactItem}>
                <Svg width={6.5} height={6.5} viewBox="0 0 24 24" style={styles.contactIcon}>
                  <Path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    stroke={PDF_COLORS.SECONDARY}
                    strokeWidth={2}
                    fill="none"
                  />
                </Svg>
                <ShapedText run={f.contactMobile} style={styles.contactText} />
              </View>
              <View style={[styles.contactItem, { marginLeft: 8 }]}>
                <Svg width={6.5} height={6.5} viewBox="0 0 24 24" style={styles.contactIcon}>
                  <Path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    stroke={PDF_COLORS.SECONDARY}
                    strokeWidth={2}
                    fill="none"
                  />
                  <Path d="m22 6-10 7L2 6" stroke={PDF_COLORS.SECONDARY} strokeWidth={2} fill="none" />
                </Svg>
                <ShapedText run={f.contactEmail} style={styles.contactText} />
              </View>
            </View>
          </View>
        </View>

        {/* Customer & Invoice Metadata */}
        <View
          style={[
            styles.metaGrid,
            isUltraCompact
              ? { padding: 3.5, marginBottom: 4 }
              : isCompact
              ? { padding: 4.5, marginBottom: 5 }
              : undefined,
          ]}
        >
          {/* Left Column: Customer details (Left Aligned) */}
          <View style={styles.metaColumnLeft}>
            <View style={styles.metaRowLeft}>
              <ShapedText run={f.metaCustomerLabel} style={styles.metaLabelLeft} />
              <ShapedText run={f.metaCustomerVal} style={styles.metaValLeft} />
            </View>
            <View style={styles.metaRowLeft}>
              <ShapedText run={f.metaMobileLabel} style={styles.metaLabelLeft} />
              <ShapedText run={f.metaMobileVal} style={styles.metaValLeft} />
            </View>
            {f.metaUniqueIdLabel && f.metaUniqueIdVal && (
              <View style={styles.metaRowLeft}>
                <ShapedText run={f.metaUniqueIdLabel} style={styles.metaLabelLeft} />
                <ShapedText run={f.metaUniqueIdVal} style={[styles.metaValLeft, { fontSize: 6.8 }]} />
              </View>
            )}
          </View>

          {/* Right Column: Invoice details (Right Aligned) */}
          <View style={styles.metaColumnRight}>
            <View style={styles.metaRowRight}>
              <ShapedText run={f.metaInvoiceNoLabel} style={styles.metaLabelRight} />
              <ShapedText run={f.metaInvoiceNoVal} style={styles.metaValRight} />
            </View>
            <View style={[styles.metaRowRight, { alignItems: "flex-start" }]}>
              <ShapedText run={f.metaDateLabel} style={styles.metaLabelRight} />
              <View style={{ alignItems: "flex-end" }}>
                <ShapedText run={f.metaDateVal} style={styles.metaValRight} />
                <ShapedText run={f.metaTimeVal} style={[styles.metaValRight, { fontSize: 6.8, color: "#555", marginTop: 1 }]} />
              </View>
            </View>
            {f.metaTrackingLabel && f.metaTrackingVal && (
              <View style={styles.metaRowRight}>
                <ShapedText run={f.metaTrackingLabel} style={styles.metaLabelRight} />
                <ShapedText run={f.metaTrackingVal} style={styles.metaValRight} />
              </View>
            )}
          </View>
        </View>

        {/* Services Table */}
        <View
          style={[
            styles.table,
            isUltraCompact ? { marginBottom: 3 } : isCompact ? { marginBottom: 4 } : undefined,
          ]}
        >
          <View
            style={[
              styles.tableHeader,
              isUltraCompact
                ? { paddingVertical: 2.5, paddingHorizontal: 3 }
                : isCompact
                ? { paddingVertical: 3, paddingHorizontal: 4 }
                : undefined,
            ]}
          >
            <ShapedText run={f.thSl} style={[styles.thText, styles.colSl]} />
            <ShapedText run={f.thService} style={[styles.thText, styles.colService]} />
            <ShapedText run={f.thGovt} style={[styles.thText, styles.colGovt]} />
            <ShapedText run={f.thGateway} style={[styles.thText, styles.colGateway]} />
            <ShapedText run={f.thCenter} style={[styles.thText, styles.colCenter]} />
            <ShapedText run={f.thTotal} style={[styles.thText, styles.colTotal]} />
          </View>

          {invoice.lines.map((_line, idx) => {
            const lf = f.lines[idx];
            return (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  isUltraCompact
                    ? { paddingVertical: 1.8, paddingHorizontal: 3 }
                    : isCompact
                    ? { paddingVertical: 2.5, paddingHorizontal: 4 }
                    : undefined,
                ]}
              >
                <ShapedText run={lf.sl} style={[styles.colSl, styles.cellText]} />
                <View style={styles.colService}>
                  <ShapedText run={lf.service} style={[styles.cellText, { color: PDF_COLORS.PRIMARY }]} />
                  {lf.sub && (
                    <ShapedText
                      run={lf.sub}
                      style={[styles.subText, isUltraCompact ? { fontSize: 5.8 } : undefined]}
                    />
                  )}
                </View>
                <ShapedText run={lf.govt} style={[styles.colGovt, styles.cellText]} />
                <ShapedText run={lf.gateway} style={[styles.colGateway, styles.cellText]} />
                <ShapedText run={lf.center} style={[styles.colCenter, styles.cellText]} />
                <ShapedText
                  run={lf.total}
                  style={[styles.colTotal, styles.cellText, { color: PDF_COLORS.SECONDARY }]}
                />
              </View>
            );
          })}
        </View>

        {/* Totals Summary with Official Stamp on Left */}
        <View
          style={[
            styles.totalSection,
            isUltraCompact ? { marginBottom: 3 } : isCompact ? { marginBottom: 4 } : undefined,
          ]}
        >
          {/* Stamp Column */}
          <View style={styles.stampCol}>
            <View
              style={[
                styles.stampBox,
                {
                  borderColor: isDueTemporary ? PDF_COLORS.THIRD : PDF_COLORS.SECONDARY,
                  backgroundColor: isDueTemporary ? "#FFF5F5" : "#F4FAF5",
                },
              ]}
            >
              <ShapedText
                run={f.stampText}
                style={[
                  styles.stampText,
                  { color: isDueTemporary ? PDF_COLORS.THIRD : PDF_COLORS.SECONDARY },
                ]}
              />
            </View>
            {f.stampNoteLine1 && f.stampNoteLine2 ? (
              <View style={{ marginTop: 2.5 }}>
                <ShapedText
                  run={f.stampNoteLine1}
                  style={[
                    styles.stampNoteText,
                    isUltraCompact ? { fontSize: 5.6 } : undefined,
                  ]}
                />
                <ShapedText
                  run={f.stampNoteLine2}
                  style={[
                    styles.stampNoteText,
                    { marginTop: 1 },
                    isUltraCompact ? { fontSize: 5.6 } : undefined,
                  ]}
                />
              </View>
            ) : f.stampNote ? (
              <ShapedText
                run={f.stampNote}
                style={[
                  styles.stampNoteText,
                  isUltraCompact ? { fontSize: 5.8, marginTop: 2 } : undefined,
                ]}
              />
            ) : null}
          </View>

          {/* Amount Box */}
          <View
            style={[
              styles.totalBox,
              isUltraCompact ? { padding: 3.5 } : isCompact ? { padding: 4 } : undefined,
            ]}
          >
            <View style={styles.totalLine}>
              <ShapedText run={f.totalGovtLabel} style={styles.cellText} />
              <ShapedText run={f.totalGovtVal} style={styles.cellText} />
            </View>
            {f.totalPostalLabel && f.totalPostalVal && (
              <View style={styles.totalLine}>
                <ShapedText run={f.totalPostalLabel} style={styles.cellText} />
                <ShapedText run={f.totalPostalVal} style={styles.cellText} />
              </View>
            )}
            {f.totalGatewayLabel && f.totalGatewayVal && (
              <View style={styles.totalLine}>
                <ShapedText run={f.totalGatewayLabel} style={styles.cellText} />
                <ShapedText run={f.totalGatewayVal} style={styles.cellText} />
              </View>
            )}
            <View style={styles.totalLine}>
              <ShapedText run={f.totalCenterLabel} style={styles.cellText} />
              <ShapedText run={f.totalCenterVal} style={styles.cellText} />
            </View>
            <View style={styles.grandTotalLine}>
              <ShapedText run={f.grandTotalLabel} style={styles.grandTotalText} />
              <ShapedText run={f.grandTotalVal} style={styles.grandTotalText} />
            </View>
            {f.paidAmountLabel && f.paidAmountVal && (
              <View
                style={[
                  styles.totalLine,
                  { marginTop: 2, paddingTop: 2, borderTopWidth: 0.5, borderTopColor: "#EAD6E8" },
                ]}
              >
                <ShapedText run={f.paidAmountLabel} style={styles.cellText} />
                <ShapedText run={f.paidAmountVal} style={styles.cellText} />
              </View>
            )}
          </View>
        </View>

        {/* Amount in words */}
        <View
          style={[
            styles.inWordsBox,
            isUltraCompact
              ? { padding: 3, marginBottom: 4 }
              : isCompact
              ? { padding: 3.5, marginBottom: 6 }
              : undefined,
          ]}
        >
          <ShapedText run={f.inWords} style={styles.inWordsText} />
        </View>

        {/* Signature Area */}
        <View
          style={[
            styles.signSection,
            isUltraCompact
              ? { marginTop: 4, paddingHorizontal: 10 }
              : isCompact
              ? { marginTop: 6, paddingHorizontal: 12 }
              : undefined,
          ]}
        >
          <View style={styles.signBox}>
            <View
              style={[
                styles.signAreaPlaceholder,
                isUltraCompact ? { height: 10 } : isCompact ? { height: 14 } : undefined,
              ]}
            />
            <ShapedText run={f.signCustomer} style={styles.signLine} />
          </View>
          <View style={styles.signBox}>
            {settings.inchargeSignatureUrl ? (
              <Image
                src={settings.inchargeSignatureUrl}
                style={{
                  width: isUltraCompact ? 55 : 70,
                  height: isUltraCompact ? 16 : 22,
                  marginBottom: 2,
                  alignSelf: "center",
                }}
              />
            ) : (
              <View
                style={[
                  styles.signAreaPlaceholder,
                  isUltraCompact ? { height: 10 } : isCompact ? { height: 14 } : undefined,
                ]}
              />
            )}
            <ShapedText run={f.signAuthority} style={styles.signLine} />
          </View>
        </View>

        {/* Absolute Footer */}
        <View style={styles.footer}>
          <ShapedText run={f.footerAddress} style={styles.footerText} />
          <View style={styles.footerUserBadge}>
            <ShapedText run={f.footerUser} style={styles.footerUserText} />
          </View>
          <ShapedText run={f.footerWebsite} style={styles.footerText} />
        </View>
      </Page>
    </Document>
  );
};

interface InvoicePrintProps {
  invoice: InvoiceRecord;
  onClose?: () => void;
  settings?: CenterSettings;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({
  invoice,
  onClose,
  settings = readSettings(),
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadVectorPdf = async () => {
    setDownloading(true);
    try {
      const fields = buildInvoiceTextFields(invoice, settings);
      const shapedFields = await shapeInvoiceTextFields(fields);

      await downloadPureVectorPdf(
        <VectorPdfDocument invoice={invoice} settings={settings} shapedFields={shapedFields} />,
        `Invoice-${invoice.invoiceNo}.pdf`
      );
    } catch (err) {
      console.error("Vector PDF generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleNativePrint = async () => {
    // For a true A5 print (not browser's default A4 HTML print), open the
    // vector PDF in a new tab. The user prints directly from the PDF viewer
    // — this gives pixel-perfect A5 layout, 1 page per invoice, and correct
    // Bengali shaping.
    setDownloading(true);
    try {
      const fields = buildInvoiceTextFields(invoice, settings);
      const shapedFields = await shapeInvoiceTextFields(fields);

      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(
        <VectorPdfDocument invoice={invoice} settings={settings} shapedFields={shapedFields} />
      ).toBlob();
      const url = URL.createObjectURL(blob);

      // Open in new tab — user can then use Ctrl+P from the PDF viewer
      const win = window.open(url, "_blank");
      if (!win) {
        // Popup blocked — fall back to download
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice-${invoice.invoiceNo}.pdf`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Print via PDF failed:", err);
      alert("পিডিএফ তৈরি করতে সমস্যা হয়েছে।");
    } finally {
      setDownloading(false);
    }
  };

  const govtTotal = invoice.lines.reduce((acc, curr) => acc + (curr.govtFee || 0), 0);
  const gatewayTotal = invoice.lines.reduce((acc, curr) => acc + (curr.gatewayFee || 0), 0);
  const postalTotal = invoice.lines.reduce((acc, curr) => acc + (curr.postalFee || 0), 0);
  const centerTotal = invoice.lines.reduce((acc, curr) => acc + (curr.centerFee || 0), 0);

  const display = settings.displayOptions || {
    showLogoOnInvoice: true,
    showAddress: true,
    showEmail: true,
    showWebsite: true,
    showFacebook: true,
    showPhone: true,
    showTagline: true,
  };

  const invoiceDateObj = new Date(invoice.createdAt);
  const formattedDate = invoiceDateObj.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  let formattedTime = invoiceDateObj.toLocaleTimeString("bn-BD", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  formattedTime = formattedTime.replace(/AM/i, "পূর্বাহ্ন").replace(/PM/i, "অপরাহ্ন");

  const linkedCustomer = findCustomerByPhoneOrNid(
    invoice.customer.mobile,
    invoice.customer.fullName
  );
  const uniqueId = linkedCustomer?.customerNumber || "";

  return (
    <div id="invoice-print-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div id="invoice-container-card" className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Modal Action Bar (প্রিন্টের সময় এটি হাইড হয়ে যাবে print:hidden দিয়ে) */}
        <div id="invoice-action-bar" className="flex items-center justify-between px-4 py-3 bg-[#902A8B] text-white print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold">ইনভয়েস ভেক্টর প্রিভিউ (A5)</span>
            <span className="text-xs bg-[#37A448] px-2 py-0.5 rounded text-white font-medium">
              টেক্সট সিলেক্টেবল
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              id="download-vector-pdf-btn"
              onClick={handleDownloadVectorPdf}
              disabled={downloading}
              className="px-3 py-1.5 bg-[#37A448] hover:bg-[#2e8b3c] text-white text-xs font-semibold rounded shadow transition flex items-center space-x-1 disabled:opacity-50"
            >
              <span>{downloading ? "পিডিএফ তৈরি হচ্ছে..." : "পিডিএফ ডাউনলোড"}</span>
            </button>
            <button
              id="native-print-btn"
              onClick={handleNativePrint}
              disabled={downloading}
              className="px-3 py-1.5 bg-white text-[#902A8B] hover:bg-purple-50 text-xs font-semibold rounded shadow transition disabled:opacity-50"
            >
              {downloading ? "প্রস্তুত হচ্ছে..." : "প্রিন্ট (PDF)"}
            </button>
            {onClose && (
              <button
                id="close-invoice-btn"
                onClick={onClose}
                className="px-2.5 py-1.5 bg-purple-900/50 hover:bg-purple-900 text-white text-xs rounded transition"
              >
                বন্ধ
              </button>
            )}
          </div>
        </div>

        {/* Invoice Printable Sheet (এখানে print: ক্লাসগুলো যুক্ত করা হয়েছে) */}
        <div id="printable-invoice" className="p-6 sm:p-8 overflow-y-auto flex-1 font-['Kalpurush'] text-[#902A8B] print:p-6 print:overflow-visible print:text-black">
          
          {/* Header */}
          <div className="text-center border-b-2 border-[#902A8B] print:border-black pb-3 mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="w-12 h-12 flex items-center justify-start shrink-0">
                {display.showLogoOnInvoice && (
                  settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Center Logo" className="max-h-11 max-w-11 object-contain print:grayscale" />
                  ) : (
                    <LsfcVectorLogo size={40} className="print:grayscale" />
                  )
                )}
              </div>

              <div className="flex-1 px-2 text-center">
                <p className="text-xs text-[#37A448] print:text-black font-medium leading-none mb-1">
                  {settings.topGovtTitle}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold font-['AnekBangla'] tracking-wide text-[#902A8B] print:text-black leading-none">
                  {settings.orgNameBn}
                </h1>
                {display.showTagline && settings.taglineBn && (
                  <p className="text-xs text-gray-600 print:text-black mt-1">{settings.taglineBn}</p>
                )}
              </div>

              <div className="w-12 h-12 flex items-center justify-end shrink-0">
                {settings.ministryLogoUrl ? (
                  <img src={settings.ministryLogoUrl} alt="Ministry Logo" className="max-h-11 max-w-11 object-contain print:grayscale" />
                ) : (
                  <div className="w-10 h-10" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs mt-2 pt-1 border-t border-purple-100 print:border-black text-gray-700 print:text-black">
              <span className="leading-normal">
                পরিচালনায়: {settings.partnerOrg} (অনুমতিপত্র নম্বর: {toBanglaNumber(settings.licenseNo || "০২")})
              </span>
              <div className="flex items-center space-x-3 text-xs text-[#37A448] print:text-black leading-normal">
                <div className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{toBanglaNumber(settings.mobile || "01723506664")}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>{settings.email || "info.kclbd@gmail.com"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice & Customer Meta */}
          <div className="grid grid-cols-2 gap-4 bg-[#FBF7FC] print:bg-transparent p-3 rounded-lg border border-purple-100 print:border-black text-xs mb-4">
            {/* Left Column: Customer details (Left Aligned) */}
            <div className="space-y-1">
              <div className="flex">
                <span className="w-28 text-[#902A8B] print:text-black">ভূমি মালিকের নাম:</span>
                <span className="font-semibold text-gray-900 print:text-black">
                  {formatOwnerName(invoice.customer.fullName)}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-[#902A8B] print:text-black">মোবাইল নম্বর:</span>
                <span className="print:text-black">{toBanglaNumber(invoice.customer.mobile)}</span>
              </div>
              {uniqueId && (
                <div className="flex">
                  <span className="w-28 text-[#902A8B] print:text-black">ইউনিক আইডি:</span>
                  <span className="font-mono text-gray-700 print:text-black">{uniqueId}</span>
                </div>
              )}
            </div>

            {/* Right Column: Invoice details (Right Aligned) */}
            <div className="space-y-1 text-right">
              <div className="flex justify-end">
                <span className="text-[#902A8B] print:text-black mr-2">ইনভয়েস নং:</span>
                <span className="font-semibold text-[#902A8B] print:text-black">{toBanglaNumber(invoice.invoiceNo)}</span>
              </div>
              <div className="flex justify-end items-start">
                <span className="text-[#902A8B] print:text-black mr-2 shrink-0">তারিখ ও সময়:</span>
                <div className="flex flex-col items-end">
                  <span className="text-gray-900 print:text-black leading-tight">{formattedDate}</span>
                  <span className="text-[11px] text-gray-500 print:text-black mt-0.5 leading-tight">সময়: {formattedTime}</span>
                </div>
              </div>
              {invoice.applicationTrackingNo && (
                <div className="flex justify-end">
                  <span className="text-[#902A8B] print:text-black mr-2">ট্র্যাকিং নং:</span>
                  <span className="font-semibold text-[#37A448] print:text-black">{toBanglaNumber(invoice.applicationTrackingNo)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Services Table */}
          <div className="border border-[#902A8B] print:border-black rounded overflow-hidden mb-4">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#902A8B] text-white print:bg-transparent print:text-black print:border-b-2 print:border-black">
                <tr>
                  <th className="py-2 px-2 text-center w-8">নং</th>
                  <th className="py-2 px-2">সেবার বিবরণ</th>
                  <th className="py-2 px-2 text-right">সরকারি ফি</th>
                  <th className="py-2 px-2 text-right">গেটওয়ে ফি</th>
                  <th className="py-2 px-2 text-right">কেন্দ্র ফি</th>
                  <th className="py-2 px-2 text-right">মোট টাকা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 print:divide-gray-400 text-gray-800 print:text-black">
                {invoice.lines.map((l, idx) => {
                  const formattedSub = formatInvoiceSubtitle(l.serviceName, l.subText);
                  return (
                    <tr key={idx} className="hover:bg-purple-50/50">
                      <td className="py-2 px-2 text-center text-gray-500 print:text-black">{toBanglaNumber(idx + 1)}</td>
                      <td className="py-2 px-2">
                        <div className="font-semibold text-[#902A8B] print:text-black">{l.serviceName}</div>
                        {formattedSub && <div className="text-[10px] text-gray-500 print:text-black">{formattedSub}</div>}
                      </td>
                      <td className="py-2 px-2 text-right">{moneyBn(l.govtFee)} ৳</td>
                      <td className="py-2 px-2 text-right">{moneyBn(l.gatewayFee || 0)} ৳</td>
                      <td className="py-2 px-2 text-right">{moneyBn(l.centerFee)} ৳</td>
                      <td className="py-2 px-2 text-right font-semibold text-[#37A448] print:text-black">{moneyBn(l.lineTotal)} ৳</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary & Stamp Section */}
          <div className="flex justify-between items-start mb-4 gap-4">
            {/* Stamp Card on Left */}
            <div className="flex-1 max-w-[280px]">
              <div
                className={`inline-block px-3 py-1.5 rounded border-2 font-anek font-bold text-xs tracking-wider shadow-2xs ${
                  (invoice.dueAmount !== undefined && invoice.dueAmount > 0) ||
                  invoice.paymentStatus === "PARTIAL"
                    ? "border-[#EC2324] text-[#EC2324] bg-red-50/70"
                    : "border-[#37A448] text-[#37A448] bg-emerald-50/70"
                }`}
              >
                {(invoice.dueAmount !== undefined && invoice.dueAmount > 0) ||
                invoice.paymentStatus === "PARTIAL"
                  ? "সাময়িক রসিদ (TEMPORARY)"
                  : "সম্পূর্ণ পরিশোধিত (PAID)"}
              </div>
              {((invoice.dueAmount !== undefined && invoice.dueAmount > 0) ||
                invoice.paymentStatus === "PARTIAL") && (
                <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
                  এটি সাময়িক রসিদ। অবশিষ্ট পরিশোধ সাপেক্ষে চূড়ান্ত রসিদ ও মূল সেবা ডেলিভারি প্রদান করা হবে।
                </p>
              )}
            </div>

            {/* Summary Cards */}
            <div className="w-72 bg-[#FBF7FC] print:bg-transparent border border-[#902A8B]/30 print:border-black rounded p-3 text-xs space-y-1.5 shrink-0">
              <div className="flex justify-between text-gray-600 print:text-black">
                <span>মোট সরকারি ফি:</span>
                <span>{moneyBn(govtTotal)} ৳</span>
              </div>
              {postalTotal > 0 && (
                <div className="flex justify-between text-gray-600 print:text-black">
                  <span>সরকারি ডাক মাশুল:</span>
                  <span>{moneyBn(postalTotal)} ৳</span>
                </div>
              )}
              {gatewayTotal > 0 && (
                <div className="flex justify-between text-gray-600 print:text-black">
                  <span>পেমেন্ট গেটওয়ে ফি:</span>
                  <span>{moneyBn(gatewayTotal)} ৳</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 print:text-black">
                <span>কেন্দ্র ফি:</span>
                <span>{moneyBn(centerTotal)} ৳</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#37A448] print:text-black border-t border-[#902A8B] print:border-black pt-1.5">
                <span>সর্বমোট প্রদেয়:</span>
                <span>{moneyBn(invoice.total)} ৳</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#902A8B] print:text-black pt-1 border-t border-purple-100 print:border-black">
                <span>পরিশোধিত টাকার পরিমাণ:</span>
                <span className="font-bold">
                  {moneyBn(invoice.paidAmount !== undefined ? invoice.paidAmount : invoice.total)} ৳
                </span>
              </div>
            </div>
          </div>

          {/* Payment Installments / History (if any) */}
          {invoice.paymentHistory && invoice.paymentHistory.length > 1 && (
            <div className="mb-4 bg-gray-50 print:bg-transparent border border-gray-200 print:border-black rounded p-2.5 text-[11px] text-gray-700 print:text-black">
              <span className="font-bold text-[#902A8B] print:text-black block mb-1">
                পরিশোধের বিবরণ ও কিস্তি ইতিহাস:
              </span>
              <div className="space-y-1">
                {invoice.paymentHistory.map((h, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-100 last:border-b-0 pb-0.5">
                    <span>
                      {toBanglaNumber(i + 1)}. {new Date(h.date).toLocaleDateString("bn-BD")} — {h.note || "জমা"} ({h.receivedBy || "ক্যাশ"})
                    </span>
                    <span className="font-bold text-[#37A448] print:text-black">
                      {moneyBn(h.amount)} ৳
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In Words */}
          <div className="bg-[#F4FAF5] print:bg-transparent p-2.5 rounded border-l-4 border-l-[#37A448] print:border-l-black print:border print:border-black text-xs text-[#37A448] print:text-black mb-6 font-medium">
            কথায়:{" "}
            {numberToBanglaWords(
              invoice.paidAmount !== undefined ? invoice.paidAmount : invoice.total
            )}{" "}
            {invoice.paidAmount !== undefined && invoice.paidAmount < invoice.total
              ? "(পরিশোধিত)"
              : ""}
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-8 px-6 text-xs text-gray-700 print:text-black">
            <div className="text-center w-36 flex flex-col items-center justify-end">
              <div className="h-10" />
              <div className="border-t border-[#902A8B] print:border-black pt-1 w-full">ভূমি মালিকের স্বাক্ষর</div>
            </div>
            <div className="text-center w-40 flex flex-col items-center justify-end">
              <div className="h-10 flex items-center justify-center mb-1">
                {settings.inchargeSignatureUrl ? (
                  <img src={settings.inchargeSignatureUrl} alt="স্বাক্ষর" className="max-h-9 object-contain print:grayscale" />
                ) : (
                  <LsfcOfficialSeal size={40} className="opacity-80 print:grayscale" />
                )}
              </div>
              <div className="border-t border-[#902A8B] print:border-black pt-1 w-full">কর্তৃপক্ষের স্বাক্ষর</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-2 border-t border-purple-100 print:border-black flex justify-between items-center text-[10px] text-gray-500 print:text-black">
            <span>{display.showAddress ? settings.address : "ঘোগাদহ, কুড়িগ্রাম"}</span>
            <div className="px-2.5 py-0.5 bg-[#F4FAF5] border border-[#37A448] rounded text-[#37A448] font-bold text-xs tracking-wide">
              ডিফল্ট ইউজার: {cleanPhone(invoice.customer.mobile)}
              {settings.citizenPortalPassword ? ` | পাসওয়ার্ড: ${settings.citizenPortalPassword}` : ` | পোর্টাল: ${settings.website || "land.gov.bd"}`}
            </div>
            <span>{settings.website || "land.gov.bd"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};