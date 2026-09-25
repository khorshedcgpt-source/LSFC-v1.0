// src/utils/assetUrl.ts
//
// Platform-aware asset URL resolver.
// Works seamlessly in:
//   - Web browsers (http/https)
//   - Tauri desktop (http://tauri.localhost or tauri://localhost)
//   - Electron desktop (custom protocol / file fallback)
//
// WHY THIS EXISTS:
// Font files and the HarfBuzz wasm binary are loaded via fetch().
// In a browser, fetch("/fonts/X.ttf") resolves against window.location.origin.
// In desktop shells the origin can be different (or "null" under file://),
// which breaks fetch entirely.
//
// This helper normalizes any root-relative path (e.g. "/fonts/Kalpurush.ttf")
// into a URL that actually works in the current runtime, without changing
// web behaviour at all.

export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return Boolean(w.__TAURI__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__);
}

export function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return Boolean(
    (w.process && w.process.type === "renderer") ||
    (typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent))
  );
}

/**
 * Resolves an asset path (root-relative or relative) into a fully
 * qualified URL appropriate for the current runtime.
 *
 * - Absolute URLs (http:, https:, data:, blob:, asset:, tauri:) pass through.
 * - Root-relative paths ("/fonts/X.ttf") are prefixed with the current origin
 *   when one is available. Under Tauri on Windows this becomes
 *   "http://tauri.localhost/fonts/X.ttf", which the app protocol serves from
 *   the bundled dist/ folder.
 * - If no usable origin is available (e.g. file://), the path is returned as-is
 *   so the caller can still try a relative fetch.
 */
export function resolveAssetUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return pathOrUrl;

  // Already absolute — don't touch.
  if (/^(https?:|data:|blob:|asset:|tauri:)/i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;

  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin;
    // "null" happens under file:// — treat as no origin.
    if (origin && origin !== "null" && !origin.startsWith("file:")) {
      return `${origin}${normalizedPath}`;
    }
  }

  // Unknown / file:// context — return as-is; caller decides.
  return normalizedPath;
}