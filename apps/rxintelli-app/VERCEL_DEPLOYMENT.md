# Vercel Deployment Guide

This guide helps you deploy the RxIntelli app to Vercel and avoid `DEPLOYMENT_NOT_FOUND` errors.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel` (optional, for CLI deployment)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import project in Vercel**
   - Go to https://vercel.com/new
   - Import your Git repository
   - Select the `apps/rxintelli-app` directory as the root directory
   - Vercel will auto-detect Next.js

3. **Configure environment variables**
   - In Vercel project settings → Environment Variables
   - Add the following:
     ```
     NEXTAUTH_SECRET=<generate a secure secret>
     NEXTAUTH_URL=https://your-project.vercel.app
     ```
   - Generate a secret: `openssl rand -base64 32`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Option 2: Deploy via CLI

1. **Install Vercel CLI** (if not installed)
   ```bash
   npm i -g vercel
   ```

2. **Link your project**
   ```bash
   cd apps/rxintelli-app
   vercel link
   ```
   - Follow prompts to link to existing project or create new one

3. **Set environment variables**
   ```bash
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   ```

4. **Deploy to preview**
   ```bash
   vercel
   ```

5. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Fixing DEPLOYMENT_NOT_FOUND Error

If you encounter `DEPLOYMENT_NOT_FOUND`:

1. **Check your Vercel dashboard**
   - Go to https://vercel.com/dashboard
   - Verify your project exists and has deployments

2. **Verify project link**
   ```bash
   cd apps/rxintelli-app
   vercel link
   ```

3. **Check deployment status**
   - Look for failed builds in the dashboard
   - Check build logs for errors

4. **Create a new deployment**
   ```bash
   vercel --prod
   ```
   Or trigger a new deployment by pushing to your connected branch

5. **Use correct URL**
   - Use the production URL from Vercel dashboard
   - Don't use old preview deployment URLs
   - Each deployment has a unique URL

## Environment Variables

Required environment variables in Vercel:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Secret for NextAuth session encryption | Generated secret |
| `NEXTAUTH_URL` | Full URL of your app | `https://rxintelli-app.vercel.app` |

Vercel automatically provides:
- `VERCEL_URL` - Current deployment URL
- `VERCEL_ENV` - Environment (`production`, `preview`, `development`)
- `VERCEL` - Set to `1` when running on Vercel

## Project Configuration

The app is configured for Vercel with:
- ✅ `next.config.mjs` - Optimized for Vercel
- ✅ `lib/config.ts` - Proper URL resolution using Vercel environment variables
- ✅ `.vercelignore` - Excludes unnecessary files from deployment
- ✅ `.env.example` - Documents required environment variables

## Troubleshooting

### Build fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)

### Environment variables not working
- Ensure variables are set in Vercel dashboard
- Variables must be set for the correct environment (Production/Preview/Development)
- Redeploy after adding new variables

### Deployment not found
- Verify project is linked: `vercel link`
- Check if deployment was deleted
- Create a new deployment: `vercel --prod`
- Use the URL from Vercel dashboard, not old URLs

## Best Practices

1. **Never hardcode deployment URLs** - Use environment variables
2. **Use production domain** - For stable integrations, use your production URL
3. **Handle 404s gracefully** - Your code should handle missing resources
4. **Monitor deployments** - Check Vercel dashboard regularly
5. **Use preview deployments** - Test changes in preview before production

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Error Reference: https://vercel.com/docs/errors
