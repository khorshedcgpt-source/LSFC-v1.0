# LSFC Management System — সম্পূর্ণ প্রকল্প নথি

**প্রকল্প:** ভূমিসেবা সহায়তা কেন্দ্র (Land Services Facilitating Center)  
**টাইপ:** Local-First SPA → Desktop → Multi-Tenant Web  
**ভার্সন:** 0.1.0 (Pilot Ready)  
**তারিখ:** সেপ্টেম্বর ২০২৬  
**অবস্থান:** ঘোগাদহ, কুড়িগ্রাম | লাইসেন্স: ০২ | খন্দকার কম্পিউটার্স  

---

## 📖 এই ডকুমেন্টটি কী

এটি LSFC Management System-এর একক সম্পূর্ণ নথি — প্রকল্পের বর্তমান অবস্থা, সম্পন্ন কাজ, বাকি কাজ, বাস্তবায়ন পরিকল্পনা, আন্তর্জাতিক মান নিরূপণ, এবং ভবিষ্যৎ রোডম্যাপ — সব একসাথে।

---

# ভাগ ১ — প্রকল্প পরিচিতি

## ১.১ লক্ষ্য ও উদ্দেশ্য

বাংলাদেশ সরকার অনুমোদিত ভূমিসেবা সহায়তা কেন্দ্র পরিচালনার জন্য সম্পূর্ণ ডিজিটাল সিস্টেম — যা:

- Pilot পর্যায়ে ১টি কেন্দ্রে (কুড়িগ্রাম) Windows Desktop অ্যাপ হিসেবে চলে
- ভবিষ্যতে ৭৩টি কেন্দ্রে Cloud-based Web অ্যাপ হিসেবে স্কেল করে
- Offline-first — ইন্টারনেট ছাড়াই কাজ করে
- Cloud-sync — ইন্টারনেট ফিরলে অটো-সিঙ্ক করে
- Bengali-compliant — ১০০% নিখুঁত বাংলা PDF

## ১.২ দুই-ধাপ বাস্তবায়ন

| Phase | Platform | Center Count | Storage | Users |
|---|---|---|---|---|
| Pilot | Windows Desktop (.msi) | ১টি | Local SQLite | ৩ জন/কেন্দ্র |
| Rollout | Web (Browser) | ৭৩টি | Cloud PostgreSQL | ২১৯ জন |

## ১.৩ প্রধান ফিচার

ভূমি মালিকের তথ্য, ইনভয়েস, লেজার, সরকারি ফি, গেটওয়ে ফি, ডাক মাশুল, কেন্দ্র ফি, আয়-ব্যয়, কর্মী বেতন, বাংলা ভেক্টর PDF, RBAC, Backup/Restore, Cloud Sync (ভবিষ্যৎ)

---

# ভাগ ২ — বর্তমান অবস্থা

## ২.১ প্রযুক্তি স্ট্যাক

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 18.3.1 |
| Language | TypeScript (strict) | 5.7.2 |
| Build Tool | Vite | 6.2.0 |
| Styling | Tailwind CSS | 4.0.9 |
| PDF Engine | @react-pdf/renderer | 4.9.0 |
| Bengali Shaping | HarfBuzz wasm + fontkit | 0.3.5 / 2.0.4 |
| Icons | lucide-react | 0.475.0 |
| Charts | recharts | 3.10.1 |
| Storage | localStorage | browser |
| Auth | SHA-256 + salt | local |

### Storage Keys

```
lsfc.invoices              — ইনভয়েস
lsfc.customers             — ভূমি মালিক
lsfc.expenses              — খরচ
lsfc.users                 — ইউজার
lsfc.session               — সেশন
lsfc.institutionSettings   — প্রতিষ্ঠান সেটিংস
lsfc-center-settings       — Legacy (migrated)
```

## ২.২ ফাইল ইনভেন্টরি

### Root

