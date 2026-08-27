"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icone, type NomeDoIcone } from "@/components/ui/prensa";
import type { Aviso } from "@/lib/site/avisos";
import { quando } from "@/lib/site/tempoRelativo";

/**
 * Faixa J1 · o sino do painel.
 *
 * O conteúdo vem derivado do banco (ver `lib/site/avisos.ts`). O que mora aqui
 * é só o que depende do navegador.
 *
 * ── O que este sino NÃO tem, e por quê ─────────────────────────────────────
 *
 * O desenho J1 marca cada linha como lida ou não lida, com ponto em `--mark` e
 * "marcar tudo como lido". Isso é estado do CASAL, não do casamento: não sai
 * de nenhum fato já gravado e pediria coluna nova — migração que não entra de
 * carona numa passada visual, num banco com casamento no ar.
 *
 * Tentei resolver com `localStorage` e desisti por uma razão melhor que a
 * dificuldade técnica: "lido" preso a um aparelho é pior que ausente. O casal
 * são DUAS pessoas, quase sempre em dois celulares; o badge zeraria para quem
 * abriu e continuaria aceso para a outra, e cada um acharia que o número está
 * errado.
 *
 * Então o contador conta o que é verificável dos dois lados: **quantos avisos
 * aconteceram nos últimos sete dias** — número que o servidor calcula e que
 * decai sozinho. A janela está escrita na tela, para ninguém procurar um botão
 * de marcar como lido que não existe.
 *
 * ── Por que `agora` entra no clique ────────────────────────────────────────
 *
 * `Date.now()` durante o render é impuro (o lint reprova, com razão) e num
 * render de servidor com Cache Components congelaria — o casal veria "há 12
 * min" por horas. Como só há tempo relativo DENTRO do painel, ele é lido no
 * gesto que abre o painel.
 */

const ICONE: Record<Aviso["tipo"], NomeDoIcone> = {
  presente: "presente",
  confirmacoes: "pessoas",
  prazo: "alerta",
  "no-ar": "check",
};

const COR: Record<Aviso["tom"], string> = {
  neutro: "text-(--c-ink-2)",
  ok: "text-(--c-ok)",
  warn: "text-(--c-warn)",
};

/** Cabeçalho do bloco: Hoje / Ontem / a data. */
function faixaDoDia(em: Date, agora: number): string {
  const dias = Math.floor((agora - em.getTime()) / 86_400_000);
  if (dias < 1) return "Hoje";
  if (dias < 2) return "Ontem";
  return em.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export default function Avisos({
  avisos,
  recentes,
}: {
  avisos: Aviso[];
  /** Quantos caem na janela de sete dias. Vem do servidor — ver o cabeçalho. */
  recentes: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [agora, setAgora] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora e no Esc — as duas saídas que todo painel flutuante
  // precisa ter para não virar armadilha.
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  function alternar() {
    // O relógio é lido AQUI: gesto do usuário, não render.
    if (!aberto) setAgora(Date.now());
    setAberto((v) => !v);
  }

  // Agrupa por faixa de dia preservando a ordem (os avisos já vêm do mais novo
  // para o mais velho).
  const blocos: { titulo: string; itens: Aviso[] }[] = [];
  for (const aviso of avisos) {
    const titulo = faixaDoDia(aviso.em, agora);
    const ultimo = blocos[blocos.length - 1];
    if (ultimo?.titulo === titulo) ultimo.itens.push(aviso);
    else blocos.push({ titulo, itens: [aviso] });
  }

  return (
    <div ref={caixa} className="relative shrink-0">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        aria-label={
          recentes > 0
            ? `Avisos — ${recentes} nos últimos sete dias`
            : "Avisos"
        }
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-[2px] text-(--c-ink) transition-colors hover:bg-(--c-sunken) cursor-pointer"
      >
        <Icone nome="sino" tamanho={20} />
        {recentes > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-(--c-mark) text-white t-data text-[10px] leading-4 text-center">
            {recentes}
          </span>
        )}
      </button>

      {aberto && (
        <div className="motion-fade-in absolute right-0 top-full z-40 mt-2 w-[min(92vw,420px)] surface-raised rounded-[3px] shadow-[0_16px_48px_rgb(26_29_33/0.20)] overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-(--c-rule) px-5 py-4">
            <span className="meta text-(--c-ink)">Avisos</span>
            <span className="meta text-[10px] text-(--c-ink-2)">
              últimos 30 dias
            </span>
          </div>

          {avisos.length === 0 ? (
            <div className="px-5 py-8 text-center flex flex-col gap-1.5">
              <p className="t-display text-[20px] text-(--c-ink)">
                Nada novo por aqui
              </p>
              <p className="t-corpo-p text-(--c-ink-2)">
                Respostas dos convidados e presentes aparecem aqui assim que
                chegarem.
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {blocos.map((bloco) => (
                <div key={bloco.titulo}>
                  <div className="bg-(--c-base) border-b border-(--c-rule) px-5 py-2">
                    <span className="meta text-[10.5px] text-(--c-ink-2)">
                      {bloco.titulo}
                    </span>
                  </div>
                  {bloco.itens.map((aviso) => (
                    <div
                      key={aviso.id}
                      className="flex gap-3.5 px-5 py-4 border-b border-(--c-rule) last:border-b-0"
                    >
                      <span
                        className={`mt-0.5 shrink-0 ${COR[aviso.tom]}`}
                        aria-hidden="true"
                      >
                        <Icone nome={ICONE[aviso.tipo]} tamanho={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] leading-[21px] text-(--c-ink)">
                          {aviso.principal.antes}
                          <strong className="font-semibold">
                            {aviso.principal.forte}
                          </strong>
                          {aviso.principal.depois}
                        </p>
                        <p className="text-[11.5px] text-(--c-ink-2) mt-1">
                          {aviso.detalhe} ·{" "}
                          <span className="t-data">
                            {quando(aviso.em, agora)}
                          </span>
                        </p>
                        {/* Todo aviso acionável leva o link junto: aviso sem
                            próximo passo é só ansiedade (regra J3). */}
                        {aviso.acao && (
                          <Link
                            href={aviso.acao.href}
                            onClick={() => setAberto(false)}
                            className="inline-block mt-1.5 text-[12.5px] text-(--c-ink) underline underline-offset-4"
                          >
                            {aviso.acao.rotulo}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
