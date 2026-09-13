import { LAB_CONFIG } from "./config";
import { generateCodeChallenge, randomToken, verifyPkce } from "./pkce";
import {
  getStore,
  pushEvent,
  pushInspector,
  updateFlow,
} from "./store";
import {
  issueAccessToken,
  issueIdToken,
  issueRefreshTokenValue,
} from "./tokens";
import type { AuthorizationCodeRecord, RefreshTokenRecord } from "./types";

export type AuthError = {
  error: string;
  error_description: string;
  status: number;
};

function authError(
  error: string,
  error_description: string,
  status = 400
): AuthError {
  return { error, error_description, status };
}

export function validateAuthorizeParams(params: {
  client_id?: string | null;
  redirect_uri?: string | null;
  response_type?: string | null;
  scope?: string | null;
  code_challenge?: string | null;
  code_challenge_method?: string | null;
}): AuthError | null {
  const client = LAB_CONFIG.registeredClient;

  pushEvent("AUTH", "INFO", "Authorization request received", {
    client_id: params.client_id ?? null,
    redirect_uri: params.redirect_uri ?? null,
    response_type: params.response_type ?? null,
    scope: params.scope ?? null,
  });

  if (!params.client_id || params.client_id !== client.client_id) {
    pushEvent("SECURITY", "REJECTED", "client_id rejected", {
      received: params.client_id ?? null,
      expected: client.client_id,
    });
    return authError(
      "invalid_client",
      "client_id rejected: unknown or mismatched client_id"
    );
  }

  if (!params.redirect_uri) {
    pushEvent("SECURITY", "REJECTED", "redirect_uri missing");
    return authError("invalid_request", "redirect_uri is required");
  }

  if (!client.redirect_uris.includes(params.redirect_uri)) {
    pushEvent("SECURITY", "REJECTED", "redirect_uri mismatch", {
      received: params.redirect_uri,
      registered: client.redirect_uris[0],
    });
    return authError(
      "invalid_request",
      "redirect_uri rejected: URI does not exactly match registered redirect URI"
    );
  }

  pushEvent("AUTH", "ACCEPTED", "redirect_uri validated", {
    redirect_uri: params.redirect_uri,
  });

  if (params.response_type !== "code") {
    pushEvent("SECURITY", "REJECTED", "unsupported response_type", {
      response_type: params.response_type ?? null,
    });
    return authError(
      "unsupported_response_type",
      "Only response_type=code is supported (Authorization Code Flow)"
    );
  }

  if (!params.code_challenge) {
    pushEvent("SECURITY", "REJECTED", "PKCE code_challenge missing");
    return authError(
      "invalid_request",
      "PKCE required: code_challenge is missing"
    );
  }

  if (params.code_challenge_method && params.code_challenge_method !== "S256") {
    pushEvent("SECURITY", "REJECTED", "unsupported code_challenge_method", {
      method: params.code_challenge_method,
    });
    return authError(
      "invalid_request",
      "Only code_challenge_method=S256 is supported"
    );
  }

  pushEvent("PKCE", "INFO", "code_challenge received", {
    code_challenge: params.code_challenge,
    method: "S256",
  });

  const scopes = (params.scope ?? "").split(/\s+/).filter(Boolean);
  for (const s of scopes) {
    if (!client.allowed_scopes.includes(s)) {
      pushEvent("SECURITY", "REJECTED", "invalid scope", { scope: s });
      return authError("invalid_scope", `Unsupported scope: ${s}`);
    }
  }

  return null;
}

export function issueAuthorizationCode(params: {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  scope: string;
  ttlSeconds?: number;
}): AuthorizationCodeRecord {
  const store = getStore();
  const ttl =
    params.ttlSeconds ?? LAB_CONFIG.ttl.authorizationCodeSeconds;
  const now = Date.now();
  const record: AuthorizationCodeRecord = {
    code: randomToken(24),
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    code_challenge: params.code_challenge,
    code_challenge_method: "S256",
    scopes: params.scope.split(/\s+/).filter(Boolean),
    user_sub: LAB_CONFIG.user.sub,
    createdAt: now,
    expiresAt: now + ttl * 1000,
    used: false,
  };
  store.authorizationCodes.set(record.code, record);
  updateFlow({
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    response_type: "code",
    scope: params.scope,
    code_challenge: params.code_challenge,
    authorization_code: record.code,
  });
  pushEvent("AUTH", "ACCEPTED", "AUTHORIZATION CODE ISSUED", {
    code: record.code,
    expires_in: ttl,
    client_id: record.client_id,
  });
  return record;
}

export async function handleAuthorizationCodeGrant(body: {
  grant_type?: string;
  code?: string;
  redirect_uri?: string;
  client_id?: string;
  code_verifier?: string | null;
}): Promise<
  | { ok: true; tokens: Record<string, unknown> }
  | { ok: false; error: AuthError }
