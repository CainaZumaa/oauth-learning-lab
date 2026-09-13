import type { LabEvent } from "./types";

export type EdgeId =
  | "user-client"
  | "client-as"
  | "as-client"
  | "client-token"
  | "client-rs";

export type EdgeTone = "idle" | "active" | "ok" | "err";

export type ArchitectureMapState = {
  edges: Record<EdgeId, EdgeTone>;
  stepKey:
    | "idle"
    | "authorize"
    | "code"
    | "token"
    | "tokens_ok"
    | "api"
    | "rejected";
  lastStatus: "idle" | "ok" | "err";
};

const EDGE_IDS: EdgeId[] = [
  "user-client",
  "client-as",
  "as-client",
  "client-token",
  "client-rs",
];

function blank(): ArchitectureMapState {
  return {
    edges: {
      "user-client": "idle",
      "client-as": "idle",
      "as-client": "idle",
      "client-token": "idle",
      "client-rs": "idle",
    },
    stepKey: "idle",
    lastStatus: "idle",
  };
}

/** Derive a live architecture map from recent lab events (newest first). */
export function deriveArchitectureMap(events: LabEvent[]): ArchitectureMapState {
  const state = blank();
  if (!events.length) return state;

  // Soft baseline: user always talks to client when anything happened
  state.edges["user-client"] = "ok";

  const recent = events.slice(0, 40);

  for (const e of [...recent].reverse()) {
    const title = e.title.toLowerCase();
    const cat = e.category;
    const st = e.status;

    if (cat === "AUTH" && title.includes("authorization request")) {
      state.edges["client-as"] = "active";
      state.stepKey = "authorize";
      state.lastStatus = "idle";
    }

    if (cat === "AUTH" && (title.includes("code issued") || title.includes("authorization code issued"))) {
      state.edges["client-as"] = "ok";
      state.edges["as-client"] = "ok";
      state.stepKey = "code";
      state.lastStatus = "ok";
    }

    if (cat === "TOKEN" && title.includes("token request")) {
      state.edges["client-token"] = "active";
      state.stepKey = "token";
      state.lastStatus = "idle";
    }

    if (cat === "TOKEN" && (title.includes("token issued") || title.includes("access token issued"))) {
      state.edges["client-token"] = "ok";
      state.edges["as-client"] = "ok";
      state.stepKey = "tokens_ok";
      state.lastStatus = "ok";
    }

    if (cat === "TOKEN" && title.includes("refresh")) {
      state.edges["client-token"] = st === "REJECTED" ? "err" : st === "ACCEPTED" ? "ok" : "active";
      state.stepKey = st === "REJECTED" ? "rejected" : "token";
      state.lastStatus = st === "REJECTED" ? "err" : st === "ACCEPTED" ? "ok" : "idle";
    }

    if (cat === "RS") {
      state.edges["client-rs"] = st === "REJECTED" ? "err" : st === "ACCEPTED" ? "ok" : "active";
      state.stepKey = "api";
      state.lastStatus = st === "REJECTED" ? "err" : st === "ACCEPTED" ? "ok" : "idle";
    }

    if (st === "REJECTED" || cat === "SECURITY") {
      state.lastStatus = "err";
      state.stepKey = "rejected";
      if (title.includes("redirect_uri") || title.includes("client_id") || title.includes("client mismatch")) {
        state.edges["client-as"] = "err";
      } else if (
        title.includes("pkce") ||
        title.includes("authorization code") ||
        title.includes("refresh") ||
        title.includes("token")
      ) {
        state.edges["client-token"] = "err";
      } else if (title.includes("access_token") || cat === "RS") {
        state.edges["client-rs"] = "err";
      } else {
        // generic rejection during auth/token path
        if (state.edges["client-token"] === "active") state.edges["client-token"] = "err";
        else if (state.edges["client-as"] === "active") state.edges["client-as"] = "err";
        else state.edges["client-as"] = "err";
      }
    }
  }

  // Ensure we never leave dangling "active" forever if a later event settled
  const newest = events[0];
  if (newest && Date.now() - new Date(newest.timestamp).getTime() > 8000) {
    for (const id of EDGE_IDS) {
      if (state.edges[id] === "active") {
        state.edges[id] = state.lastStatus === "err" ? "err" : "ok";
      }
    }
  }

  return state;
}
