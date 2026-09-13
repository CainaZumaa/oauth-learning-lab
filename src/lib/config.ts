export const LAB_CONFIG = {
  baseUrl: "http://localhost:3000",
  registeredClient: {
    client_id: "lab-client",
    client_type: "public" as const,
    redirect_uris: ["http://localhost:3000/callback"] as string[],
    // Educational only: confidential clients would keep this server-side.
    // This lab client is PUBLIC and uses PKCE instead of client_secret.
    client_secret: "lab-confidential-secret-DO-NOT-USE-IN-PRODUCTION",
    allowed_scopes: ["openid", "profile", "email", "offline_access"] as string[],
  },
  user: {
    email: "alice@example.local",
    name: "Alice Example",
    sub: "alice-001",
  },
  ttl: {
    authorizationCodeSeconds: 30,
    accessTokenSeconds: 60,
    refreshTokenSeconds: 3600,
    idTokenSeconds: 3600,
  },
  jwtSecret: "oauth-learning-lab-educational-secret-only",
};

export type Scope = "openid" | "profile" | "email" | "offline_access";

export const SCOPE_DESCRIPTIONS: Record<Scope, string> = {
  openid: "OIDC identity scope — enables ID Token issuance",
  profile: "Basic profile information (name)",
  email: "Access to the user email claim",
  offline_access:
    "Authorization for offline/refresh access — when granted, a refresh_token may be issued (implementation-dependent)",
};
