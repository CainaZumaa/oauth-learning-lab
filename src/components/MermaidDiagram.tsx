"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

type Props = {
  chart: string;
  className?: string;
};

let mermaidReady = false;

function ensureMermaid(isDark: boolean) {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? "dark" : "neutral",
    securityLevel: "loose",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    flowchart: {
      curve: "basis",
      padding: 12,
      nodeSpacing: 40,
      rankSpacing: 40,
    },
    sequence: {
      actorMargin: 48,
      messageMargin: 32,
    },
  });
  mermaidReady = true;
}

export function MermaidDiagram({ chart, className }: Props) {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const isDark =
          document.documentElement.getAttribute("data-theme") !== "light";
        ensureMermaid(isDark);
        const { svg: out } = await mermaid.render(
          `mmd-${reactId}-${Date.now()}`,
          chart
        );
        if (!cancelled) {
          setSvg(out);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Mermaid render failed");
        }
      }
    }

    void render();

    const obs = new MutationObserver(() => {
      mermaidReady = false;
      void render();
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      cancelled = true;
      obs.disconnect();
    };
  }, [chart, reactId]);

  if (error) {
    return (
      <pre className="arch-mmd-error">{error}</pre>
    );
  }

  return (
    <div
      className={`arch-mmd ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
