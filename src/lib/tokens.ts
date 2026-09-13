import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { LAB_CONFIG } from "./config";
import { randomToken } from "./pkce";

const secret = new TextEncoder().encode(LAB_CONFIG.jwtSecret);

export interface AccessClaims extends JWTPayload {
  typ: "access";
  sub: string;
  client_id: string;
  scope: string;
}

export interface IdClaims extends JWTPayload {
  typ: "id";
  sub: string;
  email?: string;
  name?: string;
  client_id: string;
}

export async function issueAccessToken(params: {
  sub: string;
  client_id: string;
  scopes: string[];
  expiresInSeconds?: number;
}): Promise<{ token: string; jti: string; expiresAt: number }> {
  const jti = randomToken(16);
  const expiresIn =
    params.expiresInSeconds ?? LAB_CONFIG.ttl.accessTokenSeconds;
  const expiresAt = Date.now() + expiresIn * 1000;

  const token = await new SignJWT({
    typ: "access",
    sub: params.sub,
    client_id: params.client_id,
    scope: params.scopes.join(" "),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .setJti(jti)
    .setIssuer(LAB_CONFIG.baseUrl)
    .setAudience(params.client_id)
    .sign(secret);

  return { token, jti, expiresAt };
}

export async function issueIdToken(params: {
  sub: string;
  client_id: string;
  email?: string;
  name?: string;
  scopes: string[];
}): Promise<string> {
  const expiresIn = LAB_CONFIG.ttl.idTokenSeconds;
  const payload: Record<string, unknown> = {
    typ: "id",
    sub: params.sub,
    client_id: params.client_id,
  };
  if (params.scopes.includes("email") && params.email) {
    payload.email = params.email;
  }
  if (params.scopes.includes("profile") && params.name) {
    payload.name = params.name;
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .setIssuer(LAB_CONFIG.baseUrl)
    .setAudience(params.client_id)
    .sign(secret);
}

export async function verifyAccessToken(
  token: string
): Promise<{ ok: true; payload: AccessClaims } | { ok: false; reason: string }> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: LAB_CONFIG.baseUrl,
    });
    if (payload.typ !== "access") {
      return { ok: false, reason: "not an access token" };
    }
    return { ok: true, payload: payload as AccessClaims };
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid token";
    if (message.toLowerCase().includes("exp")) {
      return { ok: false, reason: "access_token expired" };
    }
    return { ok: false, reason: message };
  }
}

export function issueRefreshTokenValue(): string {
  return `rt_${randomToken(32)}`;
}
