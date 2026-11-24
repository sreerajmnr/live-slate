"use client";

import { useRouter } from "next/navigation";
import MenuBar from "./MenuBar";
import NoteTabs from "./NoteTabs";
import NoteEditor from "./NoteEditor";
import Footer from "./Footer";
import { useNotesSync } from "../lib/useNotesSync";

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
const INITIAL = [{ id: "welcome", title: "Welcome", content: WELCOME, position: 0 }];

export default function Workspace({ username }) {
  const router = useRouter();
  const {
    notes,
    activeId,
    setActiveId,
    tabPosition,
    setTabPosition,
    status,
    updateNote,
    addNote: addSyncedNote,
    removeNote,
    flush,
  } = useNotesSync({ username, initialNotes: INITIAL });

  const active = notes.find((n) => n.id === activeId) || notes[0];

  function addNote() {
    addSyncedNote({ id: newId(), title: `Note ${notes.length + 1}`, content: "" });
  }
  function closeNote(id) {
    const note = notes.find((n) => n.id === id);
    if (note?.content.trim() && !window.confirm(`Delete "${note.title}"?`)) return;
    const idx = notes.findIndex((n) => n.id === id);
    const rest = notes.filter((n) => n.id !== id);
    removeNote(id);
    if (id === active.id) setActiveId(rest[Math.max(0, idx - 1)].id);
  }
  const renameNote = (id, title) => updateNote(id, { title });
  const updateContent = (content) => updateNote(active.id, { content });

  async function logout() {
    await flush();
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
        <NoteEditor key={active.id} note={active} onChange={updateContent} status={status} />
      </main>

      <Footer />
    </div>
  );
}
