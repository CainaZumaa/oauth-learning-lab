import { NextResponse } from "next/server";
import { getLabState } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getLabState());
}