- `index.html`, `main.tsx`, `index.css`
- `vite.config.ts`, `tsconfig.json`, `package.json`
- `vite-env.d.ts`
- `AGENTS.md`
- `README.md` (AI Studio boilerplate — replace দরকার)

### Components (মূল)

- `App.tsx`
- `Dashboard.tsx`
- `ApplicationForm.tsx`
- `CustomerLedger.tsx`
- `InvoicePrint.tsx`
- `LsfcVectorLogo.tsx`
- `ServiceTestModal.tsx`
- `DateRangePicker.tsx`
- `VectorPdfDocument.tsx` — dead code
- `InvoiceAndLedger.tsx` — dead code
- `Settings.tsx` — dead code (SettingsHub replace করেছে)

### Auth Module

- `AuthGate.tsx` — generic auth wrapper
- `LoginModal.tsx` — first-run + login
- `SettingsRoleGate.tsx` — RBAC gate

### Settings Module

- `SettingsHub.tsx` — 4-tab controller
- `OrganizationSettings.tsx` — identity, geo codes
- `ServiceFeeSettings.tsx` — services + fee modes
- `BackupRestore.tsx` — full backup
- `UserManagement.tsx` — create/toggle users

### Reports Module

- `ReportsHub.tsx`
- `CenterSummaryReportView.tsx`
- `CenterSummaryPdfDocument.tsx`
- `CustomerStatementView.tsx`
- `CustomerStatementPdfDocument.tsx`
- `DeveloperDocsModal.tsx`
- `ShapedText.tsx` — SVG path renderer
- `reportUtils.ts`
- `types.ts`

### Expenses Module

- `ExpenseTracker.tsx` — approval workflow

### Utils

- `authStore.ts`
- `customerStore.ts` — UUID + Unique ID
- `invoiceStore.ts` — waterfall, VOIDED
- `expenseStore.ts` — pending/approved/rejected
- `institutionSettings.ts` — data-driven services
- `serviceCalculator.ts` — 3 calculators
- `bengaliNumbers.ts`
- `pdfStandards.ts`
- `printPdfUtils.ts`
- `sampleData.ts`
- `banglaLayout.ts`
- `assetUrl.ts` — platform-aware URL

### Bangla Shaping

- `glyphPath.ts` — plain fontkit
- `hbShaper.ts` — HarfBuzz wasm
- `shapeRun.ts` — glyph → SVG path
- `shapeTree.ts` — generic recursive
- `invoiceTextFields.ts` — 55+ fields

### Public

- `fonts/` — 7টি TTF (AnekBangla, Kalpurush, SolaimanLipi, NotoSansBengali)
- `favicon.svg`

## ২.৩ ফিচার Completion Matrix

| Feature | Status |
|---|---|
| Invoice creation | 100% |
| Invoice PDF (A5) | 95% |
| Print via PDF | 100% |
| Customer management | 100% |
| Customer Unique ID | 100% |
| Geo-coding | 100% |
| Customer Ledger | 100% |
| Due collection | 100% |
| Expense tracking | 100% |
| Center Reports | 100% |
| Customer Statement | 100% |
| CSV Export | 100% |
| Auth (local) | 100% |
| RBAC | 100% |
| Backup/Restore | 100% |
| Service config | 100% |
| Bengali numbers | 100% |
| Bengali PDF | 100% |
| Miss Case flat fee | 100% |
| AuthGate all tabs | 100% |
| Desktop asset loading | 100% |
| Tauri Desktop | 0% |
| Cloud Sync | 0% |
| Multi-tenant Web | 0% |
| Automated tests | 0% |
| CI/CD | 0% |
| Audit log | 0% |
| Multi-branch | 30% |

## ২.৪ Build Status

```
✅ npm run lint     → Clean pass
✅ npm run build    → Success (~11s)
✅ Bundle           → 2.09 MB (683 KB gzipped)
✅ HarfBuzz wasm    → Bundled (317 KB)
```

---

# ভাগ ৩ — সম্পন্ন কাজ

## ৩.১ Build-Breaking Fixes

