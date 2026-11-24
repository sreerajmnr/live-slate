# Live Slate

A Next.js note-taking app with tabs and live Mermaid diagrams.

## Features
- **Login screen by default.** Credentials come from environment variables (see below).
- **Header:** app name at top left, user and log out at top right.
- **Menu bar:** File, Edit, View, Insert, Help (placeholders for now).
- **Tabs:** add, rename (double-click), close, and switch the tab position between **Top** (horizontal) and **Left** (vertical).
- **Notes:** write text and add diagrams with ` ```mermaid ` code blocks.
  - Switch between **Code / Split / Preview** (swipe left or right on a phone).
  - Each diagram can be swiped or toggled between **Diagram** and **Code**.
- **Footer:** shows the version and build, e.g. `v1.0.0 · Build 47ca395 · production`.

## Saving notes
- With a database (`DATABASE_URL`, e.g. Neon via Vercel Storage), notes are saved to Postgres and appear on every device. The `notes` table is created automatically on first use.
- Changes save about 1 second after you stop typing. The toolbar shows **Saving… / Saved**, or **Offline** if the connection drops.
- A copy is also kept in the browser, so edits made offline are uploaded when the connection returns.
- Without a database (e.g. running locally), notes are saved in the browser only.
- The tab position (Top/Left) and open tab are remembered per device.

## Version and build number
- **Version** comes from `version` in `package.json`. Bump it for each release, then tag it on GitHub (e.g. `v1.0.1`).
- **Build** is the short Git commit ID that Vercel built from, so it matches the deployment in the Vercel dashboard.
- The environment badge shows `production`, `preview`, or `local`.
- The same information is available at `/api/version`.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Deploy on Vercel
1. Import the repo at https://vercel.com/new.
2. In **Project → Settings → Environment Variables**, add these for Production and Preview:

| Variable | Purpose |
|---|---|
| `APP_USERNAME` | Login username (required on Vercel) |
| `APP_PASSWORD` | Login password (required on Vercel) |
| `SESSION_SECRET` | A long random string that signs the login cookie (recommended) |
| `DATABASE_URL` | Postgres connection, added automatically when you connect Neon |

3. Redeploy so the new values are picked up.

When you run the app locally without these variables, a simple test login is used (see `lib/auth.js`). On Vercel, login stays disabled until the variables are set.
