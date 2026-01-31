# 🚀 Step-by-Step Deployment Guide - Follow These Exact Steps

This guide will walk you through deploying your app in the simplest way possible. Just follow each step!

---

## ✅ Step 1: Open PowerShell

1. Press `Windows Key + X`
2. Click "Windows PowerShell" or "Terminal"
3. You should see a window with a prompt like: `PS C:\Users\shris>`

**⚠️ IMPORTANT: If you get an execution policy error when running npm:**
- See [FIX_POWERSHELL_ERROR.md](./FIX_POWERSHELL_ERROR.md) for the fix
- OR use Command Prompt instead (Windows Key + R, type `cmd`)

---

## ✅ Step 2: Navigate to Your App Folder

Copy and paste this EXACT command into PowerShell:

```powershell
cd c:\Users\shris\ai-data-science-team\apps\rxintelli-app
```

Press Enter. You should see the path change to show you're in the rxintelli-app folder.

**If you get an error:**
- Make sure the path is correct
- Check that the folder exists: `dir` (should show package.json, app folder, etc.)

---

## ✅ Step 3: Install Dependencies

Copy and paste this command:

```powershell
npm install
```

Press Enter and wait. This will take 1-3 minutes. You'll see lots of text scrolling.

**What you should see:**
- Lots of package names being installed
- Eventually it will finish and show the prompt again

**If you get "npm is not recognized":**
- Install Node.js from: https://nodejs.org/
- Choose the LTS version
- Restart PowerShell after installing
- Try again

**If you get "execution policy" error:**
- See [FIX_POWERSHELL_ERROR.md](./FIX_POWERSHELL_ERROR.md) for solutions
- Quick fix: Use Command Prompt (cmd) instead of PowerShell

---

## ✅ Step 4: Build Your App

Copy and paste this command:

```powershell
npm run build
```

Press Enter and wait. This takes 30-60 seconds.

**What you should see:**
- Text about compiling
- Eventually: "✓ Compiled successfully" or similar
- The prompt returns

**If build fails:**
- Look at the error message
- Common fix: Make sure you ran `npm install` first
- Check you're in the right folder (should see package.json)

---

## ✅ Step 5: Prepare Folder for Upload

**IMPORTANT:** Before uploading, we need to make sure the folder is ready.

1. Open File Explorer (Windows Key + E)
2. Navigate to: `c:\Users\shris\ai-data-science-team\apps\rxintelli-app`
3. You should see folders like: `app`, `components`, `lib`, etc.
4. **Keep this window open** - you'll need it in the next step

---

## ✅ Step 6: Deploy to Netlify (Drag & Drop!)

1. **Open your web browser**
2. **Go to:** https://app.netlify.com/drop
3. **You'll see a page that says "Deploy manually" with a big box**
4. **Go back to File Explorer** (the window from Step 5)
5. **Click on the `rxintelli-app` folder** (the whole folder, not inside it)
6. **Drag the entire `rxintelli-app` folder** from File Explorer
7. **Drop it onto the Netlify page** (the big box area)

**What happens:**
- The page will show "Uploading..."
- Then "Building..."
- Wait 1-3 minutes
- You'll see a success message with a URL like: `https://random-name-12345.netlify.app`

**Write down or copy this URL!** You'll need it in the next step.

---

## ✅ Step 7: Set Up Environment Variables

### 7a. Generate Secret Key

1. Go back to PowerShell
2. Copy and paste this command:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

3. Press Enter
4. **Copy the output** (it will be a long string of letters/numbers)
5. **Save it somewhere** - you'll need it in a moment

### 7b. Add Variables in Netlify

1. In your browser, on the Netlify page, click **"Site settings"** (or go to the dashboard)
2. Click **"Environment variables"** (in the left sidebar)
3. Click **"Add variable"** button

**Add First Variable:**
- **Key:** Type exactly: `NEXTAUTH_SECRET`
- **Value:** Paste the secret you generated in step 7a
- Click **"Save"**

**Add Second Variable:**
- Click **"Add variable"** again
- **Key:** Type exactly: `NEXTAUTH_URL`
- **Value:** Paste your Netlify URL (from Step 6, like `https://random-name-12345.netlify.app`)
- Click **"Save"**

