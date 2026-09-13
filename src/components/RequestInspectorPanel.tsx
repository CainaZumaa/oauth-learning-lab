"use client";

import type { InspectorEntry } from "@/lib/types";

export function RequestInspectorPanel({ entries }: { entries: InspectorEntry[] }) {
  return (
    <section className="panel panel-pad">
      <h2 className="panel-title">Request Inspector</h2>
      <p className="mb-2 text-left text-[11px] text-[var(--text-muted)]">
        Request → response for each protocol step.
      </p>
      <div className="max-h-[420px] space-y-2 overflow-auto">
        {entries.length === 0 && (
          <p className="text-left text-[12px] text-[var(--text-muted)]">
            No exchanges yet.
          </p>
        )}
        {entries.map((e) => (
          <details
            key={e.id}
            open
            className="border border-[var(--border)] bg-[var(--surface)]"
          >
            <summary className="cursor-pointer px-2 py-1.5 text-left text-[12px] font-mono text-[var(--text)]">
              {e.label}
              <span className="ml-2 text-[var(--text-muted)]">
                {new Date(e.timestamp).toLocaleTimeString()}
              </span>
            </summary>
            <div className="grid gap-2 border-t border-[var(--border)] p-2 md:grid-cols-2">
              <div className="text-left">
                <div className="mb-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                  REQUEST
                </div>
                <pre className="whitespace-pre-wrap break-all bg-[var(--surface-muted)] p-1.5 text-[11px] text-[var(--text)]">
                  {`${e.request.method} ${e.request.url}
${
  e.request.query
    ? `Query:\n${JSON.stringify(e.request.query, null, 2)}\n`
    : ""
}${
  e.request.headers
    ? `Headers:\n${JSON.stringify(e.request.headers, null, 2)}\n`
    : ""
}${
  e.request.body !== undefined
    ? `Body:\n${JSON.stringify(e.request.body, null, 2)}`
    : ""
}`}
                </pre>
              </div>
              <div className="text-left">
                <div className="mb-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                  RESPONSE
                </div>
                <pre className="whitespace-pre-wrap break-all bg-[var(--surface-muted)] p-1.5 text-[11px] text-[var(--text)]">
                  {`Status: ${e.response.status}${
                    e.response.statusText ? ` ${e.response.statusText}` : ""
                  }
${
  e.response.headers
    ? `Headers:\n${JSON.stringify(e.response.headers, null, 2)}\n`
    : ""
}Body:
${JSON.stringify(e.response.body, null, 2)}`}
                </pre>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
