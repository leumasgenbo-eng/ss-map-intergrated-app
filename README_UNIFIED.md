# Unified Launcher

This page (`index.html`) loads the three local projects via iframes. Serve the repository root so the relative paths work correctly.

Quick serve options (run from the workspace root `c:\Users\OBENG FAMILY\Downloads\SS-MAP2`):

Using `npx serve` (simple static server):
```bash
npx serve -s . -l 5173
```

Using `http-server`:
```bash
npx http-server -c-1 -p 3000
```

Or with Python 3 (no install):
```bash
python -m http.server 8000
```

Open `http://localhost:5173` (or the port you chose) and use the top navigation to switch apps.

Notes:
- Each app remains standalone in its folder. The launcher uses relative paths to each folder's `index.html`.
- For full development (hot reload), run each project's dev server separately and update the iframe src to point to the dev server URLs.
