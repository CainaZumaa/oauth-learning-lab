"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { useI18n } from "@/i18n/I18nProvider";

type Hotspot = {
  id: string;
  title: string;
  body: string;
};

function InteractiveRoles({
  hotspots,
  hint,
}: {
  hotspots: Hotspot[];
  hint: string;
}) {
  const [active, setActive] = useState<string>("client");
  const current = hotspots.find((h) => h.id === active) ?? hotspots[0];

  function Box({
    id,
    title,
    sub,
    example,
  }: {
    id: string;
    title: string;
    sub: string;
    example: string;
  }) {
    return (
      <button
        type="button"
        className={`arch-flow-box ${active === id ? "is-active" : ""}`}
        onMouseEnter={() => setActive(id)}
        onFocus={() => setActive(id)}
      >
        <strong>{title}</strong>
        <span>{sub}</span>
        <em className="arch-flow-example">{example}</em>
      </button>
    );
  }

  function Edge({
    id,
    label,
  }: {
    id: string;
    label: string;
  }) {
    return (
      <button
        type="button"
        className={`arch-flow-edge ${active === id ? "is-active" : ""}`}
        onMouseEnter={() => setActive(id)}
        onFocus={() => setActive(id)}
      >
        <span className="arch-flow-edge-line" aria-hidden />
        <span className="arch-flow-edge-label">{label}</span>
        <span className="arch-flow-edge-arrow" aria-hidden>
          ↓
        </span>
      </button>
    );
  }

  return (
    <div className="arch-interactive">
      <div className="arch-flow" aria-label="OAuth roles diagram">
        <div className="arch-flow-pair">
          <Box
            id="ro"
            title="Resource Owner"
            sub="User · alice@example.local"
            example="ex.: you authorizing an app"
          />
          <Box
            id="client"
            title="Client"
            sub="Public + PKCE · lab-client · /callback"
            example="ex.: SPA / mobile app (Canva, Notion)"
          />
        </div>

        <Edge id="edge-authorize" label="1 · Client → AS · authorize + PKCE" />

        <Box
          id="as"
          title="Authorization Server (AS)"
          sub="Identity Provider · /authorize · /token"
          example="ex.: Google Accounts, GitHub, Auth0"
        />

        <Edge id="edge-consent" label="2 · Resource Owner · consent / login" />
        <Edge id="edge-code" label="3 · AS → Client · authorization_code" />
        <Edge id="edge-token" label="4 · Client → AS · code + code_verifier" />
        <Edge id="edge-api" label="5 · Client → RS · Bearer access_token" />

        <Box
          id="rs"
          title="Resource Server (RS)"
          sub="Protected API · GET /api/profile"
          example="ex.: Google Drive API, GitHub API"
        />
      </div>

      <aside className="arch-interactive-detail panel panel-pad">
        <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>
        <h3 className="mt-1 text-[14px] font-semibold text-[var(--text)]">
          {current.title}
        </h3>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          {current.body}
        </p>
      </aside>
    </div>
  );
}

