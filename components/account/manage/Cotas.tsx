"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  criarCotaAction,
  editarCotaAction,
  apagarCotaAction,
  requestCotaPhotoUploadAction,
  confirmCotaPhotoUploadAction,
  deleteCotaPhotoAction,
  type GiftActionResult,
} from "@/app/actions/couple-gift-actions";
import { Botao, Campo, AreaDeTexto, DialogoDestrutivo } from "@/components/ui/prensa";
import { formatPriceCents } from "@/lib/format";
import { prepararFoto } from "@/lib/site/prepararFoto";

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
 * ── Grid de cards, não lista em linha ──────────────────────────────────────
 *
 * O card é a mesma unidade visual que o convidado vê em `/presentes` (imagem
 * grande, nome, descrição) — o casal precisa ver o que está montando com a
 * mesma cara do que vai ao ar, não uma linha de texto com um quadradinho de
 * foto ao lado. Clicar no card abre o formulário num modal, para não
 * atropelar o grid inteiro com um formulário achatado no lugar de uma linha.
 */

type Cota = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  priceCents: number | null;
  quantity: number | null;
  /** Quantas contribuições esta cota já recebeu. */
  escolhidas: number;
};

type Foto = { id: string; blurDataUrl: string | null };

export default function Cotas({
  siteId,
  cotas,
  fotos: fotosIniciais,
}: {
  siteId: string;
  cotas: Cota[];
  fotos: Record<string, Foto>;
}) {
  const [fotos, setFotos] = useState<Record<string, Foto>>(fotosIniciais);
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const cotaEmEdicao = cotas.find((c) => c.id === editando) ?? null;

  function mudarFoto(giftId: string, foto: Foto | null) {
    setFotos((atuais) => {
      const proximas = { ...atuais };
      if (foto) proximas[giftId] = foto;
      else delete proximas[giftId];
      return proximas;
    });
  }

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

      {cotas.length === 0 ? (
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cotas.map((cota) => (
            <CartaoDaCota
              key={cota.id}
              cota={cota}
              foto={fotos[cota.id]}
              aoEditar={() => setEditando(cota.id)}
            />
          ))}
          <CartaoNovo aoClicar={() => setCriando(true)} />
        </div>
      )}

      {(criando || cotaEmEdicao) && (
        <ModalDeCota
          siteId={siteId}
          cota={cotaEmEdicao}
          foto={cotaEmEdicao ? fotos[cotaEmEdicao.id] : undefined}
          aoMudarFoto={(foto) => {
            if (cotaEmEdicao) mudarFoto(cotaEmEdicao.id, foto);
          }}
          aoFechar={() => {
            setCriando(false);
            setEditando(null);
          }}
        />
      )}
    </section>
  );
}

