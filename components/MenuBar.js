"use client";

import { useEffect, useRef, useState } from "react";

// Placeholder menus for now — items are disabled until features are built.
const MENUS = {
  File: ["New note", "Open…", "Export", "Print"],
  Edit: ["Undo", "Redo", "Find", "Replace"],
  View: ["Zoom in", "Zoom out", "Full screen"],
  Insert: ["Image", "Table", "Link"],
  Help: ["Documentation", "Keyboard shortcuts", "About Live Slate"],
};

export default function MenuBar({ tabPosition, onTabPositionChange }) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(null);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <nav className="menubar" ref={ref} aria-label="Main menu">
      <ul className="menus" role="menubar">
        {Object.entries(MENUS).map(([name, items]) => (
          <li key={name} className="menu">
            <button
              className={`menu-btn ${open === name ? "active" : ""}`}
              aria-haspopup="true"
              aria-expanded={open === name}
              onClick={() => setOpen(open === name ? null : name)}
            >
              {name}
            </button>
            {open === name && (
              <ul className="dropdown" role="menu">
                {items.map((item) => (
                  <li key={item}>
                    <button className="dropdown-item" disabled role="menuitem">
                      {item}
                      <span className="soon">Soon</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <div className="segmented" role="group" aria-label="Tab position">
        <span className="segmented-label">Tabs</span>
        <button
          className={tabPosition === "top" ? "on" : ""}
          onClick={() => onTabPositionChange("top")}
          aria-pressed={tabPosition === "top"}
          title="Tabs on top"
        >
          ▭ Top
        </button>
        <button
          className={tabPosition === "left" ? "on" : ""}
          onClick={() => onTabPositionChange("left")}
          aria-pressed={tabPosition === "left"}
          title="Tabs on the left"
        >
          ▯ Left
        </button>
      </div>
    </nav>
  );
}
