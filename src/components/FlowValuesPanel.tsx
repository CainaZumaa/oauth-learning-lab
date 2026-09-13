"use client";

import { useI18n } from "@/i18n/I18nProvider";
import type { FlowSnapshot } from "@/lib/types";

const FIELDS: { key: keyof FlowSnapshot; hintEn: string; hintPt: string }[] = [
  {
    key: "client_id",
    hintEn: "Registered public client id",
    hintPt: "client_id público registrado",
  },
  {
    key: "redirect_uri",
    hintEn: "Must match registered URI exactly",
    hintPt: "Deve coincidir exatamente com a URI registrada",
  },
  {
    key: "response_type",
    hintEn: "code = Authorization Code Flow",
    hintPt: "code = Authorization Code Flow",
  },
  {
    key: "scope",
    hintEn: "openid profile email offline_access",
    hintPt: "openid profile email offline_access",
  },
  {
    key: "code_challenge",
    hintEn: "BASE64URL(SHA256(code_verifier))",
    hintPt: "BASE64URL(SHA256(code_verifier))",
  },
  {
    key: "code_verifier",
    hintEn: "Secret kept by Client (PKCE)",
    hintPt: "Segredo guardado pelo Client (PKCE)",
  },
  {
    key: "authorization_code",
    hintEn: "Single-use, short-lived",
    hintPt: "Uso único, curta duração",
  },
  {
    key: "access_token",
    hintEn: "Authorization to call APIs",
    hintPt: "Autorização para chamar APIs",
  },
  {
    key: "refresh_token",
    hintEn: "Renew access when offline_access granted",
    hintPt: "Renova acesso quando offline_access foi concedido",
  },
  {
    key: "id_token",
    hintEn: "OIDC identity (not for API auth)",
    hintPt: "Identidade OIDC (não usar na API)",
  },
];

export function FlowValuesPanel({ flow }: { flow: FlowSnapshot }) {
  const { locale, t } = useI18n();
  const f = t.flow;

  return (
    <section className="panel panel-pad">
      <h2 className="panel-title">{f.title}</h2>
      <div className="max-h-90 space-y-1 overflow-auto">
        {FIELDS.map(({ key, hintEn, hintPt }) => {
          const value = flow[key];
          return (
            <details
              key={key}
              className="border border-(--border) bg-(--surface)"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-left text-[12px]">
                <span className="font-mono text-(--accent)">{key}</span>
                <span className="max-w-[55%] truncate text-[11px] text-(--text-muted)">
                  {value
                    ? String(value).slice(0, 32) +
                      (String(value).length > 32 ? "…" : "")
                    : "—"}
                </span>
              </summary>
              <div className="border-t border-(--border) px-2 py-1.5 text-left text-[11px]">
                <p className="mb-1 text-(--text-muted)">
                  {locale === "pt" ? hintPt : hintEn}
                </p>
                <pre className="whitespace-pre-wrap break-all bg-(--surface-muted) p-1.5 text-(--text)">
                  {value ?? f.empty}
                </pre>
              </div>
            </details>
          );
        })}
      </div>
      <div className="mt-2 border-t border-(--border) pt-2 text-left text-[11px] text-(--text-muted)">
        <p>
          <span className="font-medium text-(--text-secondary)">
            {f.idToken}
          </span>{" "}
          = {f.identity}.{" "}
          <span className="font-medium text-(--text-secondary)">
            {f.accessToken}
          </span>{" "}
          = {f.authorization}.
        </p>
        <p className="mt-1">{f.publicNote}</p>
      </div>
    </section>
  );
}
