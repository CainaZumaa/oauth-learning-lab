"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

export function LanguageSelect() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(code: Locale) {
    setLocale(code);
    setOpen(false);
  }

  return (
    <div className="lang-select" ref={rootRef}>
      <button
        type="button"
        className="btn btn-secondary lang-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.common.language}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="lang-flag" aria-hidden>
          {current.flag}
        </span>
        <span>{current.code.toUpperCase()}</span>
        <span className="lang-caret" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={t.common.language}>
          {LOCALES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === locale}>
              <button
                type="button"
                className="lang-option"
                onClick={() => pick(l.code)}
              >
                <span className="lang-flag" aria-hidden>
                  {l.flag}
                </span>
                <span>{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
