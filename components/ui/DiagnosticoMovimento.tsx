"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mede, no navegador de quem está olhando, tudo que pode estar impedindo a
 * animação de aparecer. Nada aqui é simulado — são as mesmas APIs que o
 * produto usa.
 */

type Item = {
  rotulo: string;
  valor: string;
  ok: boolean;
  explica?: string;
};

/** Lê o navegador uma vez e devolve o laudo. */
function medir(): Item[] {
  const raiz = getComputedStyle(document.documentElement);
  const base = raiz.getPropertyValue("--t-base").trim();
  const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Um elemento descartável só para provar que a WAAPI anima nesta máquina.
  const cobaia = document.createElement("div");
  cobaia.style.cssText = "position:fixed;opacity:0;pointer-events:none";
  document.body.appendChild(cobaia);
  const teste = cobaia.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 300,
  });
  const waapiOk =
    teste.playState === "running" || teste.playState === "finished";
  teste.cancel();
  cobaia.remove();

  return [
    {
      rotulo: "Movimento reduzido no navegador",
      valor: menos ? "SIM — animações desligadas" : "não",
      ok: !menos,
      explica: menos
        ? "Seu navegador ou sistema está pedindo menos movimento. O produto respeita isso e desliga quase tudo. No Windows: Configurações → Acessibilidade → Efeitos visuais → Efeitos de animação."
        : undefined,
    },
    {
      rotulo: "CSS de movimento carregado",
      valor: base ? `--t-base = ${base}` : "AUSENTE",
      ok: Boolean(base),
      explica: base
        ? undefined
        : "A folha de estilo não chegou. Quase sempre é cache: force o recarregamento com Ctrl+Shift+R.",
    },
    {
      rotulo: "Duração esperada",
      valor:
        base === "0.44s" ? "0.44s (versão nova ✓)" : `${base} (versão ANTIGA)`,
      ok: base === "0.44s",
      explica:
        base === "0.44s"
          ? undefined
          : "Você está com o CSS antigo em cache. Ctrl+Shift+R resolve.",
    },
    {
      rotulo: "Animações nativas funcionam",
      valor: waapiOk ? "sim" : "NÃO",
      ok: waapiOk,
      explica: waapiOk
        ? undefined
        : "O navegador recusou animar. Extensão de acessibilidade ou economia de energia costumam causar isso.",
    },
  ];
}

export default function DiagnosticoMovimento() {
  const [itens, setItens] = useState<Item[]>([]);
  const [rodando, setRodando] = useState(0);
  const alvoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Escrita de estado no efeito é intencional e não vira laço: roda uma vez,
    // sem dependências, para ler o navegador depois da hidratação. Fazer isso
    // no render quebraria a hidratação — o servidor não tem `window`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItens(medir());
  }, []);

  // Contador ao vivo do que está animando na página inteira.
  useEffect(() => {
    const t = setInterval(
      () =>
        setRodando(
          document.getAnimations().filter((a) => a.playState === "running")
            .length
        ),
      120
    );
    return () => clearInterval(t);
  }, []);

  function dispararTeste() {
    const el = alvoRef.current;
    if (!el) return;
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(
      [
        {
          opacity: 0,
          transform: "translateY(22px) scale(0.985)",
          filter: "blur(4px)",
        },
        { opacity: 1, transform: "none", filter: "blur(0px)" },
      ],
      { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-2">
        {itens.map((i) => (
          <li
            key={i.rotulo}
            className={`rounded-xl border px-4 py-3 ${
              i.ok
                ? "border-(--color-gold)/40 bg-white"
                : "border-red-400/60 bg-red-50"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{i.rotulo}</span>
              <span
                className={`font-mono text-xs ${
                  i.ok
                    ? "text-(--color-olive)/70"
                    : "font-semibold text-red-700"
                }`}
              >
                {i.valor}
              </span>
            </div>
            {i.explica && (
              <p className="mt-1.5 text-xs leading-relaxed text-red-800">
                {i.explica}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 rounded-xl border border-(--color-gold)/40 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">Teste visual</span>
          <span className="font-mono text-xs text-(--color-olive)/60">
            animando agora: {rodando}
          </span>
        </div>
        <div
          ref={alvoRef}
          className="rounded-lg bg-(--color-blush) px-5 py-8 text-center text-sm"
        >
          Este bloco usa exatamente a mesma animação da troca de tela.
        </div>
        <button
          type="button"
          onClick={dispararTeste}
          className="btn btn-primary btn-sm self-start"
        >
          Animar este bloco
        </button>
        <p className="text-xs leading-relaxed text-(--color-olive)/60">
          Se o bloco acima NÃO se mexer ao clicar, o problema é o navegador, não
          o código. Se ele se mexer mas a troca de tela não, me diga — aí é meu.
        </p>
      </div>
    </div>
  );
}
