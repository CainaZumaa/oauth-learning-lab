"use client";

import type { LabEvent } from "@/lib/types";

const statusClass: Record<string, string> = {
  ACCEPTED: "badge-ok",
  REJECTED: "badge-err",
  WARNING: "badge-warn",
  INFO: "badge-info",
};

export function EventLogPanel({ events }: { events: LabEvent[] }) {
  return (
    <section className="panel panel-pad">
      <h2 className="panel-title">Event Log</h2>
      <div className="max-h-95 space-y-1.5 overflow-auto font-mono text-[11px]">
        {events.length === 0 && (
          <p className="text-left text-(--text-muted)">No events yet.</p>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            className="border border-(--border) bg-(--surface-muted) p-1.5 text-left"
          >
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-(--text-muted)">
                [{new Date(e.timestamp).toLocaleTimeString()}]
              </span>
              <span className="text-(--text-secondary)">[{e.category}]</span>
              <span className={`badge ${statusClass[e.status] ?? ""}`}>
                {e.status}
              </span>
              <span className="text-(--text)">{e.title}</span>
            </div>
            {e.message && (
              <p className="mt-0.5 text-(--text-secondary)">{e.message}</p>
            )}
            {e.details && (
              <pre className="mt-0.5 whitespace-pre-wrap break-all text-(--text-muted)">
                {Object.entries(e.details)
                  .map(
                    ([k, v]) =>
                      `${k}=${v === null || v === undefined ? "" : String(v)}`
                  )
                  .join("\n")}
              </pre>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
