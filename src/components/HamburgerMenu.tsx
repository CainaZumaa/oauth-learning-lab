"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

const LINKS = [
  { href: "/", key: "lab" as const },
  { href: "/docs", key: "docs" as const },
  { href: "/architecture", key: "architecture" as const },
];

export function HamburgerMenu() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function label(key: (typeof LINKS)[number]["key"]) {
    if (key === "lab") return t.common.lab;
    if (key === "docs") return t.common.docs;
    return t.common.architecture;
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="hamburger" ref={rootRef}>
      <button
        type="button"
        className="hamburger-btn"
        aria-label={t.common.menu}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>
      {open && (
        <ul className="hamburger-menu" role="menu">
          {LINKS.map((link) => (
            <li key={link.href} role="none">
              <Link
                href={link.href}
                role="menuitem"
                className="hamburger-item"
                data-active={isActive(link.href) ? "true" : undefined}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {label(link.key)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
