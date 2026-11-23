// Version info, baked in at build time (see next.config.mjs).
export const versionInfo = {
  version: process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0",
  build: process.env.NEXT_PUBLIC_BUILD_ID || "local",
  env: process.env.NEXT_PUBLIC_DEPLOY_ENV || "local",
  builtAt: process.env.NEXT_PUBLIC_BUILD_TIME || "",
};
