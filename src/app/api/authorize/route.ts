import { NextRequest, NextResponse } from "next/server";
import {
  issueAuthorizationCode,
  recordExchange,
  validateAuthorizeParams,
} from "@/lib/oauth";
import { pushEvent } from "@/lib/store";

/**
 * GET /api/authorize
 * Validates OAuth authorize params. For the interactive IdP UI, the browser
 * lands on /authorize (page). This API is used for validation + Security Lab
 * and for approve (via POST).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = {
    client_id: url.searchParams.get("client_id"),
    redirect_uri: url.searchParams.get("redirect_uri"),
    response_type: url.searchParams.get("response_type"),
    scope: url.searchParams.get("scope"),
    code_challenge: url.searchParams.get("code_challenge"),
    code_challenge_method: url.searchParams.get("code_challenge_method"),
    state: url.searchParams.get("state"),
  };

  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    query[k] = v;
  });

  const error = validateAuthorizeParams(params);

  if (error) {
    const body = {
      error: error.error,
      error_description: error.error_description,
    };
    recordExchange(
      "GET /api/authorize",
      {
        method: "GET",
        url: "/api/authorize",
        query,
        headers: { accept: "application/json" },
      },
      { status: error.status, statusText: "Bad Request", body }
    );
    return NextResponse.json(body, { status: error.status });
  }

  // If approve=1, issue code and redirect (programmatic / security-lab helper)
  if (url.searchParams.get("approve") === "1") {
    const record = issueAuthorizationCode({
      client_id: params.client_id!,
      redirect_uri: params.redirect_uri!,
      code_challenge: params.code_challenge!,
      scope: params.scope ?? "openid profile",
      ttlSeconds: url.searchParams.get("ttl")
        ? Number(url.searchParams.get("ttl"))
        : undefined,
    });

    const location = new URL(params.redirect_uri!);
    location.searchParams.set("code", record.code);
    if (params.state) location.searchParams.set("state", params.state);

    recordExchange(
      "GET /api/authorize (approve)",
      {
        method: "GET",
        url: "/api/authorize",
        query,
      },
      {
        status: 302,
        statusText: "Redirect",
        headers: { Location: location.toString() },
        body: { note: "302 redirect with authorization_code" },
      }
    );

    return NextResponse.redirect(location.toString());
  }

  // Validation-only success → tell client to show IdP consent UI
  const body = {
    ok: true,
    message: "Authorization request validated. Proceed to consent UI.",
    next: `/authorize?${url.searchParams.toString()}`,
  };
  recordExchange(
    "GET /api/authorize (validate)",
    { method: "GET", url: "/api/authorize", query },
    { status: 200, body }
  );
  return NextResponse.json(body);
}

/**
 * POST /api/authorize — consent approval (from IdP login page)
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string> = {};
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = await req.json();
  } else {
    const form = await req.formData();
    form.forEach((v, k) => {
      body[k] = String(v);
    });
  }

  const params = {
    client_id: body.client_id,
    redirect_uri: body.redirect_uri,
    response_type: body.response_type ?? "code",
    scope: body.scope,
    code_challenge: body.code_challenge,
    code_challenge_method: body.code_challenge_method ?? "S256",
  };

  const error = validateAuthorizeParams(params);
  if (error) {
    const resBody = {
      error: error.error,
      error_description: error.error_description,
    };
    recordExchange(
      "POST /api/authorize",
      { method: "POST", url: "/api/authorize", body },
      { status: error.status, body: resBody }
    );
    return NextResponse.json(resBody, { status: error.status });
  }

  pushEvent("AUTH", "INFO", "Resource Owner authorized the client (simulated login)");

  const record = issueAuthorizationCode({
    client_id: params.client_id!,
    redirect_uri: params.redirect_uri!,
    code_challenge: params.code_challenge!,
    scope: params.scope ?? "openid profile",
    ttlSeconds: body.ttl ? Number(body.ttl) : undefined,
  });

  const location = new URL(params.redirect_uri!);
  location.searchParams.set("code", record.code);
  if (body.state) location.searchParams.set("state", body.state);

  const resBody = {
    redirect_to: location.toString(),
    code: record.code,
  };

  recordExchange(
    "POST /api/authorize (consent)",
    { method: "POST", url: "/api/authorize", body },
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: resBody,
    }
  );

  return NextResponse.json(resBody);
}
