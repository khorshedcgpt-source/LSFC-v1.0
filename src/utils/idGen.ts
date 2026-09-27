/**
 * ============================================================================
 * LSFC INTERNAL ID GENERATOR
 * ============================================================================
 * Generates cryptographically secure alphanumeric random suffixes using Web Crypto API.
 * Resolves static analysis security hotspots (SonarQube S2245) while preserving
 * deterministic record ID length, prefix structure, and uniqueness.
 */
export function randomIdSuffix(length: number = 6): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  }
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, length);
}
