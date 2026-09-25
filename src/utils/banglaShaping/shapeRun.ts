// src/utils/banglaShaping/shapeRun.ts
//
// Combines HarfBuzz shaping (hbShaper.ts) and glyph outlines (glyphPath.ts)
// into plain, render-ready data (a ShapedRun) that <ShapedText> can draw
// synchronously — no more async work happens after this point.

import { shapeText } from "./hbShaper";
import { glyphIdToSvgPath } from "./glyphPath";

export interface ShapedGlyphPath {
  d: string;
  transform: string;
}

export interface ShapedRun {
  width: number;
  height: number;
  glyphs: ShapedGlyphPath[];
}

// Always render as a plain decimal string (never scientific notation like
// "1e-7", and never "NaN"/"Infinity"). @react-pdf/renderer's SVG
// transform-string parser only understands plain decimals — a stray
// scientific-notation or non-finite value silently breaks its parsing
// (symptom: "operations.forEach is not a function" deep inside
// applyTransformations), so every number going into a `transform` string
// is passed through this first.
function fmt(n: number): string {
  if (!Number.isFinite(n)) return "0";
  // toFixed also collapses any floating-point noise (e.g. 12.000000000002)
  // to a short, predictable decimal string.
  return n.toFixed(4);
}

export async function shapeRun(text: string, fontUrl: string, fontSize = 10): Promise<ShapedRun> {
  const { glyphs, unitsPerEm } = await shapeText(text, fontUrl);
  const scale = unitsPerEm > 0 ? fontSize / unitsPerEm : 0;

  let penX = 0;
  const shaped: ShapedGlyphPath[] = [];

  for (const g of glyphs) {
    const { d } = await glyphIdToSvgPath(g.glyphId, fontUrl);
    const gx = (penX + g.xOffset) * scale;
    const gy = g.yOffset * scale;

    shaped.push({
      d,
      // Flip Y (font space is Y-up, SVG/PDF space is Y-down).
      transform: `translate(${fmt(gx)}, ${fmt(fontSize - gy)}) scale(${fmt(scale)}, ${fmt(-scale)})`,
    });

    penX += g.xAdvance;
  }

  return {
    width: Number.isFinite(penX * scale) ? penX * scale : 0,
    height: fontSize * 1.4,
    glyphs: shaped,
  };
}

/** Shape many (label -> text) fields at once, e.g. every Bengali cell in an
 * invoice table, in parallel. */
export async function shapeFields(
  fields: Record<string, string>,
  fontUrl: string,
  fontSize = 10
): Promise<Record<string, ShapedRun>> {
  const entries = Object.entries(fields);
  const results = await Promise.all(
    entries.map(([, text]) => shapeRun(text, fontUrl, fontSize))
  );
  return Object.fromEntries(entries.map(([key], i) => [key, results[i]]));
}
