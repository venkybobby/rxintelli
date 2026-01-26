# Prescription Processing App — Website Structure & Content Outline

## 1. Purpose & Goals

### Website Purpose
A **prescription processing application** that streamlines the full lifecycle of prescription handling—from upload and verification to fulfillment, claims, payments, and scheduling. The app serves **pharmacy staff**, **billing teams**, and **healthcare administrators** who need to:
- Capture and validate prescription data (Rx)
- Process and track prescriptions through workflow stages
- Submit and monitor insurance claims
- Manage payments (patient + payer)
- Schedule refills, pickups, and pharmacy operations

### Core User Goals
| User Role | Primary Goals |
|-----------|---------------|
| Pharmacy staff | Upload Rx, verify details, fulfill prescriptions, manage queue |
| Billing / claims | Submit claims, resolve rejections, track reimbursements |
| Administrators | Monitor metrics, schedules, compliance, reporting |

### Non-Goals (v1)
- Patient-facing self-service portal (can be a later phase)
- Full EHR/EMR integration (assume file-based or API uploads)
- Real-time clinical decision support (e.g., drug–drug interaction checks) — can be noted as “coming soon”

---

## 2. Information Architecture & Navigation

### 2.1 Sitemap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESCRIPTION PROCESSING APP                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐   ┌─────────────┐   ┌──────────────────┐   ┌─────────────┐    │
│  │  HOME   │   │ Rx UPLOAD   │   │  PRESCRIPTION    │   │ CLAIM &     │    │
│  │         │   │             │   │  SCREEN          │   │ PAYMENT     │    │
│  └────┬────┘   └──────┬──────┘   └────────┬─────────┘   └──────┬──────┘    │
│       │               │                   │                     │           │
│       │               │                   │                     │           │
│       └───────────────┴───────────────────┴─────────────────────┘           │
│                                       │                                      │
│                               ┌───────┴───────┐                             │
│                               │   SCHEDULE    │                             │
│                               │   SCREEN      │                             │
│                               └───────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Global Navigation

**Primary nav (top bar or sidebar):**
1. **Home** — Dashboard, quick actions, status overview  
2. **Rx Upload** — Upload & intake prescriptions  
3. **Prescriptions** — Prescription list, detail, workflow  
4. **Claim & Payment** — Claims, payments, remittance  
5. **Schedule** — Refills, pickups, staff, calendar  

**Secondary / utility:**
- **Search** (global) — Rx ID, patient, NDC, claim number  
- **Notifications / Alerts** — Pending items, rejections, overdue  
- **User menu** — Profile, settings, logout  
- **Help / ?** — Onboarding, FAQs, support  

### 2.3 Breadcrumbs & Context
- **Breadcrumb pattern:** `Home > Prescriptions > [Rx #12345]` or `Home > Claim & Payment > Claims`  
- **Persistent context:** Current pharmacy/location (if multi-site), date range filters where relevant  

---

## 3. Page Outlines & Content Ideas

### 3.1 Home

**Purpose:** Central hub—status at a glance, quick actions, and entry points to main workflows.

#### Layout
- **Hero / welcome** — Greeting, current date, optional pharmacy/location selector.  
- **Key metrics cards** (configurable):
  - Prescriptions pending verification  
  - Prescriptions ready for pickup  
  - Claims pending / in progress  
  - Overdue refills or expiring soon  
- **Quick actions**
  - “Upload Rx” → Rx Upload  
  - “New prescription” (manual entry) → Prescription screen (create)  
  - “Process claims” → Claim & Payment  
  - “View schedule” → Schedule  
- **Activity feed / recent items**
  - Last 10–20 items: Rx uploaded, verified, fulfilled, claim submitted, payment received.  
  - Filters: by type, date, user.  
- **Alerts / notifications**
  - Rejected claims, missing info, expiring auth, low stock (if applicable).  
- **Shortcuts / favorites**
  - User-configurable links to frequent screens or saved searches.  

#### Content ideas
- Short **“How to”** tips (e.g., “Need to reprocess a claim? Go to Claim & Payment > select claim > Resubmit.”).  
- **Compliance or policy reminders** (e.g., “Controlled substance logs due by …”).  
- **Release notes / announcements** (optional).  

---

### 3.2 Rx Upload Screen

**Purpose:** Intake prescriptions via upload (image, PDF, structured file) or manual entry; validate and route into the Prescription workflow.

#### Layout
- **Upload zone**
  - Drag-and-drop or file picker.  
  - Supported formats: PDF, images (JPEG, PNG), CSV/Excel for bulk Rx data.  
  - Optional: camera capture (mobile).  
- **Upload queue**
  - List of files with status: Pending → Processing → Extracted → Verified / Error.  
  - Actions: Retry, remove, view extraction result.  
