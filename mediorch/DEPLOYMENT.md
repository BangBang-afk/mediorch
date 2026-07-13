# Vercel Deployment Guide

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A GitHub account with this repository connected
3. Environment variables configured (see below)

## Environment Variables

Before deploying to Vercel, you'll need to set the following environment variables:

### Required Variables

- **AUTH_SECRET**: A secure secret for NextAuth.js. Generate one with:
  ```bash
  openssl rand -base64 32
  ```

- **NEXTAUTH_SECRET**: Same as AUTH_SECRET

- **OPENAI_API_KEY**: Your OpenAI API key (get from https://platform.openai.com/api-keys)

### Optional Variables

- **DEMO_MODE**: Set to `"true"` to use demo responses without making API calls (default: `"false"`)

- **NEXTAUTH_URL**: This is automatically set by Vercel, but you can override if needed

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the project root (it should auto-detect as a Next.js project)
5. Go to "Environment Variables" and add:
   - `AUTH_SECRET`
   - `NEXTAUTH_SECRET` 
   - `OPENAI_API_KEY`
   - `DEMO_MODE` (optional)
6. Click "Deploy"

### Option 2: Deploy via CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy from the project root:
   ```bash
   cd mediorch
   vercel
   ```

3. Follow the prompts and set environment variables when asked

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Configuration Files

This repository includes Vercel-specific configuration:

- **vercel.json**: Vercel deployment settings
- **.env.example**: Template for environment variables
- **middleware.ts**: Next.js middleware for route protection
- **next.config.ts**: Next.js configuration with security headers

## Build & Start Commands

- **Build**: `npm run build`
- **Start**: `npm start`
- **Dev**: `npm run dev`

## Features

This app includes:

- ✅ Next.js 16 with App Router
- ✅ NextAuth.js 5 for authentication
- ✅ TypeScript support
- ✅ Tailwind CSS styling
- ✅ AI agents powered by OpenAI & LangChain
- ✅ Protected routes via middleware
- ✅ Security headers configured

## Troubleshooting

### Build Fails with "Cannot find module"
- Ensure all dependencies are in `package.json`
- Check that TypeScript paths are correct in `tsconfig.json`

### Authentication Not Working
- Verify `AUTH_SECRET` and `NEXTAUTH_SECRET` are set and identical
- Check that `NEXTAUTH_URL` is correctly set (usually auto-set by Vercel)

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is valid and has proper permissions
- Check API usage and rate limits on [OpenAI Dashboard](https://platform.openai.com/account/usage/overview)

### Demo Mode
- Set `DEMO_MODE=true` to test without API calls
- This is useful for testing deployment without spending on API calls

## Support

For issues with:
- **Vercel**: https://vercel.com/docs
- **Next.js**: https://nextjs.org/docs
- **NextAuth**: https://next-auth.js.org
- **OpenAI**: https://platform.openai.com/docs
