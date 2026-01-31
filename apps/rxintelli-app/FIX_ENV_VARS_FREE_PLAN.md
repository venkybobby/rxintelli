# Setting Environment Variables on Netlify Free Plan

**Good news:** Netlify's free plan DOES support environment variables! If you're having trouble, here's how to fix it.

---

## ✅ Method 1: Set Environment Variables (Free Plan Works!)

### Step 1: Navigate to Environment Variables

1. Go to: https://app.netlify.com
2. Click on your site name
3. Click **"Site settings"** (in the left sidebar)
4. Click **"Environment variables"** (under "Build & deploy")

**If you don't see "Environment variables":**
- Make sure you're logged in
- Make sure you're the site owner
- Try refreshing the page

### Step 2: Add Variables

1. Click **"Add variable"** button
2. Add each variable:

**Variable 1:**
- **Key:** `NEXTAUTH_SECRET`
- **Value:** (paste your generated secret)
- **Scopes:** Check "Production", "Preview", and "Deploy previews"
- Click **"Save"**

**Variable 2:**
- **Key:** `NEXTAUTH_URL`
- **Value:** `https://deluxe-baklava-743914.netlify.app` (your production URL)
- **Scopes:** Check "Production", "Preview", and "Deploy previews"
- Click **"Save"**

---

## ✅ Method 2: Alternative - Use netlify.toml (If UI Doesn't Work)

If you can't access the UI, you can set environment variables in `netlify.toml`:

1. Open `apps/rxintelli-app/netlify.toml`
2. Add this section:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
  # Note: Secrets should still be set in Netlify UI for security
  # But you can set NEXTAUTH_URL here if needed
```

**Important:** For `NEXTAUTH_SECRET`, you MUST use the Netlify UI (Method 1) for security. Don't put secrets in files!

---

## ✅ Method 3: Use Preview URL (Temporary Workaround)

If you absolutely can't set environment variables, you can temporarily use the preview URL:

1. Your preview URL: `https://697799b14e1e3c00b7d97f92--deluxe-baklava-743914.netlify.app`
2. Set `NEXTAUTH_URL` to this preview URL (in Netlify UI)
3. **Note:** This will break when you deploy again (preview URLs change)

**Better solution:** Get the production URL working (Method 1)

---

## 🆘 Troubleshooting: Can't Access Environment Variables

### Issue: "Environment variables" option is missing

**Solutions:**
1. **Check you're logged in** - Make sure you're signed into Netlify
2. **Check site ownership** - You must be the site owner/creator
3. **Try different browser** - Sometimes browser extensions block UI elements
4. **Clear cache** - Try hard refresh (Ctrl+F5 or Cmd+Shift+R)
5. **Try incognito mode** - Open Netlify in a private/incognito window

### Issue: "Add variable" button doesn't work

**Solutions:**
1. **Disable browser extensions** - Ad blockers can interfere
2. **Try different browser** - Chrome, Firefox, Edge
3. **Check JavaScript is enabled**
4. **Try mobile app** - Netlify has a mobile app

### Issue: Changes don't save

**Solutions:**
1. **Make sure you click "Save"** after each variable
2. **Check for error messages** - Look for red error text
3. **Verify you have permissions** - You need to be site owner

---

## ✅ Method 4: Use Netlify CLI (If UI Fails)

If the web UI doesn't work, use the CLI:

1. **Install Netlify CLI:**
   ```cmd
   npm install -g netlify-cli
   ```

2. **Login:**
   ```cmd
   netlify login
   ```

3. **Link your site:**
   ```cmd
   cd apps\rxintelli-app
   netlify link
   ```

4. **Set environment variables:**
   ```cmd
   netlify env:set NEXTAUTH_SECRET "your-secret-here"
   netlify env:set NEXTAUTH_URL "https://deluxe-baklava-743914.netlify.app"
   ```

5. **Redeploy:**
   ```cmd
   netlify deploy --prod
   ```

---

## 🎯 Recommended: Try Method 1 First

**The free plan definitely supports environment variables!**

1. Go to: https://app.netlify.com
2. Click your site
3. Site settings → Environment variables
4. Add your variables
5. Redeploy

If Method 1 doesn't work, try Method 4 (CLI) - it's more reliable.

---

## 💡 Why Environment Variables Matter

Without `NEXTAUTH_URL` set correctly:
- Login might not work
- Authentication redirects might fail
- Session cookies might not be set properly

**Your app will work better with environment variables set!**

---

## ✅ Quick Checklist

- [ ] Logged into Netlify
- [ ] Clicked on your site
- [ ] Went to Site settings → Environment variables
- [ ] Added `NEXTAUTH_SECRET`
- [ ] Added `NEXTAUTH_URL` (production URL, not preview)
- [ ] Redeployed after setting variables

---

**The free plan supports environment variables - you just need to find the right place in the UI!** 🚀
