import { NextRequest, NextResponse } from "next/server";
import {
  forceExpireAccessToken,
  forceExpireAuthorizationCode,
} from "@/lib/oauth";
import {
  clearObservability,
  getStore,
  pushEvent,
  resetStore,
  updateFlow,
} from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const action = body.action as string;

  if (action === "reset") {
    resetStore();
    pushEvent("LAB", "INFO", "Lab state reset");
    return NextResponse.json({ ok: true });
  }

  if (action === "clear_logs") {
    clearObservability();
    return NextResponse.json({ ok: true });
  }

  if (action === "expire_code") {
    const code = (body.code as string) || getStore().flow.authorization_code;
    if (!code) {
      return NextResponse.json({ ok: false, error: "no code" }, { status: 400 });
    }
    const ok = forceExpireAuthorizationCode(code);
    return NextResponse.json({ ok });
  }

  if (action === "expire_access_token") {
    const token = (body.token as string) || getStore().flow.access_token;
    if (!token) {
      return NextResponse.json({ ok: false, error: "no token" }, { status: 400 });
    }
    const ok = forceExpireAccessToken(token);
    return NextResponse.json({ ok });
  }

  if (action === "update_flow") {
    updateFlow(body.flow ?? {});
    return NextResponse.json({ ok: true, flow: getStore().flow });
  }

  if (action === "set_code_used") {
    const code = body.code as string;
    const record = getStore().authorizationCodes.get(code);
    if (!record) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    record.used = true;
    pushEvent("LAB", "WARNING", "authorization code marked used (lab helper)", {
      code,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