> {
  const store = getStore();

  pushEvent("TOKEN", "INFO", "Token request received", {
    grant_type: body.grant_type ?? null,
    code: body.code ?? null,
    client_id: body.client_id ?? null,
    has_code_verifier: Boolean(body.code_verifier),
  });

  if (!body.code) {
    pushEvent("SECURITY", "REJECTED", "authorization code missing");
    return {
      ok: false,
      error: authError("invalid_request", "code is required"),
    };
  }

  const record = store.authorizationCodes.get(body.code);
  if (!record) {
    pushEvent("SECURITY", "REJECTED", "unknown authorization code", {
      code: body.code,
    });
    return {
      ok: false,
      error: authError("invalid_grant", "authorization_code not found"),
    };
  }

  if (record.used) {
    pushEvent("SECURITY", "REJECTED", "authorization code reuse detected", {
      code: body.code,
    });
    return {
      ok: false,
      error: authError(
        "invalid_grant",
        "authorization_code already used"
      ),
    };
  }

  if (Date.now() > record.expiresAt) {
    pushEvent("SECURITY", "REJECTED", "authorization_code expired", {
      code: body.code,
      expired_at: new Date(record.expiresAt).toISOString(),
    });
    return {
      ok: false,
      error: authError("invalid_grant", "authorization_code expired"),
    };
  }

  if (body.client_id && body.client_id !== record.client_id) {
    pushEvent("SECURITY", "REJECTED", "client mismatch", {
      request_client_id: body.client_id,
      code_client_id: record.client_id,
    });
    return {
      ok: false,
      error: authError(
        "invalid_grant",
        "client_id does not match authorization code binding"
      ),
    };
  }

  if (!body.client_id) {
    pushEvent("SECURITY", "REJECTED", "client_id missing on token request");
    return {
      ok: false,
      error: authError("invalid_request", "client_id is required"),
    };
  }

  if (body.redirect_uri !== record.redirect_uri) {
    pushEvent("SECURITY", "REJECTED", "redirect_uri mismatch on token", {
      request: body.redirect_uri ?? null,
      bound: record.redirect_uri,
    });
    return {
      ok: false,
      error: authError(
        "invalid_grant",
        "redirect_uri rejected: URI does not exactly match registered redirect URI"
      ),
    };
  }

  // PKCE validation
  if (!body.code_verifier) {
    pushEvent("SECURITY", "REJECTED", "PKCE validation failed", {
      reason: "code_verifier missing",
    });
    return {
      ok: false,
      error: authError("invalid_grant", "PKCE validation failed"),
    };
  }

  const expected = record.code_challenge;
  const receivedChallenge = generateCodeChallenge(body.code_verifier);
  pushEvent("PKCE", "INFO", "PKCE VALIDATION", {
    expected,
    received: receivedChallenge,
  });

  if (!verifyPkce(body.code_verifier, record.code_challenge)) {
    pushEvent("SECURITY", "REJECTED", "PKCE validation failed", {
      expected,
      received: receivedChallenge,
    });
    return {
      ok: false,
      error: authError("invalid_grant", "PKCE validation failed"),
    };
  }

  pushEvent("PKCE", "ACCEPTED", "verifier validated");

  record.used = true;
  pushEvent("TOKEN", "INFO", "authorization code marked as used", {
    code: record.code,
  });

  updateFlow({ code_verifier: body.code_verifier });

  const tokens = await mintTokensFor(record.client_id, record.user_sub, record.scopes);
  return { ok: true, tokens };
}

export async function handleRefreshTokenGrant(body: {
  refresh_token?: string;
  client_id?: string;
  scope?: string;
}): Promise<
  | { ok: true; tokens: Record<string, unknown> }
  | { ok: false; error: AuthError }
> {
  const store = getStore();

  pushEvent("TOKEN", "INFO", "REFRESH TOKEN REQUEST", {
    client_id: body.client_id ?? null,
    refresh_token: body.refresh_token
      ? `${body.refresh_token.slice(0, 12)}...`
      : null,
  });

  if (!body.refresh_token) {
    return {
      ok: false,
      error: authError("invalid_request", "refresh_token is required"),
    };
  }

  const record = store.refreshTokens.get(body.refresh_token);
  if (!record) {
    pushEvent("SECURITY", "REJECTED", "refresh_token not found");
    return {
      ok: false,
      error: authError("invalid_grant", "refresh_token not found"),
    };
  }

  if (record.rotated || record.revoked) {
    pushEvent(
      "SECURITY",
      "REJECTED",
      "refresh_token already rotated/revoked",
      {
        familyId: record.familyId,
        rotated: record.rotated,
        revoked: record.revoked,
      }
    );
    // Didactic: revoke entire family on reuse detection
    for (const [, rt] of store.refreshTokens) {
      if (rt.familyId === record.familyId) {
        rt.revoked = true;
      }
    }
    return {
      ok: false,
      error: authError(
        "invalid_grant",
        "refresh_token already rotated/revoked"
      ),
    };
  }

  if (Date.now() > record.expiresAt) {
    pushEvent("SECURITY", "REJECTED", "refresh_token expired");
    return {
      ok: false,
      error: authError("invalid_grant", "refresh_token expired"),
    };
  }

  if (body.client_id && body.client_id !== record.client_id) {
    pushEvent("SECURITY", "REJECTED", "client mismatch on refresh", {
      request_client_id: body.client_id,
      token_client_id: record.client_id,
    });
    return {
      ok: false,
      error: authError("invalid_grant", "client mismatch"),
    };
  }

  pushEvent("TOKEN", "ACCEPTED", "REFRESH TOKEN VALIDATED");

  // Invalidate old access tokens for this client/user (didactic)
  for (const [, at] of store.accessTokens) {
    if (at.client_id === record.client_id && at.user_sub === record.user_sub) {
      at.revoked = true;
    }
  }
  pushEvent("TOKEN", "INFO", "OLD ACCESS TOKEN INVALIDATED/EXPIRED");

  // Rotate refresh token
  record.rotated = true;
  pushEvent("TOKEN", "INFO", "OLD REFRESH TOKEN INVALIDATED", {
    refresh_token: `${record.token.slice(0, 12)}...`,
  });

  const scopes = body.scope
    ? body.scope.split(/\s+/).filter(Boolean)
    : record.scopes;

  // offline_access: refresh only if originally granted (or still present)
  if (!record.scopes.includes("offline_access")) {
    pushEvent(
      "SECURITY",
      "REJECTED",
      "refresh denied: offline_access was not granted"
    );
    return {
      ok: false,
      error: authError(
        "invalid_grant",
        "refresh_token requires offline_access scope (this lab's policy)"
      ),
    };
  }

  const tokens = await mintTokensFor(
    record.client_id,
    record.user_sub,
    scopes,
    record.familyId
  );
  return { ok: true, tokens };
}

