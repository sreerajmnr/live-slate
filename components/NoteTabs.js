"use client";

import { useState } from "react";

export default function NoteTabs({ notes, activeId, position, onSelect, onAdd, onClose, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  function startRename(note) {
    setEditingId(note.id);
    setDraft(note.title);
  }
  function commitRename() {
    if (editingId) onRename(editingId, draft.trim() || "Untitled");
    setEditingId(null);
  }

  return (
    <div className={`tabs tabs-${position}`} role="tablist" aria-orientation={position === "left" ? "vertical" : "horizontal"}>
      {notes.map((note) => (
        <div
          key={note.id}
          role="tab"
          aria-selected={note.id === activeId}
          className={`tab ${note.id === activeId ? "active" : ""}`}
          onClick={() => onSelect(note.id)}
          onDoubleClick={() => startRename(note)}
          title="Double-click to rename"
        >
          {editingId === note.id ? (
            <input
              className="tab-input"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditingId(null);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="tab-title">{note.title}</span>
          )}
          {notes.length > 1 && (
            <button
              className="tab-close"
              aria-label={`Close ${note.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onClose(note.id);
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button className="tab-add" onClick={onAdd} aria-label="New note" title="New note">
        +
      </button>
    </div>
  );
}
