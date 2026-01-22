# integrated-app

This is a small Vite wrapper that imports the three existing project `App.tsx` files and exposes them under one app.

Quick start (from `c:\Users\OBENG FAMILY\Downloads\SS-MAP2\integrated-app`):

```bash
npm install
npm run dev
```

Notes:
- The wrapper imports the existing `App.tsx` files from sibling project folders. You may need to run `npm install` at the root to satisfy shared dependencies.
- Tailwind classes are provided via CDN in `index.html` so visual styles mostly work without additional setup.