async function mintTokensFor(
  client_id: string,
  user_sub: string,
  scopes: string[],
  familyId?: string
): Promise<Record<string, unknown>> {
  const store = getStore();
  const access = await issueAccessToken({
    sub: user_sub,
    client_id,
    scopes,
  });

  store.accessTokens.set(access.token, {
    jti: access.jti,
    token: access.token,
    client_id,
    user_sub,
    scopes,
    createdAt: Date.now(),
    expiresAt: access.expiresAt,
    revoked: false,
  });
  pushEvent("TOKEN", "ACCEPTED", "access token issued", {
    expires_in: LAB_CONFIG.ttl.accessTokenSeconds,
  });

  let refresh_token: string | undefined;
  if (scopes.includes("offline_access")) {
    const rtValue = issueRefreshTokenValue();
    const rt: RefreshTokenRecord = {
      token: rtValue,
      client_id,
      user_sub,
      scopes,
      createdAt: Date.now(),
      expiresAt: Date.now() + LAB_CONFIG.ttl.refreshTokenSeconds * 1000,
      revoked: false,
      rotated: false,
      familyId: familyId ?? randomToken(12),
    };
    store.refreshTokens.set(rtValue, rt);
    refresh_token = rtValue;
    pushEvent("TOKEN", "ACCEPTED", "NEW REFRESH TOKEN ISSUED", {
      refresh_token: `${rtValue.slice(0, 12)}...`,
      familyId: rt.familyId,
    });
  } else {
    pushEvent(
      "TOKEN",
      "INFO",
      "No refresh_token issued (offline_access not in granted scopes)"
    );
  }

  let id_token: string | undefined;
  if (scopes.includes("openid")) {
    id_token = await issueIdToken({
      sub: user_sub,
      client_id,
      email: LAB_CONFIG.user.email,
      name: LAB_CONFIG.user.name,
      scopes,
    });
    pushEvent("TOKEN", "ACCEPTED", "id_token issued (OIDC)");
  }

  const response: Record<string, unknown> = {
    access_token: access.token,
    token_type: "Bearer",
    expires_in: LAB_CONFIG.ttl.accessTokenSeconds,
    scope: scopes.join(" "),
  };
  if (refresh_token) response.refresh_token = refresh_token;
  if (id_token) response.id_token = id_token;

  updateFlow({
    access_token: access.token,
    refresh_token: refresh_token ?? null,
    id_token: id_token ?? null,
  });

  pushEvent("TOKEN", "ACCEPTED", "TOKEN ISSUED", {
    has_access_token: true,
    has_refresh_token: Boolean(refresh_token),
    has_id_token: Boolean(id_token),
  });

  return response;
}

export function forceExpireAuthorizationCode(code: string): boolean {
  const store = getStore();
  const record = store.authorizationCodes.get(code);
  if (!record) return false;
  record.expiresAt = Date.now() - 1000;
  pushEvent("LAB", "WARNING", "authorization code force-expired", { code });
  return true;
}

export function forceExpireAccessToken(token: string): boolean {
  const store = getStore();
  const record = store.accessTokens.get(token);
  if (!record) return false;
  record.expiresAt = Date.now() - 1000;
  record.revoked = true;
  pushEvent("LAB", "WARNING", "access token force-expired", {
    token: `${token.slice(0, 16)}...`,
  });
  return true;
}

export function recordExchange(
  label: string,
  request: {
    method: string;
    url: string;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    body?: unknown;
  },
  response: {
    status: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }
) {
  pushInspector({ label, request, response });
}