- **Manual entry**
  - “Add prescription manually” → form or guided flow (patient, drug, sig, prescriber, etc.).  
- **Extraction / OCR results** (when applicable)
  - Preview of extracted fields (patient name, DOB, drug, strength, quantity, sig, prescriber, date).  
  - Edit corrections before saving.  
  - Confidence indicators or “review required” flags.  
- **Validation panel**
  - Required-field checks, basic format validation (NDC, dates).  
  - Warnings: missing refills, unclear sig, potential duplicates.  
- **Actions**
  - “Save as draft” — store for later.  
  - “Create prescription” — send to Prescription screen and optionally open it.  
  - “Bulk create” — for multi-Rx uploads.  

#### Content ideas
- **Upload guidelines:** “Supported formats: PDF, JPG, PNG. Max 10 MB per file.”  
- **Tips:** “Clear, well-lit photos improve extraction accuracy.”  
- **Error recovery:** Clear messages for failed OCR or validation, with “Edit & retry” or “Enter manually.”  

#### Navigation
- **From:** Home (quick action), global nav.  
- **To:** Prescription screen (new or existing Rx), Home.  

---

### 3.3 Prescription Screen

**Purpose:** View, edit, and manage individual prescriptions and their workflow state (intake → verification → fulfillment → ready for pickup / shipped).

#### Layout
- **List view (default)**
  - Table/grid: Rx ID, patient, drug, prescriber, status, dates, last updated.  
  - Filters: status, date range, prescriber, drug/NDC, patient.  
  - Sort by date, status, priority.  
  - Bulk actions: Verify, mark fulfilled, send to claims, export.  
- **Detail view (drill-down)**
  - **Header:** Rx ID, status badge, patient name, drug.  
  - **Tabs or sections:**
    1. **Overview** — Patient, prescriber, drug, strength, quantity, sig, refills, dates, source (upload vs manual).  
    2. **Workflow** — Status timeline, assigned user, notes. Actions: Verify, Fulfill, Mark ready, etc.  
    3. **Claims** — Linked claims (if any), claim status. Link to Claim & Payment.  
    4. **Payments** — Patient responsibility, payments applied. Link to Claim & Payment.  
    5. **History** — Audit log (edits, status changes, claims).  
- **Create / Edit**
  - Form mirrors required fields from Rx Upload.  
  - Inline validation, NDC lookup if available.  

#### Content ideas
- **Status definitions:** Tooltip or help for each status (e.g., “Verified = Rx checked and ready for fulfillment”).  
- **Workflow guidance:** “Next: Submit claim in Claim & Payment” when Rx is fulfilled.  
- **Duplicate detection:** “Similar Rx found for this patient. Review before creating.”  

#### Navigation
- **From:** Home, Rx Upload, Search, Schedule (e.g., refill due).  
- **To:** Claim & Payment (when submitting or viewing claims), Schedule (refill scheduling), Home.  

---

### 3.4 Claim & Payment Screen

**Purpose:** Manage insurance claims (submit, track, correct, resubmit) and payments (patient + payer).

#### Layout
- **Tab or section switcher:** **Claims** | **Payments** | **Remittance** (optional).  

#### Claims
- **Claim list**
  - Columns: Claim ID, Rx ID, patient, payer, submitted date, status (pending, accepted, rejected, paid), amount billed, amount paid.  
  - Filters: status, payer, date range, Rx ID.  
- **Claim detail**
  - Claim form snapshot (e.g., NCPDP fields), submission history, EOB/ERA reference.  
  - **Actions:** Resubmit, Correct & resubmit, Appeal, Void.  
  - **Rejection handling:** Rejection reason, resolution steps, link back to Prescription if data fix needed.  
- **Submit new claim**
  - From Rx: select prescription(s) → choose payer → submit.  
  - Batch submit: multi-Rx, multi-claim.  

#### Payments
- **Payment list**
  - Patient payments (copay, cash, card) and payer payments (reimbursement).  
  - Date, amount, method, linked Rx/claim.  
- **Payment application**
  - Apply payment to specific Rx or claim; split across multiple.  
  - Record method, reference number, notes.  
- **Patient balance**
  - Balance by patient; aging (e.g., 0–30, 31–60 days).  
  - Quick “Collect payment” or “Payment plan” actions.  

#### Remittance (optional)
- **ERA / EOB list**
  - Payer, check/EFT info, date posted.  
- **Remittance detail**
  - Claim-level adjustments, paid amount, rejections.  
  - Reconcile to claims.  

