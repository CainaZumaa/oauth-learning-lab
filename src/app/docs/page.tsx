"use client";

import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/i18n/I18nProvider";

export default function DocsPage() {
  const { t } = useI18n();
  const d = t.docs;

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1 overflow-y-auto">
        <article className="docs-page mx-auto px-3 py-4 text-left">
          <p className="text-[11px] font-medium text-(--text-muted)">
            {t.common.docs}
          </p>
          <h1 className="text-[22px] font-semibold text-(--text)">
            {d.title}
          </h1>
          <p className="mt-1 text-[13px] text-(--text-secondary)">
            {d.subtitle}
          </p>

          <nav className="docs-toc panel panel-pad mt-3">
            <h2 className="panel-title" style={{ margin: 0 }}>
              {d.toc}
            </h2>
            <ul className="mt-2 space-y-1">
              <li>
                <a href="#screens">{d.s1Title}</a>
              </li>
              <li>
                <a href="#modes">{d.s2Title}</a>
              </li>
              <li>
                <a href="#happy-path">{d.s3Title}</a>
              </li>
              <li>
                <a href="#live-arch">{d.s4Title}</a>
              </li>
              <li>
                <a href="#dock">{d.s5Title}</a>
              </li>
              <li>
                <a href="#security">{d.s6Title}</a>
              </li>
              <li>
                <a href="#ui">{d.s7Title}</a>
              </li>
              <li>
                <a href="#simulated">{d.s8Title}</a>
              </li>
            </ul>
          </nav>

          <section id="screens">
            <h2>{d.s1Title}</h2>
            <p>{d.s1Body}</p>
            <ul>
              {d.s1Items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section id="modes">
            <h2>{d.s2Title}</h2>
            <ul>
              <li>
                <strong className="text-(--text)">
                  {t.header.normalFlow}
                </strong>
                {" — "}
                {d.s2Normal}
              </li>
              <li>
                <strong className="text-(--text)">
                  {t.header.securityLab}
                </strong>
                {" — "}
                {d.s2Security}
              </li>
            </ul>
          </section>

          <section id="happy-path">
            <h2>{d.s3Title}</h2>
            <ol>
              {d.s3Steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section id="live-arch">
            <h2>{d.s4Title}</h2>
            <p>{d.s4Body}</p>
          </section>

          <section id="dock">
            <h2>{d.s5Title}</h2>
            <p>{d.s5Body}</p>
          </section>

          <section id="security">
            <h2>{d.s6Title}</h2>
            <p>{d.s6Body}</p>
            <ul>
              {d.s6List.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section id="ui">
            <h2>{d.s7Title}</h2>
            <ul>
              {d.s7Tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>

          <section id="simulated" className="mb-8">
            <h2>{d.s8Title}</h2>
            <p>{d.s8Body}</p>
          </section>
        </article>
      </div>
    </main>
  );
}
