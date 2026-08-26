"use client";

import { useActionState, useState } from "react";
import {
  criarCotaAction,
  editarCotaAction,
  apagarCotaAction,
  type GiftActionResult,
} from "@/app/actions/couple-gift-actions";
import { Botao, Campo, DialogoDestrutivo } from "@/components/ui/prensa";
import { formatPriceCents } from "@/lib/format";

/**
 * E6 · a lista de presentes, editável pelo casal.
 *
 * ── O que existia antes ────────────────────────────────────────────────────
 *
 * As três actions (`criarCotaAction`, `editarCotaAction`, `apagarCotaAction`)
 * estavam implementadas, testadas na borda e **não eram importadas por
 * arquivo nenhum**. A aba mostrava a lista em texto e terminava com:
 *
 *   "Montar e editar as cotas ainda é feito pela nossa equipe. Mandem a lista
 *    de vocês pelo WhatsApp que a gente cadastra."
 *
 * Isso quebrava duas das três promessas do produto de uma vez: o casal
 * trabalhava (montar lista, abrir WhatsApp, esperar resposta) e o dono
 * encostava (cadastrar cota por cota, por venda). O código para não fazer isso
 * já existia; faltava a tela.
 *
 * ── Por que edição inline, e não uma rota de detalhe ───────────────────────
 *
 * Editar uma cota é trocar um nome ou um preço. Uma rota `/presentes/<id>` faria
 * o casal perder a lista de vista para mexer numa linha, e voltar para conferir.
 * O formulário abre no lugar do card e fecha ali mesmo.
 */

type Cota = {
  id: string;
  name: string;
  category: string;
  priceCents: number | null;
  quantity: number | null;
  /** Quantas contribuições esta cota já recebeu. */
  escolhidas: number;
};

export default function Cotas({
  siteId,
  cotas,
}: {
  siteId: string;
  cotas: Cota[];
}) {
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="t-d3 text-(--c-ink)">Cotas de presente</h2>
        {cotas.length > 0 && (
          <span className="meta text-(--c-ink-2)">
            {cotas.length} {cotas.length === 1 ? "cota" : "cotas"}
          </span>
        )}
      </div>

      {cotas.length === 0 && !criando ? (
        <div className="surface-flat border-dashed px-6 py-10 text-center">
          <p className="t-display text-[24px] leading-tight text-(--c-ink)">
            Nenhuma cota ainda
          </p>
          <p className="t-corpo-p mx-auto mt-2 max-w-[46ch] text-(--c-ink-2)">
            Criem cotas — lua de mel, jantar, o que vocês quiserem — e os
            convidados presenteiam por Pix, direto na conta de vocês.
          </p>
          <div className="pt-5">
            <Botao onClick={() => setCriando(true)}>Criar primeira cota</Botao>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {cotas.map((cota) =>
            editando === cota.id ? (
              <li key={cota.id}>
                <FormularioDeCota
                  siteId={siteId}
                  cota={cota}
                  aoFechar={() => setEditando(null)}
                />
              </li>
            ) : (
              <li key={cota.id}>
                <CartaoDaCota
                  siteId={siteId}
                  cota={cota}
                  aoEditar={() => setEditando(cota.id)}
                />
              </li>
            )
          )}
        </ul>
      )}

      {criando ? (
        <FormularioDeCota siteId={siteId} aoFechar={() => setCriando(false)} />
      ) : (
        cotas.length > 0 && (
          <button
            type="button"
            onClick={() => setCriando(true)}
            className="surface-flat flex items-center justify-center gap-2 border-dashed px-4 py-4 text-[14px] text-(--c-ink-2) transition-colors hover:border-(--c-ink) hover:text-(--c-ink)"
          >
            <span aria-hidden className="t-data text-[16px]">
              +
            </span>
            Adicionar cota de presente
          </button>
        )
      )}
    </section>
  );
}

