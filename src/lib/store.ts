import type {
  AccessTokenRecord,
  AuthorizationCodeRecord,
  FlowSnapshot,
  InspectorEntry,
  LabEvent,
  LogCategory,
  LogStatus,
  RefreshTokenRecord,
} from "./types";

interface LabStore {
  authorizationCodes: Map<string, AuthorizationCodeRecord>;
  accessTokens: Map<string, AccessTokenRecord>;
  refreshTokens: Map<string, RefreshTokenRecord>;
  events: LabEvent[];
  inspector: InspectorEntry[];
  flow: FlowSnapshot;
  lastApiResult: {
    status: number;
    body: unknown;
    at: string;
  } | null;
}

const globalForStore = globalThis as unknown as { __oauthLabStore?: LabStore };

function createInitialFlow(): FlowSnapshot {
  return {
    client_id: "lab-client",
    redirect_uri: "http://localhost:3000/callback",
    response_type: "code",
    scope: "openid profile email offline_access",
    code_challenge: null,
    code_verifier: null,
    authorization_code: null,
    access_token: null,
    refresh_token: null,
    id_token: null,
  };
}

function createStore(): LabStore {
  return {
    authorizationCodes: new Map(),
    accessTokens: new Map(),
    refreshTokens: new Map(),
    events: [],
    inspector: [],
    flow: createInitialFlow(),
    lastApiResult: null,
  };
}

export function getStore(): LabStore {
  if (!globalForStore.__oauthLabStore) {
    globalForStore.__oauthLabStore = createStore();
  }
  return globalForStore.__oauthLabStore;
}

export function resetStore(): void {
  globalForStore.__oauthLabStore = createStore();
}

export function clearObservability(): void {
  const store = getStore();
  store.events = [];
  store.inspector = [];
}

export function updateFlow(partial: Partial<FlowSnapshot>): FlowSnapshot {
  const store = getStore();
  store.flow = { ...store.flow, ...partial };
  return store.flow;
}

export function pushEvent(
  category: LogCategory,
  status: LogStatus,
  title: string,
  details?: LabEvent["details"],
  message?: string
): LabEvent {
  const store = getStore();
  const event: LabEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    category,
    status,
    title,
    details,
    message,
  };
  store.events.unshift(event);
  if (store.events.length > 300) store.events.length = 300;

  const prefix = `[${category}]`;
  const detailStr = details
    ? " " +
      Object.entries(details)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(" ")
    : "";
  const line = `${prefix} ${title}${message ? ` — ${message}` : ""}${detailStr}`;

  if (status === "REJECTED") {
    console.log(`\x1b[31m${line}\x1b[0m`);
    console.log(`\x1b[31m[SECURITY] REQUEST REJECTED\x1b[0m`);
  } else if (status === "ACCEPTED") {
    console.log(`\x1b[32m${line}\x1b[0m`);
  } else if (status === "WARNING") {
    console.log(`\x1b[33m${line}\x1b[0m`);
  } else {
    console.log(line);
  }

  return event;
}

export function pushInspector(entry: Omit<InspectorEntry, "id" | "timestamp">): InspectorEntry {
  const store = getStore();
  const full: InspectorEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  store.inspector.unshift(full);
  if (store.inspector.length > 100) store.inspector.length = 100;
  return full;
}

export function getLabState() {
  const store = getStore();
  return {
    flow: store.flow,
    events: store.events,
    inspector: store.inspector,
    lastApiResult: store.lastApiResult,
    counts: {
      codes: store.authorizationCodes.size,
      accessTokens: store.accessTokens.size,
      refreshTokens: store.refreshTokens.size,
    },
  };
}