#### Content ideas
- **Claim status glossary:** Pending vs Accepted vs Rejected vs Paid.  
- **Common rejections:** “Prior auth required,” “Invalid NDC”—link to resolution steps.  
- **Payment policies:** “Copay due at pickup,” “Refund process.”  

#### Navigation
- **From:** Home, Prescription screen (via “Submit claim” or “View claims”).  
- **To:** Prescription screen (to fix Rx data), Schedule (e.g., prior auth follow-up).  

---

### 3.5 Schedule Screen

**Purpose:** Manage time-based activities: refills, pickups, prior auths, staff, and operational calendar.

#### Layout
- **View switcher:** **Calendar** | **List** | **Board** (optional).  
- **Date range & filters**
  - Today, week, month; filter by type (refill, pickup, prior auth, other).  
- **Calendar view**
  - Day / week / month.  
  - Events: Refill due, Ready for pickup, Prior auth expiry, Staff shifts, meetings.  
  - Color or icon by type.  
  - Click event → detail or quick action (e.g., open Rx, mark picked up).  
- **List view**
  - Refills due: Rx, patient, drug, next fill date, actions (schedule, remind, fulfill).  
  - Ready for pickup: Rx, patient, ready date, notiﬁcation status.  
  - Prior auth / expiring: Rx, auth end date, actions (renew, contact prescriber).  
- **Board view (optional)**
  - Columns: Upcoming | Due soon | Overdue | Done.  
  - Drag-and-drop to reschedule or mark complete.  

#### Content ideas
- **Refill rules:** “Refill eligible X days before supply ends.”  
- **Pickup windows:** “Hold until [date]; then return to stock.”  
- **Prior auth:** “Start renewal Y days before expiry.”  

#### Navigation
- **From:** Home, Prescription screen (refill schedule, pickup status).  
- **To:** Prescription screen, Claim & Payment (prior auth), Rx Upload.  

---

## 4. Cross-Cutting Features

### 4.1 Search
- **Global search** (header): Rx ID, patient name, NDC, claim ID.  
- **Results:** Grouped by type (Prescriptions, Claims, Patients).  
- **Quick navigation** to Prescription or Claim & Payment detail.  

### 4.2 Notifications & Alerts
- **In-app:** Badge on nav, dropdown with pending items (rejections, refills due, etc.).  
- **Optional:** Email or SMS for critical items (configurable).  

### 4.3 User & Role-Based Access
- **Roles:** Pharmacy staff, Billing, Admin (expandable).  
- **Permissions:** Per page or per action (e.g., void claim, override status).  
- **Audit:** Who did what, when (visible in History tabs).  

### 4.4 Settings (optional top-level or under user menu)
- **Pharmacy:** Name, NPI, address, contact.  
- **Defaults:** Default payer, date formats, notification preferences.  
- **Integrations:** Clearinghouse, PM system, optional EHR (future).  

---

## 5. User Flows (Summary)

| Flow | Steps |
|------|--------|
| **Upload → Prescription → Fulfill** | Home or Rx Upload → upload Rx → validate → Create prescription → Prescription screen → Verify → Fulfill → (optional) Schedule pickup |
| **Prescription → Claim → Payment** | Prescription screen → Submit claim → Claim & Payment → track status → receive remittance → apply payment → update patient balance |
| **Refill workflow** | Schedule screen (Refills due) → open Rx → fulfill or schedule → update refill date |
| **Rejection resolution** | Claim & Payment (rejected) → view reason → fix in Prescription or Claim → Resubmit |

---

## 6. Technical Considerations (for implementation)

- **Responsive design:** Mobile-friendly for Rx Upload (camera) and Schedule; desktop-optimized for Claims and detailed Prescription workflows.  
- **State management:** Clear URL or route per main screen (e.g. `/upload`, `/prescriptions`, `/prescriptions/:id`, `/claims`, `/schedule`) for bookmarking and back/forward.  
- **Accessibility:** Keyboard nav, ARIA labels, focus management, sufficient contrast.  
- **Performance:** Pagination or virtual scrolling for long lists (Prescriptions, Claims); lazy-load detail panels.  
- **Security:** HIPAA-aware handling of PHI; secure file upload and storage; role-based UI and API access.  

---

## 7. Next Steps

1. **Validate** with stakeholders: pharmacy staff, billing, compliance.  
2. **Prioritize** MVP: e.g. Home, Rx Upload, Prescription (list + detail), Claim & Payment (Claims + Payments), Schedule (Refills + Pickups).  
3. **Design** wireframes per screen; map to components (e.g. React, Streamlit, or Next.js).  
4. **Define** APIs and data model: Rx, Claim, Payment, Schedule events.  
5. **Build** navigation shell and routing, then implement each page per outline above.  

---

*Document version: 1.0 — Prescription Processing App structure & content outline.*
