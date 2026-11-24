import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/session";
import { deleteNote, hasDatabase, isValidId, upsertNote } from "../../../../lib/db";

export const dynamic = "force-dynamic";

async function guard(params) {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  if (!hasDatabase()) return { error: NextResponse.json({ error: "No database" }, { status: 503 }) };
  const { id } = await params;
  if (!isValidId(id)) return { error: NextResponse.json({ error: "Bad note id" }, { status: 400 }) };
  return { session, id };
}

// PUT /api/notes/:id — create or update a note.
export async function PUT(request, { params }) {
  const g = await guard(params);
  if (g.error) return g.error;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const saved = await upsertNote(g.session.username, g.id, body);
    return NextResponse.json({ ok: true, ...saved });
  } catch (err) {
    const tooBig = err.message === "Note is too large";
    if (!tooBig) console.error("upsertNote failed", err);
    return NextResponse.json(
      { error: tooBig ? err.message : "Could not save note" },
      { status: tooBig ? 413 : 500 }
    );
  }
}

// DELETE /api/notes/:id
export async function DELETE(request, { params }) {
  const g = await guard(params);
  if (g.error) return g.error;
  try {
    await deleteNote(g.session.username, g.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("deleteNote failed", err);
    return NextResponse.json({ error: "Could not delete note" }, { status: 500 });
  }
}