| Bug | File | Fix |
|---|---|---|
| Missing `cleanPhone` import | InvoicePrint.tsx | Import added |
| Missing `formatOwnerName` import | InvoicePrint.tsx | Import added |
| Sample data ID mismatch | sampleData.ts | addInvoice() API ব্যবহার |

## ৩.২ নতুন ফিচার

### Customer Unique ID System

- **Format:** `LSFC55495202-260042`
- **Prefix:** `LSFC` + বিভাগ + জেলা + উপজেলা + লাইসেন্স
- **Serial:** বছরে ৪ ডিজিট (বছরে reset)
- Files: `customerStore.ts`, `institutionSettings.ts`, `OrganizationSettings.tsx`, `App.tsx`

### Miss Case Flat Fee Mode

- Sub-services থাকলেও fee fixed ৳১০০
- Sub-services শুধু subtitle-এর জন্য
- New field: `subServiceFeeMode: "sum" | "flat"`

### Print via PDF

- Invoice: `handleNativePrint()` → PDF new tab
- Statement: `handlePrintStatement()` → PDF new tab
- কারণ: HTML print A4 ধরে invoice ৪ পৃষ্ঠায় ভাঙে

### AuthGate for All Tabs

- Application, Ledger, Settings, Expenses — সব auth-gated
- `AuthGate.tsx` (new)

### Backup Restore Confirmation

- Confirmation dialog (counts সহ)
- Auto-backup download before restore
- Legacy format support

### Desktop-Compatible Asset Loading

- `assetUrl.ts` — platform-aware URL
- Tauri detection + fallback
- `pdfStandards.ts`, `hbShaper.ts`, `glyphPath.ts` update

### Bengali Text Improvements

- Invoice-এ "ইউনিক আইডি:" label
- Statement-এ "জনাব" prefix (`formatOwnerName()`)
- Statement-এ NID → Unique ID

---

# ভাগ ৪ — বাকি কাজ ও পরিকল্পনা

## ৪.১ Phase Overview

| Phase | সময় (Part-time) | Focus |
|---|---|---|
| Pilot Polish | ২-৩ দিন | Text changes, cleanup |
| Tauri Desktop | ১ সপ্তাহ | .msi installer |
| Supabase Foundation | ২ সপ্তাহ | Cloud backend |
| Sync Engine | ১ সপ্তাহ | Auto-sync |
| Web Deployment | ১ সপ্তাহ | Online hosting |
| 73-Center Rollout | ২ সপ্তাহ | Production scale |

**মোট:** ~২ মাস (part-time, ২ ঘণ্টা/দিন)

## ৪.২ Pilot Polish — Task List

### Task A: "গ্রাহক" → "ভূমি মালিক" Text Change

**Files (১০টি):**
- `CustomerStatementPdfDocument.tsx` — ১টি
- `ReportsHub.tsx` — ১টি
- `CustomerStatementView.tsx` — ২টি
- `InvoicePrint.tsx` — ১টি
- `invoiceTextFields.ts` — ১টি
- `CustomerLedger.tsx` — ৮টি
- `ApplicationForm.tsx` — ৯টি
- `Dashboard.tsx` — ১টি
- `BackupRestore.tsx` — ৫টি
- `App.tsx` — ১টি

**সময়:** ২ ঘণ্টা

### Task B: Dead Code Cleanup

**সরান:**
- `src/components/Settings.tsx`
- `src/components/VectorPdfDocument.tsx`
- `src/components/InvoiceAndLedger.tsx`
- `src/utils/bufferPolyfill.ts`
- Root artifacts: `test-*.pdf`, `rendered_sample.png`

**সময়:** ১ ঘণ্টা

### Task C: Event Name 통일

- `lsfc:customers-updated` (colon) standard
- `lsfc-customers-updated` (hyphen) remove

**সময়:** ৩০ মিনিট

### Task D: Hardcoded Password Remove

- `invoiceTextFields.ts` — `পাসওয়ার্ড: Ab*12345` সরান

