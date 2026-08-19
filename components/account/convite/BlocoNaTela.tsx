"use client";

import type { Bloco } from "@/lib/site/inviteDoc";
import BlocoVisual, { estiloDoBloco } from "./BlocoVisual";

/**
 * Um bloco na tela do editor, com as alças de quem está escolhido.
 *
 * Componente próprio por dois motivos. O primeiro é honesto: o loop estava
 * dentro do `EditorDeConvite` e o `react-hooks/refs` reprovava — guardar o
 * elemento num `Map` durante o render é leitura de ref no render, e a regra
 * não tem como saber que a escrita acontece no callback. Aqui o ref é do
 * PRÓPRIO componente, e o pai recebe o elemento por uma função de aviso.
 *
 * O segundo é que as alças ficaram muitas: quatro cantos, uma de largura e
 * quatro de rotação. Isso já é uma peça com regra própria.
 *
 * ── As alças ───────────────────────────────────────────────────────────────
 *
 * - CANTO (o quadradinho): largura e altura juntas — achatar e esticar.
 *   Só onde há altura própria a mexer (foto e forma); num texto a altura vem
 *   do número de linhas, e num divisor, da espessura.
 * - LARGURA (o círculo à direita): só a largura. É a única que o texto tem.
 * - ROTAÇÃO: a área invisível LOGO FORA de cada canto, como no Figma e no
 *   Canva. Não tem desenho próprio de propósito — quatro bolinhas a mais
 *   entulhariam um bloco pequeno; o que anuncia a alça é o cursor mudar ao
 *   chegar perto. Fica por fora do canto justamente para não disputar o
 *   clique com ele.
 */

type Props = {
  bloco: Bloco;
  ativo: boolean;
  aoAvisarElemento: (id: string, el: HTMLDivElement | null) => void;
  aoPegar: (
    e: React.PointerEvent,
    bloco: Bloco,
    tipo: "mover" | "largura" | "canto" | "girar"
  ) => void;
};

const CANTOS = [
  { classe: "-left-1.5 -top-1.5", cursor: "nwse-resize", giro: "-left-5 -top-5" },
  { classe: "-right-1.5 -top-1.5", cursor: "nesw-resize", giro: "-right-5 -top-5" },
  { classe: "-left-1.5 -bottom-1.5", cursor: "nesw-resize", giro: "-left-5 -bottom-5" },
  { classe: "-right-1.5 -bottom-1.5", cursor: "nwse-resize", giro: "-right-5 -bottom-5" },
] as const;

/**
 * O cursor de girar.
 *
 * Não existe `cursor: rotate` no CSS, então é um SVG embutido — o mesmo
 * caminho que Figma e Canva usam. Vai como data URI porque um arquivo
 * separado seria mais uma requisição para 300 bytes de desenho.
 */
const CURSOR_GIRAR =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M15.5 10a5.5 5.5 0 1 1-1.9-4.2' fill='none' stroke='white' stroke-width='3.4' stroke-linecap='round'/%3E%3Cpath d='M15.5 3.2v3.4h-3.4' fill='none' stroke='white' stroke-width='3.4' stroke-linejoin='round'/%3E%3Cpath d='M15.5 10a5.5 5.5 0 1 1-1.9-4.2' fill='none' stroke='%231a1d21' stroke-width='1.6' stroke-linecap='round'/%3E%3Cpath d='M15.5 3.2v3.4h-3.4' fill='none' stroke='%231a1d21' stroke-width='1.6' stroke-linejoin='round'/%3E%3C/svg%3E") 10 10, grab`;

export default function BlocoNaTela({
  bloco: b,
  ativo,
  aoAvisarElemento,
  aoPegar,
}: Props) {
  const temAltura = b.tipo === "foto" || b.tipo === "forma";

  return (
    <div
      ref={(el) => aoAvisarElemento(b.id, el)}
      onPointerDown={(e) => aoPegar(e, b, "mover")}
      style={{
        ...estiloDoBloco(b),
        outline: ativo ? "1.5px solid var(--c-mark)" : undefined,
        outlineOffset: 2,
        cursor: "grab",
      }}
    >
      <BlocoVisual bloco={b} />

      {ativo && (
        <>
          {/* Rotação primeiro no DOM, para o canto ficar por cima na
              sobreposição: quem mira o quadradinho quer redimensionar. */}
          {CANTOS.map((c) => (
            <span
              key={`girar-${c.giro}`}
              onPointerDown={(e) => aoPegar(e, b, "girar")}
              aria-hidden
              className={`absolute ${c.giro} size-5`}
              style={{ cursor: CURSOR_GIRAR }}
            />
          ))}

          <span
            onPointerDown={(e) => aoPegar(e, b, "largura")}
            className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border border-white bg-(--c-mark)"
            style={{ cursor: "ew-resize" }}
          />

          {temAltura &&
            CANTOS.map((c) => (
              <span
                key={c.classe}
                onPointerDown={(e) => aoPegar(e, b, "canto")}
                className={`absolute ${c.classe} size-3 border border-white bg-(--c-mark)`}
                style={{ cursor: c.cursor }}
              />
            ))}
        </>
      )}
    </div>
  );
}
