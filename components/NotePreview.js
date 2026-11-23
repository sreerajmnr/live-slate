"use client";

import MermaidDiagram from "./MermaidDiagram";

const FENCE = /```mermaid[^\n]*\n([\s\S]*?)```/g;

function splitSegments(content) {
  const out = [];
  let last = 0;
  for (const m of content.matchAll(FENCE)) {
    if (m.index > last) out.push({ type: "text", value: content.slice(last, m.index) });
    out.push({ type: "mermaid", value: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < content.length) out.push({ type: "text", value: content.slice(last) });
  return out;
}

// Light formatting for text: # headings, - bullets, paragraphs.
function TextBlock({ value }) {
  const blocks = [];
  let list = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={blocks.length}>{list}</ul>);
    list = [];
  };
  value.split("\n").forEach((line, i) => {
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) {
      flush();
      const Tag = `h${h[1].length + 1}`;
      blocks.push(<Tag key={blocks.length}>{h[2]}</Tag>);
    } else if (/^\s*[-*]\s+/.test(line)) {
      list.push(<li key={i}>{line.replace(/^\s*[-*]\s+/, "")}</li>);
    } else if (line.trim()) {
      flush();
      blocks.push(<p key={blocks.length}>{line}</p>);
    } else {
      flush();
    }
  });
  flush();
  return <>{blocks}</>;
}

export default function NotePreview({ content }) {
  const segments = splitSegments(content);
  if (!content.trim()) return <p className="muted">Nothing to preview yet.</p>;
  return (
    <div className="preview-body">
      {segments.map((s, i) =>
        s.type === "mermaid" ? (
          <MermaidDiagram key={i} code={s.value} />
        ) : (
          <TextBlock key={i} value={s.value} />
        )
      )}
    </div>
  );
}