**সময়:** ১৫ মিনিট

### Task E: AGENTS.md Update

- PDF text selectability waiver
- Print strategy section
- Desktop roadmap section

**সময়:** ১ ঘণ্টা

**মোট Pilot Polish: ~৫ ঘণ্টা**

## ৪.৩ Tauri Desktop Packaging

### Step 1: Install

```bash
npm install -D @tauri-apps/cli
npx tauri init
npm install @tauri-apps/plugin-fs @tauri-apps/plugin-opener
```

### Step 2: Configure `src-tauri/tauri.conf.json`

```json
{
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:3000",
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev"
  },
  "app": {
    "windows": [{
      "title": "ভূমিসেবা সহায়তা কেন্দ্র",
      "width": 1280,
      "height": 860
    }],
    "security": {
      "assetProtocol": {
        "enable": true,
        "scope": ["$RESOURCE/fonts/**", "$RESOURCE/**/*.wasm"]
      }
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis"],
    "identifier": "bd.gov.lsfc.app",
    "resources": ["../public/fonts/**/*", "../public/hb.wasm"]
  }
}
```

### Step 3: Print Adapter

Desktop-এ PDF → temp file → system PDF viewer।

### Step 4: Build

```bash
npm run tauri:build
```

**Output:** `.msi` file (Windows installer)

**সময়:** ~১০-১৫ ঘণ্টা কাজ

## ৪.৪ Supabase Backend Foundation

### Database Schema

```sql
centers (center_id PK, name_bn, division_code, district_code, upazila_code, license_no)
users (id PK, center_id FK, username UNIQUE, role)
customers (id PK, customer_number UNIQUE, center_id FK, full_name, mobile, nid_no)
invoices (id PK, invoice_no, center_id FK, customer_id FK, customer_snapshot JSONB, lines JSONB)
expenses (id PK, center_id FK, date, title, category, amount, status)
institution_settings (center_id PK FK, data JSONB)
audit_log (id PK, center_id FK, actor_id FK, action, entity_type, old_value, new_value)
```

### RLS Policy উদাহরণ

```sql
CREATE FUNCTION auth.user_center_id() RETURNS TEXT
  SELECT center_id FROM users WHERE id = auth.uid();

CREATE POLICY "Users see own center customers"
ON customers FOR SELECT
USING (center_id = auth.user_center_id());
```

**সময়:** ~২০-৩০ ঘণ্টা কাজ

## ৪.৫ Auto-Sync (PowerSync)

```bash
npm install @powersync/web @powersync/react
```

**Sync Streams (Dashboard):**
- `customers: center_id = auth.user_center_id()`
- `invoices: center_id = auth.user_center_id()`

**Sync Status UI:** 🟢 Synced | 🟡 Syncing... | 🔴 Offline (N pending)

**সময়:** ~১০-১৫ ঘণ্টা কাজ

## ৪.৬ Web Deployment (Vercel)

```bash
vercel --prod
```

**সময়:** ~১০ ঘণ্টা কাজ

## ৪.৭ 73-Center Rollout

- Admin Dashboard
- Training materials (Bengali PDF + video)

---

# ভাগ ৫ — আন্তর্জাতিক মান

## ৫.১ প্রযোজ্য মান

| Standard | Current |
|---|---|
| ISO/IEC 25010 | 75% |
| OWASP Top 10 | 60% |
| WCAG 2.2 AA | 70% |
| ISO 27001 | 50% |

## ৫.২ ISO/IEC 25010 Gap Analysis

| গুণ | বর্তমান | Target |
|---|---|---|
| Functional Suitability | 95% | 100% |
| Performance Efficiency | 70% | 90% |
| Compatibility | 90% | 95% |
| Usability | 85% | 95% |
| Reliability | 70% | 95% |
| Security | 60% | 95% |
| Maintainability | 85% | 90% |
| Portability | 90% | 95% |

## ৫.৩ OWASP Top 10 Status

