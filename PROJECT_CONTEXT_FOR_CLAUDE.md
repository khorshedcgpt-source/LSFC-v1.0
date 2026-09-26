# LSFC Management System — Project Context

## ১. Project Overview

**Name:** LSFC Management System (ভূমিসেবা সহায়তা কেন্দ্র)
**Type:** Land Services Facilitating Center management app
**Domain:** Bangladesh government land services
**Authorized By:** Ministry of Land, Bangladesh
**License:** ০২ (০২) — authorized to Khondokar Computers
**Pilot Location:** Union Parishad Gate, Ghogadaha, Kurigram-5600

## ২. Business Purpose

Government-authorized land service facilitation center (LSFC) that helps citizens apply for and receive land-related documents:
- ভূমি উন্নয়ন কর (Land Development Tax)
- ই-নামজারি (e-Namjari / Mutation)
- খতিয়ান / পর্চা (Khatian / Land Records)
- মৌজা ম্যাপ / নকশা (Mouza Map)
- ডিসিআর (DCR)
- মিস কেস (Miss Case)
- নাগরিক প্রোফাইল নিবন্ধন (Citizen Profile)

## ৩. Deployment Roadmap

**Phase 1 (Current):** Windows Desktop App (Electron)
- 1 center: Kurigram
- 3 users per center: 1 In-Charge + 2 Operators
- Local SQLite storage (offline-first)
- Optional cloud sync

**Phase 2 (Future):** Multi-tenant Web App
- 73 centers initially, potentially 1200+
- Cloud PostgreSQL database
- Real-time sync
- Firebase backend (or Supabase — decision pending)

## ৪. Tech Stack

### Frontend
- React 18.3.1
- TypeScript 5.7.2 (strict mode)
- Vite 6.2.0
- Tailwind CSS 4.0.9

### PDF & Bengali Shaping
- @react-pdf/renderer 4.9.0
- HarfBuzz wasm 0.3.5 (GSUB/GPOS shaping)
- fontkit 2.0.4 (glyph outline extraction)
- SVG path rendering (not native PDF text)

### Desktop
- Electron 33.x
- electron-builder 25.x
- concurrently + wait-on

### Storage (Current)
- localStorage (browser)
- IndexedDB migration planned

### Auth
- PBKDF2-SHA256 (100,000 iterations)
- Auto-migration from legacy SHA-256

### Icons & Charts
- lucide-react 0.475.0
- recharts 3.10.1

## ৫. Project Structure

```
src/
├── App.tsx                          — Main app shell (6 tabs)
├── main.tsx                         — React root
├── index.css                        — Global styles, fonts
├── components/
│   ├── ApplicationForm.tsx          — New invoice creation
│   ├── CustomerLedger.tsx           — Customer history
│   ├── Dashboard.tsx                — KPIs & charts
│   ├── InvoicePrint.tsx             — Invoice preview + PDF
│   ├── LsfcVectorLogo.tsx           — SVG logos
│   ├── ServiceTestModal.tsx         — Fee calculator
│   ├── DateRangePicker.tsx
│   ├── auth/
│   │   ├── AuthGate.tsx
│   │   ├── LoginModal.tsx
│   │   └── SettingsRoleGate.tsx
│   ├── expenses/
│   │   └── ExpenseTracker.tsx
│   ├── settings/
│   │   ├── SettingsHub.tsx
│   │   ├── OrganizationSettings.tsx
│   │   ├── ServiceFeeSettings.tsx
│   │   ├── BackupRestore.tsx
│   │   └── UserManagement.tsx
│   └── reports/
│       ├── ReportsHub.tsx
│       ├── CenterSummaryReportView.tsx
│       ├── CenterSummaryPdfDocument.tsx
│       ├── CustomerStatementView.tsx
│       ├── CustomerStatementPdfDocument.tsx
│       ├── DeveloperDocsModal.tsx
│       ├── ShapedText.tsx
│       ├── reportUtils.ts
│       └── types.ts
├── utils/
│   ├── authStore.ts                 — PBKDF2 auth
│   ├── customerStore.ts             — Customer data
│   ├── invoiceStore.ts              — Invoice data
│   ├── expenseStore.ts
│   ├── institutionSettings.ts
│   ├── serviceCalculator.ts
│   ├── bengaliNumbers.ts
│   ├── pdfStandards.ts
│   ├── printPdfUtils.ts
│   ├── sampleData.ts
│   ├── banglaLayout.ts
│   ├── assetUrl.ts                  — Platform-aware URLs
│   ├── geoContext.ts                — Center/district/upazila IDs
│   └── banglaShaping/
│       ├── glyphPath.ts             — fontkit
│       ├── hbShaper.ts              — HarfBuzz
│       ├── shapeRun.ts              — Shaping to SVG
│       ├── shapeTree.ts             — Generic recursive
│       └── invoiceTextFields.ts     — Invoice fields
├── electron/                        — Electron desktop files
│   ├── main.cjs
│   └── preload.cjs
└── public/fonts/                    — Bengali TTF fonts
    ├── AnekBangla-Bold.ttf
    ├── AnekBangla-Regular.ttf
    ├── Kalpurush.ttf
    └── SolaimanLipi.ttf

docs/
├── AGENTS.md                        — PDF standards
├── FEE_POLICY.md                    — Fee structure
└── LSFC_COMPLETE_PROJECT_DOCUMENT.md

scripts/
└── audit.ps1                        — Automated audit script
```

