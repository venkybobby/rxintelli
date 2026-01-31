# Quick Deployment Guide

## 🎯 Fastest Way: Netlify (5 minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy on Netlify
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub and select your repository
4. **IMPORTANT**: Click "Show advanced" and set:
   - **Base directory**: `apps/rxintelli-app`
5. Click "Deploy site"

### Step 3: Set Environment Variables
1. After first deploy, go to Site settings → Environment variables
2. Click "Add variable" and add:
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: Run `openssl rand -base64 32` in terminal, copy the output
3. Add second variable:
   - **Key**: `NEXTAUTH_URL`
   - **Value**: Your Netlify URL (e.g., `https://your-app-name.netlify.app`)
4. Go to Deploys → Trigger deploy → Deploy site

### Step 4: Done! 🎉
Your app should now be live at your Netlify URL.

---

## 🔧 If Netlify Doesn't Work

### Try Railway (Alternative)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
cd apps/rxintelli-app
railway login
railway init
railway up
```

Then set environment variables in Railway dashboard.

---

## ✅ Verify Deployment

1. Visit your deployment URL
2. Try logging in with: `patient@rx.com` / `pass`
3. Check that protected routes work
4. Verify all pages load

---

## 🆘 Common Issues

**Build fails?**
- Make sure base directory is set to `apps/rxintelli-app`
- Check that `package.json` exists in that directory

**App crashes?**
- Verify environment variables are set
- Check `NEXTAUTH_URL` matches your deployment URL exactly

**Need more help?**
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions
- Check platform-specific documentation
