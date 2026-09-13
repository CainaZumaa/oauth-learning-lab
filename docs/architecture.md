# Architecture — OAuth 2.0 / OIDC Learning Lab

Educational diagram of the local lab. All entities run inside one Next.js app on `localhost:3000`, but are conceptually separated.

> This is a **local educational lab**. Login is simulated (no real password). JWTs use a lab secret. Do not use in production.

---

## Four OAuth 2.0 roles (+ OIDC)

```mermaid
flowchart TB
  subgraph roles [OAuth 2.0 Roles]
    RO[Resource Owner<br/>User: alice@example.local]
    CL[Client<br/>Public Client + PKCE<br/>Web UI /callback]
    AS[Authorization Server<br/>Identity Provider<br/>/authorize · /api/authorize · /api/token]
    RS[Resource Server<br/>Protected API<br/>GET /api/profile]
  end

  RO -->|"authenticates / consents"| AS
  CL -->|"Authorization Request + code_challenge"| AS
  AS -->|"redirect_uri?code=authorization_code"| CL
  CL -->|"Token Request: code + code_verifier"| AS
  AS -->|"access_token · refresh_token · id_token"| CL
  CL -->|"Authorization: Bearer access_token"| RS
```

**OpenID Connect (OIDC)** sits on top of OAuth 2.0: when `scope` includes `openid`, the Authorization Server also issues an **id_token** (identity). The **access_token** remains the credential for calling the Resource Server.

---

## Authorization Code Flow (happy path)

```mermaid
sequenceDiagram
  participant User as Resource Owner
  participant Client as Client public
  participant AS as Authorization Server
  participant RS as Resource Server

  User->>Client: Start login
  Note over Client: Generate code_verifier<br/>code_challenge = BASE64URL SHA256 verifier
  Client->>AS: GET /authorize<br/>client_id, redirect_uri, response_type=code,<br/>scope, code_challenge, S256
  AS->>User: Simulated login / consent
  User->>AS: Authorize application
  AS->>Client: 302 redirect_uri?code=authorization_code
  Client->>AS: POST /token<br/>grant_type=authorization_code<br/>code, redirect_uri, client_id, code_verifier
  AS->>AS: Verify PKCE, mark code used once
  AS->>Client: access_token, refresh_token, id_token
  Client->>RS: GET /api/profile Bearer access_token
  RS->>Client: 200 profile
```

---

## PKCE step by step

```mermaid
flowchart LR
  A[1. Client generates code_verifier] --> B[2. Client computes code_challenge]
  B --> C[3. Client sends code_challenge to /authorize]
  C --> D[4. AS issues authorization_code]
  D --> E[5. Client sends code + code_verifier to /token]
  E --> F[6. AS recomputes challenge]
  F --> G{Match?}
  G -->|yes| H[7. ACCEPTED · issue tokens]
  G -->|no| I[8. REJECTED · PKCE validation failed]
```

---

## Concepts map

```mermaid
flowchart TB
  subgraph oauth [OAuth 2.0]
    ART[authorization_code]
    AT[access_token]
    RT[refresh_token]
    CID[client_id]
    RURI[redirect_uri]
    SC[scope]
  end

  subgraph oidc [OpenID Connect]
    IDT[id_token]
    OP[openid scope]
  end

  subgraph pkce [PKCE]
    CV[code_verifier]
    CC[code_challenge S256]
  end

  subgraph clients [Client types]
    PUB[Public Client<br/>no client_secret in browser · uses PKCE]
    CONF[Confidential Client<br/>client_secret only on server]
  end

  OP --> IDT
  CV --> CC
  ART --> AT
  ART --> RT
  ART --> IDT
```

### authorization_code — single use

```mermaid
flowchart LR
  C1[authorization_code issued] --> C2[first /token exchange]
  C2 --> C3[marked used]
  C3 --> C4[second use]
  C4 --> C5[REJECTED already used]
```

### redirect_uri — exact match

```mermaid
flowchart LR
  R1[redirect_uri in request] --> R2{Exactly equals registered URI?}
  R2 -->|yes| R3[ACCEPTED]
  R2 -->|no| R4[REJECTED URI mismatch]
```

### Public vs Confidential Client

| Type | Secret | This lab |
|------|--------|----------|
| **Public Client** | Must NOT ship `client_secret` in the browser | **lab-client** uses **PKCE** |
| **Confidential Client** | Keeps `client_secret` on a trusted server | Secret exists in config **only for teaching**; not used by the browser flow |

---

## Where security controls live

| Control | What it enforces | Implementation |
|---------|------------------|----------------|
| redirect_uri validation | Exact match to registered URI | [`src/lib/oauth.ts`](../src/lib/oauth.ts) `validateAuthorizeParams` |
| PKCE validation | `SHA256(code_verifier)` == stored challenge | [`src/lib/oauth.ts`](../src/lib/oauth.ts) + [`src/lib/pkce.ts`](../src/lib/pkce.ts) |
| authorization code single-use | Second exchange rejected | `record.used` in store |
| token expiration | Short-lived access / code TTLs | [`src/lib/config.ts`](../src/lib/config.ts) + checks in oauth/profile |
| refresh token handling | Rotation + reuse detection | `handleRefreshTokenGrant` |
| scope validation | Allowed scopes; offline_access → refresh | authorize + mintTokensFor |
| client validation | Known `client_id`; code binding | authorize + token grants |

---

## Lab components (same process)

| Logical role | Routes / UI |
|--------------|-------------|
| Client | `/`, `/callback` |
| Authorization Server / IdP | `/authorize`, `/api/authorize`, `/api/token` |
| Resource Server | `/api/profile` |
| Observability | Event Log, Request Inspector, terminal `[AUTH]` / `[PKCE]` / `[TOKEN]` / `[SECURITY]` |
