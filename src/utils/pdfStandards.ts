import { Font, StyleSheet } from "@react-pdf/renderer";
import { resolveAssetUrl } from "./assetUrl";

// Global Bengali Hyphenation Callback to prevent breaking words across syllable boundaries
Font.registerHyphenationCallback((word: string) => [word]);

// Font path resolution now goes through the shared platform-aware resolver,
// so the exact same code works in browsers, Tauri, and Electron.
const getFontUrl = (fontFile: string): string => resolveAssetUrl(`/fonts/${fontFile}`);

let fontsRegistered = false;

export function ensurePdfFontsRegistered(): void {
  if (fontsRegistered) return;

  try {
    Font.register({
      family: "AnekBangla",
      fonts: [
        {
          src: getFontUrl("AnekBangla-Regular.ttf"),
          fontWeight: 400,
        },
        {
          src: getFontUrl("AnekBangla-Bold.ttf"),
          fontWeight: 700,
        },
      ],
    });

    Font.register({
      family: "Kalpurush",
      src: getFontUrl("Kalpurush.ttf"),
      fontWeight: 400, // Strictly 400 per Global PDF Standard
    });

    Font.register({
      family: "SolaimanLipi",
      src: getFontUrl("SolaimanLipi.ttf"),
      fontWeight: 400,
    });

    fontsRegistered = true;
  } catch (error) {
    console.warn("PDF Font registration error:", error);
  }
}

// Initial registration trigger
ensurePdfFontsRegistered();

// Approved 5-Color System
export const PDF_COLORS = {
  PRIMARY: "#902A8B",
  SECONDARY: "#37A448",
  THIRD: "#EC2324",
  FOURTH: "#FFF200",
  FIFTH: "#FFFFFF",
  WHITE: "#FFFFFF",
} as const;

export const PDF_FONTS = {
  TITLE: "AnekBangla",
  BODY: "Kalpurush",
} as const;

// Shared Header & Logo Layout Styles (DRY across all LSFC PDF reports)
export const PDF_HEADER_STYLES = StyleSheet.create({
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  logoSlot: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logoSlotRight: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  logoImage: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },
  headerCenterCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topGovt: {
    fontSize: 8.5,
    color: PDF_COLORS.SECONDARY,
    marginBottom: 2,
  },
  brandTitle: {
    fontFamily: "AnekBangla",
    fontWeight: 700,
    fontSize: 18,
    color: PDF_COLORS.PRIMARY,
    marginBottom: 2,
  },
  reportTitle: {
    fontFamily: "AnekBangla",
    fontWeight: 700,
    fontSize: 12,
    color: PDF_COLORS.SECONDARY,
    marginTop: 2,
  },
});