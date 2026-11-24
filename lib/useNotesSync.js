"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Keeps notes in sync between the browser and the database.
// - The browser copy (localStorage) loads instantly and works offline.
// - Changes are saved ~5s after you stop typing, and right away when you
//   switch notes or leave the page.
// - Unsaved changes are remembered across reloads and retried automatically.

const SAVE_DELAY = 5000;
const RETRY_DELAY = 5000;

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

const sameNote = (a, b) =>
  a && b && a.title === b.title && a.content === b.content && a.position === b.position;

export function useNotesSync({ username, initialNotes }) {
  const storeKey = `live-slate:${username}`;
  const [notes, setNotesState] = useState(initialNotes);
  const [activeId, setActiveId] = useState(initialNotes[0]?.id);
  const [tabPosition, setTabPosition] = useState("top");
  const [status, setStatus] = useState("loading"); // loading | saving | saved | offline | local | error
  const [ready, setReady] = useState(false);

  const notesRef = useRef(notes);
  const dirty = useRef(new Set()); // note ids with unsaved changes
  const deleted = useRef(new Set()); // note ids deleted but not yet removed on the server
  const mode = useRef("pending"); // pending | server | local
  const timer = useRef(null);
  const flushing = useRef(false);

  // Update the ref right away so saves always see the latest text.
  const setNotes = useCallback((updater) => {
    const next = typeof updater === "function" ? updater(notesRef.current) : updater;
    notesRef.current = next;
    setNotesState(next);
  }, []);

  // ---- Save queued changes to the server ----
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (mode.current !== "server" || flushing.current) return;
    if (!dirty.current.size && !deleted.current.size) return;
    flushing.current = true;
    setStatus("saving");
    let failed = null;

    for (const id of [...deleted.current]) {
      try {
        const res = await fetch(`/api/notes/${id}`, { method: "DELETE", keepalive: true });
        if (!res.ok) throw new Error(String(res.status));
        deleted.current.delete(id);
      } catch {
        failed = "offline";
      }
    }

    for (const id of [...dirty.current]) {
      const snapshot = notesRef.current.find((n) => n.id === id);
      if (!snapshot) {
        dirty.current.delete(id);
        continue;
      }
      try {
        const res = await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: snapshot.title,
            content: snapshot.content,
            position: snapshot.position,
          }),
          keepalive: snapshot.content.length < 60_000,
        });
        if (res.status === 413) {
          failed = "error";
          continue;
        }
        if (!res.ok) throw new Error(String(res.status));
        // Only mark as saved if it wasn't edited again while saving.
        const current = notesRef.current.find((n) => n.id === id);
        if (sameNote(current, snapshot)) dirty.current.delete(id);
      } catch {
        failed = failed || "offline";
      }
    }

    flushing.current = false;
    persist();
    if (failed) {
      setStatus(failed);
      timer.current = setTimeout(flush, RETRY_DELAY);
    } else if (dirty.current.size || deleted.current.size) {
      timer.current = setTimeout(flush, SAVE_DELAY); // edited during save
    } else {
      setStatus("saved");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleSave = useCallback(() => {
    if (mode.current === "local") return;
    setStatus((s) => (s === "offline" || s === "error" ? s : "saving"));
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY);
  }, [flush]);

  // ---- Browser copy ----
  const latestUi = useRef({ activeId, tabPosition });
  latestUi.current = { activeId, tabPosition };
  function persist() {
    writeStore(storeKey, {
      notes: notesRef.current,
      ...latestUi.current,
      dirty: [...dirty.current],
      deleted: [...deleted.current],
    });
  }

  // ---- Initial load: browser copy first, then the server ----
  useEffect(() => {
    let cancelled = false;
    const saved = readStore(storeKey);
    const hadLocal = Boolean(saved?.notes?.length);
    if (hadLocal) {
      setNotes(saved.notes.map((n, i) => ({ ...n, position: n.position ?? i })));
      setActiveId(saved.activeId || saved.notes[0].id);
    }
    if (saved?.tabPosition) setTabPosition(saved.tabPosition);
    (saved?.dirty || []).forEach((id) => dirty.current.add(id));
    (saved?.deleted || []).forEach((id) => deleted.current.add(id));
    setReady(true);

    async function load() {
      try {
        const res = await fetch("/api/notes", { cache: "no-store" });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (cancelled) return;

        if (!data.enabled) {
          mode.current = "local";
          setStatus("local");
          return;
        }

        const local = notesRef.current;
        let merged;
        if (data.notes.length === 0) {
          // First time with the database: upload what this browser has
          // (or the welcome note) — this is the one-time move.
          merged = local.map((n, i) => ({ ...n, position: i }));
          merged.forEach((n) => dirty.current.add(n.id));
        } else {
          // Server is the source of truth, except for changes made here
          // that haven't been saved yet.
          const byId = new Map(data.notes.map((n) => [n.id, n]));
          for (const n of local) if (dirty.current.has(n.id)) byId.set(n.id, n);
          for (const id of deleted.current) byId.delete(id);
          merged = [...byId.values()]
            .map(({ id, title, content, position }) => ({ id, title, content, position }))
            .sort((a, b) => a.position - b.position);
          if (!merged.length) {
            merged = initialNotes;
            dirty.current.add(initialNotes[0].id);
          }
        }

        mode.current = "server";
        setNotes(merged);
        setActiveId((cur) => (merged.some((n) => n.id === cur) ? cur : merged[0].id));
        persist();
        if (dirty.current.size || deleted.current.size) flush();
        else setStatus("saved");
      } catch {
        if (cancelled) return;
        setStatus("offline");
        timer.current = setTimeout(load, RETRY_DELAY);
      }
    }
    load();

    const onOnline = () => (mode.current === "server" ? flush() : load());
    const onHide = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      cancelled = true;
      clearTimeout(timer.current);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey]);

  // Keep the browser copy up to date.
  useEffect(() => {
    if (ready) persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, notes, activeId, tabPosition]);

  // ---- Actions ----
  const updateNote = useCallback(
    (id, changes) => {
      setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...changes } : n)));
      dirty.current.add(id);
      scheduleSave();
    },
    [setNotes, scheduleSave]
  );

  const addNote = useCallback(
    (note) => {
      setNotes((ns) => {
        const position = ns.reduce((m, n) => Math.max(m, n.position ?? 0), -1) + 1;
        return [...ns, { ...note, position }];
      });
      dirty.current.add(note.id);
      setActiveId(note.id);
      scheduleSave();
    },
    [setNotes, scheduleSave]
  );

  const removeNote = useCallback(
    (id) => {
      setNotes((ns) => ns.filter((n) => n.id !== id));
      dirty.current.delete(id);
      if (mode.current !== "local") deleted.current.add(id);
      scheduleSave();
    },
    [setNotes, scheduleSave]
  );

  // Switching notes saves any pending changes right away.
  const selectNote = useCallback(
    (id) => {
      flush();
      setActiveId(id);
    },
    [flush]
  );

  return {
    notes,
    activeId,
    setActiveId: selectNote,
    flush,
    tabPosition,
    setTabPosition,
    status,
    updateNote,
    addNote,
    removeNote,
  };
}
