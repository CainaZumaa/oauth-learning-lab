"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ObservabilityDock } from "@/components/ObservabilityDock";
import type { InspectorEntry, LabEvent } from "@/lib/types";

const STORAGE_KEY = "oauth-lab-dock-width";
const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 280;
const MAX_WIDTH = 720;

function clamp(n: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n));
}

export function ResizableObservabilityDock({
  events,
  inspector,
  onClearLogs,
}: {
  events: LabEvent[];
  inspector: InspectorEntry[];
  onClearLogs?: () => void | Promise<void>;
}) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const n = Number(raw);
        if (!Number.isNaN(n)) setWidth(clamp(n));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return;
    const delta = startX.current - e.clientX;
    const next = clamp(startWidth.current + delta);
    setWidth(next);
  }, []);

  const stopDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.classList.remove("dock-resizing");
    setWidth((w) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(w));
      } catch {
        /* ignore */
      }
      return w;
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

  function startDrag(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.classList.add("dock-resizing");
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  return (
    <div
      className="relative hidden h-full shrink-0 xl:block"
      style={{ width }}
    >
      <div
        className="dock-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize event log panel"
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={startDrag}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            setWidth((w) => {
              const next = clamp(w + 16);
              localStorage.setItem(STORAGE_KEY, String(next));
              return next;
            });
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            setWidth((w) => {
              const next = clamp(w - 16);
              localStorage.setItem(STORAGE_KEY, String(next));
              return next;
            });
          }
        }}
      />
      <ObservabilityDock
        events={events}
        inspector={inspector}
        onClearLogs={onClearLogs}
      />
    </div>
  );
}
