"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MenuBar from "./MenuBar";
import NoteTabs from "./NoteTabs";
import NoteEditor from "./NoteEditor";
import Footer from "./Footer";

const WELCOME = `# Welcome to Live Slate
Write plain notes, and add diagrams with Mermaid code blocks.
- Switch Code / Split / Preview above (or swipe on a phone)
- Swipe a diagram to flip between the picture and its code
- Double-click a tab to rename it

\`\`\`mermaid
flowchart LR
  Idea --> Note[Write note]
  Note --> Diagram{Need a diagram?}
  Diagram -->|Yes| Mermaid[Add mermaid block]
  Diagram -->|No| Done
  Mermaid --> Done
\`\`\`
`;

const newId = () => Math.random().toString(36).slice(2, 10);

function readStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export default function Workspace({ username }) {
  const router = useRouter();
  const storeKey = `live-slate:${username}`;
  const [notes, setNotes] = useState([{ id: "welcome", title: "Welcome", content: WELCOME }]);
  const [activeId, setActiveId] = useState("welcome");
  const [tabPosition, setTabPosition] = useState("top");
  const [loaded, setLoaded] = useState(false);

  // Notes are saved in this browser (localStorage) for now.
  useEffect(() => {
    const saved = readStore(storeKey);
    if (saved?.notes?.length) {
      setNotes(saved.notes);
      setActiveId(saved.activeId || saved.notes[0].id);
    }
    if (saved?.tabPosition) setTabPosition(saved.tabPosition);
    setLoaded(true);
  }, [storeKey]);

  useEffect(() => {
    if (loaded) writeStore(storeKey, { notes, activeId, tabPosition });
  }, [loaded, storeKey, notes, activeId, tabPosition]);

  const active = notes.find((n) => n.id === activeId) || notes[0];

  function addNote() {
    const note = { id: newId(), title: `Note ${notes.length + 1}`, content: "" };
    setNotes((ns) => [...ns, note]);
    setActiveId(note.id);
  }
  function closeNote(id) {
    if (!confirmClose(notes.find((n) => n.id === id))) return;
    const idx = notes.findIndex((n) => n.id === id);
    const rest = notes.filter((n) => n.id !== id);
    setNotes(rest);
    if (id === activeId) setActiveId(rest[Math.max(0, idx - 1)].id);
  }
  function confirmClose(note) {
    return !note?.content.trim() || window.confirm(`Delete "${note.title}"?`);
  }
  const renameNote = (id, title) =>
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, title } : n)));
  const updateContent = (content) =>
    setNotes((ns) => ns.map((n) => (n.id === active.id ? { ...n, content } : n)));

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="brand">
          <span className="brand-logo">LS</span>
          <span className="brand-name">Live Slate</span>
        </div>
        <div className="user">
          <span className="avatar" aria-hidden>{username[0]?.toUpperCase()}</span>
          <span className="user-name">{username}</span>
          <button className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <MenuBar tabPosition={tabPosition} onTabPositionChange={setTabPosition} />

      <main className={`workspace tabs-pos-${tabPosition}`}>
        <NoteTabs
          notes={notes}
          activeId={active.id}
          position={tabPosition}
          onSelect={setActiveId}
          onAdd={addNote}
          onClose={closeNote}
          onRename={renameNote}
        />
        <NoteEditor key={active.id} note={active} onChange={updateContent} />
      </main>

      <Footer />
    </div>
  );
}
