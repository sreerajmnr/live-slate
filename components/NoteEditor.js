"use client";

import { useEffect, useRef, useState } from "react";
import NotePreview from "./NotePreview";
import { useSwipe } from "../lib/useSwipe";

const MODES = ["code", "split", "preview"];
const MODE_LABELS = { code: "Code", split: "Split", preview: "Preview" };
const TEMPLATE = "\n```mermaid\nflowchart LR\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Do it]\n  B -->|No| D[Skip]\n```\n";

const STATUS_TEXT = {
  loading: "Loading…",
  saving: "Saving…",
  saved: "Saved",
  offline: "Offline · saved on this device",
  local: "Saved in this browser",
  error: "Couldn't save · note too large",
};

export default function NoteEditor({ note, onChange, status }) {
  const [mode, setMode] = useState("split");
  const textRef = useRef(null);

  // Phones start in Code view; swipe to move between Code / Split / Preview.
  useEffect(() => {
    if (window.matchMedia("(max-width: 720px)").matches) setMode("code");
  }, []);

  const step = (dir) =>
    setMode((m) => MODES[Math.min(MODES.length - 1, Math.max(0, MODES.indexOf(m) + dir))]);
  const swipe = useSwipe({ onLeft: () => step(1), onRight: () => step(-1) });

  function insertDiagram() {
    const el = textRef.current;
    const pos = el ? el.selectionStart : note.content.length;
    const next = note.content.slice(0, pos) + TEMPLATE + note.content.slice(pos);
    onChange(next);
    if (mode === "preview") setMode("split");
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = pos + TEMPLATE.length;
    });
  }

  return (
    <section className="editor">
      <div className="editor-toolbar">
        <div className="mode-toggle" role="group" aria-label="View mode">
          {MODES.map((m) => (
            <button key={m} className={mode === m ? "on" : ""} onClick={() => setMode(m)} aria-pressed={mode === m}>
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          {status && (
            <span className={`save-status save-${status}`} role="status" aria-live="polite">
              {STATUS_TEXT[status]}
            </span>
          )}
          <button className="btn btn-ghost" onClick={insertDiagram}>
            + <span className="hide-sm">Mermaid </span>diagram
          </button>
        </div>
      </div>

      <div className={`editor-body mode-${mode}`} {...swipe}>
        {mode !== "preview" && (
          <textarea
            ref={textRef}
            className="editor-text"
            value={note.content}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            placeholder={"Write notes here.\n\nAdd a diagram with a ```mermaid code block."}
            aria-label="Note text"
          />
        )}
        {mode !== "code" && (
          <div className="editor-preview" aria-label="Preview">
            <NotePreview content={note.content} />
          </div>
        )}
      </div>
    </section>
  );
}
