import { NextResponse } from "next/server";
import { getSession } from "../../../lib/session";
import { hasDatabase, listNotes } from "../../../lib/db";

export const dynamic = "force-dynamic";

// GET /api/notes — all notes for the logged-in user.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // No database configured (e.g. running locally): the app saves in the browser only.
  if (!hasDatabase()) return NextResponse.json({ enabled: false, notes: [] });

  try {
    const notes = await listNotes(session.username);
    return NextResponse.json({ enabled: true, notes });
  } catch (err) {
    console.error("listNotes failed", err);
    return NextResponse.json({ error: "Could not load notes" }, { status: 500 });
  }
}
