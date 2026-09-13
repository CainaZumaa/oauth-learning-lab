import { NextRequest, NextResponse } from "next/server";
import {
  handleAuthorizationCodeGrant,
  handleRefreshTokenGrant,
  recordExchange,
} from "@/lib/oauth";
import { pushEvent } from "@/lib/store";

async function parseBody(req: NextRequest): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await req.json();
  }
  const form = await req.formData();
  const body: Record<string, string> = {};
  form.forEach((v, k) => {
    body[k] = String(v);
  });
  return body;
}

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  const grant_type = body.grant_type;

  if (grant_type === "authorization_code") {
    const omitVerifier =
      body.__omit_code_verifier === "1" ||
      body.__omit_code_verifier === "true";

    const result = await handleAuthorizationCodeGrant({
      grant_type,
      code: body.code,
      redirect_uri: body.redirect_uri,
      client_id: body.client_id,
      code_verifier: omitVerifier ? null : body.code_verifier ?? null,
    });

    const inspectorBody = { ...body };
    if (omitVerifier) delete inspectorBody.code_verifier;
    delete inspectorBody.__omit_code_verifier;

    if (!result.ok) {
      const resBody = {
        error: result.error.error,
        error_description: result.error.error_description,
      };
      recordExchange(
        "POST /api/token",
        { method: "POST", url: "/api/token", body: inspectorBody },
        { status: result.error.status, body: resBody }
      );
      return NextResponse.json(resBody, { status: result.error.status });
    }

    recordExchange(
      "POST /api/token",
      { method: "POST", url: "/api/token", body: inspectorBody },
      { status: 200, body: result.tokens }
    );
    return NextResponse.json(result.tokens);
  }

  if (grant_type === "refresh_token") {
    const result = await handleRefreshTokenGrant({
      refresh_token: body.refresh_token,
      client_id: body.client_id,
      scope: body.scope,
    });

    if (!result.ok) {
      const resBody = {
        error: result.error.error,
        error_description: result.error.error_description,
      };
      recordExchange(
        "POST /api/token (refresh)",
        { method: "POST", url: "/api/token", body },
        { status: result.error.status, body: resBody }
      );
      return NextResponse.json(resBody, { status: result.error.status });
    }

    recordExchange(
      "POST /api/token (refresh)",
      { method: "POST", url: "/api/token", body },
      { status: 200, body: result.tokens }
    );
    return NextResponse.json(result.tokens);
  }

  pushEvent("SECURITY", "REJECTED", "unsupported grant_type", {
    grant_type: grant_type ?? null,
  });
  const resBody = {
    error: "unsupported_grant_type",
    error_description: "Supported: authorization_code, refresh_token",
  };
  recordExchange(
    "POST /api/token",
    { method: "POST", url: "/api/token", body },
    { status: 400, body: resBody }
  );
  return NextResponse.json(resBody, { status: 400 });
}
