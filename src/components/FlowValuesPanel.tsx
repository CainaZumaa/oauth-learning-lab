"use client";

import { useEffect, useId, useState } from "react";
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
    hintEn:
      "BASE64URL(SHA256(code_verifier)). One-way hash: cannot recover the verifier.",
    hintPt:
      "BASE64URL(SHA256(code_verifier)). Hash unidirecional: não dá para recuperar o verifier.",
  },
  {
    key: "code_verifier",
    hintEn:
      "High-entropy secret kept by the Client. Base64URL of random bytes (PKCE).",
    hintPt:
      "Segredo de alta entropia guardado pelo Client. Base64URL de bytes aleatórios (PKCE).",
  },
  {
    key: "authorization_code",
    hintEn: "Single-use, short-lived",
    hintPt: "Uso único, curta duração",
  },
  {
    key: "access_token",
    hintEn: "JWT used to call APIs (Bearer). Payload below is decoded for learning.",
    hintPt:
      "JWT para chamar APIs (Bearer). O payload abaixo é decodificado só para estudo.",
  },
  {
    key: "refresh_token",
    hintEn: "Renew access when offline_access granted",
    hintPt: "Renova acesso quando offline_access foi concedido",
  },
  {
    key: "id_token",
    hintEn: "OIDC identity JWT (not for API auth). Payload decoded for learning.",
    hintPt:
      "JWT de identidade OIDC (não usar na API). Payload decodificado só para estudo.",
  },
];

const MODAL_KEYS = new Set<keyof FlowSnapshot>([
  "scope",
  "code_challenge",
  "code_verifier",
  "authorization_code",
  "access_token",
  "refresh_token",
  "id_token",
]);

function preview(value: string | null) {
  if (!value) return "—";
  return value.length > 32 ? `${value.slice(0, 32)}…` : value;
}

function base64UrlToBytes(input: string): Uint8Array | null {
  try {
    const padded = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function decodeJwtPart(part: string): unknown | null {
  const bytes = base64UrlToBytes(part);
  if (!bytes) return null;
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function decodeFlowValue(
  key: keyof FlowSnapshot,
  value: string
): {
  labelKey: "decodedChallenge" | "decodedVerifier" | "decodedJwt";
  text: string;
} | null {
  if (key === "code_challenge") {
    const bytes = base64UrlToBytes(value);
    if (!bytes || bytes.length === 0) return null;
    return {
      labelKey: "decodedChallenge",
      text: bytesToHex(bytes),
    };
  }

  if (key === "code_verifier") {
    const bytes = base64UrlToBytes(value);
    if (!bytes || bytes.length === 0) return null;
    return {
      labelKey: "decodedVerifier",
      text: bytesToHex(bytes),
    };
  }

  if (key === "access_token" || key === "id_token") {
    const parts = value.split(".");
    if (parts.length < 2) return null;
    const header = decodeJwtPart(parts[0]);
    const payload = decodeJwtPart(parts[1]);
    if (!header && !payload) return null;
    return {
      labelKey: "decodedJwt",
      text: JSON.stringify({ header, payload }, null, 2),
    };
  }

  return null;
}

export function FlowValuesPanel({ flow }: { flow: FlowSnapshot }) {
  const { locale, t } = useI18n();
  const f = t.flow;
  const titleId = useId();
  const [modal, setModal] = useState<{
    key: keyof FlowSnapshot;
    value: string;
    hint: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!modal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModal(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copyValue() {
    if (!modal) return;
    try {
      await navigator.clipboard.writeText(modal.value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const decoded = modal ? decodeFlowValue(modal.key, modal.value) : null;

  return (
    <section className="panel panel-pad">
      <h2 className="panel-title">{f.title}</h2>
      <div className="max-h-90 space-y-1 overflow-auto">
        {FIELDS.map(({ key, hintEn, hintPt }) => {
          const value = flow[key];
          const hint = locale === "pt" ? hintPt : hintEn;
          const needsModal = MODAL_KEYS.has(key);

          if (needsModal) {
            return (
              <button
                key={key}
                type="button"
                className="flow-row"
                disabled={!value}
                title={value ? f.openValue : undefined}
                onClick={() => {
                  if (!value) return;
                  setCopied(false);
                  setModal({ key, value: String(value), hint });
                }}
              >
                <span className="font-mono text-(--accent)">{key}</span>
                <span className="max-w-[55%] truncate text-[11px] text-(--text-muted)">
                  {preview(value)}
                </span>
              </button>
            );
          }

          return (
            <details
              key={key}
              className="border border-(--border) bg-(--surface)"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-left text-[12px]">
                <span className="font-mono text-(--accent)">{key}</span>
                <span className="max-w-[55%] truncate text-[11px] text-(--text-muted)">
                  {preview(value)}
                </span>
              </summary>
              <div className="border-t border-(--border) px-2 py-1.5 text-left text-[11px]">
                <p className="mb-1 text-(--text-muted)">{hint}</p>
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

      {modal && (
        <div
          className="flow-modal-backdrop"
          role="presentation"
          onClick={() => setModal(null)}
        >
          <div
            className="flow-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flow-modal-header">
              <h3 id={titleId} className="font-mono text-[13px] text-(--accent)">
                {modal.key}
              </h3>
              <button
                type="button"
                className="flow-modal-close"
                aria-label={f.close}
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>
            <p className="mb-2 text-left text-[11px] text-(--text-muted)">
              {modal.hint}
            </p>
            <p className="mb-1 text-left text-[11px] font-semibold text-(--text-secondary)">
              {f.rawValue}
            </p>
            <pre className="flow-modal-value">{modal.value}</pre>
            {decoded && (
              <>
                <p className="mb-1 mt-3 text-left text-[11px] font-semibold text-(--text-secondary)">
                  {f[decoded.labelKey]}
                </p>
                <pre className="flow-modal-value">{decoded.text}</pre>
              </>
            )}
            <div className="mt-3 flex justify-end gap-1.5">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void copyValue()}
              >
                {copied ? f.copied : f.copy}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setModal(null)}
              >
                {f.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