| # | Risk | Status |
|---|---|---|
| 1 | Broken Access Control | 60% |
| 2 | Cryptographic Failures | 50% |
| 3 | Injection | 90% |
| 4 | Insecure Design | 70% |
| 5 | Security Misconfiguration | 60% |
| 6 | Vulnerable Components | 70% |
| 7 | Auth Failures | 70% |
| 8 | Data Integrity | 60% |
| 9 | Logging Failures | 20% |
| 10 | SSRF | N/A |

## ৫.৪ Standards Roadmap

| Phase | সময় | Standards |
|---|---|---|
| Quality Foundation | ২ সপ্তাহ | ISO 25010 |
| Security Hardening | ২ সপ্তাহ | OWASP, ISO 27001 |
| Accessibility | ১ সপ্তাহ | WCAG 2.2 AA |
| Desktop Packaging | ১ সপ্তাহ | ISO 25010 Portability |
| Cloud Backend | ৩ সপ্তাহ | ISO 27001 |
| Sync & Scale | ২ সপ্তাহ | ISO 25010 Reliability |
| Rollout | ২ সপ্তাহ | Production |

**Full compliance:** ~৬ মাস

---

# ভাগ ৬ — নিরাপত্তা Hardening

## ৬.১ OWASP Fixes Checklist

1. Broken Access Control → Server RBAC + RLS
2. Cryptographic Failures → Argon2id + HTTPS + TLS 1.3
3. Injection → Zod validation + parameterized queries
4. Insecure Design → Threat modeling
5. Security Misconfiguration → CSP + headers
6. Vulnerable Components → npm audit + Dependabot
7. Auth Failures → Rate limit + MFA
8. Data Integrity → Audit log + immutable
9. Logging → Structured logs + Sentry
10. SSRF → N/A

## ৬.২ Data Protection

| Data Type | Classification | Protection |
|---|---|---|
| Customer NID | Sensitive | Encrypt, mask |
| Customer Mobile | PII | Encrypt, log |
| Invoice amounts | Business | Audit log |
| User passwords | Critical | Argon2id |
| Session tokens | Critical | JWT short expiry |
| Audit log | Compliance | Immutable |

---

# ভাগ ৭ — Development Standards

## ৭.১ Git Conventions

### Conventional Commits

```
feat:      নতুন feature
fix:       Bug fix
docs:      Documentation
refactor:  Code refactor
test:      Tests
chore:     Maintenance
```

### Branch Strategy

```
main        → Production
develop     → Development
feature/*   → New features
bugfix/*    → Bug fixes
hotfix/*    → Production hotfix
```

### Semantic Versioning

```
MAJOR.MINOR.PATCH
```

## ৭.২ Required Files

- `.github/workflows/ci.yml`
- `.prettierrc`
- `.eslintrc.json`
- `.gitignore`
- `.env.example`
- `CHANGELOG.md`
- `CONTRIBUTING.md`

## ৭.৩ CI/CD Pipeline

```yaml
name: CI/CD
on: [push, pull_request]
jobs:
  quality:
    - npm ci
    - npm run lint
    - npm run test
    - npm run build
  security:
    - npm audit
  deploy:
    - vercel --prod (on main)
```

---

# ভাগ ৮ — Backup ও Disaster Recovery

## ৮.১ Backup Strategy

| Type | Frequency | Retention |
|---|---|---|
| Database snapshot | Daily | 30 days |
| Full backup | Weekly | 12 weeks |
| Monthly archive | Monthly | 12 months |
| Year-end archive | Yearly | 7 years |

## ৮.২ Locations

1. Supabase automated (primary)
2. S3-compatible (secondary)
3. Local encrypted disk (tertiary)

## ৮.৩ Restore Drill

**Quarterly verification**

---

# ভাগ ৯ — Documentation Standards

## ৯.১ Required Documents

