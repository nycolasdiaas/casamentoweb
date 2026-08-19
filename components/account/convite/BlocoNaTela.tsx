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
 * - BORDA (os círculos): esquerda e direita esticam só a LARGURA — as únicas
 *   que um texto tem, porque a altura dele vem do número de linhas. Cima e
 *   baixo esticam só a ALTURA, e existem onde ela é campo próprio.
 * - ROTAÇÃO: a área invisível LOGO FORA de cada canto, como no Figma e no
 *   Canva. Não tem desenho próprio de propósito — quatro bolinhas a mais
 *   entulhariam um bloco pequeno; o que anuncia a alça é o cursor mudar ao
 *   chegar perto. Fica por fora do canto justamente para não disputar o
 *   clique com ele.
 */

type Props = {
  bloco: Bloco;
  ativo: boolean;
  /** Este bloco está sendo digitado agora? */
  editando: boolean;
  aoAvisarElemento: (id: string, el: HTMLDivElement | null) => void;
  aoPegar: (
    e: React.PointerEvent,
    bloco: Bloco,
    tipo: "mover" | "largura" | "canto" | "girar" | "altura"
  ) => void;
  aoEditarTexto: (id: string, texto: string) => void;
  aoComecarEdicao: (id: string) => void;
  aoTerminarEdicao: () => void;
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
  editando,
  aoAvisarElemento,
  aoPegar,
  aoEditarTexto,
  aoComecarEdicao,
  aoTerminarEdicao,
}: Props) {
  const temAltura = b.tipo === "foto" || b.tipo === "forma";

  return (
    <div
      ref={(el) => aoAvisarElemento(b.id, el)}
      onPointerDown={(e) => {
        // Digitando: o ponteiro pertence ao campo, não ao arrasto.
        if (editando) return;
        aoPegar(e, b, "mover");
      }}
      onDoubleClick={() => {
        if (b.tipo === "texto") aoComecarEdicao(b.id);
      }}
      style={{
        ...estiloDoBloco(b),
        outline: ativo ? "1.5px solid var(--c-mark)" : undefined,
        outlineOffset: 2,
        cursor: "grab",
      }}
    >
      {/* Digitar NO PRÓPRIO BLOCO, com dois cliques.
          Antes o texto só se editava por um campo no painel lateral — longe
          do olho, e fora de alcance quando o painel rolava. Aqui a pessoa vê
          a fonte, o tamanho e a cor reais enquanto escreve.

          O `textarea` é transparente e herda a tipografia do bloco: é o
          próprio desenho que se edita, não uma caixa por cima dele. */}
      {editando && b.tipo === "texto" ? (
        <textarea
          autoFocus
          value={b.texto}
          onChange={(e) => aoEditarTexto(b.id, e.target.value)}
          onBlur={aoTerminarEdicao}
          onKeyDown={(e) => {
            // Escape sai; Enter quebra linha, como em qualquer texto.
            if (e.key === "Escape") aoTerminarEdicao();
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full resize-none bg-transparent outline-none"
          style={{
            fontSize: `${b.tamanho * 100}cqw`,
            color: b.cor,
            fontWeight: b.peso,
            textAlign: b.alinhamento,
            letterSpacing: `${b.espacamento}em`,
            lineHeight: 1.25,
            fontFamily:
              b.fonte === "sans"
                ? "var(--font-sans, sans-serif)"
                : b.fonte === "script"
                  ? "cursive"
                  : "var(--font-serif, serif)",
            // Cresce com o conteúdo: uma caixa de altura fixa cortaria o
            // texto que a pessoa está escrevendo.
            height: "auto",
            minHeight: "1.25em",
            overflow: "hidden",
            cursor: "text",
          }}
          rows={Math.max(1, b.texto.split("\n").length)}
        />
      ) : (
        <BlocoVisual bloco={b} />
      )}

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

          {/* BORDAS: esticar num eixo só. A da direita e a da esquerda mexem
              na largura (todo bloco tem); as de cima e de baixo, na altura —
              e essas só existem onde há altura própria, pelo mesmo motivo dos
              cantos. */}
          <span
            onPointerDown={(e) => aoPegar(e, b, "largura")}
            className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border border-white bg-(--c-mark)"
            style={{ cursor: "ew-resize" }}
          />
          <span
            onPointerDown={(e) => aoPegar(e, b, "largura")}
            className="absolute -left-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border border-white bg-(--c-mark)"
            style={{ cursor: "ew-resize" }}
          />

          {temAltura && (
            <>
              <span
                onPointerDown={(e) => aoPegar(e, b, "altura")}
                className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full border border-white bg-(--c-mark)"
                style={{ cursor: "ns-resize" }}
              />
              <span
                onPointerDown={(e) => aoPegar(e, b, "altura")}
                className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full border border-white bg-(--c-mark)"
                style={{ cursor: "ns-resize" }}
              />
            </>
          )}

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
