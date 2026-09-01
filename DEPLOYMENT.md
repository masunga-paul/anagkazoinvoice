# Cloudflare Pages Deployment Guide

This project is configured with `@sveltejs/adapter-cloudflare` and is ready for 1-click deployment on **Cloudflare Pages**.

---

## 🚀 Option 1: Automatic Git Deployment via Cloudflare Dashboard (Recommended)

1. Push your repository to **GitHub** or **GitLab**.
2. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Navigate to **Compute (Workers & Pages)** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**.
4. Select your repository and configure the build settings:
   - **Framework Preset**: `SvelteKit` (or `None`)
   - **Build Command**: `pnpm run build` *(or `npm run build`)*
   - **Build Output Directory**: `.svelte-kit/cloudflare`
   - **Root Directory**: `anagkazo-invoice` *(if deploying as a subfolder in monorepo)*
5. **Environment Variables**:
   Under **Settings** ➔ **Environment Variables**, add:
   - `DATABASE_URL`: `postgresql://<user>:<password>@<endpoint-pooler>.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `AUTH_SECRET`: *(Optional custom random 32-character string for token signing)*
   - `NODE_VERSION`: `22` (or `20`)
6. Under **Settings** ➔ **Functions** ➔ **Compatibility Flags**, ensure `nodejs_compat` is enabled (already defined in `wrangler.jsonc` & `wrangler.toml`).
7. Click **Save and Deploy**.

---

## ⚡ Option 2: Direct CLI Deployment with Wrangler

You can deploy directly to Cloudflare Pages from your terminal:

```bash
# 1. Login to your Cloudflare account
npx wrangler login

# 2. Build and deploy
pnpm run deploy
```

Or step-by-step:
```bash
# Build the production bundle
pnpm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy anagkazo-invoice/.svelte-kit/cloudflare --project-name=anagkazoinvoicesystem
```

---

## ⚙️ Configuration Files Reference

- **[svelte.config.js](file:///Users/apple/Desktop/anagkazoinvoicesystem/anagkazo-invoice/svelte.config.js)**: Configured with `@sveltejs/adapter-cloudflare` and edge routing.
- **[wrangler.jsonc](file:///Users/apple/Desktop/anagkazoinvoicesystem/wrangler.jsonc)** & **[wrangler.toml](file:///Users/apple/Desktop/anagkazoinvoicesystem/wrangler.toml)**: Configured with `nodejs_compat` compatibility flag and `.svelte-kit/cloudflare` build output.
