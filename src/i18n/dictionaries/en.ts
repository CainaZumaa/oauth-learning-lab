const en = {
  common: {
    docs: "Docs",
    howToUse: "How to use",
    lab: "Lab",
    architecture: "Architecture",
    menu: "Menu",
    reset: "Reset",
    light: "Light",
    dark: "Dark",
    language: "Language",
    backToLab: "Back to lab",
    required: "required",
  },
  header: {
    eyebrow: "Educational lab · localhost only",
    title: "OAuth 2.0 / OIDC Learning Lab",
    subtitle:
      "Authorization Code Flow + PKCE with a local Identity Provider. Observe the protocol; break controls in Security Lab.",
    normalFlow: "Normal flow",
    securityLab: "Security lab",
  },
  home: {
    banner:
      "JWT and login are didactic. Not for production. No external IdP. In-memory state resets when the server restarts.",
    startFlow: "Start Authorization Code Flow",
    callApi: "Call protected API",
    request: "REQUEST",
    response: "RESPONSE",
    normalFlowTitle: "Normal flow",
    normalSteps: [
      "Client generates code_verifier and code_challenge (S256).",
      "Browser opens local IdP (/authorize).",
      "Resource Owner authorizes → Authorization Server issues authorization code.",
      "Redirect to /callback?code=…",
      "Client exchanges code + verifier at POST /api/token.",
      "Receives access_token, refresh_token (if offline_access), id_token (OIDC).",
      "Call the protected API with Bearer access_token.",
    ],
    diagramHint: "Full diagram: docs/architecture.md",
    registeredClient: "Registered client",
    clientType: "public + PKCE",
  },
  architecture: {
    title: "Architecture",
    user: "USER",
    userSub: "Resource Owner",
    client: "CLIENT",
    clientSub: "Public + PKCE",
    as: "AUTHORIZATION SERVER (AS)",
    asSub: "Identity Provider · /authorize · /token",
    rs: "RESOURCE SERVER (RS)",
    rsSub: "Protected API · GET /api/profile",
    ready: "Ready",
    running: "Running",
    last401: "401 last call",
    oidcNote: "OIDC adds id_token on top of OAuth. Tokens issued:",
    yes: "yes",
    notYet: "not yet",
    overlayTitle: "Live architecture",
    dragHint: "Drag · resize from any corner",
    stepIdle: "Waiting for an action",
    stepAuthorize: "Client → Authorization Server",
    stepCode: "Authorization code → Client",
    stepToken: "Client → Token endpoint",
    stepTokensOk: "Tokens issued",
    stepApi: "Client → Resource Server",
    stepRejected: "Request rejected",
    edgeUser: "User → Client",
    edgeAuthorize: "Authorize",
    edgeCode: "Code",
    edgeToken: "Token",
    edgeApi: "API",
    hopCode: "Auth Server → Client · code",
    hopToken: "Client → Auth Server · token",
    hopApi: "Client → Resource Server · API",
    minimize: "Minimize",
    expand: "Expand",
  },
  flow: {
    title: "OAuth Flow Values",
    idToken: "ID Token",
    accessToken: "Access Token",
    identity: "identity",
    authorization: "authorization",
    publicNote:
      "This Client is public (PKCE). client_secret belongs only on confidential servers.",
    empty: "(empty)",
  },
  scopes: {
    title: "Scopes",
    lockedHint: " — locked here so the lab always shows OIDC / id_token.",
    footer:
      "Access Token expires on its own. Refresh requires offline_access in this lab's policy.",
  },
  dock: {
    eventLog: "Event log",
    inspector: "Inspector",
    clear: "Clear",
    clearTitle: "Clear event log and inspector (keeps tokens)",
    noEvents: "No events yet. Run a flow or security test.",
    noExchanges: "No exchanges yet.",
    request: "REQUEST",
    response: "RESPONSE",
  },
  security: {
    title: "Security tests",
    enableHint: "Switch to Security lab mode to enable attack buttons.",
    runTest: "Run test",
    what: "What we test:",
    why: "Why reject:",
    ifAccepted: "If accepted:",
    control: "Control:",
  },
  authorize: {
    eyebrow: "Authorization Server · Identity Provider",
    title: "Simulated login",
    subtitle:
      "Educational lab — no real password. Resource Owner authorizes the Client.",
    user: "User",
    client: "Client",
    authorize: "Authorize application",
    authorizing: "Authorizing…",
    nextTitle: "What happens next",
    nextSteps: [
      "The Authorization Server (AS) issues a single-use authorization_code.",
      "Browser redirects to redirect_uri?code=…",
      "Client exchanges code + PKCE verifier at /token.",
    ],
  },
  callback: {
    eyebrow: "Client · /callback",
    title: "OAuth callback",
    authError: "Authorization error:",
    noCode: "No authorization code in the URL.",
    status: "Status:",
    exchanging: "Exchanging…",
    starting: "Starting…",
    success: "Tokens issued. Return to the lab to inspect them.",
    noVerifier:
      "code_verifier not found in sessionStorage. Start the flow from the lab home page.",
    exchangeTitle: "Token exchange",
    exchangeBody:
      "This page sends code + code_verifier to POST /api/token.",
  },
  attacker: {
    title: "Attacker redirect target",
    body: "Unregistered redirect_uri. A correct Authorization Server must not deliver a valid authorization code here.",
  },
  docs: {
    title: "How to use",
    subtitle:
      "How to use this app: screens, Normal flow, Security lab, and the observability panels.",
    toc: "On this page",
    s1Title: "1. Screens (hamburger menu)",
    s1Body:
      "Open the menu (☰) in the header:",
    s1Items: [
      "Lab — interactive OAuth playground (main screen).",
      "Docs — this guide (how to use the UI).",
      "Architecture — schematic diagrams of roles, flow, and PKCE.",
    ],
    s2Title: "2. Modes on the Lab screen",
    s2Normal:
      "Normal flow — correct Authorization Code + PKCE. Start here.",
    s2Security:
      "Security lab — attack buttons that break parameters on purpose so you see REJECTED vs ACCEPTED.",
    s3Title: "3. Happy path (in the UI)",
    s3Steps: [
      "Optionally adjust scopes (openid is required/locked for OIDC).",
      "Click Start Authorization Code Flow.",
      "On the IdP page, click Authorize application (Alice, simulated login).",
      "You land on /callback; the Client exchanges the code for tokens.",
      "Click Back to lab and inspect Flow Values, Event log, and Inspector.",
      "Click Call protected API to hit GET /api/profile with the access token.",
    ],
    s4Title: "4. Live architecture (floating widget)",
    s4Body:
      "The floating Live architecture map stays on every page. Arrows turn blue (in progress), green (ok), or red (rejected). Drag it, resize from any corner, or minimize to a bubble in the bottom-right.",
    s5Title: "5. Observability dock",
    s5Body:
      "On the Lab screen, the right panel (or bottom on smaller screens) shows Event log and Request Inspector. Resize the dock from its left edge. Watch ACCEPTED/REJECTED without scrolling away from Security tests.",
    s6Title: "6. Security tests",
    s6Body:
      "Switch to Security lab and run each test. Read the card (what / why / if accepted / control), then watch the dock and the live architecture map.",
    s6List: [
      "Tamper redirect_uri",
      "Reuse authorization code",
      "Remove / wrong PKCE",
      "Tamper client_id",
      "Expired code / access token",
      "Refresh + refresh reuse (rotation)",
      "Remove offline_access",
    ],
    s7Title: "7. Useful UI controls",
    s7Tips: [
      "Reset clears in-memory codes, tokens, and logs.",
      "Language (EN/PT) and dark/light theme are in the header.",
      "Server terminal also prints [AUTH], [PKCE], [TOKEN], [SECURITY] lines.",
      "Theory and how to install/run the project live in the README.",
    ],
    s8Title: "8. What is simulated in the UI",
    s8Body:
      "Login has no real password. JWTs use a lab secret. State is in-memory — Reset or restarting the server clears it. This is for learning, not production.",
  },
  architecturePage: {
    title: "Architecture",
    subtitle:
      "Full static map of the OAuth 2.0 / OIDC learning lab — roles, flow, PKCE, and security controls.",
    notice:
      "Educational lab only. Simulated login, didactic JWTs, single Next.js process on localhost.",
    rolesTitle: "The four OAuth 2.0 roles (+ OIDC)",
    rolesOidc:
      "OIDC sits on OAuth 2.0: with scope=openid the AS also issues an id_token (identity). The access_token authorizes API calls.",
    flowTitle: "Authorization Code Flow",
    flowSteps: [
      "User → Client: start login",
      "Client → AS: /authorize + code_challenge (PKCE)",
      "User consents on IdP (simulated login)",
      "AS → Client: redirect_uri?code=…",
      "Client → AS: /token + code + code_verifier",
      "AS → Client: access_token, refresh_token, id_token",
      "Client → RS: Bearer access_token → /api/profile",
    ],
    pkceTitle: "PKCE (S256)",
    pkceSteps: [
      "1. Client generates code_verifier",
      "2. code_challenge = BASE64URL(SHA256(verifier))",
      "3. Send challenge to /authorize",
      "4. AS issues authorization_code",
      "5. Client sends code + verifier to /token",
      "6. AS recomputes and compares",
      "7. Match → tokens · mismatch → REJECTED",
    ],
    artifactsTitle: "Protocol artifacts",
    controlsTitle: "Where security controls live",
    clientsTitle: "Public vs Confidential Client",
    publicClient:
      "Public (this lab): no client_secret in the browser — uses PKCE.",
    confidentialClient:
      "Confidential: client_secret only on a trusted server — never in the frontend.",
    singleUse: "authorization_code → single use → reuse REJECTED",
    redirectExact:
      "redirect_uri → exact match with registered URI → mismatch REJECTED",
    singleUseTitle: "authorization_code — single use",
    redirectTitle: "redirect_uri — exact match",
    hoverHint: "Hover boxes and arrows for a deeper explanation",
    fileHint: "Also in the repo: docs/architecture.md",
  },
};

export type Dictionary = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: (typeof en)[K][P] extends readonly string[]
      ? string[]
      : string;
  };
};

export default en;
