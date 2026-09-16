"use client";

import { useActionState, useState } from "react";
import {
  editarFamiliaAction,
  apagarFamiliaAction,
} from "@/app/actions/site-actions";

/**
 * Editar e remover uma família, na própria linha da lista.
 *
 * ── Por que remover não apaga ──────────────────────────────────────────────
 *
 * A resposta do convidado é dado de terceiro, e ela não está em backup
 * nenhum: `groups_backup` guarda id, endereço, nome e data de criação — nada
 * de quantos vêm, quem vem ou o recado. Apagar a família apagaria isso para
 * sempre, e o endereço que já está no WhatsApp dela passaria a devolver 404.
 *
 * Então remover tira a família da lista do casal e deixa a resposta gravada;
 * quem abrir o link vê um aviso para falar com os noivos. Decisão do dono em
 * 15/09/2026.
 *
 * ── Por que o aviso dos lugares ────────────────────────────────────────────
 *
 * O casal pode reduzir os lugares — o buffet é dele. O que o sistema não faz é
 * encolher a resposta do convidado para caber: "3 de 2 vêm" é feio e é
 * verdade. O aviso existe para a conta não aparecer errada depois, sem
 * explicação.
 */

type Pessoa = { id: string; nome: string };

export default function AcoesDaFamilia({
  siteId,
  groupId,
  nome,
  lugares,
  pessoas,
  confirmados,
}: {
  siteId: string;
  groupId: string;
  /** Rótulo da família — privado, só o casal vê. */
  nome: string | null;
  lugares: number;
  pessoas: Pessoa[];
  /** null = sem resposta; 0 = respondeu que não vai. */
  confirmados: number | null;
}) {
  const [modo, setModo] = useState<"fechado" | "editar" | "remover">("fechado");
  /* Qual resposta do servidor o casal JÁ VIU quando abriu o formulário.

     Sem isto, salvar deixava o formulário aberto do mesmo jeito e sem dizer
     nada: a linha atualizava atrás, e quem salvou ficava olhando os campos
     sem saber se foi. É o mesmo silêncio da UX-024, em miniatura. Guardar o
     estado visto (em vez de um booleano) é o que permite reabrir o formulário
     depois sem a confirmação velha reaparecer. */
  const [jaVisto, setJaVisto] = useState<unknown>(undefined);
  const [edicao, editar, editando] = useActionState(
    editarFamiliaAction,
    undefined
  );
  const [remocao, remover, removendo] = useActionState(
    apagarFamiliaAction,
    undefined
  );
  /* Linhas em branco para nomes novos. As que já existem vêm do servidor e
     carregam o id — é ele que preserva a resposta individual de quem já
     respondeu quando o casal corrige um nome. */
  const [novas, setNovas] = useState(0);

  const total = pessoas.length + novas;

  const salvouAgora =
    edicao && "saved" in edicao && edicao !== jaVisto ? edicao.message : null;

  if (modo === "fechado" || salvouAgora) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        {salvouAgora && (
          <p role="status" className="text-[12.5px] text-(--c-ink-2)">
            {salvouAgora}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              // O que já foi visto fica para trás: o formulário reabre limpo.
              setJaVisto(edicao);
              setModo("editar");
            }}
            className="text-[12.5px] text-(--c-ink-2) underline underline-offset-4 hover:text-(--c-ink)"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              setJaVisto(edicao);
              setModo("remover");
            }}
            className="text-[12.5px] text-(--c-ink-2) underline underline-offset-4 hover:text-(--c-danger)"
          >
            Remover
          </button>
        </div>
      </div>
    );
  }

  if (modo === "remover") {
    return (
      <form action={remover} className="flex flex-col gap-2.5">
        <input type="hidden" name="siteId" value={siteId} />
        <input type="hidden" name="groupId" value={groupId} />

        <p className="text-[13.5px] text-(--c-ink)">
          Remover {nome ? `a ${nome}` : "esta família"}?
        </p>
        <p className="text-[12.5px] leading-relaxed text-(--c-ink-2)">
          Ela sai da sua lista. Quem abrir o endereço que vocês mandaram vai ver
          um aviso para falar com vocês, em vez do convite.
          {confirmados !== null && (
            <>
              {" "}
              A resposta que eles já deram (
              {confirmados === 0
                ? "não vão"
                : `${confirmados} ${confirmados === 1 ? "vem" : "vêm"}`}
              ) fica guardada, mas sai das suas contas.
            </>
          )}
        </p>

        {remocao && "error" in remocao && (
          <p role="alert" className="text-[12.5px] text-(--c-danger)">
            {remocao.error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={removendo}
            className="btn btn-ink btn-sm"
          >
            {removendo ? "Removendo…" : "Remover família"}
          </button>
          <button
            type="button"
            onClick={() => setModo("fechado")}
            className="text-[12.5px] text-(--c-ink-2) underline underline-offset-4 hover:text-(--c-ink)"
          >
            Manter
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={editar} className="flex flex-col gap-3">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="groupId" value={groupId} />

      <label className="flex flex-col gap-1">
        <span className="text-[12.5px] text-(--c-ink-2)">Nome da família</span>
        <input
          type="text"
          name="label"
          defaultValue={nome ?? ""}
          maxLength={120}
          className="campo"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[12.5px] text-(--c-ink-2)">Quantos lugares</span>
        <input
          type="number"
          name="lugares"
          min={1}
          max={20}
          defaultValue={lugares}
          className="campo w-24"
        />
        {pessoas.length > 0 && (
          <span className="text-[11.5px] text-(--c-ink-2)">
            Com os nomes escritos abaixo, a conta sai deles.
          </span>
        )}
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12.5px] text-(--c-ink-2)">
          Quem foi convidado
        </legend>
        {pessoas.map((p) => (
          <span key={p.id} className="flex flex-col">
            <input type="hidden" name="pessoaId" value={p.id} />
            <input
              type="text"
              name="nome"
              defaultValue={p.nome}
              maxLength={120}
              className="campo"
            />
          </span>
        ))}
        {Array.from({ length: novas }).map((_, i) => (
          <span key={`nova-${i}`} className="flex flex-col">
            <input type="hidden" name="pessoaId" value="" />
            <input
              type="text"
              name="nome"
              maxLength={120}
              placeholder={`Pessoa ${pessoas.length + i + 1}`}
              className="campo"
            />
          </span>
        ))}
        {total < 20 && (
          <button
            type="button"
            onClick={() => setNovas((n) => n + 1)}
            className="self-start text-[12.5px] text-(--c-ink-2) underline underline-offset-4 hover:text-(--c-ink)"
          >
            + acrescentar pessoa
          </button>
        )}
        {pessoas.length > 0 && (
          <span className="text-[11.5px] leading-relaxed text-(--c-ink-2)">
            Apagar um nome tira essa pessoa da família. Corrigir a escrita
            mantém a resposta dela.
          </span>
        )}
      </fieldset>

      {/* O aviso aparece enquanto ainda dá para desistir — depois de salvar,
          o casal veria "3 de 2 vêm" na lista sem saber de onde veio. */}
      {confirmados !== null && confirmados > 0 && (
        <p className="text-[12px] leading-relaxed text-(--c-warn)">
          Esta família já confirmou {confirmados}{" "}
          {confirmados === 1 ? "pessoa" : "pessoas"}. Se vocês deixarem menos
          lugares que isso, a resposta continua valendo como foi dada — falem
          com eles antes.
        </p>
      )}

      {edicao && "error" in edicao && (
        <p role="alert" className="text-[12.5px] text-(--c-danger)">
          {edicao.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={editando}
          className="btn btn-ink btn-sm"
        >
          {editando ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setModo("fechado")}
          className="text-[12.5px] text-(--c-ink-2) underline underline-offset-4 hover:text-(--c-ink)"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
