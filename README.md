# Live Slate

A Next.js note-taking app with tabs and live Mermaid diagrams.

## Features
- **Login screen by default.** Test account: `anvi` / `anvith`.
- **Header:** app name at top left, user and log out at top right.
- **Menu bar:** File, Edit, View, Insert, Help (placeholders for now).
- **Tabs:** add, rename (double-click), close, and switch the tab position between **Top** (horizontal) and **Left** (vertical).
- **Notes:** write text and add diagrams with ` ```mermaid ` code blocks.
  - Switch between **Code / Split / Preview** (swipe left or right on a phone).
  - Each diagram can be swiped or toggled between **Diagram** and **Code**.
- **Footer:** shows the version and build, e.g. `v1.0.0 · Build 47ca395 · production`.

Notes are saved in the browser (localStorage) for now.

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
Import the repo at https://vercel.com/new. Optional environment variables:

| Variable | Purpose | Default |
|---|---|---|
| `APP_USERNAME` | Login username | `anvi` |
| `APP_PASSWORD` | Login password | `anvith` |
| `SESSION_SECRET` | Signs the login cookie, so set a long random value in production | dev value |
