# AGENTS.md — LSFC Management System Architecture & Engineering Guidelines

> **System Purpose:** Land Services Facilitating Center (LSFC / ভূমিসেবা সহায়তা কেন্দ্র) Management System.  
> A Local-First, production-grade business operations platform for authorized land service facilitation centers in Bangladesh.

---

## 1. System Architecture Overview

- **Frontend Core:** React 18.3.1 (TypeScript, Strict Mode), Vite 6.2.0.
- **Styling System:** Tailwind CSS v4.0.9 (CSS-first `@import "tailwindcss";`, no arbitrary config hacks).
- **Design Tokens & Brand Colors:**
  - Primary / Royal Purple: `#902A8B`
  - Secondary / Govt Green: `#37A448`
  - Accent / Danger Red: `#EC2324`
  - Accent / Yellow Warning: `#FFF200`
  - Clean Backgrounds: `#FFFFFF`, Slate neutrals
- **Typography:**
  - Headings: `Anek Bangla` (Font-Anek)
  - Body & Ledger: `Kalpurush` (Font-Kalpurush)
  - Numerals: Bangla digits (`toBanglaNumber` converter) & Monospace fonts for currency alignment.

---

## 2. Bengali Typography & HarfBuzz WASM Text Shaping

Standard PDF engines (including `@react-pdf/renderer`, PDFKit, and jsPDF) lack native support for OpenType complex text shaping required by Indic scripts (specifically Bengali conjuncts, ligatures, pre-base matras like `ি`, `ে`, `ৈ`, and post-base reph/hasant forms).

### The HarfBuzz Pipeline
1. TrueType font binaries (`AnekBangla-Bold.ttf`, `Kalpurush-Regular.ttf`) are loaded into memory.
2. UTF-8 Bengali strings are fed into the `HarfBuzz WASM` shaper.
3. The shaper computes accurate glyph IDs, horizontal advances, and (x, y) placement offsets.
4. Glyph contours are extracted via `opentype.js` / `fontkit` and converted into exact vector `<svg><path>` elements.
5. Injected into `@react-pdf/renderer` as vector SVG components.

### ⚠️ PDF Text Selectability Waiver (Architectural Decision)
Because Bengali conjuncts are converted into exact vector SVG glyph paths:
- **Flawless Visual Integrity:** Bengali conjuncts (`ক্ষ`, `জ্ঞ`, `ব্র`, `স্ট্র`, `ঙ্ক`) render with 100% visual fidelity on every printer, mobile viewer, and operating system with zero missing matras or broken glyphs.
- **Waiver:** Text within the generated PDF is non-selectable vector glyph geometry rather than raw Unicode text. This trade-off is an **intentional and officially approved architectural decision** for LSFC to guarantee legal readability and zero print distortion.

---

## 3. Dual Printing & Output Strategy

The system provides two distinct, complementary output pipelines:

1. **Browser Native Print (DOM `@media print`):**
   - Implemented in `src/components/InvoicePrint.tsx`.
   - Utilizes CSS `@media print` rules, `@page { size: A4 portrait; margin: 0; }`.
   - Fast, instant print dialog invocation via `window.print()`.
   - Renders directly from styled HTML/Tailwind DOM using browser font rasterization.

2. **Standalone Vector PDF Generation:**
   - Implemented via `@react-pdf/renderer` and `src/utils/banglaShaping/`.
   - Produces a downloadable, standalone `.pdf` binary file.
   - Ideal for saving to disk, emailing, or sharing via messaging apps.

---

## 4. Local-First Data Storage & Unified Event Bus

The application is architected as an offline-first system using browser `localStorage` with custom dispatch events for cross-component reactivity.

### Unified Storage Keys
| Key | Type | Description |
|---|---|---|
| `lsfc.institutionSettings` | `InstitutionSettings` | Center identity, licensing, address, geo-codes, fee structures |
| `lsfc.customers` | `CustomerRecord[]` | Landowner directory with unique Geo-coded IDs |
| `lsfc.invoices` | `InvoiceRecord[]` | All invoices, line items, service tracking, payments |
| `lsfc.expenses` | `ExpenseRecord[]` | Operational expenses, approval workflows, vouchers |
| `lsfc.users` | `User[]` | Staff & admin authentication credentials |
| `lsfc.session` | `User` | Active user session state |

### Event Bus Specification (Colon-Separated Convention)
- `lsfc:invoices-updated` — Dispatched on invoice creation, payment, or status change.
- `lsfc:customers-updated` — Dispatched when landowner profile is added or updated.
- `lsfc:expenses-updated` — Dispatched on expense entry, approval, rejection, or deletion.
- `lsfc:auth-updated` — Dispatched on login, logout, or user creation.
- `lsfc:institution-settings-updated` — Dispatched on center settings or service fee updates.

*(Note: Legacy hyphenated events such as `lsfc-customers-updated` are strictly deprecated and removed).*

---

## 5. Security & Sensitive Information Discipline

- **No Hardcoded Passwords:** The system must never contain hardcoded citizen credentials or fallback passwords (e.g. `Ab*12345` was permanently purged). If no portal password is configured in settings, output cleanly falls back to displaying the official government portal URL without generating fictitious credentials.
- **No Native `window.confirm` or `window.prompt`:** In sandboxed or iframe preview environments, native browser modal dialogs fail silently. All user confirmations (approvals, rejections, deletions) must use in-app accessible modals with explicit feedback toasts.

---

## 6. Desktop (Tauri) Packaging Roadmap

For deployment on center Windows/Linux desktop terminals without dependency on cloud internet:
- **Tauri v2 Architecture:** Minimal Rust wrapper hosting the existing Vite/React production build.
- **Asset Protocol:** Local fonts (`/fonts/*.ttf`) and HarfBuzz wasm binaries (`hb-subset.wasm`) are bundled in the binary resource scope.
- **Hardware Integration:** Direct ESC/POS thermal printer and USB scanner support via Tauri IPC plugins.

---

## 7. Future: Centralized Monitoring (v1.0+, Design-Only)

When the system scales to 70+ branch centers, admins need a way to detect problems without relying on staff phone calls. The following four mechanisms are planned for the v1.0 (multi-branch + Firebase) phase:

1. **Centralized Error Logging** — Integrate a crash/error reporting tool (e.g. Sentry) so any JS error or crash automatically reports to the cloud with: center name, user role, module/screen, and stack trace. Reports should queue locally when offline and flush once connectivity returns.

2. **Health / Heartbeat Ping** — Each center's app instance sends a lightweight status signal (daily or per-session) to a central location: last-sync timestamp, app version, and whether any critical error is currently flagged. This is essential for catching *silent* failures (e.g. sync quietly stopped working with no crash).

3. **Sync-Failure Logging** — Distinguish and log the specific case where internet connectivity exists but the app fails to reach the Firebase backend (as opposed to fully offline). This must not be conflated with normal offline mode.

4. **In-App "Report a Problem" Button** — A manual fallback: one click lets staff send a report (screenshot + relevant logs) without phoning support.

Together, these four give an admin a single dashboard view of the health of all branch centers.

### Design Constraint to Note
These four items should be kept in mind while designing the current data model and architecture (even in the localStorage-only MVP phase) so that adding them later is a clean backend-swap, not a rearchitecture — but nothing about this should be built or scaffolded right now.

