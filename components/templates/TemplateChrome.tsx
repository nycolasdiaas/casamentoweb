"use client";

import { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
import Link from "next/link";
import { WHATSAPP_LINK } from "@/lib/site";
import { PACKAGES, type PackageTier } from "@/lib/packages";
import { TEMPLATE_STYLES, type TemplateStyleId } from "@/lib/templates";
import type { ReactNode } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import PaperBackdrop from "@/components/webgl/PaperBackdrop";

gsap.registerPlugin(useGSAP, Flip);

// Moldura comum das 3 prévias de template: fundo escuro "letterbox", cartão
// central de até 480px (como as prévias foram desenhadas, pensando em
// celular), barra de navegação fixa com o seletor de pacote (mesma prévia
// muda de seções conforme o pacote escolhido) e CTA de WhatsApp no rodapé.
export default function TemplateChrome({
  styleId,
  styleName,
  outerBg,
  cardBg,
  ink,
  accent,
  tier,
  onTierChange,
  children,
}: {
  styleId: TemplateStyleId;
  styleName: string;
  outerBg: string;
  cardBg: string;
  ink: string;
  accent: string;
  tier: PackageTier;
  onTierChange: (tier: PackageTier) => void;
  children: ReactNode;
}) {
  /**
   * Modo EMBUTIDO: sem a barra de navegação e sem o CTA do rodapé.
   *
   * A prévia do modelo aparece DENTRO do questionário, e ali a barra
   * oferecia "← Pacotes" e "Minha conta" — dois convites para o casal
   * abandonar o pedido no meio. Os seletores de modelo e de pacote também
   * saem: a etapa já tem os dela, e dois controles para a mesma escolha
   * na mesma tela é convite a divergirem.
   */
  const embutido = useSearchParams().get("embutido") === "1";

  const raiz = useRef<HTMLDivElement>(null);
  const estadoAntes = useRef<ReturnType<typeof Flip.getState> | null>(null);

  /**
   * Trocar de pacote muda QUAIS seções existem — é a única interação da
   * vitrine que acontece sem sair da página, e por isso a única em que dá
   * para animar o rearranjo em vez do redesenho.
   *
   * O truque do Flip é medir ANTES: aqui guardamos a posição de cada seção,
   * o React troca o conteúdo, e o efeito abaixo interpola de uma para a
   * outra. Sem esta captura no clique, não há "antes" com que comparar.
   */
  const trocarPacote = (novo: PackageTier) => {
    if (novo === tier) return;
    if (raiz.current) {
      estadoAntes.current = Flip.getState(
        raiz.current.querySelectorAll("section, [data-secao]")
      );
    }
    onTierChange(novo);
  };

  useGSAP(
    () => {
      const querMenos =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        document.documentElement.dataset.movimento !== "ligado";

      // Sem estado guardado, não houve troca de pacote — nada a fazer aqui.
      //
      // NÃO existe animação de entrada nesta função, e é deliberado: quem
      // revela as seções é o `RevealOnScroll` logo abaixo, com ScrollTrigger.
      // Uma entrada aqui disputaria os MESMOS elementos com ele — duas
      // animações escrevendo transform no mesmo nó — e ainda animaria a
      // primeira seção, que já está na tela quando a página abre. Animar o
      // que já está visível faz piscar, e é justamente por isso que o
      // RevealOnScroll pula a primeira.
      if (!estadoAntes.current) return;

      // TROCA DE PACOTE: o rearranjo.
      const estado = estadoAntes.current;
      estadoAntes.current = null;
      if (querMenos) return;

      Flip.from(estado, {
        duration: 0.55,
        ease: "power2.inOut",
        stagger: 0.03,
        // `absolute` tira os alvos do fluxo durante a interpolação; sem isso,
        // as seções que ficam empurram umas às outras enquanto animam e o
        // movimento vira tranco.
        absolute: true,
        // Seção que o pacote novo LIBERA não tinha "antes": ela nasce —
        // e fica MARCADA por um instante.
        //
        // Trocar de plano só rearranjava, e a crítica foi exata: "não dá
        // pra ver o que mudou". O contorno na cor de acento responde a
        // pergunta que a troca levanta — o que este pacote me deu? — e
        // some sozinho, porque é resposta, não decoração.
        onEnter: (elementos) => {
          elementos.forEach((el) => el.classList.add("secao-nova"));
          gsap.delayedCall(2.2, () =>
            elementos.forEach((el) => el.classList.remove("secao-nova"))
          );
          return gsap.fromTo(
            elementos,
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" }
          );
        },
        // E a que o pacote novo não inclui sai, em vez de sumir num quadro.
        onLeave: (elementos) =>
          gsap.to(elementos, {
            opacity: 0,
            scale: 0.96,
            duration: 0.3,
            ease: "power2.in",
          }),
      });
    },
    { dependencies: [tier], scope: raiz }
  );

  return (
    <div
      ref={raiz}
      className="min-h-screen w-full flex justify-center"
      style={{ background: outerBg }}
    >
      {/* 480px no celular — que é o desenho de origem e não muda — e TELA
          CHEIA a partir de 1024px.
          Estas são as páginas de VENDA: quem está decidindo comprar olha no
          computador, e antes o cartão parava em 1120px, deixando duas faixas
          de fundo dos lados. O corte em `lg` é o mesmo do site de verdade;
          tablet em retrato ainda lê melhor em coluna.
          O `@container` acompanha o motor de templates, para as seções
          responderem à largura do cartão. */}
      <div
        id="vitrine"
        className="site-canvas @container relative isolate w-full max-w-[480px] lg:max-w-none flex flex-col shadow-2xl"
        style={{ background: cardBg }}
      >
        {/* A tinta em WebGL na cor de ACENTO deste molde: cada estilo ganha o
            próprio papel sem uma linha de código por molde, e um molde novo
            herda sem saber que existe.

            `forca` baixa (0.09) porque aqui ela passa por baixo do conteúdo
            inteiro, não só de um hero — no mesmo valor do hero viraria fundo
            estampado e brigaria com a tipografia do molde.

            Fica SÓ na vitrine. O site do convidado não paga os ~170 KB do
            three: ele é aberto pelo WhatsApp, no celular, com meta de LCP de
            2,5 s. */}
        <PaperBackdrop tinta={accent} forca={0.09} />
        {!embutido && (
        <div
          className="sticky top-0 z-50 flex flex-col gap-2.5 px-4 py-2.5 text-[11px]"
          style={{
            background: cardBg,
            borderBottom: `1px solid ${accent}66`,
            color: ink,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="underline underline-offset-2">
              ← Pacotes
            </Link>
            <Link href="/conta" className="underline underline-offset-2">
              Minha conta
            </Link>
          </div>

          {/* Trocar de modelo sem sair da prévia (mantém o pacote atual).
              min-w-0 é essencial: sem ele, um item flex não encolhe abaixo do
              conteúdo e a linha estoura a tela em aparelhos estreitos — a
              rolagem horizontal (overflow-x-auto) é o fallback nesse caso. */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-9 sm:w-12 tracking-[0.12em] uppercase text-[9px] opacity-55">
              Modelo
            </span>
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
              <div className="flex gap-1.5 w-max">
                {TEMPLATE_STYLES.map((t) => {
                  const active = t.id === styleId;
                  return (
                    <Link
                      key={t.id}
                      href={`/pacotes/estilos/${t.id}?pacote=${tier}`}
                      aria-current={active ? "page" : undefined}
                      className="shrink-0 whitespace-nowrap text-center leading-tight px-3 py-1.5 rounded-full border transition-colors"
                      style={{
                        background: active ? ink : "transparent",
                        borderColor: active ? ink : `${ink}33`,
                        color: active ? cardBg : ink,
                        opacity: active ? 1 : 0.7,
                      }}
                    >
                      {t.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Trocar de pacote (muda quais seções aparecem) */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-9 sm:w-12 tracking-[0.12em] uppercase text-[9px] opacity-55">
              Pacote
            </span>
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
              <div className="flex gap-1.5 w-max">
                {PACKAGES.map((pkg) => {
                  const active = pkg.tier === tier;
                  return (
                    <button
                      key={pkg.tier}
                      type="button"
                      onClick={() => trocarPacote(pkg.tier)}
                      className="shrink-0 whitespace-nowrap text-center leading-tight px-3 py-1.5 rounded-full border transition-colors"
                      style={{
                        background: active ? accent : "transparent",
                        borderColor: active ? accent : `${ink}33`,
                        color: active ? cardBg : ink,
                        opacity: active ? 1 : 0.7,
                      }}
                    >
                      {pkg.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="text-center opacity-70">
            {PACKAGES.find((pkg) => pkg.tier === tier)?.price} · prévia deste
            pacote no template {styleName}
          </p>
        </div>
        )}

        {/* A vitrine nao tinha NENHUMA revelacao na rolagem: as 6 paginas
            apareciam prontas enquanto a pessoa descia. Mora aqui, no quadro,
            para alcancar os 6 moldes de uma vez — e um molde novo herdar sem
            precisar saber que existe. */}
        <RevealOnScroll raiz="#vitrine" />

        <div className="relative z-10 flex flex-col">{children}</div>

        {!embutido && (
        <div
          className="flex flex-col items-center gap-3 px-6 py-12 text-center"
          style={{ background: ink }}
        >
          <p className="text-sm" style={{ color: cardBg }}>
            Gostaram deste modelo?
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium tracking-wide px-7 py-3 rounded-full transition-opacity hover:opacity-90"
            style={{ background: accent, color: ink }}
          >
            Quero um site assim
          </a>
        </div>
        )}
      </div>
    </div>
  );
}
