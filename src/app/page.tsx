"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ArchitecturePanel } from "@/components/ArchitecturePanel";
import { FlowValuesPanel } from "@/components/FlowValuesPanel";
import { ObservabilityDock } from "@/components/ObservabilityDock";
import { ResizableObservabilityDock } from "@/components/ResizableObservabilityDock";
import { ScopeSelector } from "@/components/ScopeSelector";
import {
  SecurityTestsPanel,
  type TestResult,
} from "@/components/SecurityTestsPanel";
import { ResultToast } from "@/components/ResultToast";
import { useI18n } from "@/i18n/I18nProvider";
import { LAB_CONFIG, type Scope } from "@/lib/config";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  PKCE_STORAGE_KEY,
} from "@/lib/pkce-browser";
import type { FlowSnapshot, InspectorEntry, LabEvent } from "@/lib/types";

type Mode = "normal" | "security";

const emptyFlow: FlowSnapshot = {
  client_id: LAB_CONFIG.registeredClient.client_id,
  redirect_uri: LAB_CONFIG.registeredClient.redirect_uris[0],
  response_type: "code",
  scope: "openid profile email offline_access",
  code_challenge: null,
  code_verifier: null,
  authorization_code: null,
  access_token: null,
  refresh_token: null,
  id_token: null,
};

export default function LabHomePage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("normal");
  const [scopes, setScopes] = useState<Scope[]>([
    "openid",
    "profile",
    "email",
    "offline_access",
  ]);
  const [flow, setFlow] = useState<FlowSnapshot>(emptyFlow);
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [inspector, setInspector] = useState<InspectorEntry[]>([]);
  const [lastApiOk, setLastApiOk] = useState<boolean | null>(null);
  const [apiDemo, setApiDemo] = useState<{
    request: string;
    response: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [busy, setBusy] = useState(false);

  const refreshState = useCallback(async () => {
    const res = await fetch("/api/logs");
    const data = await res.json();
    setFlow(data.flow);
    setEvents(data.events);
    setInspector(data.inspector);
    if (data.lastApiResult) {
      setLastApiOk(data.lastApiResult.status === 200);
    }
  }, []);

  useEffect(() => {
    void refreshState();
    const id = setInterval(() => void refreshState(), 1500);
    return () => clearInterval(id);
  }, [refreshState]);

  async function startNormalFlow() {
    setBusy(true);
    setTestResult(null);
    try {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const redirect_uri = LAB_CONFIG.registeredClient.redirect_uris[0];
      const client_id = LAB_CONFIG.registeredClient.client_id;
      const scope = scopes.join(" ");

      sessionStorage.setItem(
        PKCE_STORAGE_KEY,
        JSON.stringify({
          code_verifier: verifier,
          redirect_uri,
          client_id,
          code_challenge: challenge,
        })
      );

      await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_flow",
          flow: {
            client_id,
            redirect_uri,
            response_type: "code",
            scope,
            code_challenge: challenge,
            code_verifier: verifier,
            authorization_code: null,
            access_token: null,
            refresh_token: null,
            id_token: null,
          },
        }),
      });

      const qs = new URLSearchParams({
        client_id,
        redirect_uri,
        response_type: "code",
        scope,
        code_challenge: challenge,
        code_challenge_method: "S256",
        state: "lab-state",
      });
      window.location.href = `/authorize?${qs.toString()}`;
    } finally {
      setBusy(false);
    }
  }

  async function callProtectedApi() {
    const token = flow.access_token;
    const reqText = `GET /api/profile\nAuthorization: Bearer ${
      token ?? "(none)"
    }`;
    if (!token) {
      setApiDemo({
        request: reqText,
        response:
          '401 Unauthorized\n{ "error": "no access_token in flow" }',
      });
      setLastApiOk(false);
      return;
    }
    const res = await fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setApiDemo({
      request: reqText,
      response: `${res.status} ${res.statusText}\n${JSON.stringify(data, null, 2)}`,
    });
    setLastApiOk(res.ok);
    await refreshState();
  }

  async function resetLab() {
    await fetch("/api/lab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    sessionStorage.removeItem(PKCE_STORAGE_KEY);
    setApiDemo(null);
    setTestResult(null);
    setLastApiOk(null);
    await refreshState();
  }

  async function clearLogs() {
    await fetch("/api/lab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_logs" }),
    });
    await refreshState();
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <AppHeader mode={mode} onModeChange={setMode} onReset={() => void resetLab()} />

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid gap-3 p-3 lg:grid-cols-[1fr_260px]">
            <div className="min-w-0 space-y-3 text-left">
              <div className="banner">{t.home.banner}</div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => void startNormalFlow()}
                >
                  {t.home.startFlow}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void callProtectedApi()}
                >
                  {t.home.callApi}
                </button>
              </div>

              {apiDemo && (
                <div className="panel grid gap-2 p-2 md:grid-cols-2">
                  <div className="min-w-0 text-left">
                    <div className="mb-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                      {t.home.request}
                    </div>
                    <pre className="whitespace-pre-wrap break-all bg-[var(--surface-muted)] p-1.5 font-mono text-[11px]">
                      {apiDemo.request}
                    </pre>
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="mb-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                      {t.home.response}
                    </div>
                    <pre className="whitespace-pre-wrap break-all bg-[var(--surface-muted)] p-1.5 font-mono text-[11px]">
                      {apiDemo.response}
                    </pre>
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <ArchitecturePanel
                  hasTokens={Boolean(flow.access_token)}
                  lastApiOk={lastApiOk}
                />
                <FlowValuesPanel flow={flow} />
              </div>

              {mode === "security" && (
                <SecurityTestsPanel
                  enabled
                  flow={flow}
                  scopes={scopes}
                  onResult={setTestResult}
                  refreshState={refreshState}
                />
              )}

              {mode === "normal" && (
                <section className="panel panel-pad text-left text-[13px] text-[var(--text-secondary)]">
                  <h2 className="panel-title">{t.home.normalFlowTitle}</h2>
                  <ol className="list-decimal space-y-0.5 pl-4">
                    {t.home.normalSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    {t.home.diagramHint}
                  </p>
                </section>
              )}
            </div>

            <div className="space-y-3 lg:self-start">
              <ScopeSelector scopes={scopes} onChange={setScopes} />
              <section className="panel panel-pad text-left text-[12px] text-[var(--text-secondary)]">
                <h2 className="panel-title">{t.home.registeredClient}</h2>
                <dl className="space-y-1 font-mono text-[11px]">
                  <div>
                    <dt className="text-[var(--text-muted)]">client_id</dt>
                    <dd className="text-[var(--text)]">
                      {LAB_CONFIG.registeredClient.client_id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">type</dt>
                    <dd className="text-[var(--text)]">{t.home.clientType}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">redirect_uri</dt>
                    <dd className="break-all text-[var(--text)]">
                      {LAB_CONFIG.registeredClient.redirect_uris[0]}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        </div>

        <ResizableObservabilityDock
          events={events}
          inspector={inspector}
          onClearLogs={clearLogs}
        />
      </div>

      <div className="h-[42vh] shrink-0 border-t border-[var(--border)] xl:hidden">
        <ObservabilityDock
          events={events}
          inspector={inspector}
          onClearLogs={clearLogs}
        />
      </div>

      <ResultToast
        result={testResult}
        onDismiss={() => setTestResult(null)}
      />
    </main>
  );
}
