// Postgres (Neon) access for notes. Server-side only.
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const hasDatabase = () => Boolean(connectionString);

// Reuse one small pool per server instance (serverless-friendly).
function getPool() {
  if (!globalThis.__liveSlatePool) {
    const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
    globalThis.__liveSlatePool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: true },
      max: 3,
      idleTimeoutMillis: 10_000,
    });
  }
  return globalThis.__liveSlatePool;
}

// Create the table the first time it's needed — no manual setup.
let schemaReady;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS notes (
          username   TEXT        NOT NULL,
          id         TEXT        NOT NULL,
          title      TEXT        NOT NULL,
          content    TEXT        NOT NULL DEFAULT '',
          position   INTEGER     NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (username, id)
        )
      `)
      .catch((err) => {
        schemaReady = undefined; // retry next time
        throw err;
      });
  }
  return schemaReady;
}

async function query(text, params) {
  await ensureSchema();
  return getPool().query(text, params);
}

// ---- Validation ----
export const LIMITS = { title: 200, content: 200_000 };
export const isValidId = (id) => typeof id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(id);

export function cleanNote(input) {
  const title = String(input?.title ?? "").trim().slice(0, LIMITS.title) || "Untitled";
  const content = String(input?.content ?? "");
  if (content.length > LIMITS.content) throw new Error("Note is too large");
  const position = Number.isInteger(input?.position) ? input.position : 0;
  return { title, content, position };
}

// ---- Queries (always scoped to the logged-in username) ----
export async function listNotes(username) {
  const { rows } = await query(
    `SELECT id, title, content, position, updated_at AS "updatedAt"
       FROM notes WHERE username = $1
      ORDER BY position, created_at`,
    [username]
  );
  return rows;
}

export async function upsertNote(username, id, note) {
  const { title, content, position } = cleanNote(note);
  const { rows } = await query(
    `INSERT INTO notes (username, id, title, content, position)
          VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (username, id) DO UPDATE
             SET title = EXCLUDED.title,
                 content = EXCLUDED.content,
                 position = EXCLUDED.position,
                 updated_at = now()
       RETURNING id, updated_at AS "updatedAt"`,
    [username, id, title, content, position]
  );
  return rows[0];
}

export async function deleteNote(username, id) {
  await query(`DELETE FROM notes WHERE username = $1 AND id = $2`, [username, id]);
}
