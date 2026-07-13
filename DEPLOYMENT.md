# MediOrch - Vercel Deployment Guide

## ⚠️ Repository Structure

Your repository has a nested structure:
```
.
├── package.json (root wrapper - added for Vercel)
├── vercel.json (root config - added for Vercel)  
├── DEPLOYMENT.md (this file)
└── mediorch/ (actual Next.js project)
    ├── package.json
    ├── next.config.ts
    ├── middleware.ts
    ├── .env.example
    ├── tsconfig.json
    └── ... (rest of Next.js app)
```

### ✅ What Was Fixed

1. ✅ Created `middleware.ts` - properly configured Next.js middleware
2. ✅ Updated `next.config.ts` - added security headers and Vercel optimizations
3. ✅ Created `.env.example` - environment variable documentation
4. ✅ Updated `vercel.json` - Vercel deployment configuration
5. ✅ Created root-level `package.json` - wrapper for nested project structure

## 🚀 Deploying to Vercel

### Step 1: Set Up Environment Variables

Create a `.env.local` file in the `mediorch/` folder with:

```bash
cp mediorch/.env.example mediorch/.env.local
```

Then edit `mediorch/.env.local` and add:
```
AUTH_SECRET=<generate-secure-key>
NEXTAUTH_SECRET=<same-as-auth-secret>
OPENAI_API_KEY=<your-openai-api-key>
DEMO_MODE=false
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

Get `OPENAI_API_KEY` from: https://platform.openai.com/api-keys

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. **Important**: Select "mediorch" as the Root Directory (if prompted)
5. Add Environment Variables:
   - `AUTH_SECRET` = `<your-generated-secret>`
   - `NEXTAUTH_SECRET` = `<same-value>`
   - `OPENAI_API_KEY` = `<your-api-key>`
   - `DEMO_MODE` = `false` (optional)
6. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or deploy directly to production
vercel --prod
```

## 🔧 Environment Variables

### Required
- **AUTH_SECRET**: NextAuth.js secret (generate with `openssl rand -base64 32`)
- **NEXTAUTH_SECRET**: Same as AUTH_SECRET
- **OPENAI_API_KEY**: Your OpenAI API key

### Optional
- **DEMO_MODE**: Set to `"true"` to use demo responses (great for testing without API costs)
- **NEXTAUTH_URL**: Auto-set by Vercel, but can override

## 📋 Build & Start Commands

The root `package.json` includes wrapper scripts that work from the repository root:

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Start production server
npm run lint   # Run ESLint
```

These scripts automatically change to the `mediorch/` directory.

## ✨ Features Enabled

- ✅ **NextAuth.js v5** - User authentication with JWT sessions
- ✅ **Next.js 16** - Latest App Router
- ✅ **TypeScript** - Full type safety
- ✅ **Middleware** - Protected routes (auto-redirect to login)
- ✅ **Security Headers** - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- ✅ **OpenAI Integration** - GPT-4o-mini powered AI agents
- ✅ **LangChain** - AI orchestration
- ✅ **Tailwind CSS** - Styling
- ✅ **Shadcn UI** - Component library

## 🐛 Troubleshooting

### Build fails with "Command failed"
- Ensure both `mediorch/package.json` and root `package.json` exist
- Check that `mediorch` is accessible from the root

### "Cannot find module" errors
- Verify all dependencies are in `mediorch/package.json`
- Run `npm install` in the `mediorch/` directory locally

### Authentication not working
- ✅ Check `AUTH_SECRET` and `NEXTAUTH_SECRET` are identical
- ✅ Verify environment variables are set in Vercel Dashboard
- ✅ Ensure `NEXTAUTH_URL` is correct (auto-set: `https://your-deployment.vercel.app`)

### "Invalid OpenAI API key"
- ✅ Verify API key is valid at https://platform.openai.com/account/api-keys
- ✅ Check for leading/trailing spaces
- ✅ Ensure your API key has available quota

### Using Demo Mode
Set `DEMO_MODE=true` to test without API calls:
- Prescription uploads will return demo data
- AI agents will return demo responses
- No API costs!

## 📚 Additional Resources

- [Vercel Next.js Docs](https://vercel.com/docs/frameworks/nextjs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Next.js Docs](https://nextjs.org/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)

## 🎯 Next Steps

1. ✅ Set environment variables in `mediorch/.env.local`
2. ✅ Test locally: `npm run dev`
3. ✅ Deploy to Vercel following the steps above
4. ✅ Configure environment variables in Vercel Dashboard
5. ✅ Monitor deployment in Vercel Dashboard

---

**Ready to deploy?** Your repository is now Vercel-compatible! 🚀
