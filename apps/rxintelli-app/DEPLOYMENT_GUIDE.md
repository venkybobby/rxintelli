# Complete Deployment Guide for RxIntelli App

This guide provides step-by-step instructions for deploying your Next.js app to various platforms.

## 📋 Pre-Deployment Checklist

Before deploying, ensure your app builds successfully locally:

```bash
cd apps/rxintelli-app
npm install
npm run build
npm run start  # Test production build
```

If the build fails, fix errors before deploying.

---

## 🚀 Option 1: Netlify (Easiest Alternative to Vercel)

### Why Netlify?
- Free tier with generous limits
- Automatic deployments from Git
- Built-in Next.js support
- Easy environment variable management

### Step-by-Step:

#### 1. Prepare Your Repository
```bash
# Ensure code is pushed to GitHub/GitLab/Bitbucket
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Create Netlify Configuration
Create `netlify.toml` in `apps/rxintelli-app/`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
```

#### 3. Deploy via Netlify Dashboard
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. **IMPORTANT**: Set these build settings:
   - **Base directory**: `apps/rxintelli-app`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. Click "Show advanced" and add environment variables:
   - `NEXTAUTH_SECRET` = (generate: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = (will be your Netlify URL, e.g., `https://your-app.netlify.app`)
7. Click "Deploy site"

#### 4. After First Deployment
1. Go to Site settings → Domain management
2. Copy your site URL (e.g., `https://your-app.netlify.app`)
3. Go to Site settings → Environment variables
4. Update `NEXTAUTH_URL` to your actual Netlify URL
5. Trigger a new deployment (Deploys → Trigger deploy)

---

## 🚂 Option 2: Railway (Great for Full-Stack Apps)

### Why Railway?
- Simple deployment process
- Automatic HTTPS
- Database support if needed later
- $5/month free credit

### Step-by-Step:

#### 1. Install Railway CLI
```bash
npm i -g @railway/cli
```

#### 2. Login and Initialize
```bash
cd apps/rxintelli-app
railway login
railway init
```

#### 3. Configure Build Settings
Railway will auto-detect Next.js. Create `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 4. Set Environment Variables
```bash
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set NEXTAUTH_URL=https://your-app.up.railway.app
```

#### 5. Deploy
```bash
railway up
```

Or connect via GitHub:
1. Go to https://railway.app
2. New Project → Deploy from GitHub repo
3. Select your repository
4. Set root directory to `apps/rxintelli-app`
5. Add environment variables in the dashboard
6. Deploy automatically triggers

---

## 🎯 Option 3: Render (Simple & Reliable)

### Why Render?
- Free tier available
- Automatic SSL
- Zero-downtime deployments
- Simple dashboard

### Step-by-Step:

#### 1. Create `render.yaml`
Create `render.yaml` in `apps/rxintelli-app/`:

```yaml
services:
  - type: web
    name: rxintelli-app
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXTAUTH_SECRET
        generateValue: true
      - key: NEXTAUTH_URL
        sync: false  # Set manually after first deploy
```

#### 2. Deploy via Dashboard
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure:
   - **Name**: `rxintelli-app`
   - **Root Directory**: `apps/rxintelli-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Add environment variables:
   - `NEXTAUTH_SECRET` = (generate secret)
   - `NEXTAUTH_URL` = (set after first deploy with your Render URL)
6. Click "Create Web Service"

#### 3. After First Deploy
1. Copy your Render URL (e.g., `https://rxintelli-app.onrender.com`)
2. Go to Environment → Update `NEXTAUTH_URL`
3. Manual deploy to apply changes

---

## 🐳 Option 4: Docker + Any Platform

### Why Docker?
- Works on any platform (AWS, Google Cloud, DigitalOcean, etc.)
- Consistent environment
- Easy to scale

### Step-by-Step:

#### 1. Create `Dockerfile`
Create `Dockerfile` in `apps/rxintelli-app/`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Update `next.config.mjs`
```javascript
const nextConfig = {
  output: 'standalone', // Required for Docker
  reactStrictMode: true,
};

export default nextConfig;
```

#### 3. Build and Run Locally
```bash
docker build -t rxintelli-app .
docker run -p 3000:3000 \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  rxintelli-app
```

#### 4. Deploy to Platform
- **Fly.io**: `flyctl launch` (then follow prompts)
- **DigitalOcean App Platform**: Connect repo, select Dockerfile
- **AWS ECS/Fargate**: Push to ECR, create task definition
- **Google Cloud Run**: `gcloud run deploy`

---

## 🔧 Option 5: Fix Vercel Issues

If you want to stick with Vercel, try these fixes:

### Common Vercel Issues:

#### Issue 1: Root Directory Not Set
**Fix**: In Vercel project settings → General → Root Directory → Set to `apps/rxintelli-app`

#### Issue 2: Build Fails
**Fix**: 
1. Check build logs in Vercel dashboard
2. Ensure `package.json` has all dependencies
3. Try adding `package-lock.json` to repository
4. Set Node.js version: Create `.nvmrc` with `18` or `20`

#### Issue 3: Environment Variables Not Working
**Fix**:
1. Go to Project Settings → Environment Variables
2. Ensure variables are set for **Production**, **Preview**, and **Development**
3. Redeploy after adding variables

#### Issue 4: Deployment Not Found Error
**Fix**:
1. Delete `.vercel` folder locally: `rm -rf apps/rxintelli-app/.vercel`
2. Re-link: `cd apps/rxintelli-app && vercel link`
3. Create fresh deployment: `vercel --prod`

### Vercel Configuration File
Create `vercel.json` in `apps/rxintelli-app/`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

---

## 🔑 Environment Variables (All Platforms)

Required for all deployments:

| Variable | How to Generate | Example |
|----------|----------------|---------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | `aBc123XyZ...` |
| `NEXTAUTH_URL` | Your deployment URL | `https://your-app.netlify.app` |

**Important**: Set `NEXTAUTH_URL` AFTER first deployment with your actual URL.

---

## ✅ Post-Deployment Checklist

1. ✅ App loads at deployment URL
2. ✅ Login page works (`/login`)
3. ✅ Can authenticate with test users
4. ✅ Protected routes redirect to login
5. ✅ All pages load without errors
6. ✅ Check browser console for errors

---

## 🆘 Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build` locally first

### App Crashes on Load
- Check environment variables are set correctly
- Verify `NEXTAUTH_URL` matches your deployment URL exactly
- Check deployment logs for runtime errors

### Authentication Not Working
- Verify `NEXTAUTH_SECRET` is set
- Ensure `NEXTAUTH_URL` includes `https://` (not `http://`)
- Check middleware is not blocking requests

### 404 Errors
- Verify root directory is set correctly
- Check Next.js routing (App Router vs Pages Router)
- Ensure all files are committed to Git

---

## 📊 Platform Comparison

| Platform | Free Tier | Ease of Use | Best For |
|----------|-----------|-------------|----------|
| **Netlify** | ✅ Generous | ⭐⭐⭐⭐⭐ | Quick deployments |
| **Railway** | ✅ $5 credit | ⭐⭐⭐⭐ | Full-stack apps |
| **Render** | ✅ Limited | ⭐⭐⭐⭐ | Simple deployments |
| **Vercel** | ✅ Generous | ⭐⭐⭐⭐⭐ | Next.js optimized |
| **Docker** | Varies | ⭐⭐⭐ | Custom requirements |

---

## 🎯 Recommended: Start with Netlify

**Why?** Easiest setup, great Next.js support, free tier is generous.

**Quick Start:**
1. Push code to GitHub
2. Go to https://app.netlify.com
3. Import from Git → Select repo → Set base directory to `apps/rxintelli-app`
4. Add environment variables
5. Deploy!

---

## 📞 Need Help?

- Check deployment logs in your platform's dashboard
- Test build locally first: `npm run build`
- Verify environment variables are set
- Check platform-specific documentation

Good luck with your deployment! 🚀
