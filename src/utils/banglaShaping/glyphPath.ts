// src/utils/banglaShaping/glyphPath.ts
//
// Uses plain `fontkit` (the original, actively-maintained foliojs package),
// NOT @react-pdf/fontkit. @react-pdf/fontkit is a 4-year-stale fork that
// broke when bundled by this project's Vite setup ("Cannot read properties
// of undefined (reading 'prototype')"). Plain `fontkit` ships a documented
// browser entry point that works directly with a Uint8Array — no Buffer
// polyfill needed at all. See https://fontkit.typogram.co/quick-start
// ("ES6 (Browser)" example).
//
// Font URLs are resolved through resolveAssetUrl() so the same code works
// in a browser, Tauri desktop app, or Electron app without any change.

import * as fontkit from "fontkit";
import { resolveAssetUrl } from "../assetUrl";

export interface GlyphOutline {
  d: string;
  advanceWidth: number;
  unitsPerEm: number;
}

const fontkitCache = new Map<string, Promise<any>>();

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const resolvedUrl = resolveAssetUrl(url);
  const res = await fetch(resolvedUrl);
  if (!res.ok) throw new Error(`Failed to fetch font: ${resolvedUrl} (${res.status})`);
  return res.arrayBuffer();
}

export function loadFontkitFont(fontUrl: string): Promise<any> {
  if (!fontkitCache.has(fontUrl)) {
    fontkitCache.set(
      fontUrl,
      fetchArrayBuffer(fontUrl).then((buf) => (fontkit as any).create(new Uint8Array(buf)))
    );
  }
  return fontkitCache.get(fontUrl)!;
}

export async function glyphIdToSvgPath(glyphId: number, fontUrl: string): Promise<GlyphOutline> {
  const font = await loadFontkitFont(fontUrl);
  const glyph = font.getGlyph(glyphId);
  return {
    d: glyph.path.toSVG(),
    advanceWidth: glyph.advanceWidth,
    unitsPerEm: font.unitsPerEm,
  };
}