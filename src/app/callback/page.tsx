"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { LAB_CONFIG } from "@/lib/config";
import { useI18n } from "@/i18n/I18nProvider";

const STORAGE_KEY = "oauth-lab-pkce";

function CallbackInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const started = useRef(false);
  const [status, setStatus] = useState<
    "idle" | "exchanging" | "done" | "failed"
  >("idle");
  const [message, setMessage] = useState("");
  const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!code || started.current) return;
    started.current = true;

    async function exchange() {
      setStatus("exchanging");
      let verifier = "";
      let redirectUri: string = LAB_CONFIG.registeredClient.redirect_uris[0];
      let clientId: string = LAB_CONFIG.registeredClient.client_id;
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            code_verifier: string;
            redirect_uri: string;
            client_id: string;
          };
          verifier = parsed.code_verifier;
          redirectUri = parsed.redirect_uri || redirectUri;
          clientId = parsed.client_id || clientId;
        }
      } catch {
        /* ignore */
      }

      if (!verifier) {
        setStatus("failed");
        setMessage(t.callback.noVerifier);
        return;
      }

      const body = {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: verifier,
      };

      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("failed");
        setMessage(
          data.error_description || data.error || "Token exchange failed"
        );
        return;
      }
      setTokens(data);
      setStatus("done");
      setMessage(t.callback.success);
      sessionStorage.removeItem(STORAGE_KEY);
    }

    void exchange();
  }, [code, t.callback.noVerifier, t.callback.success]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-(--bg)">
      <div className="mx-auto grid max-w-220 gap-3 px-3 py-6 md:grid-cols-[1.3fr_0.7fr]">
        <section className="panel panel-pad min-w-0 overflow-hidden text-left">
          <p className="text-[11px] font-medium text-(--text-muted)">
            {t.callback.eyebrow}
          </p>
          <h1 className="mt-0.5 text-[18px] font-semibold">
            {t.callback.title}
          </h1>

          {error && (
            <p className="mt-2 text-[13px] text-(--err)">
              {t.callback.authError} {error}
            </p>
          )}

          {!code && !error && (
            <p className="mt-2 text-[13px] text-(--text-muted)">
              {t.callback.noCode}
            </p>
          )}

          {code && (
            <div className="mt-3 min-w-0 space-y-2 text-[13px]">
              <div className="min-w-0">
                <div className="text-[11px] text-(--text-muted)">
                  authorization_code
                </div>
                <code className="block break-all text-[12px] text-(--text)">
                  {code}
                </code>
              </div>
              <p>
                {t.callback.status}{" "}
                <span
                  className={`badge ${
                    status === "done"
                      ? "badge-ok"
                      : status === "failed"
                        ? "badge-err"
                        : "badge-info"
                  }`}
                >
                  {status === "exchanging" && t.callback.exchanging}
                  {status === "done" && "ACCEPTED"}
                  {status === "failed" && "REJECTED"}
                  {status === "idle" && t.callback.starting}
                </span>
              </p>
              {message && (
                <p className="text-(--text-secondary)">{message}</p>
              )}
              {tokens && (
                <pre className="max-h-56 max-w-full overflow-auto whitespace-pre-wrap break-all bg-(--surface-muted) p-2 font-mono text-[11px]">
                  {JSON.stringify(tokens, null, 2)}
                </pre>
              )}
            </div>
          )}

          <Link href="/" className="mt-3 inline-block text-[13px]">
            ← {t.common.backToLab}
          </Link>
        </section>

        <aside className="panel panel-pad min-w-0 text-left text-[12px] text-(--text-secondary)">
          <h2 className="panel-title">{t.callback.exchangeTitle}</h2>
          <p>{t.callback.exchangeBody}</p>
        </aside>
      </div>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-[13px] text-(--text-muted)">Loading…</div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
