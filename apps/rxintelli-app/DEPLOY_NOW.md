# 🚀 Deploy Right Now - 3 Simple Steps

## Step 1: Build Your App
Open PowerShell and run:
```powershell
cd c:\Users\shris\ai-data-science-team\apps\rxintelli-app
npm install
npm run build
```

## Step 2: Deploy to Netlify (No Git Required!)
1. Go to: **https://app.netlify.com/drop**
2. **Drag your entire `apps\rxintelli-app` folder** onto the page
3. Wait 1-2 minutes for deployment
4. Copy your deployment URL (e.g., `https://random-name-12345.netlify.app`)

## Step 3: Set Environment Variables
1. In Netlify dashboard, go to: **Site settings → Environment variables**
2. Click **"Add variable"** and add:

   **Variable 1:**
   - Key: `NEXTAUTH_SECRET`
   - Value: Run this in PowerShell and copy the output:
     ```powershell
     [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
     ```

   **Variable 2:**
   - Key: `NEXTAUTH_URL`
   - Value: Your Netlify URL (the one you copied in Step 2)

3. Go to **Deploys → Trigger deploy → Deploy site**

## ✅ Done!
Your app is now live! Visit your Netlify URL and test it.

---

## 🆘 Having Issues?

**"npm is not recognized"**
→ Install Node.js from https://nodejs.org/ and restart PowerShell

**"Build fails"**
→ Make sure you're in the `apps\rxintelli-app` directory
→ Run `npm install` first

**"App crashes"**
→ Check environment variables are set correctly
→ Verify `NEXTAUTH_URL` matches your deployment URL exactly

**Need more help?**
→ See [DEPLOY_WITHOUT_GIT.md](./DEPLOY_WITHOUT_GIT.md) for detailed alternatives
