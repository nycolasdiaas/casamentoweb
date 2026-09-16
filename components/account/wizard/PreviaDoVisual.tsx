"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TemaAoVivoMsg } from "@/components/site/TemaAoVivo";

type Dispositivo = "desktop" | "celular";

// Larguras VIRTUAIS: o quadro é montado nelas e depois escalado para caber na
// coluna. Sem isso o site reagiria à largura do quadro e não à do aparelho — o
// "computador" renderizaria como tela estreita. Mesma razão do `LivePreview`.
const LARGURA: Record<Dispositivo, number> = { desktop: 1280, celular: 390 };
const ALTURA: Record<Dispositivo, number> = { desktop: 760, celular: 700 };

export type ConteudoDaPrevia = {
  nomes: string;
  /** "AAAA-MM-DD" e "HH:MM", como os campos do questionário guardam. */
  data: string;
  hora: string;
  cerimoniaLocal: string;
  festaLocal: string;
  traje: string;
  historia: string;
};

type Tema = { cor1: string; cor2: string; cor3: string; fonte: string };

/**
 * Monta o endereço da prévia.
 *
 * `comTema` é a diferença entre os dois usos, e ela é o coração deste
 * componente:
 *
 * - **No quadro, sem tema.** Se a cor entrasse no endereço, cada pixel
 *   arrastado no seletor trocaria o `src` e recarregaria o iframe: piscada
 *   branca, rolagem de volta ao topo, fonte rebaixada. As cores chegam lá por
 *   `postMessage`, que é instantâneo (ver `TemaAoVivo`).
 * - **No link "abrir em outra aba", com tema.** Ali não há iframe para
 *   recarregar, e o endereço precisa levar tudo — senão a aba nova abre com a
 *   paleta do molde em vez da que está na tela.
 */
