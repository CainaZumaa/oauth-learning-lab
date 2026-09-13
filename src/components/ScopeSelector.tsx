"use client";

import { type Scope } from "@/lib/config";
import { useI18n } from "@/i18n/I18nProvider";

const ALL: Scope[] = ["openid", "profile", "email", "offline_access"];

export function ScopeSelector({
  scopes,
  onChange,
}: {
  scopes: Scope[];
  onChange: (scopes: Scope[]) => void;
}) {
  const { t } = useI18n();

  function toggle(s: Scope) {
    if (s === "openid") return;
    if (scopes.includes(s)) {
      onChange(scopes.filter((x) => x !== s));
    } else {
      onChange([...scopes, s]);
    }
  }

  return (
    <section className="panel panel-pad">
      <h2 className="panel-title">{t.scopes.title}</h2>
      <ul className="space-y-1.5 text-left text-[13px]">
        {ALL.map((s) => {
          const locked = s === "openid";
          const checked = scopes.includes(s);
          return (
            <li
              key={s}
              className={`flex items-start gap-2 ${locked ? "opacity-60" : ""}`}
            >
              <input
                type="checkbox"
                className="mt-0.5 accent-(--accent) disabled:cursor-not-allowed"
                checked={checked}
                disabled={locked}
                onChange={() => toggle(s)}
                id={`scope-${s}`}
              />
              <label
                htmlFor={locked ? undefined : `scope-${s}`}
                className={locked ? "cursor-default" : "cursor-pointer"}
              >
                <span className="font-mono text-[12px] text-(--accent)">
                  {s}
                  {locked && (
                    <span className="ml-1.5 font-sans text-[10px] font-normal text-(--text-muted)">
                      {t.common.required}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[11px] text-(--text-muted)">
                  {t.scopes[s]}
                  {locked ? t.scopes.lockedHint : ""}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-left text-[11px] text-(--text-muted)">
        {t.scopes.footer}
      </p>
    </section>
  );
}
