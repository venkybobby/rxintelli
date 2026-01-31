# How to Find Your Netlify Production URL

You have a **preview URL** (the one with the long hash). Here's how to get your **production URL**:

---

## ✅ Step 1: Go to Netlify Dashboard

1. Go to: https://app.netlify.com
2. You should see your site listed (probably named something like "deluxe-baklava-743914")

---

## ✅ Step 2: Find Your Production URL

### Option A: From the Site Overview

1. Click on your site name in the dashboard
2. Look at the top of the page
3. You'll see a URL like: `https://deluxe-baklava-743914.netlify.app`
4. **This is your production URL!** (no hash in the middle)

### Option B: From Site Settings

1. Click on your site
2. Go to **"Site settings"** (left sidebar)
3. Click **"Domain management"**
4. You'll see:
   - **Production domain**: `https://deluxe-baklava-743914.netlify.app` (or similar)
   - **Preview deployments**: The one with the hash

---

## ✅ Step 3: Set Environment Variables

Now that you have your production URL, set it up:

1. In Netlify, go to **Site settings** → **Environment variables**
2. Make sure you have:
   - `NEXTAUTH_SECRET` = (your generated secret)
   - `NEXTAUTH_URL` = `https://deluxe-baklava-743914.netlify.app` (your production URL, NOT the preview URL)

3. **Important**: Use the production URL (without the hash), not the preview URL!

---

## ✅ Step 4: Redeploy

After setting the environment variables:

1. Go to **Deploys** (top menu)
2. Click **"Trigger deploy"** dropdown
3. Click **"Deploy site"**
4. Wait for it to rebuild

---

## 📝 Understanding Netlify URLs

**Preview URL** (what you have now):
- Format: `https://[hash]--[site-name].netlify.app`
- Example: `https://697799b14e1e3c00b7d97f92--deluxe-baklava-743914.netlify.app`
- This is for testing specific deployments
- Changes with each deployment

**Production URL** (what you need):
- Format: `https://[site-name].netlify.app`
- Example: `https://deluxe-baklava-743914.netlify.app`
- This is your main, stable URL
- Stays the same across deployments
- This is what you share with others

---

## 🎯 Quick Steps Summary

1. **Go to**: https://app.netlify.com
2. **Click** your site name
3. **Copy** the URL at the top (production URL, no hash)
4. **Go to**: Site settings → Environment variables
5. **Update** `NEXTAUTH_URL` to your production URL
6. **Redeploy**: Deploys → Trigger deploy → Deploy site

---

## ✅ Test Your Production URL

After redeploying:

1. Visit your production URL: `https://deluxe-baklava-743914.netlify.app` (or whatever yours is)
2. Try logging in with: `patient@rx.com` / `pass`
3. If it works, you're all set! 🎉

---

## 💡 Pro Tip: Custom Domain (Optional)

Later, you can add a custom domain:
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow the instructions

But for now, your `.netlify.app` URL works perfectly!

---

**Your production URL is the one WITHOUT the hash in the middle!** 🚀
