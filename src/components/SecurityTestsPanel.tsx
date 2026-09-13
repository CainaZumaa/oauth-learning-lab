"use client";

import type { FlowSnapshot } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";

export type TestResult = {
  id: string;
  status: "ACCEPTED" | "REJECTED" | "INFO" | "401";
  reason: string;
} | null;

type Props = {
  enabled: boolean;
  flow: FlowSnapshot;
  scopes: string[];
  onResult: (r: TestResult) => void;
  refreshState: () => Promise<void>;
};

type TestDef = {
  id: string;
  title: string;
  what: string;
  why: string;
  ifAccepted: string;
  control: string;
  run: (ctx: {
    flow: FlowSnapshot;
    scopes: string[];
    refreshState: () => Promise<void>;
  }) => Promise<{ status: TestResult extends null ? never : NonNullable<TestResult>["status"]; reason: string }>;
};

async function createCode(opts: {
  client_id: string;
  redirect_uri: string;
  scope: string;
  code_challenge: string;
  ttl?: number;
}): Promise<{ ok: true; code: string } | { ok: false; reason: string }> {
  const res = await fetch("/api/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: opts.client_id,
      redirect_uri: opts.redirect_uri,
      response_type: "code",
      scope: opts.scope,
      code_challenge: opts.code_challenge,
      code_challenge_method: "S256",
      ...(opts.ttl ? { ttl: String(opts.ttl) } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      reason: data.error_description || data.error || "authorize failed",
    };
  }
  return { ok: true, code: data.code as string };
}

async function tokenExchange(body: Record<string, unknown>) {
  const res = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { res, data };
}

