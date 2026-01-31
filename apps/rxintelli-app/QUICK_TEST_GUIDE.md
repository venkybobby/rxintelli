# Quick Test Guide - RxIntelli App

## 🚀 Fastest Way to Test

### Step 1: Login
- Go to: `https://deluxe-baklava-743914.netlify.app`
- Click "Login"
- Use: `admin@rx.com` / `pass`

### Step 2: Test Upload (Easiest!)
1. Go to **Intake** page
2. Click **"Upload"** tab
3. **Drag ANY image or PDF** onto the page
   - Can be a screenshot, photo, or any PDF
   - The app will accept it (it's a mock system)
4. Click **"Process Prescription"**
5. Wait for processing animation
6. You'll be redirected to Verification

### Step 3: Test Manual Entry
1. Go to **Intake** page
2. Click **"Manual Entry"** tab
3. Fill in:
   - Patient Name: `John Doe`
   - DOB: `1980-01-15`
   - Gender: `Male`
   - Physician Name: `Dr. Jane Smith`
   - NPI: `1234567890` (10 digits)
   - Drug: `Lisinopril`
   - Strength: `10mg`
   - Sig: `Take 1 tablet daily`
   - Quantity: `30`
   - Refills: `0`
4. Click **"Submit"**

---

## 📋 Sample Test Data (Copy & Paste)

### Quick Manual Entry Test:
```
Patient Name: John Doe
DOB: 1980-01-15
Gender: Male
Physician: Dr. Jane Smith
NPI: 1234567890
Drug: Lisinopril
Strength: 10mg
Sig: Take 1 tablet daily
Quantity: 30
Refills: 0
```

---

## ✅ What to Test

1. **Upload works** - Any file is accepted
2. **Manual entry works** - Form submission
3. **Verification** - See validation cards
4. **Entry** - Approve/reject flow
5. **Adjudication** - Submit claim, payment
6. **Schedule** - Pick time slot
7. **Control Tower** - View all prescriptions

---

## 🎯 Test Files

**You can use ANY of these:**
- Screenshot of this page
- Any PDF from your computer
- Photo from your phone
- Empty PDF (just create a blank PDF)

**The app will accept it and simulate processing!**

---

**That's it! Just upload any file and test the flow!** 🚀