/** Card grande — mesma unidade visual do que o convidado vê em /presentes. */
function CartaoDaCota({
  cota,
  foto,
  aoEditar,
}: {
  cota: Cota;
  foto?: Foto;
  aoEditar: () => void;
}) {
  const temTeto = cota.quantity !== null && cota.quantity > 0;
  const pct = temTeto
    ? Math.min(100, Math.round((cota.escolhidas / cota.quantity!) * 100))
    : 0;

  return (
    <button
      type="button"
      onClick={aoEditar}
      className="group flex flex-col overflow-hidden rounded-[3px] border border-(--c-rule) bg-(--c-surface) text-left transition-all hover:border-(--c-ink)/40 hover:shadow-[0_8px_20px_rgb(26_29_33/0.08)]"
    >
      <div className="relative w-full aspect-[4/3] bg-black/5 overflow-hidden">
        {foto ? (
          <Image
            src={`/gf/${foto.id}`}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform group-hover:scale-[1.03]"
            {...(foto.blurDataUrl
              ? { placeholder: "blur" as const, blurDataURL: foto.blurDataUrl }
              : {})}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[12px] text-(--c-ink-2)">
            Sem foto ainda
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="text-[14.5px] font-medium leading-snug text-(--c-ink) line-clamp-2">
          {cota.name}
        </p>
        {cota.description && (
          <p className="text-[12.5px] italic leading-snug text-(--c-ink-2) line-clamp-2">
            {cota.description}
          </p>
        )}

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-2">
          <span className="t-data text-[14px] text-(--c-ink)">
            {cota.priceCents === null
              ? "livre"
              : formatPriceCents(cota.priceCents)}
          </span>
          <span className="meta text-(--c-ink-2)">
            {temTeto
              ? `${cota.escolhidas} de ${cota.quantity}`
              : cota.escolhidas > 0
                ? `${cota.escolhidas} escolhida${cota.escolhidas === 1 ? "" : "s"}`
                : cota.category}
          </span>
        </div>

        {temTeto && (
          <div
            role="progressbar"
            aria-valuenow={cota.escolhidas}
            aria-valuemin={0}
            aria-valuemax={cota.quantity!}
            aria-label={`${cota.name}: ${cota.escolhidas} de ${cota.quantity}`}
            className="surface-sunken h-1 overflow-hidden"
          >
            <div className="h-full bg-(--c-ink)" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </button>
  );
}

/** Última célula do grid: abre o formulário de criação. */
function CartaoNovo({ aoClicar }: { aoClicar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-[3px] border border-dashed border-(--c-mark)/60 text-(--c-ink-2) transition-colors hover:border-(--c-ink) hover:text-(--c-ink)"
    >
      <span aria-hidden className="t-data text-[20px] leading-none">
        +
      </span>
      <span className="text-[13px]">Adicionar cota</span>
    </button>
  );
}

/**
 * Modal de criar/editar — mesmo padrão visual de `DialogoDestrutivo`
 * (overlay + caixa `surface-raised`), com o formulário de cota (nome,
 * categoria, descrição, preço, teto) e a foto lado a lado com os campos.
 */
function ModalDeCota({
  siteId,
  cota,
  foto,
  aoMudarFoto,
  aoFechar,
}: {
  siteId: string;
  cota: Cota | null;
  foto?: Foto;
  aoMudarFoto: (foto: Foto | null) => void;
  aoFechar: () => void;
}) {
  const editando = cota !== null;
  const [estado, enviar, enviando] = useActionState(
    editando ? editarCotaAction : criarCotaAction,
    undefined as GiftActionResult
  );
  const [estadoApagar, apagar] = useActionState(
    apagarCotaAction,
    undefined as GiftActionResult
  );

  useEffect(() => {
    if (estado && "saved" in estado) aoFechar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  useEffect(() => {
    if (estadoApagar && "saved" in estadoApagar) aoFechar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoApagar]);

  const fechar = useCallback(() => aoFechar(), [aoFechar]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [fechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editando ? "Editar cota" : "Nova cota"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={fechar}
        className="absolute inset-0 bg-[rgb(26_29_33/0.35)] cursor-default"
      />

      <div className="surface-raised relative flex w-full max-w-[640px] max-h-[90dvh] flex-col gap-5 overflow-y-auto rounded-[3px] p-6 shadow-[0_12px_40px_rgb(26_29_33/0.20)]">
        <div className="flex items-start justify-between gap-4">
          <p className="t-display text-[22px] leading-tight text-(--c-ink)">
            {editando ? "Editar cota" : "Nova cota"}
          </p>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="text-xl leading-none text-(--c-ink-2) transition-opacity hover:opacity-60"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row">
          {editando && (
            <CotaFototile
              siteId={siteId}
              giftId={cota.id}
              foto={foto}
              onChange={aoMudarFoto}
            />
          )}

          <form
            action={enviar}
            className="flex flex-1 flex-col gap-4 min-w-0"
          >
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

            <AreaDeTexto
              rotulo="Descrição (opcional)"
              name="description"
              defaultValue={cota?.description ?? ""}
              placeholder="O tom de humor de vocês — ou deixem em branco."
              maxLength={280}
              rows={2}
            />

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
            {estadoApagar && "error" in estadoApagar && (
              <p role="alert" className="erro-do-campo">
                {estadoApagar.error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <Botao type="submit" carregando={enviando}>
                  {editando ? "Salvar cota" : "Criar cota"}
                </Botao>
                <button type="button" onClick={fechar} className="btn btn-texto btn-sm">
                  Cancelar
                </button>
              </div>

              {editando && (
                <DialogoDestrutivo
                  gatilho="Apagar"
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
                    &ldquo;{cota.name}&rdquo; sai do site na hora. Quem já
                    presenteou continua registrado.
                  </>
                </DialogoDestrutivo>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Foto de uma cota: preview + upload/troca/apagar, uma cota por vez.
 *
 * Mesmo fluxo de `PhotoManager` (comprime no cliente, pede URL assinada,
 * envia direto ao Storage, confirma), com autorização por posse do site
 * (`requestCotaPhotoUploadAction` etc.), não por sessão de admin.
 */
function CotaFototile({
  siteId,
  giftId,
  foto,
  onChange,
}: {
  siteId: string;
  giftId: string;
  foto?: Foto;
  onChange: (foto: Foto | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(file: File) {
    setErro(null);
    setBusy(true);
    try {
      const preparada = await prepararFoto(file);

      const pedido = await requestCotaPhotoUploadAction({
        siteId,
        giftId,
        contentType: "image/jpeg",
        sizeBytes: preparada.blob.size,
      });
      if ("error" in pedido) {
        setErro(pedido.error);
        return;
      }

      const upload = await fetch(pedido.uploadUrl, {
        method: "PUT",
        headers: { "content-type": "image/jpeg" },
        body: preparada.blob,
      });
      if (!upload.ok) {
        setErro("O envio falhou no meio do caminho. Tente de novo.");
        return;
      }

      const confirmada = await confirmCotaPhotoUploadAction({
        siteId,
        giftId,
        storagePath: pedido.storagePath,
        width: preparada.width,
        height: preparada.height,
        blurDataUrl: preparada.blurDataUrl,
      });
      if ("error" in confirmada) {
        setErro(confirmada.error);
        return;
      }

      onChange({ id: confirmada.photoId, blurDataUrl: preparada.blurDataUrl });
    } catch (e) {
      console.error("[fotos]", e);
      setErro("Não consegui enviar essa foto. Tente outra.");
    } finally {
      setBusy(false);
    }
  }

  async function apagar() {
    setErro(null);
    setBusy(true);
    try {
      const res = await deleteCotaPhotoAction({ siteId, giftId });
      if ("error" in res) {
        setErro(res.error);
        return;
      }
      onChange(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5 sm:w-40">
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[3px] border border-(--c-rule) bg-black/5">
        {foto ? (
          <Image
            src={`/gf/${foto.id}`}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
            {...(foto.blurDataUrl
              ? { placeholder: "blur" as const, blurDataURL: foto.blurDataUrl }
              : {})}
          />
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-(--c-ink-2) hover:bg-(--c-sunken)/50">
            <span className="text-xl leading-none" aria-hidden>
              {busy ? "…" : "+"}
            </span>
            <span className="text-[11px] leading-tight">
              {busy ? "enviando" : "adicionar foto"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              disabled={busy}
              onChange={(e) => {
                if (e.target.files?.[0]) enviar(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {foto && (
        <button
          type="button"
          onClick={apagar}
          disabled={busy}
          className="text-[11px] text-(--c-danger) underline underline-offset-2 disabled:opacity-50"
        >
          {busy ? "…" : "apagar foto"}
        </button>
      )}
      {erro && <span className="text-[10px] text-(--c-danger)">{erro}</span>}
    </div>
  );
}
