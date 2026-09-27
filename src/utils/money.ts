/**
 * ============================================================================
 * LSFC FINANCIAL ARITHMETIC UTILITIES (Paisa-based integer arithmetic)
 * ============================================================================
 *
 * Floating-point arithmetic in JavaScript (IEEE 754 standard) uses binary
 * fractions which cannot represent every decimal number exactly.
 *
 * MOTIVATING RATIONALE:
 * In computeInvoiceFeeTotals (src/utils/invoiceStore.ts), fee totals across
 * multiple invoice lines were previously calculated by directly summing raw
 * floating-point numbers without intermediate rounding. When an invoice
 * contains multiple line items with fractional fees (or when multi-step
 * waterfall allocations reduce remaining due balances across successive
 * collections), unrounded binary floating-point addition accumulates subtle
 * drift that can distort comparisons or totals when stored or serialized.
 *
 * SOLUTION:
 * All monetary calculations route through integer PAISA (1 Taka = 100 Paisa).
 * Adding, subtracting, and multiplying occur in whole integer paisa; values
 * are converted back to standard 2-decimal Taka numbers only at the
 * calculation boundary.
 * ============================================================================
 */

/**
 * Converts a Taka amount to an integer number of paisa (1 Taka = 100 paisa).
 * Math.round safely absorbs any IEEE 754 precision noise from incoming numbers.
 * Non-finite inputs (NaN, Infinity, -Infinity, null, undefined) return 0.
 */
export function toPaisa(taka: number): number {
  if (!Number.isFinite(taka)) return 0;
  return Math.round(taka * 100);
}

/**
 * Converts an integer number of paisa back to a 2-decimal Taka number
 * for storage/display. Non-finite inputs return 0.
 */
export function toTaka(paisa: number): number {
  if (!Number.isFinite(paisa)) return 0;
  return Math.round(paisa) / 100;
}

/**
 * Safely adds multiple Taka amounts via integer paisa and returns a Taka result.
 * Example: addMoney(10.15, 20.35, 5.50) => 36.00
 */
export function addMoney(...amounts: number[]): number {
  const totalPaisa = amounts.reduce((acc, amt) => acc + toPaisa(amt), 0);
  return toTaka(totalPaisa);
}

/**
 * Safely subtracts subtrahend from minuend via integer paisa and returns
 * a Taka result.
 * Example: subtractMoney(100.00, 25.50) => 74.50
 */
export function subtractMoney(minuend: number, subtrahend: number): number {
  return toTaka(toPaisa(minuend) - toPaisa(subtrahend));
}

/**
 * Multiplies a Taka amount by a factor (quantity, rate, or percentage fraction
 * such as 0.01). Calculation is conducted on integer paisa, rounded, and
 * returned as Taka.
 */
export function multiplyMoney(amount: number, factor: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(factor)) return 0;
  const paisa = toPaisa(amount);
  return toTaka(Math.round(paisa * factor));
}