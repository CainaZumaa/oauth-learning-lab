"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function AttackerPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-(--bg) px-3 py-6">
      <section className="panel panel-pad mx-auto max-w-md text-left">
        <h1 className="text-[16px] font-semibold text-(--err)">
          {t.attacker.title}
        </h1>
        <p className="mt-1 text-[13px] text-(--text-secondary)">
          {t.attacker.body}
        </p>
      </section>
    </main>
  );
}