## ৬. Key Features (Completed)

### Invoice & Fees
- Multi-line invoice with cart
- Historical fee snapshot (immutable after creation)
- Waterfall income allocation (govt → postal → gateway → center)
- Center-wise fee configuration (data-driven, no hardcoding)
- Sub-services (multi-select) with sum OR flat fee modes
- Combination overrides for subtitle text
- VOIDED invoice workflow (no hard delete)
- Partial payment + due tracking
- 1% gateway fee on government fees (July 2026 policy)

### Customer Management
- UUIDv7 internal ID + human-readable unique ID
- Format: LSFC + [division:2][district:2][upazila:2][license:2] + "-" + [YY:2] + [serial:4+]
- Example: LSFC55495202-260001
- Auto-migration for existing customers
- Bengali name validation

### Bengali Text Handling
- HarfBuzz wasm for complex GSUB/GPOS shaping
- fontkit for glyph outlines
- SVG paths in PDF (not native text)
- 100% accurate Bengali conjuncts, matras, hasanta
- Trade-off: PDF text is NOT selectable/searchable/copyable

### PDF Documents
- Invoice (A5 portrait)
- Customer Statement (A4 portrait)
- Center Summary Report (A4 portrait)
- All PDFs are pure vector text (no screenshots)
- Font hierarchy: AnekBangla (bold, header) + Kalpurush (body)
- 5-color palette enforced: #902A8B, #37A448, #EC2324, #FFF200, #FFFFFF
- Hyphenation callback to prevent Bengali word breaking

### Auth & RBAC
- PBKDF2-SHA256 with 100,000 iterations
- Auto-migration from legacy SHA-256
- 3 roles: admin, branch_incharge, staff
- AuthGate wrapper for protected screens
- SettingsRoleGate for admin-only settings
- Session via localStorage

### Expenses
- Category-based expense tracking
- Approval workflow: pending → approved/rejected
- Voucher number + issuer tracking
- Only approved expenses count in net profit

### Reports
- Center financial summary with date filtering
- Customer statement (historical)
- CSV export with UTF-8 BOM (Excel-compatible)
- Waterfall-aware revenue recognition

### Data Management
- Full system backup (JSON)
- Restore with confirmation + auto-backup
- Legacy format support
- Multi-key storage: lsfc.invoices, lsfc.customers, etc.

## ৭. Known Issues / Areas to Audit

1. **Testing Coverage:** 0% — no unit/integration/E2E tests
2. **Security:**
   - Review PBKDF2 implementation
   - Check for XSS vulnerabilities in Bengali text handling
   - Verify RBAC enforcement depth
   - Audit localStorage data sanitization
3. **Performance:**
   - Bundle size: 2.1 MB JS (688 KB gzipped)
   - Large chunk warning
   - Consider code splitting
4. **PDF/Text:**
   - PDF text is not selectable (HarfBuzz trade-off)
   - Is this acceptable? Alternative approaches?
5. **Accessibility:**
   - Zero ARIA attributes
   - Keyboard navigation needs review
   - Screen reader support?
6. **Error Handling:**
   - Network failures (future Firebase)
   - Corrupt localStorage data
   - Font loading failures
7. **International Standards:**
   - ISO/IEC 25010 (software quality)
   - OWASP Top 10 (security)
   - WCAG 2.2 AA (accessibility)
   - ISO 27001 (info security)
8. **Code Quality:**
   - Any anti-patterns?
   - Unused code?
   - Duplicate logic?
   - Type safety gaps?

## ৮. Business Constraints

- Bengali must be 100% accurate in PDFs (non-negotiable)
- PDF must be A5 for invoices, A4 for reports
- Invoice must include: Government fee + Gateway fee (1%) + Center fee
- Center fee collected in cash; government fees via e-Challan
- Historical invoices must be immutable (audit trail)
- Data must be stored locally (offline-first)
- Future: cloud sync for 73+ centers

## ৯. Current Stage

- Pilot deployment at 1 center (Kurigram)
- Demo to DC (District Commissioner) office pending
- Awaiting approval for 73-center rollout
- Electron desktop app in development

## ১০. What I Need From You

Please provide a comprehensive audit focusing on:

1. **Architecture Review** — Is the structure sound for scaling to 73+ centers?
2. **Security Audit** — OWASP Top 10 gaps, auth flow, RBAC depth
3. **Code Quality** — Anti-patterns, duplication, type safety
4. **Testing Strategy** — What tests should be written first?
5. **PDF/Bengali Handling** — Is the HarfBuzz approach correct?
6. **Data Model** — Is localStorage sufficient? Migration path?
7. **Performance** — Bundle optimization strategies?
8. **International Standards** — Compliance gaps (ISO/OWASP/WCAG)
9. **Multi-tenancy** — Preparation for 73 centers
10. **Recommendations** — Prioritized improvement roadmap

Please be thorough, honest, and specific. Point out what's good and what needs improvement. Provide actionable recommendations with code examples where applicable.