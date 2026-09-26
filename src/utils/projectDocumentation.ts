/**
 * LSFC Management System — AI Agent & Developer Documentation
 * This document provides complete context for AI models or developers working on this project.
 */

export const LSFC_PROJECT_DOCUMENTATION = `# LSFC Management System — প্রকল্প নথি ও কারিগরি নির্দেশিকা

## ১. প্রজেক্ট পরিচিতি ও উদ্দেশ্য
- **নাম:** ভূমিসেবা সহায়তা কেন্দ্র (Land Service Facilitation Center - LSFC)
- **উদ্দেশ্য:** বাংলাদেশ সরকার অনুমোদিত ভূমিসেবা কেন্দ্র পরিচালনার জন্য স্থানীয়-কেন্দ্রিক (Local-First) ডিজিটাল ম্যানেজমেন্ট সিস্টেম।
- **প্রধান সেবা:** ই-নামজারি, খতিয়ান/পর্চা, মৌজা ম্যাপ, মিস কেস, ভূমি উন্নয়ন কর (LD Tax) ইত্যাদির আবেদন গ্রহণ, সরকারি ও কেন্দ্র ফি হিসাব, ভেক্টর পিডিএফ ইনভয়েস প্রদান, মালিক লেজার ও হিসাবরক্ষণ।

## ২. প্রযুক্তি স্ট্যাক (Tech Stack)
- **ফ্রেমওয়ার্ক:** React 18.3.1 (TypeScript, Strict Mode)
- **বিল্ড টুল:** Vite 6.2.0 (Host: 0.0.0.0, Port: 3000)
- **ডিজাইন:** Tailwind CSS v4.0.9 (ব্র্যান্ড কালার: #902A8B, #37A448, #EC2324, #FFF200, #FFFFFF)
- **পিডিএফ ইঞ্জিন:** @react-pdf/renderer 4.9.0
- **বাংলা ফন্ট ও টেক্সট শেপিং:** HarfBuzz (Wasm) + Fontkit (Anek Bangla 700, Kalpurush 400, Solaiman Lipi)
- **চার্ট ও আইকন:** recharts, lucide-react
- **ডাটা স্টোরেজ:** ব্রাউজার localStorage (ভবিষ্যতে SQLite / Cloud PostgreSQL-এর জন্য প্রস্তুত)

## ৩. লোকাল স্টোরেজ স্কিমা (LocalStorage Keys)
1. \`lsfc.institutionSettings\`: কেন্দ্রের নাম, লাইসেন্স, জিও-কোড ও সেবার ফি তালিকা।
2. \`lsfc.customers\`: ভূমি মালিকদের তালিকা (id, name, mobile, nid, address, uniqueId)।
3. \`lsfc.invoices\`: ইনভয়েসসমূহ (invoiceNumber, customerId, services, payment breakdown, status)।
4. \`lsfc.expenses\`: কেন্দ্রের দৈনন্দিন খরচ (category, amount, status: pending/approved/rejected)।
5. \`lsfc.users\`: সিস্টেম ব্যবহারকারী ও রোল (admin, branch_incharge, operator)।
6. \`lsfc.session\`: বর্তমান লগইন সেশন।

## ৪. প্রধান মডিউল ও ফিচারসমূহ
- **ড্যাশবোর্ড (Dashboard):** রিয়েলটাইম রাজস্ব, মাসিক আয়-ব্যয় চার্ট, নিট লাভ ও সর্বমোট বকেয়ার হিসাব।
- **নতুন আবেদন ও ইনভয়েস (Application Form):** ভূমি মালিকের তথ্য সংগ্রহ, সেবা বাছাই, স্বয়ংক্রিয় সরকারি ও কেন্দ্র ফি হিসাব এবং নিখুঁত বাংলা ভেক্টর ইনভয়েস জেনারেশন।
- **ভূমি মালিক লেজার (Landowner Ledger):** প্রতিটি ভূমি মালিকের পৃথক হিসাব খতিয়ান, অতীত ইনভয়েস ও ওয়াটারফল বকেয়া আদায় ব্যবস্থা।
- **দৈনন্দিন খরচ (Expense Tracker):** কেন্দ্রের অফিস ও পরিচালনা খরচ এন্ট্রি এবং অনুমোদন ওয়ার্কফ্লো।
- **রিপোর্ট ও স্টেটমেন্ট (Reports Hub):** তারিখভিত্তিক কেন্দ্রের সারসংক্ষেপ রিপোর্ট, ভূমি মালিক অ্যাকাউন্ট স্টেটমেন্ট ও CSV এক্সপোর্ট।
- **সেটিংস ও ব্যাকআপ (Settings Hub):** জিও-কোড, কাস্টম সার্ভিস ফি, ইউজার রোল ও JSON ব্যাকআপ/রিস্টোর সুবিধা।

## ৫. বিশেষ বিজনেস লজিক
- **ইউনিক কাস্টমার আইডি:** ফরম্যাট \`LSFC<বিভাগ><জেলা><উপজেলা><লাইসেন্স>-<বছর><সিরিয়াল>\` (যেমন: LSFC55495202-260001)।
- **বাংলা টেক্সট শেপিং:** যুক্তাক্ষর ভাঙন রোধে HarfBuzz WASM দিয়ে গ্লিফ তৈরি করে ভেক্টর SVG আকারে PDF রেন্ডার করা হয়।
- **ওয়াটারফল পেমেন্ট:** বকেয়া পরিশোধ করার সময় স্বয়ংক্রিয়ভাবে প্রাচীনতম বকেয়া ইনভয়েস আগে পরিশোধিত হয়।
`;
