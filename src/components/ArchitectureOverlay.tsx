"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  deriveArchitectureMap,
  type EdgeId,
  type EdgeTone,
} from "@/lib/architecture-map";
import type { LabEvent } from "@/lib/types";

const POS_KEY = "oauth-lab-arch-overlay-pos";
const SIZE_KEY = "oauth-lab-arch-overlay-size";
const MIN_KEY = "oauth-lab-arch-overlay-min";

const DEFAULT_W = 280;
const DEFAULT_H = 440;
const MIN_W = 220;
const MIN_H = 420;
const MAX_W = 480;
const MAX_H = 560;

type Pos = { x: number; y: number };
type Size = { w: number; h: number };

function clampPos(pos: Pos, size: Size): Pos {
  const maxX = Math.max(8, window.innerWidth - size.w - 8);
  const maxY = Math.max(8, window.innerHeight - size.h - 8);
  return {
    x: Math.min(maxX, Math.max(8, pos.x)),
    y: Math.min(maxY, Math.max(8, pos.y)),
  };
}

function defaultPos(size: Size): Pos {
  return {
    x: Math.max(8, window.innerWidth - size.w - 16),
    y: Math.max(8, window.innerHeight - size.h - 16),
  };
}

function toneColor(tone: EdgeTone): string {
  if (tone === "ok") return "var(--ok)";
  if (tone === "err") return "var(--err)";
  if (tone === "active") return "var(--accent)";
  return "var(--border-strong)";
}

function NodeBox({
  label,
  sub,
  lit,
}: {
  label: string;
  sub: string;
  lit?: EdgeTone;
}) {
  return (
    <div className={`arch-node ${lit && lit !== "idle" ? `arch-node-${lit}` : ""}`}>
      <div className="arch-node-label">{label}</div>
      <div className="arch-node-sub">{sub}</div>
    </div>
  );
}

function HopChip({ tone, label }: { tone: EdgeTone; label: string }) {
  return (
    <div className={`arch-hop arch-hop-${tone}`} title={label}>
      <span className="arch-hop-dot" />
      <span>{label}</span>
    </div>
  );
}

function EdgeArrow({ tone, label }: { tone: EdgeTone; label: string }) {
  const color = toneColor(tone);
  return (
    <div className={`arch-edge arch-edge-${tone}`} title={label}>
      <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden>
        <path
          d="M6 1 v10"
          stroke={color}
          strokeWidth={tone === "idle" ? 1.5 : 2.25}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M2.5 8.5 L6 13 L9.5 8.5"
          stroke={color}
          strokeWidth={tone === "idle" ? 1.5 : 2.25}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{ color }}>{label}</span>
    </div>
  );
}

type Corner = "nw" | "ne" | "sw" | "se";

