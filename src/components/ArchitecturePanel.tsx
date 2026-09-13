"use client";

import { useI18n } from "@/i18n/I18nProvider";

export function ArchitecturePanel({
  hasTokens,
  lastApiOk,
}: {
  hasTokens: boolean;
  lastApiOk: boolean | null;
}) {
  const { t } = useI18n();
  const a = t.architecture;

  const nodes = [
    { label: a.user, sub: a.userSub, status: a.ready, ok: true },
    { label: a.client, sub: a.clientSub, status: a.ready, ok: true },
    { label: a.as, sub: a.asSub, status: a.running, ok: true },
    {
      label: a.rs,
      sub: a.rsSub,
      status: lastApiOk === false ? a.last401 : a.running,
      ok: lastApiOk !== false,
    },
  ];

  return (
    <section className="panel panel-pad">
      <h2 className="panel-title">{a.title}</h2>
      <div className="space-y-1">
        {nodes.map((n, i) => (
          <div key={n.label}>
            <div className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1.5">
              <div className="min-w-0 text-left">
                <div className="font-mono text-[12px] font-medium text-[var(--text)]">
                  {n.label}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">{n.sub}</div>
              </div>
              <div className="shrink-0 text-[11px] text-[var(--text-secondary)]">
                <span className={`status-dot ${n.ok ? "" : "err"}`} />
                {n.status}
              </div>
            </div>
            {i < nodes.length - 1 && (
              <div className="pl-3 text-[11px] leading-4 text-[var(--text-muted)]">
                ↓
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-left text-[11px] text-[var(--text-muted)]">
        {a.oidcNote} {hasTokens ? a.yes : a.notYet}.
      </p>
    </section>
  );
}
