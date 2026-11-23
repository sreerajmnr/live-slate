import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url)));

// Build number = short Git commit ID that Vercel built from (matches the
// deployment in the Vercel dashboard and the commit/tag on GitHub).
const commit = process.env.VERCEL_GIT_COMMIT_SHA || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BUILD_ID: commit ? commit.slice(0, 7) : "local",
    NEXT_PUBLIC_DEPLOY_ENV: process.env.VERCEL_ENV || "local",
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