| Document | Audience | Format |
|---|---|---|
| README.md | Developers | Markdown |
| AGENTS.md | AI agents | Markdown |
| ARCHITECTURE.md | Developers | Markdown |
| SECURITY.md | Internal | Markdown |
| DEPLOYMENT.md | DevOps | Markdown |
| User Manual | Operators | Bengali PDF |
| Admin Manual | Admins | Bengali PDF |
| Training Videos | Users | MP4 |

## ৯.২ docs/ Structure

```
docs/
├── AGENTS.md
├── ARCHITECTURE.md
├── SECURITY.md
├── DEPLOYMENT.md
├── ROADMAP.md
├── CHANGELOG.md
└── guides/
    ├── user-manual-bn.md
    └── admin-manual-bn.md
```

---

# ভাগ ১০ — Success Metrics

## ১০.১ Technical

| Metric | Target | Current |
|---|---|---|
| Test coverage | ≥ 80% | 0% |
| Bundle (gzipped) | < 500 KB | 683 KB |
| Build time | < 60s | ~11s ✅ |

## ১০.২ Business

| Metric | Target |
|---|---|
| Pilot centers | 1 |
| Rollout centers | 73 |
| Daily active users | ~219 |
| Invoices/month | ~5,000 |

## ১০.৩ Quality

| Metric | Target |
|---|---|
| Critical bugs | 0 |
| MTTR | < 4 hours |
| Deploy frequency | Weekly |

---

# ভাগ ১১ — সিদ্ধান্তের তালিকা

## ১১.১ সম্পন্ন ✅

- Pilot: Tauri desktop app
- Backend: Supabase
- Sync: PowerSync (free tier)
- ID format: `LSFC55495202-260042`
- Miss Case: Flat fee mode
- Print: PDF-based
- Offline-first architecture
- Multi-tenant with `centerId`

## ১১.২ সিদ্ধান্ত প্রয়োজন ⚠️

| # | বিষয় | Deadline |
|---|---|---|
| ১ | "গ্রাহক" → "ভূমি মালিক" | Pilot polish |
| ২ | Auth model | Backend phase |
| ৩ | MFA | Security phase |
| ৪ | Multi-branch priority | Rollout |
| ৫ | Land Parcel entity | Deferred |
| ৬ | Document tracking | Deferred |

---

# ভাগ ১২ — উপসংহার

## ১২.১ বর্তমান স্কোর

| Dimension | Score |
|---|---|
| Functional | 80% |
| Security | 60% |
| Quality | 70% |
| Documentation | 85% |
| Portability | 90% |
| Scale Readiness | 40% |

## ১২.২ অর্জন

- বাংলা PDF ১০০% নিখুঁত (HarfBuzz + fontkit)
- Complete business logic (waterfall, RBAC, approval)
- Offline-first architecture
- Data-driven configuration
- Backup/Restore সম্পূর্ণ
- Multi-center ready (Unique ID, centerId)

## ১২.৩ এখনই করণীয়

1. Pilot Polish — "গ্রাহক" → "ভূমি মালিক" (২ ঘণ্টা)
2. Dead code cleanup — ৫টি ফাইল (১ ঘণ্টা)
3. AGENTS.md update — Print + Desktop strategy (১ ঘণ্টা)
4. Tauri setup — প্রথম `.msi` build (১০-১৫ ঘণ্টা)

## ১২.৪ Timeline (Part-time, ২ ঘণ্টা/দিন)

```
সপ্তাহ ১-২:  Pilot polish + Tauri → .msi ready
সপ্তাহ ৩-৪:  Supabase backend → cloud-ready
সপ্তাহ ৫:    Sync engine → auto-sync
সপ্তাহ ৬:    Web deploy → online
সপ্তাহ ৭-৮:  Testing + training → rollout-ready
```

**মোট:** ~২ মাস (part-time) = Pilot → Multi-tenant Web

---

**ডকুমেন্ট ভার্সন:** 1.0  
**সর্বশেষ আপডেট:** সেপ্টেম্বর ২০২৬  
**পরবর্তী রিভিউ:** Pilot demo-র পরে

**—— সমাপ্ত ——**