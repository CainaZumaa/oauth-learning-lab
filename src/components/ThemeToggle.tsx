"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Theme = "dark" | "light";

const STORAGE_KEY = "oauth-lab-theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  const isLight = theme === "light";

  return (
    <label className="theme-toggle" title={isLight ? t.common.light : t.common.dark}>
      <span className="theme-toggle-label">{t.common.dark}</span>
      <button
        type="button"
        role="switch"
        aria-checked={isLight}
        aria-label={`${t.common.dark} / ${t.common.light}`}
        className="theme-switch"
        onClick={toggle}
      >
        <span className="theme-switch-thumb" />
      </button>
      <span className="theme-toggle-label">{t.common.light}</span>
    </label>
  );
}
