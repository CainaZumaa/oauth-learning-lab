"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { LAB_CONFIG } from "@/lib/config";
import { useI18n } from "@/i18n/I18nProvider";

function AuthorizeForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const params = useMemo(
    () => ({
      client_id: searchParams.get("client_id") ?? "",
      redirect_uri: searchParams.get("redirect_uri") ?? "",
      response_type: searchParams.get("response_type") ?? "code",
      scope: searchParams.get("scope") ?? "openid profile",
      code_challenge: searchParams.get("code_challenge") ?? "",
      code_challenge_method: searchParams.get("code_challenge_method") ?? "S256",
      state: searchParams.get("state") ?? "",
    }),
    [searchParams]
  );

  async function onAuthorize() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error_description || data.error || "Authorization rejected"
        );
        return;
      }
      window.location.href = data.redirect_to;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto grid max-w-[880px] gap-3 px-3 py-6 md:grid-cols-[1.2fr_0.8fr]">
        <section className="panel panel-pad text-left">
          <p className="text-[11px] font-medium text-[var(--text-muted)]">
            {t.authorize.eyebrow}
          </p>
          <h1 className="mt-0.5 text-[18px] font-semibold">
            {t.authorize.title}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {t.authorize.subtitle}
          </p>

          <div className="mt-3 space-y-1.5 border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-[13px]">
            <div>
              <span className="text-[var(--text-muted)]">{t.authorize.user}</span>
              <div className="font-mono text-[12px] text-[var(--text)]">
                {LAB_CONFIG.user.email}
              </div>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">
                {t.authorize.client}
              </span>
              <div className="font-mono text-[12px]">
                {params.client_id || "(missing)"}
              </div>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">redirect_uri</span>
              <div className="break-all font-mono text-[11px]">
                {params.redirect_uri || "(missing)"}
              </div>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">scope</span>
              <div className="font-mono text-[11px]">{params.scope}</div>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">code_challenge</span>
              <div className="break-all font-mono text-[11px]">
                {params.code_challenge
                  ? `${params.code_challenge.slice(0, 40)}…`
                  : "(missing)"}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-2 rounded-[var(--radius)] border border-[var(--err-border)] bg-[var(--err-bg)] px-2.5 py-1.5 text-[12px] text-[var(--err)]">
              REJECTED — {error}
            </div>
          )}

          <div className="mt-3 flex gap-1.5">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={onAuthorize}
            >
              {busy ? t.authorize.authorizing : t.authorize.authorize}
            </button>
          </div>
        </section>

        <aside className="panel panel-pad text-left text-[12px] text-[var(--text-secondary)]">
          <h2 className="panel-title">{t.authorize.nextTitle}</h2>
          <ol className="list-decimal space-y-1 pl-4">
            {t.authorize.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </aside>
      </div>
    </main>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-[13px] text-[var(--text-muted)]">Loading…</div>
      }
    >
      <AuthorizeForm />
    </Suspense>
  );
}
