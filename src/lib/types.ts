export type LogStatus = "ACCEPTED" | "REJECTED" | "WARNING" | "INFO";

export type LogCategory = "AUTH" | "PKCE" | "TOKEN" | "SECURITY" | "RS" | "LAB";

export interface LabEvent {
  id: string;
  timestamp: string;
  category: LogCategory;
  status: LogStatus;
  title: string;
  details?: Record<string, string | number | boolean | null | undefined>;
  message?: string;
}

export interface InspectorEntry {
  id: string;
  timestamp: string;
  label: string;
  request: {
    method: string;
    url: string;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response: {
    status: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
}

export interface AuthorizationCodeRecord {
  code: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: "S256";
  scopes: string[];
  user_sub: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export interface AccessTokenRecord {
  jti: string;
  token: string;
  client_id: string;
  user_sub: string;
  scopes: string[];
  createdAt: number;
  expiresAt: number;
  revoked: boolean;
}

export interface RefreshTokenRecord {
  token: string;
  client_id: string;
  user_sub: string;
  scopes: string[];
  createdAt: number;
  expiresAt: number;
  revoked: boolean;
  rotated: boolean;
  familyId: string;
}

export interface FlowSnapshot {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  code_challenge: string | null;
  code_verifier: string | null;
  authorization_code: string | null;
  access_token: string | null;
  refresh_token: string | null;
  id_token: string | null;
}