/** Uma cota na lista, com a barra de progresso quando há teto. */
function CartaoDaCota({
  siteId,
  cota,
  aoEditar,
}: {
  siteId: string;
  cota: Cota;
  aoEditar: () => void;
}) {
  const [estado, apagar] = useActionState(
    apagarCotaAction,
    undefined as GiftActionResult
  );

  /* A barra só existe quando o casal definiu um teto.
     Sem teto não há "quanto falta" — e uma barra sem fim é um gráfico que não
     mede nada. O que sobra é a contagem, que é verdade dos dois jeitos. */
  const temTeto = cota.quantity !== null && cota.quantity > 0;
  const pct = temTeto
    ? Math.min(100, Math.round((cota.escolhidas / cota.quantity!) * 100))
    : 0;

  return (
    <div className="surface-raised flex flex-wrap items-center gap-x-5 gap-y-3 p-5">
      <div className="min-w-[12rem] flex-1">
        <p className="text-[15.5px] font-medium text-(--c-ink)">{cota.name}</p>
        <p className="meta mt-1 text-(--c-ink-2)">
          {cota.category}
          {temTeto
            ? ` · ${cota.escolhidas} de ${cota.quantity} escolhidas`
            : cota.escolhidas > 0
              ? ` · ${cota.escolhidas} ${cota.escolhidas === 1 ? "escolhida" : "escolhidas"}`
              : ""}
        </p>

        {temTeto && (
          <div
            role="progressbar"
            aria-valuenow={cota.escolhidas}
            aria-valuemin={0}
            aria-valuemax={cota.quantity!}
            aria-label={`${cota.name}: ${cota.escolhidas} de ${cota.quantity}`}
            className="surface-sunken mt-2.5 h-1.5 overflow-hidden"
          >
            <div className="h-full bg-(--c-ink)" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <div className="text-right">
        <p className="t-data text-[16px] text-(--c-ink)">
          {cota.priceCents === null
            ? "livre"
            : formatPriceCents(cota.priceCents)}
        </p>
        <p className="meta text-(--c-ink-2)">
          {cota.priceCents === null ? "o convidado decide" : "por cota"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={aoEditar}
          className="inline-flex min-h-11 items-center text-[13px] text-(--c-ink) underline underline-offset-4"
        >
          Editar
        </button>
        {/* V4 · diálogo destrutivo: pergunta + consequência + reversibilidade,
            e o botão repete o verbo perigoso. O que ele diz sobre quem já
            presenteou não é consolo — é fato: `gift_contributions` guarda o
            nome da cota em texto justamente para sobreviver à exclusão dela. */}
        <DialogoDestrutivo
          gatilho={
            <span className="inline-flex min-h-11 items-center text-[13px] text-(--c-danger) underline underline-offset-4">
              Apagar
            </span>
          }
          titulo="Apagar esta cota?"
          confirmar="Apagar"
          form={{
            action: apagar,
            campos: (
              <>
                <input type="hidden" name="siteId" value={siteId} />
                <input type="hidden" name="giftId" value={cota.id} />
              </>
            ),
          }}
        >
          <>
            &ldquo;{cota.name}&rdquo; sai do site na hora. Quem já presenteou
            continua registrado.
          </>
        </DialogoDestrutivo>
      </div>

      {estado && "error" in estado && (
        <p className="erro-do-campo w-full">{estado.error}</p>
      )}
    </div>
  );
}

/**
 * Criar ou editar. Um formulário só: os campos são os mesmos, e duplicá-lo
 * seria duplicar a validação — que é como um limite passa a valer num lugar e
 * não no outro.
 */
function FormularioDeCota({
  siteId,
  cota,
  aoFechar,
}: {
  siteId: string;
  cota?: Cota;
  aoFechar: () => void;
}) {
  const editando = cota !== undefined;
  const [estado, enviar, enviando] = useActionState(
    editando ? editarCotaAction : criarCotaAction,
    undefined as GiftActionResult
  );

  /* Fecha sozinho quando salvou. Deixar o formulário aberto depois de salvar
     faz o casal clicar em "Salvar" de novo achando que não pegou. */
  if (estado && "saved" in estado) {
    aoFechar();
  }

  return (
    <form action={enviar} className="surface-raised flex flex-col gap-4 p-5">
      <input type="hidden" name="siteId" value={siteId} />
      {editando && <input type="hidden" name="giftId" value={cota.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Nome da cota"
          name="name"
          defaultValue={cota?.name ?? ""}
          placeholder="Lua de mel"
          required
          maxLength={120}
        />
        <Campo
          rotulo="Categoria"
          name="category"
          defaultValue={cota?.category ?? ""}
          placeholder="Viagem"
          required
          maxLength={60}
          ajuda="Agrupa as cotas no site."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Valor da cota"
          name="price"
          defaultValue={
            cota?.priceCents != null ? String(cota.priceCents / 100) : ""
          }
          placeholder="250"
          inputMode="decimal"
          ajuda="Em branco: o convidado escolhe quanto dar."
        />
        <Campo
          rotulo="Quantas cotas"
          name="quantity"
          type="number"
          min={1}
          max={999}
          defaultValue={cota?.quantity != null ? String(cota.quantity) : ""}
          placeholder="20"
          ajuda="Em branco: sem limite."
        />
      </div>

      {estado && "error" in estado && (
        <p role="alert" className="erro-do-campo">
          {estado.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Botao type="submit" carregando={enviando}>
          {editando ? "Salvar cota" : "Criar cota"}
        </Botao>
        <button
          type="button"
          onClick={aoFechar}
          className="btn btn-texto btn-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
