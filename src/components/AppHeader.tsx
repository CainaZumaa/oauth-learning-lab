"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { LanguageSelect } from "@/components/LanguageSelect";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useI18n } from "@/i18n/I18nProvider";

type Mode = "normal" | "security";

export function AppHeader({
  mode,
  onModeChange,
  onReset,
}: {
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
  onReset?: () => void;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const onLab = pathname === "/";
  const showLabControls = onLab && Boolean(onModeChange && onReset);

  return (
    <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-start justify-between gap-4 px-3 py-2.5">
        <div className="flex min-w-0 items-start gap-2 text-left">
          <HamburgerMenu />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[var(--text-muted)]">
              {t.header.eyebrow}
            </p>
            <h1 className="text-[18px] font-semibold leading-tight text-[var(--text)]">
              <Link href="/" className="text-[var(--text)] no-underline">
                {t.header.title}
              </Link>
            </h1>
            {onLab && (
              <p className="mt-0.5 max-w-xl text-[12px] text-[var(--text-secondary)]">
                {t.header.subtitle}
              </p>
            )}
          </div>
        </div>
        <nav className="flex shrink-0 flex-wrap items-center gap-1.5">
          {showLabControls && (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                aria-pressed={mode === "normal"}
                onClick={() => onModeChange?.("normal")}
              >
                {t.header.normalFlow}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                aria-pressed={mode === "security"}
                onClick={() => onModeChange?.("security")}
              >
                {t.header.securityLab}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onReset}
              >
                {t.common.reset}
              </button>
            </>
          )}
          <LanguageSelect />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