export default function ArchitecturePage() {
  const { t, locale } = useI18n();
  const p = t.architecturePage;

  const hotspots: Hotspot[] =
    locale === "pt"
      ? [
          {
            id: "ro",
            title: "Resource Owner (usuário)",
            body: "Dono dos dados. Neste lab é Alice (alice@example.local). Ela autentica/consente no Identity Provider — sem senha real, só o botão Autorizar.",
          },
          {
            id: "client",
            title: "Client (aplicação)",
            body: "App pública (lab-client) com PKCE. Não guarda client_secret no browser. Inicia o fluxo, guarda o code_verifier e troca o code por tokens em /callback.",
          },
          {
            id: "as",
            title: "Authorization Server (AS)",
            body: "Servidor de autorização / Identity Provider. Expõe /authorize e /token. Valida redirect_uri, PKCE, emite authorization_code e tokens (access, refresh, id_token).",
          },
          {
            id: "rs",
            title: "Resource Server (RS)",
            body: "API protegida (GET /api/profile). Exige Authorization: Bearer <access_token>. Se o token for inválido/expirado → 401.",
          },
          {
            id: "edge-consent",
            title: "Consentimento do usuário",
            body: "O Resource Owner autoriza o Client no AS. Sem isso o Authorization Server não deve emitir o code.",
          },
          {
            id: "edge-authorize",
            title: "Authorization Request",
            body: "Client → AS: client_id, redirect_uri, response_type=code, scope, code_challenge (S256). É o início do Authorization Code Flow.",
          },
          {
            id: "edge-code",
            title: "Authorization Code",
            body: "AS → Client (redirect): code de uso único, curto TTL, ligado a client_id, redirect_uri e code_challenge.",
          },
          {
            id: "edge-token",
            title: "Token Request",
            body: "Client → AS (/token): envia code + code_verifier. O AS verifica PKCE, marca o code como usado e emite tokens.",
          },
          {
            id: "edge-api",
            title: "Chamada à API",
            body: "Client → RS: Bearer access_token. O access_token autoriza o recurso; o id_token representa identidade (OIDC) e não deve ir na API.",
          },
        ]
      : [
          {
            id: "ro",
            title: "Resource Owner (user)",
            body: "Owns the data. In this lab: Alice (alice@example.local). Authenticates/consents at the Identity Provider — simulated login, Authorize button only.",
          },
          {
            id: "client",
            title: "Client (application)",
            body: "Public app (lab-client) with PKCE. No client_secret in the browser. Starts the flow, keeps code_verifier, exchanges the code for tokens at /callback.",
          },
          {
            id: "as",
            title: "Authorization Server (AS)",
            body: "Authorization server / Identity Provider. Exposes /authorize and /token. Validates redirect_uri and PKCE, issues authorization_code and tokens (access, refresh, id_token).",
          },
          {
            id: "rs",
            title: "Resource Server (RS)",
            body: "Protected API (GET /api/profile). Requires Authorization: Bearer <access_token>. Invalid/expired token → 401.",
          },
          {
            id: "edge-consent",
            title: "User consent",
            body: "The Resource Owner authorizes the Client at the AS. Without consent the Authorization Server should not issue a code.",
          },
          {
            id: "edge-authorize",
            title: "Authorization Request",
            body: "Client → AS: client_id, redirect_uri, response_type=code, scope, code_challenge (S256). Start of the Authorization Code Flow.",
          },
          {
            id: "edge-code",
            title: "Authorization Code",
            body: "AS → Client (redirect): single-use short-lived code bound to client_id, redirect_uri and code_challenge.",
          },
          {
            id: "edge-token",
            title: "Token Request",
            body: "Client → AS (/token): sends code + code_verifier. AS verifies PKCE, marks the code used, and issues tokens.",
          },
          {
            id: "edge-api",
            title: "API call",
            body: "Client → RS: Bearer access_token. Access token authorizes the resource; id_token is OIDC identity and should not be sent to the API.",
          },
        ];

  const rolesChart = `flowchart TB
  subgraph roles["OAuth 2.0 Roles"]
    RO["Resource Owner<br/>User: alice@example.local<br/><i>ex.: you authorizing an app</i>"]
    CL["Client<br/>Public Client + PKCE<br/>Web UI /callback<br/><i>ex.: SPA / mobile (Canva, Notion)</i>"]
    AS["Authorization Server AS<br/>Identity Provider<br/>/authorize · /api/authorize · /api/token<br/><i>ex.: Google, GitHub, Auth0</i>"]
    RS["Resource Server RS<br/>Protected API<br/>GET /api/profile<br/><i>ex.: Drive API, GitHub API</i>"]
  end
  RO -->|"authenticates / consents"| AS
  CL -->|"Authorization Request + code_challenge"| AS
  AS -->|"redirect_uri?code=authorization_code"| CL
  CL -->|"Token Request: code + code_verifier"| AS
  AS -->|"access_token · refresh_token · id_token"| CL
  CL -->|"Authorization: Bearer access_token"| RS`;

  const sequenceChart = `sequenceDiagram
  participant User as Resource Owner (ex.: you)
  participant Client as Client public (ex.: Canva / Notion)
  participant AS as AS (ex.: Google / GitHub)
  participant RS as RS (ex.: Drive / GitHub API)
  User->>Client: Start login
  Note over Client: Generate code_verifier<br/>code_challenge = BASE64URL SHA256 verifier
  Client->>AS: GET /authorize + PKCE
  AS->>User: Simulated login / consent
  User->>AS: Authorize application
  AS->>Client: 302 redirect_uri?code=...
  Client->>AS: POST /token code + code_verifier
  AS->>AS: Verify PKCE, mark code used once
  AS->>Client: access_token, refresh_token, id_token
  Client->>RS: GET /api/profile Bearer access_token
  RS->>Client: 200 profile`;

  const pkceChart = `flowchart LR
  A["1. code_verifier"] --> B["2. code_challenge S256"]
  B --> C["3. /authorize"]
  C --> D["4. authorization_code"]
  D --> E["5. /token + verifier"]
  E --> F["6. AS verifies"]
  F --> G{"Match?"}
  G -->|yes| H["7. ACCEPTED tokens"]
  G -->|no| I["8. REJECTED PKCE"]`;

  const conceptsChart = `flowchart TB
  subgraph oauth["OAuth 2.0"]
    ART[authorization_code]
    AT[access_token]
    RT[refresh_token]
    CID[client_id]
    RURI[redirect_uri]
    SC[scope]
  end
  subgraph oidc["OpenID Connect"]
    IDT[id_token]
    OP[openid scope]
  end
  subgraph pkce["PKCE"]
    CV[code_verifier]
    CC[code_challenge S256]
  end
  subgraph clients["Client types"]
    PUB["Public Client<br/>PKCE · no secret in browser<br/><i>ex.: SPA, mobile app</i>"]
    CONF["Confidential Client<br/>client_secret on server only<br/><i>ex.: backend API, Next.js server</i>"]
  end
  OP --> IDT
  CV --> CC
  ART --> AT
  ART --> RT
  ART --> IDT`;

  const singleUseChart = `flowchart LR
  C1["code issued"] --> C2["first /token"]
  C2 --> C3["marked used"]
  C3 --> C4["second use"]
  C4 --> C5["REJECTED already used"]`;

  const redirectChart = `flowchart LR
  R1["redirect_uri in request"] --> R2{"Exact match?"}
  R2 -->|yes| R3["ACCEPTED"]
  R2 -->|no| R4["REJECTED mismatch"]`;

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1 overflow-y-auto">
        <article className="arch-page mx-auto px-3 py-4 text-left">
          <p className="text-[11px] font-medium text-[var(--text-muted)]">
            {t.common.architecture}
          </p>
          <h1 className="text-[22px] font-semibold text-[var(--text)]">
            {p.title}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {p.subtitle}
          </p>
          <div className="banner mt-3">{p.notice}</div>

          <section className="mt-5">
            <h2>{p.rolesTitle}</h2>
            <p className="mb-3 text-[13px] text-[var(--text-secondary)]">
              {p.rolesOidc}
            </p>
            <InteractiveRoles hotspots={hotspots} hint={p.hoverHint} />
          </section>

          <section className="mt-6">
            <h2>{p.rolesTitle} — Mermaid</h2>
            <div className="arch-mmd-wrap panel panel-pad">
              <MermaidDiagram chart={rolesChart} />
            </div>
          </section>

          <section className="mt-6">
            <h2>{p.flowTitle}</h2>
            <p className="mb-2 text-[12px] text-[var(--text-muted)]">
              {p.flowExamples}
            </p>
            <div className="arch-mmd-wrap panel panel-pad">
              <MermaidDiagram chart={sequenceChart} />
            </div>
          </section>

          <section className="mt-6">
            <h2>{p.pkceTitle}</h2>
            <div className="arch-mmd-wrap panel panel-pad">
              <MermaidDiagram chart={pkceChart} />
            </div>
          </section>

          <section className="mt-6">
            <h2>{p.artifactsTitle}</h2>
            <div className="arch-mmd-wrap panel panel-pad">
              <MermaidDiagram chart={conceptsChart} />
            </div>
          </section>

          <section className="mt-6 grid gap-3 md:grid-cols-2">
            <div>
              <h2>{p.singleUseTitle}</h2>
              <div className="arch-mmd-wrap panel panel-pad mt-2">
                <MermaidDiagram chart={singleUseChart} />
              </div>
            </div>
            <div>
              <h2>{p.redirectTitle}</h2>
              <div className="arch-mmd-wrap panel panel-pad mt-2">
                <MermaidDiagram chart={redirectChart} />
              </div>
            </div>
          </section>

          <section className="mt-6 mb-8">
            <h2>{p.clientsTitle}</h2>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div className="panel panel-pad text-[13px] text-[var(--text-secondary)]">
                {p.publicClient}
              </div>
              <div className="panel panel-pad text-[13px] text-[var(--text-secondary)]">
                {p.confidentialClient}
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[var(--text-muted)]">
              {p.fileHint}
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