---

## ✅ Step 8: Redeploy with New Variables

1. In Netlify dashboard, click **"Deploys"** (top menu)
2. Click **"Trigger deploy"** dropdown
3. Click **"Deploy site"**
4. Wait 1-2 minutes for it to rebuild

---

## ✅ Step 9: Test Your App!

1. Go to your Netlify URL (from Step 6)
2. You should see your app's home page
3. Try clicking "Login"
4. Test login with:
   - Email: `patient@rx.com`
   - Password: `pass`

**If it works:** 🎉 **Congratulations! Your app is deployed!**

**If it doesn't work:**
- Check the Troubleshooting section below
- Look at the browser console (F12) for errors
- Check Netlify deployment logs

---

## 🆘 Troubleshooting Common Issues

### Issue: "npm is not recognized"

**Solution:**
1. Install Node.js: https://nodejs.org/
2. Download the LTS version
3. Install it (use default settings)
4. **Restart PowerShell completely**
5. Try again from Step 3

---

### Issue: Build fails with errors

**Solution:**
1. Make sure you're in the right folder:
   ```powershell
   cd c:\Users\shris\ai-data-science-team\apps\rxintelli-app
   dir
   ```
   (Should see package.json)

2. Delete node_modules and try again:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   npm run build
   ```

---

### Issue: App crashes or shows errors after deployment

**Check these:**
1. Environment variables are set correctly:
   - Go to Netlify → Site settings → Environment variables
   - Make sure `NEXTAUTH_SECRET` exists
   - Make sure `NEXTAUTH_URL` matches your Netlify URL exactly (including `https://`)

2. Redeploy after setting variables:
   - Go to Deploys → Trigger deploy → Deploy site

3. Check deployment logs:
   - In Netlify, click on the latest deployment
   - Look at the "Build log" for errors

---

### Issue: Can't drag folder to Netlify

**Alternative method:**
1. In File Explorer, right-click the `rxintelli-app` folder
2. Select "Send to" → "Compressed (zipped) folder"
3. This creates a ZIP file
4. Drag the ZIP file to Netlify Drop instead
5. Netlify will extract it automatically

---

### Issue: "Deployment not found" or similar errors

**Solution:**
1. Make sure you're using Netlify Drop (https://app.netlify.com/drop)
2. Not the regular deploy page
3. Try creating a new deployment by dragging the folder again

---

## 📝 Quick Reference Commands

If you need to start over or repeat steps:

```powershell
# Navigate to app folder
cd c:\Users\shris\ai-data-science-team\apps\rxintelli-app

# Install dependencies
npm install

# Build the app
npm run build

# Generate secret (for environment variable)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## ✅ Success Checklist

Before you're done, verify:

- [ ] App builds successfully (`npm run build` works)
- [ ] App is deployed to Netlify (you have a URL)
- [ ] Environment variables are set (NEXTAUTH_SECRET and NEXTAUTH_URL)
- [ ] App has been redeployed after setting variables
- [ ] You can visit the URL and see the app
- [ ] Login works (test with patient@rx.com / pass)

---

## 🎯 Next Steps After Deployment

Once your app is working:

1. **Share the URL** with others
2. **Set up a custom domain** (optional, in Netlify settings)
3. **Monitor usage** in Netlify dashboard
4. **Set up Git later** for automatic deployments (optional)

---

## 💡 Need More Help?

If you're still stuck:

1. **Check the error message** - it usually tells you what's wrong
2. **Look at Netlify build logs** - they show what happened during deployment
3. **Try the alternative methods** in [DEPLOY_WITHOUT_GIT.md](./DEPLOY_WITHOUT_GIT.md)
4. **Check browser console** (F12) for runtime errors

**Remember:** Most issues are:
- Missing Node.js → Install it
- Wrong folder → Make sure you're in `apps\rxintelli-app`
- Missing environment variables → Set them in Netlify
- Need to redeploy → Trigger a new deployment after setting variables

---

**You've got this! Follow the steps one by one, and you'll have your app deployed! 🚀**