const TESTS: TestDef[] = [
  {
    id: "tamper_redirect",
    title: "1. Tamper redirect_uri",
    what: "Enviar redirect_uri não registrada (http://localhost:3000/attacker).",
    why: "O código poderia ser enviado a um atacante se o AS aceitasse URIs arbitrárias.",
    ifAccepted: "Um Authorization Code seria entregue fora do Client legítimo.",
    control: "redirect_uri validation (exact match)",
    run: async () => {
      const { generateCodeVerifier, generateCodeChallenge } = await import(
        "@/lib/pkce-browser"
      );
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const res = await fetch("/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: "lab-client",
          redirect_uri: "http://localhost:3000/attacker",
          response_type: "code",
          scope: "openid profile",
          code_challenge: challenge,
          code_challenge_method: "S256",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          status: "REJECTED" as const,
          reason: data.error_description || "redirect_uri mismatch",
        };
      }
      return { status: "ACCEPTED" as const, reason: "UNEXPECTED: server accepted tampered URI" };
    },
  },
  {
    id: "reuse_code",
    title: "2. Reuse authorization code",
    what: "Trocar o code por tokens e tentar usar o mesmo code de novo.",
    why: "Authorization codes são artefatos temporários e de uso único.",
    ifAccepted: "Um código interceptado poderia ser reutilizado.",
    control: "Single-use authorization code",
    run: async ({ scopes }) => {
      const { generateCodeVerifier, generateCodeChallenge } = await import(
        "@/lib/pkce-browser"
      );
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const issued = await createCode({
        client_id: "lab-client",
        redirect_uri: "http://localhost:3000/callback",
        scope: scopes.join(" ") || "openid profile offline_access",
        code_challenge: challenge,
      });
      if (!issued.ok) return { status: "REJECTED", reason: issued.reason };

      const first = await tokenExchange({
        grant_type: "authorization_code",
        code: issued.code,
        redirect_uri: "http://localhost:3000/callback",
        client_id: "lab-client",
        code_verifier: verifier,
      });
      if (!first.res.ok) {
        return {
          status: "REJECTED",
          reason: first.data.error_description || "first exchange failed",
        };
      }

      const second = await tokenExchange({
        grant_type: "authorization_code",
        code: issued.code,
        redirect_uri: "http://localhost:3000/callback",
        client_id: "lab-client",
        code_verifier: verifier,
      });
      if (!second.res.ok) {
        return {
          status: "REJECTED",
          reason: second.data.error_description || "authorization_code already used",
        };
      }
      return { status: "ACCEPTED", reason: "UNEXPECTED: reuse was accepted" };
    },
  },
  {
    id: "remove_pkce",
    title: "3. Remove PKCE verifier",
    what: "Enviar token request sem code_verifier.",
    why: "Sem PKCE, um interceptor do code poderia trocá-lo sem conhecer o verifier.",
    ifAccepted: "Authorization code interception attacks ficariam mais fáceis (public clients).",
    control: "PKCE validation",
    run: async ({ scopes }) => {
      const { generateCodeVerifier, generateCodeChallenge } = await import(
        "@/lib/pkce-browser"
      );
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const issued = await createCode({
        client_id: "lab-client",
        redirect_uri: "http://localhost:3000/callback",
        scope: scopes.join(" ") || "openid profile",
        code_challenge: challenge,
      });
      if (!issued.ok) return { status: "REJECTED", reason: issued.reason };

      const { res, data } = await tokenExchange({
        grant_type: "authorization_code",
        code: issued.code,
        redirect_uri: "http://localhost:3000/callback",
        client_id: "lab-client",
        __omit_code_verifier: "1",
      });
      if (!res.ok) {
        return {
          status: "REJECTED",
          reason: data.error_description || "PKCE validation failed",
        };
      }
      return { status: "ACCEPTED", reason: "UNEXPECTED: missing PKCE accepted" };
    },
  },
  {
    id: "wrong_pkce",
    title: "4. Use wrong PKCE verifier",
    what: "Enviar um code_verifier diferente do usado para gerar o challenge.",
    why: "Demonstra que só quem gerou o verifier original consegue completar o fluxo.",
    ifAccepted: "Qualquer possuidor do code poderia obter tokens.",
    control: "PKCE (S256) challenge/verifier binding",
    run: async ({ scopes }) => {
      const { generateCodeVerifier, generateCodeChallenge } = await import(
        "@/lib/pkce-browser"
      );
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const wrong = generateCodeVerifier();
      const issued = await createCode({
        client_id: "lab-client",
        redirect_uri: "http://localhost:3000/callback",
        scope: scopes.join(" ") || "openid profile",
        code_challenge: challenge,
      });
      if (!issued.ok) return { status: "REJECTED", reason: issued.reason };

      const { res, data } = await tokenExchange({
        grant_type: "authorization_code",
        code: issued.code,
        redirect_uri: "http://localhost:3000/callback",
        client_id: "lab-client",
        code_verifier: wrong,
      });
      if (!res.ok) {
        return {
          status: "REJECTED",
          reason: data.error_description || "PKCE validation failed",
        };
      }
      return { status: "ACCEPTED", reason: "UNEXPECTED: wrong verifier accepted" };
    },
  },
  {
    id: "tamper_client",
    title: "5. Tamper client_id",
    what: "Usar client_id diferente do registrado / do code.",
    why: "Codes e tokens são vinculados ao client que iniciou o fluxo.",
    ifAccepted: "Outro client poderia se apropriar da autorização.",
    control: "client validation / code binding",
    run: async () => {
      const { generateCodeVerifier, generateCodeChallenge } = await import(
        "@/lib/pkce-browser"
      );
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const res = await fetch("/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: "evil-client",
          redirect_uri: "http://localhost:3000/callback",
          response_type: "code",
          scope: "openid profile",
          code_challenge: challenge,
          code_challenge_method: "S256",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          status: "REJECTED",
          reason: data.error_description || "client mismatch",
        };
      }
      // Also try mismatch on token endpoint with a valid code
      const issued = await createCode({
        client_id: "lab-client",
        redirect_uri: "http://localhost:3000/callback",
        scope: "openid profile",
        code_challenge: challenge,
      });
      if (!issued.ok) return { status: "REJECTED", reason: issued.reason };
      const second = await tokenExchange({
        grant_type: "authorization_code",
        code: issued.code,
        redirect_uri: "http://localhost:3000/callback",
        client_id: "evil-client",
        code_verifier: verifier,
      });
      if (!second.res.ok) {
        return {
          status: "REJECTED",
          reason: second.data.error_description || "client mismatch",
        };
      }
      return { status: "ACCEPTED", reason: "UNEXPECTED: tampered client accepted" };
    },
  },
  {
    id: "expired_code",
    title: "6. Expired authorization code",
    what: "Forçar expiração do code e tentar trocá-lo por tokens.",
    why: "Codes devem viver pouco tempo para limitar a janela de ataque.",
    ifAccepted: "Codes capturados permaneceriam utilizáveis por tempo demais.",
    control: "authorization code expiration",
    run: async ({ scopes }) => {
      const { generateCodeVerifier, generateCodeChallenge } = await import(
        "@/lib/pkce-browser"
      );
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const issued = await createCode({
        client_id: "lab-client",
        redirect_uri: "http://localhost:3000/callback",
        scope: scopes.join(" ") || "openid profile",
        code_challenge: challenge,
        ttl: 1,
      });
      if (!issued.ok) return { status: "REJECTED", reason: issued.reason };

      await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "expire_code", code: issued.code }),
      });

      const { res, data } = await tokenExchange({
        grant_type: "authorization_code",
        code: issued.code,
        redirect_uri: "http://localhost:3000/callback",
        client_id: "lab-client",
        code_verifier: verifier,
      });
      if (!res.ok) {
        return {
          status: "REJECTED",
          reason: data.error_description || "authorization_code expired",
        };
      }
      return { status: "ACCEPTED", reason: "UNEXPECTED: expired code accepted" };
    },
  },
  {
    id: "expired_access",
    title: "7. Expired access token",
    what: "Expirar o access token e chamar GET /api/profile.",
    why: "Access tokens de curta duração limitam o impacto de vazamento.",
    ifAccepted: "Um token roubado permaneceria válido por tempo excessivo.",
    control: "access token expiration",
    run: async ({ flow, scopes, refreshState }) => {
      let access = flow.access_token;
      if (!access) {
        const { generateCodeVerifier, generateCodeChallenge } = await import(
          "@/lib/pkce-browser"
        );
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        const issued = await createCode({
          client_id: "lab-client",
          redirect_uri: "http://localhost:3000/callback",
          scope: (scopes.includes("offline_access")
            ? scopes
            : [...scopes, "offline_access"]
          ).join(" "),
          code_challenge: challenge,
        });
        if (!issued.ok) return { status: "REJECTED", reason: issued.reason };
        const { res, data } = await tokenExchange({
          grant_type: "authorization_code",
          code: issued.code,
          redirect_uri: "http://localhost:3000/callback",
          client_id: "lab-client",
          code_verifier: verifier,
        });
        if (!res.ok) {
          return { status: "REJECTED", reason: data.error_description };
        }
        access = data.access_token as string;
        await refreshState();
      }

      await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "expire_access_token", token: access }),
      });

      const profile = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${access}` },
      });
      const body = await profile.json();
      if (profile.status === 401) {
        return {
          status: "401",
          reason: body.error_description || "access_token expired",
        };
      }
      return { status: "ACCEPTED", reason: "UNEXPECTED: expired token allowed" };
    },
  },
  {
    id: "refresh",
    title: "8. Refresh access token",
    what: "Usar refresh_token para obter novo access_token (com rotation).",
    why: "Permitir renovação sem re-login quando offline_access foi concedido.",
    ifAccepted: "Novo access (+ novo refresh) emitidos; antigo refresh invalidado.",
    control: "Refresh token + rotation",
    run: async ({ flow, scopes, refreshState }) => {
      let refresh = flow.refresh_token;
      if (!refresh) {
        const { generateCodeVerifier, generateCodeChallenge } = await import(
          "@/lib/pkce-browser"
        );
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        const scopeList = scopes.includes("offline_access")
          ? scopes
          : [...scopes, "openid", "offline_access"];
        const issued = await createCode({
          client_id: "lab-client",
          redirect_uri: "http://localhost:3000/callback",
          scope: [...new Set(scopeList)].join(" "),
          code_challenge: challenge,
        });
        if (!issued.ok) return { status: "REJECTED", reason: issued.reason };
        const { res, data } = await tokenExchange({
          grant_type: "authorization_code",
          code: issued.code,
          redirect_uri: "http://localhost:3000/callback",
          client_id: "lab-client",
          code_verifier: verifier,
        });
        if (!res.ok) {
          return { status: "REJECTED", reason: data.error_description };
        }
        refresh = data.refresh_token as string;
        await refreshState();
      }

      const { res, data } = await tokenExchange({
        grant_type: "refresh_token",
        refresh_token: refresh,
        client_id: "lab-client",
      });
      await refreshState();
      if (!res.ok) {
        return { status: "REJECTED", reason: data.error_description };
      }
      return {
        status: "ACCEPTED",
        reason: "NEW ACCESS TOKEN ISSUED (+ rotated refresh_token)",
      };
    },
  },
  {
    id: "reuse_refresh",
    title: "9. Reuse refresh token",
    what: "Após rotation, tentar reutilizar o refresh_token antigo.",
    why: "Reuse sugere roubo; o AS deve invalidar a família de tokens.",
    ifAccepted: "Atacante e vítima poderiam manter sessões paralelas.",
    control: "Refresh token rotation + reuse detection",
    run: async ({ scopes, refreshState }) => {
      const { generateCodeVerifier, generateCodeChallenge } = await import(
        "@/lib/pkce-browser"
      );
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const scopeList = [...new Set([...scopes, "openid", "offline_access"])];
      const issued = await createCode({
        client_id: "lab-client",
        redirect_uri: "http://localhost:3000/callback",
        scope: scopeList.join(" "),
        code_challenge: challenge,
      });
      if (!issued.ok) return { status: "REJECTED", reason: issued.reason };
      const first = await tokenExchange({
        grant_type: "authorization_code",
        code: issued.code,
        redirect_uri: "http://localhost:3000/callback",
        client_id: "lab-client",
        code_verifier: verifier,
      });
      if (!first.res.ok) {
        return { status: "REJECTED", reason: first.data.error_description };
      }
      const oldRt = first.data.refresh_token as string;

      const rotated = await tokenExchange({
        grant_type: "refresh_token",
        refresh_token: oldRt,
        client_id: "lab-client",
      });
      if (!rotated.res.ok) {
        return { status: "REJECTED", reason: rotated.data.error_description };
      }

      const reuse = await tokenExchange({
        grant_type: "refresh_token",
        refresh_token: oldRt,
        client_id: "lab-client",
      });
      await refreshState();
      if (!reuse.res.ok) {
        return {
          status: "REJECTED",
          reason:
            reuse.data.error_description ||
            "refresh_token already rotated/revoked",
        };
      }
      return { status: "ACCEPTED", reason: "UNEXPECTED: old refresh accepted" };
    },
  },
  {
    id: "no_offline",
    title: "10. Remove offline_access",
    what: "Fluxo sem offline_access — comparar access expiry vs refresh availability.",
    why: "offline_access autoriza acesso offline/refresh; sem ele este lab não emite refresh_token.",
    ifAccepted:
      "Access Token ainda funciona até expirar; refresh não estará disponível.",
    control: "scope validation · offline_access policy",
    run: async ({ refreshState }) => {
      const { generateCodeVerifier, generateCodeChallenge } = await import(
        "@/lib/pkce-browser"
      );
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const issued = await createCode({
        client_id: "lab-client",
        redirect_uri: "http://localhost:3000/callback",
        scope: "openid profile email",
        code_challenge: challenge,
      });
      if (!issued.ok) return { status: "REJECTED", reason: issued.reason };
      const { res, data } = await tokenExchange({
        grant_type: "authorization_code",
        code: issued.code,
        redirect_uri: "http://localhost:3000/callback",
        client_id: "lab-client",
        code_verifier: verifier,
      });
      await refreshState();
      if (!res.ok) {
        return { status: "REJECTED", reason: data.error_description };
      }
      if (data.refresh_token) {
        return {
          status: "ACCEPTED",
          reason: "UNEXPECTED: refresh_token issued without offline_access",
        };
      }
      return {
        status: "INFO",
        reason:
          "Access token issued WITHOUT refresh_token. Access still expires on its own TTL; offline_access was not granted so refresh is unavailable.",
      };
    },
  },
];

export function SecurityTestsPanel({
  enabled,
  flow,
  scopes,
  onResult,
  refreshState,
}: Props) {
  const { t } = useI18n();

  return (
    <section className="panel panel-pad text-left">
      <h2 className="panel-title">{t.security.title}</h2>
      {!enabled && (
        <p className="mb-2 text-[12px] text-[var(--warn)]">
          {t.security.enableHint}
        </p>
      )}
      <div className="space-y-2">
        {TESTS.map((test) => (
          <div
            key={test.id}
            className="border border-[var(--border)] bg-[var(--surface)] p-2.5"
          >
            <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-[var(--text)]">
                {test.title}
              </h3>
              <button
                type="button"
                disabled={!enabled}
                className="btn btn-danger"
                onClick={async () => {
                  const result = await test.run({ flow, scopes, refreshState });
                  onResult({ id: test.id, ...result });
                  await refreshState();
                }}
              >
                {t.security.runTest}
              </button>
            </div>
            <dl className="space-y-0.5 text-[12px] text-[var(--text-secondary)]">
              <div>
                <dt className="inline text-[var(--text-muted)]">
                  {t.security.what}{" "}
                </dt>
                <dd className="inline">{test.what}</dd>
              </div>
              <div>
                <dt className="inline text-[var(--text-muted)]">
                  {t.security.why}{" "}
                </dt>
                <dd className="inline">{test.why}</dd>
              </div>
              <div>
                <dt className="inline text-[var(--text-muted)]">
                  {t.security.ifAccepted}{" "}
                </dt>
                <dd className="inline">{test.ifAccepted}</dd>
              </div>
              <div>
                <dt className="inline text-[var(--text-muted)]">
                  {t.security.control}{" "}
                </dt>
                <dd className="inline font-medium text-[var(--accent)]">
                  {test.control}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
