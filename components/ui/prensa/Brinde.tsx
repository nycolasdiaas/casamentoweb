"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/**
 * A4 · O brinde — a confirmação que passa e some.
 *
 * O produto não escreve "toast": Voz V5 proíbe termo técnico em texto visível,
 * e o nome vale também para o código, senão o vocabulário fica com duas
 * verdades e a próxima pessoa não sabe qual procurar.
 *
 * ── Onde ele serve, e onde não ─────────────────────────────────────────────
 *
 * Serve quando a ação **não tem onde mostrar o resultado**: o autosave do
 * conteúdo (o formulário continua igual), o fim de um envio de fotos (a grade
 * já mudou, mas ninguém garante que o casal estava olhando para ela).
 *
 * NÃO serve para erro. Voz V4 é explícita: erro de campo mora **abaixo do
 * campo**, nunca flutuando no canto — quem errou está olhando para o campo.
 * Esta peça só confirma.
 *
 * E não serve onde já existe confirmação melhor: `CopiarLink` mostra
 * "Copiado" dentro do próprio botão, que é onde o dedo está. Ver a nota nele.
 *
 * ── A fórmula do texto ─────────────────────────────────────────────────────
 *
 * Voz V4: **resultado no passado, com ponto final.** "Suas fotos estão no
 * site.", nunca "Upload realizado com sucesso!". Por isso o texto vem de quem
 * dispara e esta peça não tem padrão nenhum: montar frase aqui seria decidir
 * a voz longe de onde a ação acontece.
 */

type Item = { id: number; texto: string };

const BrindeContexto = createContext<((texto: string) => void) | null>(null);

/** Quantos cabem na tela ao mesmo tempo (HANDOFF-motion §4). */
const TETO = 3;

/**
 * Quando o nó sai do DOM.
 *
 * 4140 e não 4000: são os 4s de permanência que o handoff pede MAIS os 140ms
 * (`--t-rapido`) da saída. Remover em 4000 cortaria o fade pela metade — o
 * brinde sumiria no meio do próprio movimento de sair, que é o defeito que a
 * animação existe para não ter. O número casa com a duração de
 * `.brinde` em `globals.css`; os dois mudam juntos.
 */
const PERMANENCIA = 4140;

export function useBrinde(): (texto: string) => void {
  const mostrar = useContext(BrindeContexto);
  /* Sem provider, o brinde vira função vazia em vez de erro. Uma confirmação
     que não aparece é uma falha de acabamento; uma tela que quebra porque a
     confirmação não achou o provider é uma falha de produto. */
  return mostrar ?? (() => {});
}

export function BrindeProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<Item[]>([]);
  const proximo = useRef(0);

  const mostrar = useCallback((texto: string) => {
    const id = ++proximo.current;
    setItens((atuais) => {
      /* O quarto disparo descarta o MAIS ANTIGO na hora, sem esperar os 4s
         dele: quatro linhas empilhadas viram um bloco, e um bloco não é uma
         confirmação passageira — é um painel que ninguém pediu. */
      const cabem = atuais.length >= TETO ? atuais.slice(1) : atuais;
      return [...cabem, { id, texto }];
    });
    window.setTimeout(() => {
      setItens((atuais) => atuais.filter((i) => i.id !== id));
    }, PERMANENCIA);
  }, []);

  const valor = useMemo(() => mostrar, [mostrar]);

  return (
    <BrindeContexto.Provider value={valor}>
      {children}
      {/* `role="status"` com `aria-live="polite"`: o leitor de tela anuncia ao
          terminar a frase atual, em vez de interromper quem está no meio de
          uma leitura. Mesma escolha do `BrandLoader`. */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {itens.map((item) => (
          <div
            key={item.id}
            className="brinde flex items-center gap-3 rounded-[3px] bg-[#1a1d21] px-4 py-3.5 shadow-[0_8px_24px_rgb(26_29_33/0.22)]"
          >
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-[#5fae86]"
            />
            <span className="text-[13.5px] leading-none text-white">
              {item.texto}
            </span>
          </div>
        ))}
      </div>
    </BrindeContexto.Provider>
  );
}