function montarEndereco(
  modelo: string,
  pacote: string,
  conteudo: ConteudoDaPrevia,
  tema: Tema | null
): string {
  const p = new URLSearchParams();
  if (modelo) p.set("m", modelo);
  if (pacote) p.set("p", pacote);

  if (tema) {
    // Sem `#`: na URL ele abriria um fragmento e a cor não chegaria.
    if (tema.cor1) p.set("c1", tema.cor1.replace(/^#/, ""));
    if (tema.cor2) p.set("c2", tema.cor2.replace(/^#/, ""));
    if (tema.cor3) p.set("c3", tema.cor3.replace(/^#/, ""));
    if (tema.fonte) p.set("f", tema.fonte);
  }

  if (conteudo.nomes.trim()) p.set("n", conteudo.nomes.trim());
  if (conteudo.data) {
    // Sem hora digitada, meio da tarde: `buildContentView` trata meia-noite
    // como "hora ainda não informada" e omitiria o horário da contagem.
    p.set("d", `${conteudo.data}T${conteudo.hora || "16:00"}`);
  }
  if (conteudo.cerimoniaLocal.trim()) p.set("lc", conteudo.cerimoniaLocal.trim());
  if (conteudo.festaLocal.trim()) p.set("lf", conteudo.festaLocal.trim());
  if (conteudo.traje.trim()) p.set("tr", conteudo.traje.trim());
  if (conteudo.historia.trim()) p.set("hi", conteudo.historia.trim());

  return `/previa-do-estilo?${p.toString()}`;
}

/**
 * O quadro que acompanha a etapa do visual.
 *
 * ── O que recarrega e o que não ────────────────────────────────────────────
 *
 * **Modelo, pacote e conteúdo** viajam no endereço do quadro: mudá-los troca o
 * HTML das seções, então o quadro carrega de novo.
 *
 * **Cor e tipografia** vão por `postMessage`, sem recarregar — elas são
 * variáveis CSS do lado de lá. É o que separa "o site de vocês mudando de cor"
 * de "o site de vocês piscando em branco a cada pixel que o seletor arrasta".
 */
export default function PreviaDoVisual({
  modelo,
  pacote,
  cor1,
  cor2,
  cor3,
  fonte,
  conteudo,
}: {
  modelo: string;
  pacote: string;
  /** Acento, tinta e papel — a ordem que `resolveTheme` espera. */
  cor1: string;
  cor2: string;
  cor3: string;
  fonte: string;
  conteudo: ConteudoDaPrevia;
}) {
  const [dispositivo, setDispositivo] = useState<Dispositivo>("desktop");
  const [escala, setEscala] = useState(1);
  /* Qual endereço já terminou de carregar. Guardar o ENDEREÇO, e não um
     booleano, é o que faz a opacidade se resolver sozinha: quando o `src`
     muda, `pronto` vira falso sem nenhum efeito para reiniciá-lo. */
  const [carregado, setCarregado] = useState<string | null>(null);
  const palcoRef = useRef<HTMLDivElement>(null);
  const quadroRef = useRef<HTMLIFrameElement>(null);

  const larguraVirtual = LARGURA[dispositivo];
  const alturaVirtual = ALTURA[dispositivo];

  const src = useMemo(
    () => montarEndereco(modelo, pacote, conteudo, null),
    [modelo, pacote, conteudo]
  );
  const enderecoCompleto = montarEndereco(modelo, pacote, conteudo, {
    cor1,
    cor2,
    cor3,
    fonte,
  });

  // Escala para o viewport virtual caber na coluna. Nunca amplia: esticar
  // 390px de celular mostraria um site borrado que ninguém vê assim.
  useEffect(() => {
    const palco = palcoRef.current;
    if (!palco) return;
    const medir = () => {
      const disponivel = palco.clientWidth;
      if (disponivel > 0) setEscala(Math.min(1, disponivel / larguraVirtual));
    };
    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(palco);
    return () => observer.disconnect();
  }, [larguraVirtual]);

  /* Cada mudança de cor ou de fonte vira uma mensagem. Sem debounce de
     propósito: `postMessage` para um iframe de mesma origem é barato, e
     qualquer atraso aqui vira exatamente a sensação que esta tela existe para
     remover — a de que o site demora a responder. */
  useEffect(() => {
    const janela = quadroRef.current?.contentWindow;
    if (!janela) return;
    const msg: TemaAoVivoMsg = {
      tipo: "enlace:tema",
      accent: cor1 || undefined,
      ink: cor2 || undefined,
      paper: cor3 || undefined,
      display: fonte || undefined,
    };
    // Alvo explícito, nunca "*": a mensagem não tem segredo, mas mandar para
    // qualquer origem é o hábito que um dia carrega algo que tem.
    janela.postMessage(msg, window.location.origin);
  }, [cor1, cor2, cor3, fonte, carregado]);

  const pronto = carregado === src;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--c-mark)">
          O site de vocês
        </p>
        <div
          role="group"
          aria-label="Ver em"
          className="flex items-center gap-1 rounded-[3px] border border-(--c-rule) p-1"
        >
          {(
            [
              { id: "desktop", rotulo: "Computador" },
              { id: "celular", rotulo: "Celular" },
            ] as const
          ).map(({ id, rotulo }) => {
            const ativo = dispositivo === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setDispositivo(id)}
                aria-pressed={ativo}
                className={`rounded-[2px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  ativo
                    ? "bg-[#1a1d21] text-white"
                    : "text-(--c-ink) hover:bg-(--c-sunken)"
                }`}
              >
                {rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={palcoRef}
        className="w-full overflow-hidden rounded-xl bg-[#1c1c1c] p-2.5 sm:p-3.5"
      >
        <div
          className="relative mx-auto overflow-hidden rounded-lg bg-white shadow-2xl"
          style={{
            width: larguraVirtual * escala,
            height: alturaVirtual * escala,
          }}
        >
          <iframe
            ref={quadroRef}
            /* `key` no dispositivo: trocar a largura virtual precisa de um
               documento novo para o CSS responsivo do molde recalcular. */
            key={dispositivo}
            src={src}
            title="Prévia do site de vocês"
            /* Aparece só depois de carregado E de receber o tema.

               O endereço do quadro não leva as cores, então ele nasce com a
               paleta do molde: num rascunho salvo com cores próprias, isso
               seria um piscar de cor errada a cada vez que o casal volta a
               esta etapa. A mensagem do tema sai no mesmo `onLoad`, antes do
               primeiro quadro visível. */
            onLoad={() => setCarregado(src)}
            className={`block border-0 transition-opacity duration-200 ${
              pronto ? "opacity-100" : "opacity-0"
            }`}
            style={{
              width: larguraVirtual,
              height: alturaVirtual,
              transform: `scale(${escala})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-(--c-ink-2)">
        {/* Diz o que FALTA antes que o casal repare sozinho e ache defeito.
            Foto, presentes e mural dependem do site existir; esta tela é sobre
            o desenho. */}
        As fotos, a lista de presentes e o mural entram depois que o pedido for
        enviado. Aqui o que vale é o desenho.{" "}
        <a
          href={enderecoCompleto}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-(--c-ink) underline underline-offset-2"
        >
          Abrir em outra aba
        </a>
      </p>
    </div>
  );
}
