# Deploying to Vercel

This repository contains multiple subprojects and an `integrated-app` Vite wrapper located at `integrated-app/`.

Recommended deployment options:

- Option A (recommended): Create a Vercel project and set the **Root Directory** to `integrated-app` (Project Settings → General → Root Directory). Vercel will then run `npm install` and `npm run build` automatically.

- Option B (monorepo build using vercel.json): The repo includes `vercel.json` which tells Vercel to run a static build using `integrated-app/package.json`. If you use this, Vercel will run the build and serve the `integrated-app/dist` output.

Environment variables (set these in Vercel Dashboard → Settings → Environment Variables):

- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_KEY` — your Supabase anon or service key
- `VITE_GEMINI_API_KEY` — Gemini (Google GenAI) API key

Local test before deploy:

```bash
cd integrated-app
npm install
npm run build
npx serve dist
```

Notes & troubleshooting:
- If Vercel fails to access files outside the `integrated-app` folder during build, use Option A (set root directory to `integrated-app`) or copy necessary source files into that folder.
- Use the Vercel dashboard to add environment variables; do NOT commit secrets to the repo.
- If you need me to create a root `package.json` that orchestrates the monorepo build, I can add that.
