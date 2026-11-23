import "./globals.css";

export const metadata = {
  title: "Live Slate",
  description: "Notes with live Mermaid diagrams",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
