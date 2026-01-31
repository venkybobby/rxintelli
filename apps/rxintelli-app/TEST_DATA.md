# Test Data for RxIntelli App

Use this guide to test your deployed app with sample data.

---

## 🧪 Test Methods

Your app has **3 ways to submit prescriptions**:

1. **Upload** - Drag & drop PDF or image (JPG, PNG)
2. **eRx Import** - Mock electronic prescriptions
3. **Manual Entry** - Fill out the form manually

---

## 📄 Method 1: Upload Test (PDF/Image)

### Option A: Use Any PDF or Image

**The app accepts ANY PDF or image file!** Since it's a mock system, you can use:

- **Any PDF file** from your computer (even an empty one or a document)
- **Any image file** (JPG, PNG) - even a screenshot or photo
- **File size limit:** 10MB max
- **Multiple files:** Up to 5 files at once

**Quick test:**
1. Take a screenshot of anything
2. Save it as `prescription.jpg`
3. Upload it in the app
4. Click "Process Prescription"

The app will simulate OCR extraction and create a mock prescription!

### Option B: Create a Simple Test PDF

You can create a simple PDF with this content:

```
PRESCRIPTION

Patient: John Doe
DOB: 01/15/1980
Patient ID: PAT-12345

Physician: Dr. Jane Smith
NPI: 1234567890

Drug: Lisinopril
Strength: 10mg
Quantity: 30
Refills: 0
Sig: Take 1 tablet by mouth once daily

Date: 01/25/2026
```

**How to create:**
1. Open Word/Notepad
2. Copy the text above
3. Save as PDF (File → Save As → PDF)
4. Upload in the app

---

## 📋 Method 2: Manual Entry Test Data

Use this sample data to fill out the **Manual Entry** form:

### Patient Information
- **Patient Name:** `John Doe`
- **Date of Birth:** `1980-01-15` (or use date picker)
- **Gender:** `Male` (or Female/Other)

### Physician Information
- **Physician Name:** `Dr. Jane Smith`
- **NPI:** `1234567890` (must be 10 digits)

### Prescription Details
- **Drug:** `Lisinopril`
- **Strength:** `10mg`
- **Sig (Instructions):** `Take 1 tablet by mouth once daily`
- **Quantity:** `30`
- **Refills:** `0`

### Alternative Test Prescriptions

**Prescription 2:**
- Patient: `Jane Smith`, DOB: `1990-05-20`, Gender: `Female`
- Physician: `Dr. Michael Johnson`, NPI: `9876543210`
- Drug: `Metformin`, Strength: `500mg`, Sig: `Take 1 tablet twice daily with meals`, Quantity: `60`, Refills: `3`

**Prescription 3:**
- Patient: `Robert Williams`, DOB: `1975-12-10`, Gender: `Male`
- Physician: `Dr. Sarah Davis`, NPI: `1122334455`
- Drug: `Atorvastatin`, Strength: `20mg`, Sig: `Take 1 tablet at bedtime`, Quantity: `90`, Refills: `11`

---

## 🔌 Method 3: eRx Import Test

The app has **2 mock eRx prescriptions** pre-loaded:

1. **ERX-001**
   - Patient: John D. (P-1001)
   - Drug: Lisinopril 10mg
   - Ref: REF-A1

2. **ERX-002**
   - Patient: Jane S. (P-1002)
   - Drug: Metformin 500mg
   - Ref: REF-B2

**To test:**
1. Go to Intake page
2. Click "eRx Import" tab
3. Search for "ERX" or click on one of the results
4. Click "Import" button

---

## ✅ Complete Test Flow

### Full End-to-End Test:

1. **Login** as `admin@rx.com` / `pass`

2. **Intake:**
   - Go to Intake page
   - Upload any PDF/image OR use Manual Entry with test data above
   - Click "Process Prescription"
   - You'll be redirected to Verification

3. **Verification:**
   - Review the validation cards
   - If any show "Fail", click "Edit" to fix
   - Click "Re-Validate" to check again
   - When score ≥ 80, click "Proceed to Entry"

4. **Entry:**
   - As Admin/RPh: You can edit prescription details
   - Click "Approve" to proceed
   - Or "Reject" to test rejection flow

5. **Adjudication:**
   - Click "Submit Claim" (80% chance of approval)
   - If approved: Enter payment details
   - Click "Pay" to proceed

6. **Schedule:**
   - Select delivery method (Pickup or Delivery)
   - Choose location (if Pickup)
   - Select a time slot
   - Click "Confirm & Schedule"

7. **Control Tower:**
   - View all prescriptions
   - See metrics and alerts
   - Filter by status, search, etc.

---

## 🎯 Quick Test Scenarios

### Scenario 1: High-Risk Prescription
- Use Manual Entry
- Set NPI to less than 10 digits (e.g., `12345`)
- This will create a "Fail" in Verification
- Test the edit and re-validation flow

### Scenario 2: Complete Flow
- Upload any image/PDF
- Follow through all steps: Intake → Verification → Entry → Adjudication → Schedule
- Verify it appears in Control Tower

### Scenario 3: Role Testing
- Login as `patient@rx.com` - Can only see their own prescriptions
- Login as `rph@rx.com` - Can approve/reject and see Control Tower
- Login as `admin@rx.com` - Full access

---

## 📝 Sample Prescription Text (for PDF creation)

Copy this into a document and save as PDF:

```
═══════════════════════════════════════
          PRESCRIPTION
═══════════════════════════════════════

PATIENT INFORMATION
───────────────────
Name: John Doe
Date of Birth: January 15, 1980
Patient ID: PAT-12345
Gender: Male

PHYSICIAN INFORMATION
─────────────────────
Name: Dr. Jane Smith, MD
NPI: 1234567890
License: TX-12345

PRESCRIPTION DETAILS
───────────────────
Drug Name: Lisinopril
Strength: 10mg
Dosage Form: Tablet
Quantity: 30 tablets
Refills: 0

SIG (Instructions):
Take 1 tablet by mouth once daily
for hypertension

INDICATION: Hypertension
DAYS SUPPLY: 30

═══════════════════════════════════════
Date: January 25, 2026
Prescriber Signature: [Dr. Jane Smith]
═══════════════════════════════════════
```

---

## 💡 Tips

1. **Any file works** - Since it's a mock system, upload any PDF or image
2. **Test different scenarios** - Try valid/invalid data to see validation
3. **Check Control Tower** - See how prescriptions appear in the dashboard
4. **Test alerts** - Create prescriptions with low scores to see alerts
5. **Role switching** - Test different user roles to see access differences

---

## 🚀 Ready to Test!

1. Go to your Netlify URL
2. Login with `admin@rx.com` / `pass`
3. Go to Intake
4. Upload any PDF/image or use Manual Entry
5. Follow the flow!

**Remember:** The app is a mock/demo system, so any file will work - it simulates the OCR extraction process.

---

**Happy testing! 🎉**
