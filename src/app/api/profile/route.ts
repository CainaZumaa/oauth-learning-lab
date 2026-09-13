import { NextRequest, NextResponse } from "next/server";
import { LAB_CONFIG } from "@/lib/config";
import { recordExchange } from "@/lib/oauth";
import { getStore, pushEvent } from "@/lib/store";
import { verifyAccessToken } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];

  const requestMeta = {
    method: "GET",
    url: "/api/profile",
    headers: { Authorization: token ? `Bearer ${token.slice(0, 20)}...` : "(missing)" },
  };

  if (!token) {
    pushEvent("RS", "REJECTED", "missing Bearer token");
    const body = { error: "unauthorized", error_description: "Bearer access_token required" };
    recordExchange("GET /api/profile", requestMeta, { status: 401, body });
    return NextResponse.json(body, { status: 401 });
  }

  const store = getStore();
  const record = store.accessTokens.get(token);

  if (record?.revoked || (record && Date.now() > record.expiresAt)) {
    pushEvent("RS", "REJECTED", "access_token expired", {
      reason: "access_token expired",
    });
    const body = {
      error: "unauthorized",
      error_description: "access_token expired",
    };
    recordExchange("GET /api/profile", requestMeta, { status: 401, body });
    store.lastApiResult = {
      status: 401,
      body,
      at: new Date().toISOString(),
    };
    return NextResponse.json(body, { status: 401 });
  }

  const verified = await verifyAccessToken(token);
  if (!verified.ok) {
    pushEvent("RS", "REJECTED", "access_token invalid", {
      reason: verified.reason,
    });
    const body = {
      error: "unauthorized",
      error_description: verified.reason,
    };
    recordExchange("GET /api/profile", requestMeta, { status: 401, body });
    store.lastApiResult = {
      status: 401,
      body,
      at: new Date().toISOString(),
    };
    return NextResponse.json(body, { status: 401 });
  }

  if (record && record.client_id !== verified.payload.client_id) {
    pushEvent("RS", "REJECTED", "token context mismatch");
    const body = {
      error: "unauthorized",
      error_description: "token associated with different client/context",
    };
    recordExchange("GET /api/profile", requestMeta, { status: 401, body });
    return NextResponse.json(body, { status: 401 });
  }

  pushEvent("RS", "ACCEPTED", "Protected resource accessed", {
    user: LAB_CONFIG.user.email,
    scope: verified.payload.scope ?? null,
  });

  const body = {
    user: LAB_CONFIG.user.email,
    name: LAB_CONFIG.user.name,
    sub: LAB_CONFIG.user.sub,
    scope: verified.payload.scope,
    message: "Protected resource accessed successfully",
  };

  recordExchange("GET /api/profile", requestMeta, { status: 200, body });
  store.lastApiResult = {
    status: 200,
    body,
    at: new Date().toISOString(),
  };
  return NextResponse.json(body);
}
