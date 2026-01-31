# Fix PowerShell Execution Policy Error

You're getting this error because Windows PowerShell is blocking script execution. Here's how to fix it:

---

## ✅ Solution 1: Change Execution Policy (Recommended)

### Step 1: Open PowerShell as Administrator

1. Press `Windows Key + X`
2. Click **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
3. If prompted, click **"Yes"** to allow changes

### Step 2: Run This Command

Copy and paste this EXACT command:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Press Enter.

### Step 3: Confirm

- You'll see a prompt asking if you want to change the execution policy
- Type `Y` and press Enter

### Step 4: Close and Reopen PowerShell

1. Close the admin PowerShell window
2. Open a **regular** PowerShell (not admin)
3. Navigate to your app folder:
   ```powershell
   cd c:\Users\shris\ai-data-science-team\apps\rxintelli-app
   ```
4. Try `npm install` again

---

## ✅ Solution 2: Use Command Prompt Instead (Quick Fix)

If you don't want to change PowerShell settings, use Command Prompt instead:

### Step 1: Open Command Prompt

1. Press `Windows Key + R`
2. Type: `cmd`
3. Press Enter

### Step 2: Navigate to Your App

```cmd
cd c:\Users\shris\ai-data-science-team\apps\rxintelli-app
```

### Step 3: Run npm Commands

```cmd
npm install
npm run build
```

Command Prompt doesn't have this restriction, so it will work immediately!

---

## ✅ Solution 3: Bypass for Single Command (Temporary)

If you want to keep using PowerShell but just run npm once:

```powershell
powershell -ExecutionPolicy Bypass -Command "npm install"
```

But this is tedious - better to use Solution 1 or 2.

---

## 🎯 Recommended: Use Solution 1

**Why?** It fixes the issue permanently and you can use PowerShell normally after that.

**Steps:**
1. Open PowerShell as Admin
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Type `Y` to confirm
4. Close admin PowerShell
5. Open regular PowerShell
6. Continue with your deployment steps

---

## ✅ After Fixing: Continue Deployment

Once you've fixed the execution policy, continue with the deployment guide:

1. Navigate to app folder:
   ```powershell
   cd c:\Users\shris\ai-data-science-team\apps\rxintelli-app
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Build the app:
   ```powershell
   npm run build
   ```

4. Continue with Step 5 in [STEP_BY_STEP_DEPLOY.md](./STEP_BY_STEP_DEPLOY.md)

---

## 🆘 Still Having Issues?

**If Solution 1 doesn't work:**
- Make sure you opened PowerShell **as Administrator**
- Try Solution 2 (use Command Prompt instead)

**If npm still doesn't work:**
- Verify Node.js is installed: `node --version`
- If not installed, download from: https://nodejs.org/
- Restart your computer after installing Node.js

---

## 💡 What This Error Means

Windows PowerShell has a security feature that prevents scripts from running by default. This protects your computer, but it also blocks npm (which is a script). 

The `RemoteSigned` policy allows:
- ✅ Scripts you write locally (like npm)
- ✅ Scripts from the internet that are signed
- ❌ Unsigned scripts from the internet (still blocked for safety)

This is a safe setting that won't compromise your security!

---

**Choose Solution 1 or 2, and you'll be back on track! 🚀**
