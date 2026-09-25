/**
 * Canonical Bengali Unicode Normalization & Layout Pipeline
 * 
 * Production-ready standard normalization for @react-pdf/renderer and web views.
 * Preserves canonical Unicode sequence so that fontkit (used by @react-pdf/renderer)
 * and modern browser text shapers can apply native OpenType GSUB/GPOS tables
 * without double-shifting matras or breaking conjunct ligatures.
 */

export interface BanglaLayoutOptions {
  mode?: "standard" | "visual" | "bypass";
}

// Default mode MUST be "standard" to prevent double-shaping with fontkit OpenType GSUB
let globalLayoutMode: "standard" | "visual" | "bypass" = "standard";

/**
 * Configure the global layout engine mode
 */
export function setBanglaLayoutMode(mode: "standard" | "visual" | "bypass"): void {
  globalLayoutMode = mode;
}

export function getBanglaLayoutMode(): "standard" | "visual" | "bypass" {
  return globalLayoutMode;
}

/**
 * Normalizes Bengali Unicode text into clean canonical forms:
 * 1. Unicode NFC Normalization (composes base characters and combining marks)
 * 2. Canonicalizes decomposed Nuktas (ড়, ঢ়, য়)
 * 3. Composes split two-part vowel signs (ো, ৌ)
 * 4. Canonicalizes Khanda-Ta (ৎ)
 * 5. Strips disruptive Zero-Width Non-Joiner (ZWNJ), Zero-Width Space, and BOM
 *    around Hasanta that break conjunct ligatures (e.g., ক্ষ, ঙ্ক, প্র, ভূ, স্মার্ট)
 */
export function normalizeBanglaUnicode(str: string): string {
  if (!str) return "";

  // 1. Canonical Unicode Normalization (NFC)
  let result = str.normalize("NFC");

  // 2. Normalize decomposed Nuktas to standard composite characters
  // \u09A1 (ড) + \u09BC (়) -> \u09DC (ড়)
  // \u09A2 (ঢ) + \u09BC (়) -> \u09DD (ঢ়)
  // \u09AF (য) + \u09BC (়) -> \u09DF (য়)
  // Also handle cases where nukta is placed after a vowel mark: e.g. ড + ি + ় -> ড় + ি
  result = result
    .replace(/([\u09A1\u09A2\u09AF])([\u09BE-\u09CD\u09D7])\u09BC/g, (_, base, mark) => {
      const map: Record<string, string> = { "\u09A1": "\u09DC", "\u09A2": "\u09DD", "\u09AF": "\u09DF" };
      return (map[base] || base) + mark;
    })
    .replace(/\u09A1\u09BC/g, "\u09DC")
    .replace(/\u09A2\u09BC/g, "\u09DD")
    .replace(/\u09AF\u09BC/g, "\u09DF");

  // 3. Compose two-part split vowel signs into single canonical Unicode codepoints
  // E-kaar (\u09C7) + Aa-kaar (\u09BE) -> O-kaar (\u09CB, ো)
  // E-kaar (\u09C7) + Au-length mark (\u09D7) -> Ou-kaar (\u09CC, ৌ)
  result = result
    .replace(/\u09C7\u09BE/g, "\u09CB")
    .replace(/\u09BE\u09C7/g, "\u09CB")
    .replace(/\u09C7\u09D7/g, "\u09CC")
    .replace(/\u09D7\u09C7/g, "\u09CC");

  // 4. Canonicalize Khanda-Ta: \u09A4\u09CD\u200D -> \u09CE (ৎ)
  result = result.replace(/\u09A4\u09CD\u200D/g, "\u09CE");

  // 5. Clean disruptive zero-width characters that break conjunct formation
  result = result
    .replace(/[\u200B\uFEFF]/g, "")     // Strip Zero-Width Space and BOM
    .replace(/\u200C(?=\u09CD)/g, "")   // Strip ZWNJ before Hasanta
    .replace(/(?<=\u09CD)\u200C/g, "");  // Strip ZWNJ after Hasanta

  return result;
}

/**
 * Optional legacy visual reordering (only used if explicit mode: "visual" is requested)
 */
export function shapeBanglaVisual(str: string): string {
  if (!str) return "";
  const normalized = normalizeBanglaUnicode(str);

  const C = "[\u0995-\u09B9\u09DC-\u09DF\u09CE]";
  const H = "\u09CD";
  const clusterPattern = `(?:${C}(?:${H}${C})*)`;

  let result = normalized.replace(
    new RegExp(`(${clusterPattern})\u09CB`, "g"),
    "\u09C7$1\u09BE"
  );
  result = result.replace(
    new RegExp(`(${clusterPattern})\u09CC`, "g"),
    "\u09C7$1\u09D7"
  );
  result = result.replace(
    new RegExp(`(${clusterPattern})([\u09BF\u09C7\u09C8])`, "g"),
    "$2$1"
  );

  return result;
}

/**
 * Prepares Bengali text for rendering in @react-pdf/renderer and web views.
 * In "standard" mode (default), performs canonical normalization so OpenType
 * engines (fontkit) render 100% accurate ligatures and vowel signs.
 */
export function fixBanglaText(
  input: string | number | null | undefined,
  options?: BanglaLayoutOptions
): string {
  if (input === null || input === undefined) {
    return "";
  }

  const str = String(input);
  if (!str) return "";

  const mode = options?.mode || globalLayoutMode;
  if (mode === "bypass") {
    return str;
  }

  if (mode === "visual") {
    return shapeBanglaVisual(str);
  }

  // Default: Standard canonical NFC Unicode normalization
  return normalizeBanglaUnicode(str);
}

export const fixBn = fixBanglaText;
export default fixBanglaText;
