"use client";

import { useEffect } from "react";
import type { TestResult } from "@/components/SecurityTestsPanel";

export function ResultToast({
  result,
  onDismiss,
}: {
  result: TestResult;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!result) return;
    const id = window.setTimeout(() => onDismiss(), 7000);
    return () => window.clearTimeout(id);
  }, [result, onDismiss]);

  if (!result) return null;

  const tone =
    result.status === "REJECTED" || result.status === "401"
      ? "err"
      : result.status === "ACCEPTED"
        ? "ok"
        : "info";

  return (
    <div className="result-toast-stack" aria-live="polite">
      <div className={`result-toast result-toast-${tone}`} role="status">
        <div className="result-toast-body">
          <span className="result-toast-status">{result.status}</span>
          <span className="result-toast-reason">{result.reason}</span>
        </div>
        <button
          type="button"
          className="result-toast-close"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