function clampSize(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function resizeFromCorner(
  corner: Corner,
  orig: Pos & Size,
  dx: number,
  dy: number
): { pos: Pos; size: Size } {
  let w = orig.w;
  let h = orig.h;
  let x = orig.x;
  let y = orig.y;

  if (corner === "se" || corner === "ne") w = orig.w + dx;
  if (corner === "sw" || corner === "nw") {
    w = orig.w - dx;
    x = orig.x + dx;
  }
  if (corner === "se" || corner === "sw") h = orig.h + dy;
  if (corner === "ne" || corner === "nw") {
    h = orig.h - dy;
    y = orig.y + dy;
  }

  const cw = clampSize(w, MIN_W, MAX_W);
  const ch = clampSize(h, MIN_H, MAX_H);

  if ((corner === "sw" || corner === "nw") && cw !== w) {
    x = orig.x + orig.w - cw;
  }
  if ((corner === "ne" || corner === "nw") && ch !== h) {
    y = orig.y + orig.h - ch;
  }

  const size = { w: cw, h: ch };
  return { pos: clampPos({ x, y }, size), size };
}

function strongest(...tones: EdgeTone[]): EdgeTone {
  if (tones.includes("err")) return "err";
  if (tones.includes("active")) return "active";
  if (tones.includes("ok")) return "ok";
  return "idle";
}

export function ArchitectureOverlay() {
  const { t } = useI18n();
  const a = t.architecture;
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [size, setSize] = useState<Size>({ w: DEFAULT_W, h: DEFAULT_H });
  const [pos, setPos] = useState<Pos | null>(null);
  const [minimized, setMinimized] = useState(false);
  const drag = useRef<{
    kind: "move" | "resize";
    corner?: Corner;
    startX: number;
    startY: number;
    orig: Pos & Size;
  } | null>(null);

  useEffect(() => {
    try {
      const rawSize = localStorage.getItem(SIZE_KEY);
      const rawPos = localStorage.getItem(POS_KEY);
      const rawMin = localStorage.getItem(MIN_KEY);
      let nextSize = { w: DEFAULT_W, h: DEFAULT_H };
      if (rawSize) {
        const parsed = JSON.parse(rawSize) as Size;
        nextSize = {
          w: Math.min(MAX_W, Math.max(MIN_W, parsed.w || DEFAULT_W)),
          h: Math.min(MAX_H, Math.max(MIN_H, parsed.h || DEFAULT_H)),
        };
      }
      setSize(nextSize);
      if (rawPos) {
        setPos(clampPos(JSON.parse(rawPos) as Pos, nextSize));
      } else {
        setPos(defaultPos(nextSize));
      }
      setMinimized(rawMin === "1");
    } catch {
      setPos(defaultPos({ w: DEFAULT_W, h: DEFAULT_H }));
    }
  }, []);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/logs");
        const data = await res.json();
        if (alive) setEvents(data.events ?? []);
      } catch {
        /* ignore */
      }
    }
    void poll();
    const id = setInterval(() => void poll(), 1200);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!drag.current) return;
    const d = drag.current;
    if (d.kind === "move") {
      setPos(
        clampPos(
          {
            x: d.orig.x + (e.clientX - d.startX),
            y: d.orig.y + (e.clientY - d.startY),
          },
          { w: d.orig.w, h: d.orig.h }
        )
      );
      return;
    }

    const corner = d.corner ?? "se";
    const next = resizeFromCorner(
      corner,
      d.orig,
      e.clientX - d.startX,
      e.clientY - d.startY
    );
    setSize(next.size);
    setPos(next.pos);
  }, []);

  const stopDrag = useCallback(() => {
    if (!drag.current) return;
    drag.current = null;
    document.body.classList.remove("arch-overlay-dragging");
    setPos((p) => {
      if (p) {
        try {
          localStorage.setItem(POS_KEY, JSON.stringify(p));
        } catch {
          /* ignore */
        }
      }
      return p;
    });
    setSize((s) => {
      try {
        localStorage.setItem(SIZE_KEY, JSON.stringify(s));
      } catch {
        /* ignore */
      }
      return s;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [onPointerMove, stopDrag]);

  if (!pos) return null;
  const panelPos = pos;

  const map = deriveArchitectureMap(events);
  const stepLabel: Record<typeof map.stepKey, string> = {
    idle: a.stepIdle,
    authorize: a.stepAuthorize,
    code: a.stepCode,
    token: a.stepToken,
    tokens_ok: a.stepTokensOk,
    api: a.stepApi,
    rejected: a.stepRejected,
  };

  function startMove(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button, .arch-resize")) return;
    e.preventDefault();
    drag.current = {
      kind: "move",
      startX: e.clientX,
      startY: e.clientY,
      orig: { x: panelPos.x, y: panelPos.y, w: size.w, h: size.h },
    };
    document.body.classList.add("arch-overlay-dragging");
  }

  function startResize(corner: Corner, e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    drag.current = {
      kind: "resize",
      corner,
      startX: e.clientX,
      startY: e.clientY,
      orig: { x: panelPos.x, y: panelPos.y, w: size.w, h: size.h },
    };
    document.body.classList.add("arch-overlay-dragging");
  }

  function toggleMin() {
    setMinimized((m) => {
      const next = !m;
      try {
        localStorage.setItem(MIN_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const lit = (...ids: EdgeId[]) => strongest(...ids.map((id) => map.edges[id]));

  if (minimized) {
    const bubbleTone =
      map.lastStatus === "err"
        ? "err"
        : map.lastStatus === "ok"
          ? "ok"
          : "idle";

    return (
      <button
        type="button"
        className={`architecture-bubble architecture-bubble-${bubbleTone}`}
        onClick={toggleMin}
        title={`${a.overlayTitle} — ${a.expand}`}
        aria-label={`${a.expand}: ${a.overlayTitle}. ${stepLabel[map.stepKey]}`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="8.5" y="16" width="7" height="5" rx="1" />
          <path d="M6.5 8v3.5h11V8" />
          <path d="M12 11.5V16" />
        </svg>
        <span className="architecture-bubble-dot" />
      </button>
    );
  }

  return (
    <div
      className="architecture-overlay"
      style={{ left: panelPos.x, top: panelPos.y, width: size.w, height: size.h }}
    >
      <div className="architecture-overlay-bar" onPointerDown={startMove}>
        <div className="min-w-0 text-left">
          <div className="architecture-overlay-title">{a.overlayTitle}</div>
          <div className="architecture-overlay-hint">{a.dragHint}</div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={toggleMin}>
          {a.minimize}
        </button>
      </div>

      <div className={`arch-step-pill arch-step-${map.lastStatus}`}>
        {stepLabel[map.stepKey]}
      </div>

      <div className="architecture-overlay-body">
        <NodeBox label={a.user} sub={a.userSub} lit={lit("user-client")} />
        <EdgeArrow tone={map.edges["user-client"]} label={a.edgeUser} />

        <NodeBox
          label={a.client}
          sub={a.clientSub}
          lit={lit("user-client", "client-as", "client-token", "client-rs")}
        />
        <EdgeArrow tone={map.edges["client-as"]} label={a.edgeAuthorize} />

        <NodeBox
          label={a.as}
          sub={a.asSub}
          lit={lit("client-as", "as-client", "client-token")}
        />

        <div className="arch-hops">
          <HopChip tone={map.edges["as-client"]} label={a.hopCode} />
          <HopChip tone={map.edges["client-token"]} label={a.hopToken} />
        </div>

        <EdgeArrow tone={map.edges["client-rs"]} label={a.hopApi} />
        <NodeBox label={a.rs} sub={a.rsSub} lit={lit("client-rs")} />
      </div>

      <div
        className="arch-resize arch-resize-nw"
        onPointerDown={(e) => startResize("nw", e)}
      />
      <div
        className="arch-resize arch-resize-ne"
        onPointerDown={(e) => startResize("ne", e)}
      />
      <div
        className="arch-resize arch-resize-sw"
        onPointerDown={(e) => startResize("sw", e)}
      />
      <div
        className="arch-resize arch-resize-se"
        onPointerDown={(e) => startResize("se", e)}
      />
    </div>
  );
}
