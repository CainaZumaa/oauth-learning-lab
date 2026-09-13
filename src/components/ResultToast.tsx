"use client";

import { useEffect } from "react";
import type { TestResult } from "@/components/SecurityTestsPanel";
import { useI18n } from "@/i18n/I18nProvider";
import {
  translateToastReason,
  translateToastStatus,
} from "@/i18n/toastReasons";

export function ResultToast({
  result,
  onDismiss,
}: {
  result: TestResult;
  onDismiss: () => void;
}) {
  const { locale, t } = useI18n();

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
          <span className="result-toast-status">
            {translateToastStatus(locale, result.status)}
          </span>
          <span className="result-toast-reason">
            {translateToastReason(locale, result.reason)}
          </span>
        </div>
        <button
          type="button"
          className="result-toast-close"
          aria-label={t.flow.close}
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
