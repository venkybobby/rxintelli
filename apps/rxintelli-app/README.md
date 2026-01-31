# RxIntelli – Prescription Processing Prototype

MVP prototype with two high-impact pages: **Intake** (multi-channel prescription entry) and **Control Tower** (oversight dashboard with real-time-style updates, role-based views, and workflow monitoring).

## Stack

- **Next.js 14** (App Router)
- **NextAuth** (CredentialsProvider, mock users)
- **Tailwind CSS**
- **React Hook Form** + **React Dropzone**
- Custom UI components (Tailwind-based, shadcn-style)

## Run locally

```bash
cd apps/rxintelli-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home – quick links to Intake and Control Tower |
| `/login` | **Login** – Email/password form; mock users (patient@rx.com, rph@rx.com, admin@rx.com / pass) |
| `/intake` | **Intake** – Upload (drag-and-drop, AI OCR toggle), eRx Import (mock), Manual Entry |
| `/control-tower` | **Control Tower** – Metrics, filters, prescription table, expandable timeline |
| `/flow-demo` | **Flow Demo** – Step-by-step mock flow (RX-00123) Intake → … → Completed |
| `/verification` | **Verification** – validation cards (Patient, Physician, Drug, RPE), inline edit, Re-Validate, Proceed to Entry |
| `/entry` | **Entry** – prescription form (Patient read-only, Physician/Drug/RPE editable for RPh), Submit for RPh Review / Approve / Reject |
| `/adjudication` | **Adjudication** – Submit claim (80% approve, random copay $0–50; 20% reject), Enroll in Assistance, Full/Split payment, Pay → /schedule |
| `/schedule` | **Schedule** – Rx summary (Copay Paid, Ready for delivery); Delivery (Pickup \| Home +$5); Location Select (CVS Georgetown, Walgreens, etc.); 7 days from today + 2‑hour slots (9AM–5PM), mock-fetched with loading state; past/full disabled, selected highlighted; "No convenient slot?" → call pharmacy; Confirm & Schedule → toast "Scheduled for [date/time] – Thank you!", success page / Track in Control Tower |

## Features

- **Intake**: Tabs (Upload \| eRx \| Manual), stepper, progress indicator, “Process Prescription” → redirect to Verification with toast.
- **Control Tower**: Total Rx, Avg Time, Success Rate, **Active Alerts** (score &lt; 70, Rejected, `drugValidatedRisk === "High"`, or `rphVerification.notes` &gt; 0); search; status filter; **alert filter** (All / High Risk / Rejected / Pending Approval); table with **Risk** badges (red/yellow/green) and row highlighting (red=high, yellow=warn); expandable timeline; real-time fetch every 5s. **Alert** (destructive) banner when alerts &gt; 0: “X High-Risk Prescriptions Pending Review” "View All" link. **Toast** on new alert: "Alert: High-risk Rx #{id} ({reason})". Table sorted by risk descending; row styles `bg-red-100/50` / `bg-yellow-50/50`.
- **Verification**: Four validation cards (Patient, Physician, Drug, RPE) with Pass/Fail. "Edit" on Fail → inline fields (Input/Textarea/Number) → "Save Changes" updates `updateRx`, re-runs `validateRx`, toast on score improvement. "Re-Validate" re-runs validation; loading spinner during re-validation. "Proceed to Entry" disabled until overall score ≥ 80 (`VERIFICATION_THRESHOLD` in `lib/validateRx.ts`).
- **Entry**: Stepper (Entry active). Fetch by `?rxId=...`. Patient: read-only + "Submit for RPh Review" (→ status Entered). RPh/Admin: editable Physician, Drug, RPE + Approve (→ RPhApproved, navigate `/adjudication?rxId=...`) / Reject (dialog + notes → Rejected). "I verify this Rx" checkbox; collapsible validation summary. Toasts on actions.
- **Adjudication**: Stepper (Adjudication active). Fetch by `?rxId=...`. Summary: Rx ID, drug, **estimated total (from validation)**. "Submit Claim" → mock async (80% approve, random copay $0–50; 20% reject with reason e.g. "Out of network"). On approve: update `adjudication` {claimStatus, payerResponse, copay}. **Reject**: Alert with reason, "Back to Entry", **Retry** (self-healing). **Enroll in Assistance** → mock 20–50% discount, `copayEnrolled: true`. Payment: **Radio** Full / Split; split inputs (auto-calc). Mock payment form (card, expiry, CVV). **Pay** → status Adjudicated, navigate `/schedule?rxId=...`; toast "Claim Approved – Copay $X after enrollment" or "Adjudicated – Proceed to Schedule". Responsive stack on mobile.
- **Schedule**: Stepper (Schedule active). Fetch by `?rxId=...`. **Rx Summary**: Rx #, drug, Copay Paid, Ready for delivery. **Delivery**: Radio Pickup at Pharmacy \| Home Delivery (conditional +$5 note). **Location**: shadcn-style Select (CVS Georgetown TX, Walgreens Round Rock, Other) for Pickup; "Deliver to Home" for Delivery. **Calendar**: 7 days from today; 9AM–5PM 2‑hour blocks; mock async "Fetching availability…" loading state; **slots** generated with random availability (some full); past and full slots disabled, selected slot highlighted. **"No convenient slot?"** link → toast suggesting call pharmacy. **Confirmation**: selected date/time/location; **Confirm & Schedule** → `updateRx` (status Scheduled, `scheduling`), toast **"Scheduled for [date/time] – Thank you!"**; success page with **Track in Control Tower**, Back to Adjudication. Responsive: stack calendar + options on mobile.
- **Auth**: **NextAuth** with CredentialsProvider. Mock users: `patient@rx.com`, `rph@rx.com`, `admin@rx.com` (password: `pass`). Role in session. **Login** page: shadcn-style form, `signIn('credentials')`; toast "Welcome, {role}". **Nav**: "Logged as {role}", **Logout**; **Override** (demo) role dropdown for RPh/Admin only.
- **Protected routes**: Verification, Entry, Adjudication, Control Tower use `useSession()` → redirect to `/login?callbackUrl=...` if unauthenticated. **Middleware**: protects those routes; `/control-tower` requires **admin** or **rph** (patients redirected to `/`).
- **Role-based view**: Patient sees only `patient.id === "PAT-45678"` in Control Tower. Override (RPh/Admin) for demo role switching.
- **Navigation**: Global nav (Home, Intake, …, Control Tower, Flow Demo); stepper on relevant pages.

## Step-by-step mock flow

`lib/mock-rx-flow.ts` simulates RX-00123 (Lisinopril, John Doe) through each stage:

1. **Intake** – `patient`, `prescriptionDetails` from form/OCR; `status: "Intake"`, `source: "Upload"`.
2. **Validated** – `validation`: `patientEligibility: { status: "Eligible" }`, `physicianVerified: true`, `drugValidated: true`, `issues: []`.
3. **Entered** – `prescriptionDetails` may be updated (sig/quantity).
4. **RPhApproved** – `rphVerification`: `approvedBy: "RPh Jane"`, `notes: "No issues"`, `approvedAt`.
5. **Adjudicated** – `adjudication`: `claimStatus: "Approved"`, `payerResponse`, `copay: 15`, `copayEnrolled: true`.
6. **Scheduled** – `scheduling`: `deliveryMethod: "Delivery"`, `date: "2026-01-28"`, `timeSlot: "10:00 AM - 12:00 PM"`, `location: "Home"`, `confirmed: true`.
7. **Completed** – final audit + metrics.

`MOCK_RX_FLOW_STEPS` and `getMockFlowStep(i)` expose each snapshot. **Flow Demo** (`/flow-demo`) renders them. `MOCK_PRESCRIPTIONS[0]` uses `MOCK_RX_00123_ADJUDICATED`.

## Rx (prescription) schema

Canonical shape in `lib/rx-types.ts`: `rxId`, `status`, `createdAt`, `updatedAt`, `source` (Upload | eRx | Manual), `patient`, `physician`, `prescriptionDetails`, `validation` (includes optional `drugValidatedRisk`: High | Medium | Low), `rphVerification`, `adjudication`, `scheduling`, `auditLog`, `metrics.timeInStatus`. Status enum includes `Rejected`. Timeline is derived from `auditLog` via `getTimeline(rx)`; duration from `metrics.timeInStatus` or `createdAt` → `updatedAt` via `getDurationSeconds(rx)`.

## RxIntelli branding

- Teal/blue color scheme (`teal-600`, `teal-700`).
- Stepper: Intake → Verification → Entry → Adjudication → Schedule.

## Mock API (`lib/mockApi.ts`)

In-memory store for demo flow. Seeded with `MOCK_PRESCRIPTIONS`.

- **`createRx(data)`** – Create new Rx (status Intake), push to `mockDb`, return it. Used by Intake on submit.
- **`updateRx(rxId, updates)`** – Update by id; sets `updatedAt`.
- **`getAllRx()`** – Return all prescriptions. Control Tower fetches on load and re-fetches every 10s.
- **`getRxById(rxId)`** – Get one Rx (e.g. for Verification).

**Background `simulateStatusUpdates()`** (runs on module load): every 10s, each eligible Rx advances one step (Intake → … → Completed). 10% random chance of `Rejected` instead; audit log and `updatedAt` updated. Control Tower refreshes via `getAllRx()` so the table reflects mockDb updates.

Intake submit → `createRx` → navigate to `/verification?rxId=...`. Control Tower → `getAllRx()` → filter/sort/render table.

## Verification (`lib/validateRx.ts`)

`validateRx(rx)` returns per-section results (Patient, Physician, Drug, RPE) with status Pass/Fail, overall score (0–100), and issues. Each section scores 25; threshold for "Proceed to Entry" is `VERIFICATION_THRESHOLD` (default 80). On save, mock updates: Patient eligibility set when name+id present; Physician `verified` set when NPI is 10 digits.

## Deployment

### 🎯 **START HERE: Step-by-Step Guide**

**👉 [STEP_BY_STEP_DEPLOY.md](./STEP_BY_STEP_DEPLOY.md) - Follow these exact steps!**

This is the easiest guide with copy-paste commands and detailed explanations.

### 📚 Other Deployment Guides

- **[STEP_BY_STEP_DEPLOY.md](./STEP_BY_STEP_DEPLOY.md)** ⭐ **START HERE** - Detailed step-by-step with exact commands
- **[DEPLOY_NOW.md](./DEPLOY_NOW.md)** - Quick 3-step summary
- **[DEPLOY_WITHOUT_GIT.md](./DEPLOY_WITHOUT_GIT.md)** - All options without Git
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete guide for all platforms
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Quick reference guide

### Recommended Platforms:

1. **Netlify Drop** (Easiest, no Git) - See [DEPLOY_NOW.md](./DEPLOY_NOW.md)
2. **Netlify with Git** - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#-option-1-netlify-easiest-alternative-to-vercel)
3. **Railway** - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#-option-2-railway-great-for-full-stack-apps)
4. **Render** - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#-option-3-render-simple--reliable)
5. **Vercel** - See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
6. **Docker** - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#-option-4-docker--any-platform)

### Required Environment Variables:

- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your deployment URL (set after first deploy)

**Note**: Configuration files are included for Netlify, Render, Vercel, and Docker. See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for details.

## Next steps

1. Implement full Schedule page (delivery method, date, time slot).
2. Add shadcn/ui via `npx shadcn@latest init` and `add` components as needed.
3. Replace mock Rx data with API + optional WebSocket for live updates.
4. Replace mock NextAuth users with real IdP (e.g. OAuth) and persist role/patient.
