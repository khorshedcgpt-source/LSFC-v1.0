/**
 * Bangladesh Standard Time & Local Date Utilities
 * Prevents UTC timezone shift bug (where midnight to 6 AM in BD UTC+6 produces previous calendar day).
 */

export function getLocalDateString(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const target = isNaN(d.getTime()) ? new Date() : d;
  
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatBnLocalDate(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const target = isNaN(d.getTime()) ? new Date() : d;
  return target.toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
