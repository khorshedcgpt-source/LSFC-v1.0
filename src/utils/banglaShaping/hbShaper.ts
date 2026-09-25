// src/utils/banglaShaping/hbShaper.ts
//
// Browser + Desktop version. Loads hb.wasm and the font file via fetch().
// The wasm URL is passed through resolveAssetUrl() so the same code works
// inside a browser, Tauri desktop app, or Electron app without any change.
//
// WHY THIS FILE EXISTS: @react-pdf/renderer's text layout has no GSUB/GPOS
// shaping engine, so Bengali conjuncts (যুক্তাক্ষর) and pre-base matra
// reordering (কার) are never resolved — that's what breaks in the PDF.
// HarfBuzz does that resolution; this file runs it and returns the
// resulting glyph IDs + positions.

import hbjs from "harfbuzzjs/hbjs.js";
// '?url' tells Vite to emit hb.wasm as a static asset and give us its URL
// (works in both `npm run dev` and the production build).
import hbWasmUrl from "harfbuzzjs/hb.wasm?url";
import { resolveAssetUrl } from "../assetUrl";

export interface ShapedGlyph {
  glyphId: number;
  cluster: number;
  xAdvance: number;
  yAdvance: number;
  xOffset: number;
  yOffset: number;
}

export interface ShapeResult {
  glyphs: ShapedGlyph[];
  unitsPerEm: number;
}

let hbPromise: Promise<any> | null = null;
async function getHB() {
  if (!hbPromise) {
    const resolvedWasmUrl = resolveAssetUrl(hbWasmUrl);
    hbPromise = fetch(resolvedWasmUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch HarfBuzz wasm: ${resolvedWasmUrl} (${res.status})`);
        }
        return res.arrayBuffer();
      })
      .then((buf) => WebAssembly.instantiate(buf, {}))
      .then(({ instance }) => hbjs(instance));
  }
  return hbPromise;
}

const fontBufferCache = new Map<string, Promise<ArrayBuffer>>();
function fetchFontBuffer(fontUrl: string) {
  if (!fontBufferCache.has(fontUrl)) {
    const resolvedUrl = resolveAssetUrl(fontUrl);
    fontBufferCache.set(
      fontUrl,
      fetch(resolvedUrl).then((r) => {
        if (!r.ok) {
          throw new Error(`Failed to fetch font for HB: ${resolvedUrl} (${r.status})`);
        }
        return r.arrayBuffer();
      })
    );
  }
  return fontBufferCache.get(fontUrl)!;
}

const hbFontCache = new Map<string, Promise<{ font: any; unitsPerEm: number }>>();
function getHBFont(fontUrl: string) {
  if (!hbFontCache.has(fontUrl)) {
    hbFontCache.set(
      fontUrl,
      (async () => {
        const hb = await getHB();
        const buf = await fetchFontBuffer(fontUrl);
        const blob = hb.createBlob(new Uint8Array(buf));
        const face = hb.createFace(blob, 0);
        const font = hb.createFont(face);
        return { font, unitsPerEm: face.upem || 1000 };
      })()
    );
  }
  return hbFontCache.get(fontUrl)!;
}

/**
 * @param text     e.g. "ভূমিসেবা সহায়তা কেন্দ্র"
 * @param fontUrl  Public URL of a .ttf with Bengali OT tables, e.g. "/fonts/AnekBangla-Regular.ttf"
 */
export async function shapeText(
  text: string,
  fontUrl: string,
  opts: { script?: string; language?: string; direction?: string } = {}
): Promise<ShapeResult> {
  const { script = "Beng", language = "BEN", direction = "ltr" } = opts;
  const hb = await getHB();
  const { font, unitsPerEm } = await getHBFont(fontUrl);

  const buffer = hb.createBuffer();
  buffer.addText(text);
  buffer.setDirection(direction);
  buffer.setScript(script);
  buffer.setLanguage(language);
  hb.shape(font, buffer);

  const result = buffer.json(font);
  buffer.destroy();

  return {
    glyphs: result.map((g: any) => ({
      glyphId: g.g,
      cluster: g.cl,
      xAdvance: g.ax,
      yAdvance: g.ay,
      xOffset: g.dx,
      yOffset: g.dy,
    })),
    unitsPerEm,
  };
}