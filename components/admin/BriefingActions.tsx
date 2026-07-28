"use client";

import { useState } from "react";

async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    el.remove();
  }
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "pedido"
  );
}

/**
 * Substitui os três botões antigos ("Copiar JSON", "Copiar prompt + pedido",
 * "ver JSON"). O que a equipe realmente faz é: copiar o briefing e colar num
 * gerador. Então tem UM caminho principal — copiar e abrir o Claude na mesma
 * ação — e o resto fica como apoio.
 */
export default function BriefingActions({
  coupleName,
  briefing,
  json,
}: {
  coupleName: string;
  briefing: string;
  json: string;
}) {
  const [copied, setCopied] = useState<"briefing" | "json" | null>(null);
  const [showJson, setShowJson] = useState(false);

  function flag(which: "briefing" | "json") {
    setCopied(which);
    setTimeout(() => setCopied(null), 2500);
  }

  async function copyAndOpenClaude() {
    await copy(briefing);
    flag("briefing");
    window.open("https://claude.ai/new", "_blank", "noopener,noreferrer");
  }

  function downloadBriefing() {
    const blob = new Blob([briefing], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `briefing-${slugify(coupleName)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-(--color-gold)/40 bg-white p-5 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-(--color-olive)">
          Gerar o site
        </h2>
        <p className="text-xs leading-relaxed text-(--color-muted)">
          O briefing junta o prompt de produção com tudo que este casal pediu.
          O botão abaixo copia e já abre o Claude — é só colar (Ctrl+V) e
          enviar.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyAndOpenClaude}
          className="btn btn-primary btn-sm"
        >
          {copied === "briefing" ? "Copiado ✓ abrindo…" : "Copiar e abrir no Claude"}
        </button>
        <button
          type="button"
          onClick={async () => {
            await copy(briefing);
            flag("briefing");
          }}
          className="btn btn-secondary btn-sm"
        >
          {copied === "briefing" ? "Copiado ✓" : "Só copiar"}
        </button>
        <button
          type="button"
          onClick={downloadBriefing}
          className="btn btn-secondary btn-sm"
        >
          Baixar .md
        </button>
      </div>

      <details
        open={showJson}
        onToggle={(event) => setShowJson(event.currentTarget.open)}
      >
        <summary className="cursor-pointer text-xs text-(--color-olive)/70">
          Ver o JSON cru do pedido
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={async () => {
              await copy(json);
              flag("json");
            }}
            className="btn btn-secondary btn-sm self-start"
          >
            {copied === "json" ? "Copiado ✓" : "Copiar JSON"}
          </button>
          <pre className="max-h-80 overflow-auto rounded-lg border border-(--color-gold)/30 bg-(--color-paper) p-3 text-[11px] font-mono whitespace-pre">
            {json}
          </pre>
        </div>
      </details>
    </section>
  );
}
