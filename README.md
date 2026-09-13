# OAuth 2.0 / OIDC Learning Lab

Local **educational** lab to study OAuth 2.0, OpenID Connect, Authorization Code Flow, PKCE, and security controls by watching the protocol run and breaking it on purpose.

> **Not for production.** No Google, Microsoft, Auth0, or any external IdP. Simulated Identity Provider on `localhost`. Login with no real password. JWTs with a lab secret. State is **in memory** (cleared when you restart `npm run dev`).

Useful for study, workshop demos, or exploring classic OAuth threats (redirect URI, PKCE, code reuse, refresh rotation).

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Resource | Where |
|----------|-------|
| Interactive lab | `/` |
| How to use (UI) | `/docs` |
| Architecture (UI) | `/architecture` |
| Mermaid diagram | [`docs/architecture.md`](docs/architecture.md) |
| Language | Header dropdown EN / PT |
| Theme | Dark / light toggle |

## What this project does

One Next.js app (App Router + TypeScript), conceptually split into OAuth roles:

| OAuth role | In this lab |
|------------|-------------|
| **Resource Owner** | Alice (`alice@example.local`) |
| **Client** | UI at `/` + `/callback` (`lab-client`, **public** + PKCE) |
| **Authorization Server** | `/authorize`, `/api/authorize`, `/api/token` |
| **Resource Server** | `GET /api/profile` |

Happy path:

1. Client generates `code_verifier` / `code_challenge` (S256).
2. Browser opens the local IdP, simulated login, authorization code.
3. Redirect to `/callback?code=...`.
4. Client exchanges code + verifier via `POST /api/token`.
5. Receives `access_token`, `refresh_token` (if `offline_access`), and `id_token` (OIDC).
6. Calls the protected API with `Authorization: Bearer ...`.

In **Security Lab** mode, buttons deliberately alter the flow (`redirect_uri`, PKCE, code/refresh reuse, expiry, etc.) so you can see **REJECTED** vs **ACCEPTED** in the Event Log and Request Inspector.

## Concepts

### 1. OAuth 2.0

**Authorization** protocol: the Client gets limited permission (tokens) to access the Resource Owner's resources on the Resource Server via the Authorization Server, **without** receiving the user's password.

### 2. OpenID Connect (OIDC)

**Identity** layer on top of OAuth 2.0. With `scope=openid`, the AS issues an **id_token**. OAuth authorizes access; OIDC authenticates who the user is.

### 3. Authorization Code Flow

The browser redirects to `/authorize` (`response_type=code`). After consent, the AS returns a short-lived code on the `redirect_uri`. The Client exchanges the code at the token endpoint (back-channel / same origin in this lab).

### 4. PKCE

Protects **public clients** against authorization code interception.

1. Client generates a random `code_verifier`.
2. `code_challenge = BASE64URL(SHA256(code_verifier))`.
3. Challenge goes to `/authorize`; verifier only to `/token`.
4. AS recomputes. Mismatch means **PKCE validation failed**.

### 5. redirect_uri

Must **exactly match** the registered URI (`http://localhost:3000/callback`). Any other URI is rejected.

### 6. Public vs Confidential Client

- **Public** (this lab): no `client_secret` in the browser; uses PKCE.
- **Confidential**: a trusted backend may use `client_secret` (never in the frontend). The secret in config exists only to teach the concept.

### 7. Tokens

| Token | Role |
|-------|------|
| **Access Token** | Authorization for the API (~60s in this lab) |
| **Refresh Token** | Renews access when `offline_access` was granted; with **rotation**, the old one is invalidated |
| **ID Token** | OIDC identity. Do **not** send it as Bearer to the API |

### 8. Scopes

| Scope | In this lab |
|-------|-------------|
| `openid` | Issues `id_token` (locked in the UI so OIDC is always shown) |
| `profile` / `email` | Claims in the id_token |
| `offline_access` | Lab policy: allows issuing a `refresh_token` |

Access tokens expire on their own. Refresh is not a magic one-hour session; it depends on AS policy.

### 9. Security controls

| Test | Expected | Control |
|------|----------|---------|
| redirect_uri tampering | REJECTED | redirect_uri validation |
| authorization code reuse | REJECTED | single-use code |
| missing / wrong PKCE | REJECTED | PKCE S256 |
| tamper client_id | REJECTED | client validation |
| expired code | REJECTED | code expiration |
| expired access token | 401 | token expiration |
| refresh + rotation reuse | REJECTED | refresh rotation |

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS (custom CSS tokens, dense UI)
- `jose` for didactic JWTs (HS256)
- In-memory state (`src/lib/store.ts`)
- Lightweight i18n (`src/i18n`): EN / PT

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # serve build
npm run lint     # eslint
```

## Structure

```
src/app/              # pages + API routes
src/components/       # lab UI / dock / docs header
src/lib/              # oauth, pkce, tokens, store
src/i18n/             # EN/PT dictionaries
docs/architecture.md  # Mermaid diagrams
```

## Real vs simulated

| Piece | Status |
|-------|--------|
| Authorization Code + PKCE S256 | Real didactic protocol implementation |
| redirect / single-use / expiry / rotation checks | Real in the lab |
| Login / password | **Simulated** |
| JWT | **Didactic** (not a production IdP) |
| Microservices | **Same** Next.js process |

## Validated in this lab

- [x] Authorization Code Flow
- [x] OIDC
- [x] PKCE
- [x] redirect_uri validation
- [x] authorization code single-use
- [x] access token expiration
- [x] refresh token + rotation
- [x] scopes
- [x] protected resource
- [x] request/response inspector
- [x] security tests
- [x] terminal logging
- [x] i18n (EN/PT)
- [x] UI docs (`/docs`)

## License / usage

Educational material. Use, copy, and adapt for learning. **Do not** use it as production authentication.

Suggested GitHub topics: `oauth2`, `oidc`, `pkce`, `security`, `learning`, `nextjs`.
