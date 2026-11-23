import { versionInfo } from "../lib/version";

export default function Footer() {
  const { version, build, env, builtAt } = versionInfo;
  const title = builtAt ? `Built ${new Date(builtAt).toUTCString()}` : undefined;
  return (
    <footer className="footer">
      <span>© Live Slate</span>
      <span className="footer-version" title={title}>
        v{version} · Build {build}
        <span className={`env-badge env-${env}`}>{env}</span>
      </span>
    </footer>
  );
}
