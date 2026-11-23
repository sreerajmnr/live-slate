"use client";

import { useEffect, useId, useState } from "react";
import { useSwipe } from "../lib/useSwipe";

let mermaidPromise;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: {
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          fontSize: "13px",
          primaryColor: "#e5f0fa",
          primaryBorderColor: "#8cb6df",
          primaryTextColor: "#1f2d3a",
          secondaryColor: "#eaf3fb",
          tertiaryColor: "#f5f9fc",
          lineColor: "#6fa8dc",
          edgeLabelBackground: "#ffffff",
          actorBkg: "#e5f0fa",
          actorBorder: "#8cb6df",
          signalColor: "#4a86c5",
          signalTextColor: "#1f2d3a",
        },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

// One Mermaid block in the preview: swipe (or tap the toggle) between diagram and code.
export default function MermaidDiagram({ code }) {
  const rawId = useId();
  const id = "mmd" + rawId.replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(false);
  const swipe = useSwipe({ onLeft: () => setShowCode(true), onRight: () => setShowCode(false) });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const mermaid = await loadMermaid();
        await mermaid.parse(code);
        const { svg } = await mermaid.render(id + Date.now(), code);
        if (!cancelled) {
          setSvg(svg);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err?.message?.split("\n")[0] || "Invalid Mermaid code");
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, id]);

  return (
    <figure
      className="diagram-card"
      onTouchStart={(e) => {
        e.stopPropagation();
        swipe.onTouchStart(e);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        swipe.onTouchEnd(e);
      }}
    >
      <div className="diagram-toolbar">
        <span className="diagram-label">Mermaid</span>
        <div className="mini-toggle">
          <button className={!showCode ? "on" : ""} onClick={() => setShowCode(false)}>
            Diagram
          </button>
          <button className={showCode ? "on" : ""} onClick={() => setShowCode(true)}>
            Code
          </button>
        </div>
      </div>
      <div className={`diagram-slider ${showCode ? "show-code" : ""}`}>
        <div className="diagram-pane">
          {error ? (
            <p className="error">⚠ {error}</p>
          ) : svg ? (
            <div className="diagram-svg" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <p className="muted">Rendering…</p>
          )}
        </div>
        <div className="diagram-pane">
          <pre className="code-block">{code}</pre>
        </div>
      </div>
      <figcaption className="swipe-hint">Swipe to switch diagram ⇄ code</figcaption>
    </figure>
  );
}
