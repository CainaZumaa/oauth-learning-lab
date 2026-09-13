"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import type { InspectorEntry, LabEvent } from "@/lib/types";

type Tab = "events" | "inspector";

const statusClass: Record<string, string> = {
  ACCEPTED: "badge-ok",
  REJECTED: "badge-err",
  WARNING: "badge-warn",
  INFO: "badge-info",
};

export function ObservabilityDock({
  events,
  inspector,
  onClearLogs,
}: {
  events: LabEvent[];
  inspector: InspectorEntry[];
  onClearLogs?: () => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("events");
  const canClear = events.length > 0 || inspector.length > 0;

  return (
    <aside className="observability-dock flex h-full min-h-0 w-full flex-col border-l border-(--border) bg-(--surface)">
      <div className="flex shrink-0 items-center border-b border-(--border)">
        <div className="flex min-w-0 flex-1">
          <button
            type="button"
            className="dock-tab"
            aria-pressed={tab === "events"}
            onClick={() => setTab("events")}
          >
            {t.dock.eventLog}
            <span className="dock-tab-count">{events.length}</span>
          </button>
          <button
            type="button"
            className="dock-tab"
            aria-pressed={tab === "inspector"}
            onClick={() => setTab("inspector")}
          >
            {t.dock.inspector}
            <span className="dock-tab-count">{inspector.length}</span>
          </button>
        </div>
        {onClearLogs && (
          <button
            type="button"
            className="dock-clear"
            disabled={!canClear}
            title={t.dock.clearTitle}
            onClick={() => void onClearLogs()}
          >
            {t.dock.clear}
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2">
        {tab === "events" && (
          <div className="space-y-1.5 font-mono text-[11px]">
            {events.length === 0 && (
              <p className="px-1 text-left text-(--text-muted)">
                {t.dock.noEvents}
              </p>
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
                  <span className="text-(--text-secondary)">
                    [{e.category}]
                  </span>
                  <span className={`badge ${statusClass[e.status] ?? ""}`}>
                    {e.status}
                  </span>
                </div>
                <div className="mt-0.5 text-(--text)">{e.title}</div>
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
        )}

        {tab === "inspector" && (
          <div className="space-y-2">
            {inspector.length === 0 && (
              <p className="px-1 text-left text-[12px] text-(--text-muted)">
                {t.dock.noExchanges}
              </p>
            )}
            {inspector.map((e) => (
              <details
                key={e.id}
                className="border border-(--border) bg-(--bg)"
              >
                <summary className="cursor-pointer px-2 py-1.5 text-left text-[12px] font-mono text-(--text)">
                  {e.label}
                  <span className="ml-2 text-(--text-muted)">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                </summary>
                <div className="space-y-2 border-t border-(--border) p-2">
                  <div className="text-left">
                    <div className="mb-1 text-[11px] font-semibold text-(--text-secondary)">
                      {t.dock.request}
                    </div>
                    <pre className="whitespace-pre-wrap break-all bg-(--surface-muted) p-1.5 text-[11px] text-(--text)">
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
                    <div className="mb-1 text-[11px] font-semibold text-(--text-secondary)">
                      {t.dock.response}
                    </div>
                    <pre className="whitespace-pre-wrap break-all bg-(--surface-muted) p-1.5 text-[11px] text-(--text)">
                      {`Status: ${e.response.status}${
                        e.response.statusText
                          ? ` ${e.response.statusText}`
                          : ""
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
        )}
      </div>
    </aside>
  );
}
