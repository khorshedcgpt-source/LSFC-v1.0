import { Font } from "@react-pdf/renderer";
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