"use client";

import { useSyncExternalStore } from "react";

/**
 * A legenda de atalhos do editor de convite.
 *
 * Atalho que ninguém descobre é atalho que não existe. Sem esta lista, os doze
 * atalhos do editor seriam uma funcionalidade que só quem escreveu o código
 * sabe usar — e o casal continuaria arrastando bloco a bloco com o mouse para
 * mover 3px.
 *
 * O modificador é lido da plataforma no CLIENTE: escrever "Ctrl" para quem
 * está num Mac faz a legenda apontar para uma tecla que não faz nada ali. E
 * não dá para saber isso no servidor.
 */

const ATALHOS: { teclas: string; o_que: string }[] = [
  { teclas: "{cmd} + Z", o_que: "Desfazer" },
  { teclas: "{cmd} + Shift + Z", o_que: "Refazer" },
  { teclas: "{cmd} + D", o_que: "Duplicar o bloco" },
  { teclas: "{cmd} + C · {cmd} + V", o_que: "Copiar e colar o bloco" },
  { teclas: "Setas", o_que: "Mover 1px" },
  { teclas: "Shift + setas", o_que: "Mover 10px" },
  { teclas: "[ · ]", o_que: "Mandar para trás · trazer para frente" },
  { teclas: "+ · −", o_que: "Aproximar · afastar" },
  { teclas: "0", o_que: "Convite inteiro na tela" },
  { teclas: "Espaço + arrastar", o_que: "Mover a tela" },
  { teclas: "Alt (arrastando)", o_que: "Sem encaixe" },
  { teclas: "Delete", o_que: "Remover o bloco" },
  { teclas: "Esc", o_que: "Sair da seleção" },
];

const ASSINATURA_VAZIA = () => () => {};

/** "Cmd" no Mac, "Ctrl" no resto. Escrever o errado aponta para uma tecla que não faz nada. */
function teclaDeComando(): string {
  const plataforma =
    // `userAgentData` é o caminho novo; `platform` ainda é o que existe em
    // todo navegador que o casal usa.
    (navigator as { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ??
    navigator.platform ??
    "";
  return /mac|iphone|ipad/i.test(plataforma) ? "Cmd" : "Ctrl";
}

export default function LegendaDeAtalhos({
  aberto,
  aoFechar,
}: {
  aberto: boolean;
  aoFechar: () => void;
}) {
  /* `useSyncExternalStore` e não `useState` + efeito: o servidor não tem
     plataforma nenhuma, então o valor precisa nascer diferente dos dois lados
     sem quebrar a hidratação — e é exatamente para isso que o terceiro
     argumento (o retrato do servidor) existe. Guardar em estado e corrigir num
     efeito daria o mesmo resultado com um render a mais, e é o que o lint
     reprova com razão.

     A assinatura nunca chama de volta: a plataforma não muda no meio da
     sessão. */
  const cmd = useSyncExternalStore(ASSINATURA_VAZIA, teclaDeComando, () => "Ctrl");

  if (!aberto) return null;

  return (
    <div
      role="dialog"
      aria-label="Atalhos do editor"
      className="surface-raised absolute bottom-full right-0 z-30 mb-2 w-[290px] rounded-[3px] p-3 shadow-[0_6px_24px_rgba(26,29,33,0.18)]"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="meta text-(--c-ink-2)">Atalhos</span>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar atalhos"
          className="px-1 text-[15px] leading-none text-(--c-ink-3) hover:text-(--c-ink)"
        >
          ✕
        </button>
      </div>
      <dl className="flex flex-col gap-1.5">
        {ATALHOS.map((a) => (
          <div key={a.o_que} className="flex items-baseline justify-between gap-3">
            <dt className="t-data shrink-0 text-[11.5px] text-(--c-ink)">
              {a.teclas.replaceAll("{cmd}", cmd)}
            </dt>
            <dd className="text-right text-[12px] leading-tight text-(--c-ink-2)">
              {a.o_que}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
