import { NextRequest, NextResponse } from "next/server";
import { getStore, pushEvent } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.refresh_token as string | undefined;
  if (!token) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "refresh_token required" },
      { status: 400 }
    );
  }

  const store = getStore();
  const record = store.refreshTokens.get(token);
  if (!record) {
    pushEvent("TOKEN", "REJECTED", "revoke failed: refresh_token not found");
    return NextResponse.json(
      { error: "invalid_grant", error_description: "refresh_token not found" },
      { status: 400 }
    );
  }

  record.revoked = true;
  pushEvent("TOKEN", "ACCEPTED", "refresh_token revoked", {
    refresh_token: `${token.slice(0, 12)}...`,
  });
  return NextResponse.json({ revoked: true });
}
