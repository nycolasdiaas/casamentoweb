"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  createGiftAction,
  updateGiftAction,
  deleteGiftAction,
  requestGiftPhotoUploadAction,
  confirmGiftPhotoUploadAction,
  deleteGiftPhotoAction,
} from "@/app/actions/gift-actions";
import { formatPriceCents } from "@/lib/format";
import { prepararFoto } from "@/lib/site/prepararFoto";

/**
 * Presentes do casamento legado, geridos pelo admin — grid de cards, mesma
 * unidade visual do que o convidado vê em `/presentes` (imagem grande, nome,
 * descrição). Clicar num card abre o formulário daquele presente num modal.
 */

type Gift = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  priceCents: number | null;
};

type Contribution = {
  id: string;
  giftName: string;
  guestName: string | null;
  createdAt: Date;
};

type Foto = { id: string; blurDataUrl: string | null };

function centsToInput(priceCents: number | null): string {
  if (priceCents === null) return "";
  return (priceCents / 100).toFixed(2).replace(".", ",");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function GiftAdmin({
  gifts,
  contributions,
  fotos: fotosIniciais,
}: {
  gifts: Gift[];
  contributions: Contribution[];
  fotos: Record<string, Foto>;
}) {
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [fotos, setFotos] = useState<Record<string, Foto>>(fotosIniciais);

  const categories = useMemo(
    () => [...new Set(gifts.map((gift) => gift.category))],
    [gifts]
  );

  const giftEmEdicao = gifts.find((g) => g.id === editandoId) ?? null;

  function mudarFoto(giftId: string, foto: Foto | null) {
    setFotos((atuais) => {
      const proximas = { ...atuais };
      if (foto) proximas[giftId] = foto;
      else delete proximas[giftId];
      return proximas;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {gifts.length === 0 ? (
        <p className="t-corpo text-(--c-ink-2)">
          Nenhum presente cadastrado ainda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gifts.map((gift) => (
            <CartaoDoPresente
              key={gift.id}
              gift={gift}
              foto={fotos[gift.id]}
              aoEditar={() => setEditandoId(gift.id)}
            />
          ))}
          <CartaoNovo aoClicar={() => setCriando(true)} />
        </div>
      )}

      {(criando || giftEmEdicao) && (
        <ModalDoPresente
          gift={giftEmEdicao}
          foto={giftEmEdicao ? fotos[giftEmEdicao.id] : undefined}
          categories={categories}
          aoMudarFoto={(foto) => {
            if (giftEmEdicao) mudarFoto(giftEmEdicao.id, foto);
          }}
          aoFechar={() => {
            setCriando(false);
            setEditandoId(null);
          }}
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="t-corpo text-(--c-ink)">
          Quem já presenteou ({contributions.length})
        </h2>
        {contributions.length === 0 ? (
          <p className="t-corpo-p text-(--c-ink-2)">
            Ninguém registrou um Pix por aqui ainda. Confira também o app do
            Mercado Pago — nem todo mundo se identifica.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {contributions.map((contribution) => (
              <li
                key={contribution.id}
                className="flex items-center justify-between gap-3 border border-(--c-rule) px-4 py-2"
              >
                <span className="t-corpo text-(--c-ink) truncate">
                  {contribution.guestName ?? "Anônimo(a) 🕵️"} —{" "}
                  {contribution.giftName}
                </span>
                <span className="t-data text-[12.5px] text-(--c-ink-2) shrink-0">
                  {formatDate(contribution.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="t-corpo-p text-(--c-ink-2)">
          Registros feitos pelos convidados na página de presentes. A
          confirmação do valor é sempre no extrato do Mercado Pago.
        </p>
      </section>
    </div>
  );
}

function CartaoDoPresente({
  gift,
  foto,
  aoEditar,
}: {
  gift: Gift;
  foto?: Foto;
  aoEditar: () => void;
}) {
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
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-[11px] uppercase tracking-[0.08em] text-(--c-ink-2)">
          {gift.category}
        </span>
        <span className="text-[14px] font-medium leading-snug text-(--c-ink) line-clamp-2">
          {gift.name}
        </span>
        {gift.description && (
          <span className="text-[12px] italic leading-snug text-(--c-ink-2) line-clamp-2">
            {gift.description}
          </span>
        )}
        <span className="t-data mt-auto pt-1.5 text-[13px] text-(--c-ink)">
          {formatPriceCents(gift.priceCents)}
        </span>
      </div>
    </button>
  );
}

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
      <span className="text-[13px]">Novo presente</span>
    </button>
  );
}

function ModalDoPresente({
  gift,
  foto,
  categories,
  aoMudarFoto,
  aoFechar,
}: {
  gift: Gift | null;
  foto?: Foto;
  categories: string[];
  aoMudarFoto: (foto: Foto | null) => void;
  aoFechar: () => void;
}) {
  const editando = gift !== null;
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(formData: FormData) {
    setErro(null);
    setEnviando(true);
    try {
      if (editando) {
        await updateGiftAction(gift.id, formData);
      } else {
        await createGiftAction(formData);
      }
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui salvar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  async function excluir() {
    if (!gift) return;
    if (!window.confirm(`Excluir o presente "${gift.name}"?`)) return;
    setExcluindo(true);
    try {
      await deleteGiftAction(gift.id);
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui excluir. Tente de novo.");
      setExcluindo(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editando ? "Editar presente" : "Novo presente"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="absolute inset-0 bg-[rgb(26_29_33/0.35)] cursor-default"
      />

      <div className="surface-raised relative flex w-full max-w-[640px] max-h-[90dvh] flex-col gap-5 overflow-y-auto rounded-[3px] p-6 shadow-[0_12px_40px_rgb(26_29_33/0.20)]">
        <div className="flex items-start justify-between gap-4">
          <p className="t-display text-[22px] leading-tight text-(--c-ink)">
            {editando ? "Editar presente" : "Novo presente"}
          </p>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="text-xl leading-none text-(--c-ink-2) transition-opacity hover:opacity-60"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row">
          {editando && (
            <GiftPhotoTile giftId={gift.id} foto={foto} onChange={aoMudarFoto} />
          )}

          <form action={salvar} className="flex flex-1 flex-col gap-3 min-w-0">
            <GiftFields categories={categories} gift={gift ?? undefined} />

            {erro && <p className="erro-do-campo">{erro}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={enviando}
                  className="btn btn-ink btn-sm"
                >
                  {enviando ? "Salvando…" : editando ? "Salvar" : "Adicionar presente"}
                </button>
                <button
                  type="button"
                  onClick={aoFechar}
                  className="btn btn-quiet btn-sm"
                >
                  Cancelar
                </button>
              </div>

              {editando && (
                <button
                  type="button"
                  onClick={excluir}
                  disabled={excluindo}
                  className="text-[12.5px] text-(--c-danger) underline underline-offset-4 disabled:opacity-50"
                >
                  {excluindo ? "Excluindo…" : "Excluir"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function GiftFields({
  categories,
  gift,
}: {
  categories: string[];
  gift?: Gift;
}) {
  return (
    <>
      <input
        type="text"
        name="category"
        list="gift-categories"
        defaultValue={gift?.category}
        placeholder="Categoria (ex: Lua de Mel)"
        required
        className="campo"
      />
      <datalist id="gift-categories">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
      <input
        type="text"
        name="name"
        defaultValue={gift?.name}
        placeholder="Nome do presente"
        required
        className="campo"
      />
      <textarea
        name="description"
        defaultValue={gift?.description ?? ""}
        placeholder="Descrição (opcional) — o tom de humor da lista"
        rows={2}
        className="campo"
      />
      <input
        type="text"
        name="price"
        inputMode="decimal"
        defaultValue={gift ? centsToInput(gift.priceCents) : ""}
        placeholder="Valor em R$ (vazio = convidado decide)"
        className="campo"
      />
    </>
  );
}

/**
 * Foto do presente: preview + upload/troca/apagar, um presente por vez.
 *
 * Mesmo fluxo de `PhotoManager` (comprime no cliente, pede URL assinada,
 * envia direto ao Storage, confirma) — sem os slots, porque aqui cada
 * presente tem no máximo uma foto.
 */
function GiftPhotoTile({
  giftId,
  foto,
  onChange,
}: {
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

      const pedido = await requestGiftPhotoUploadAction({
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

      const confirmada = await confirmGiftPhotoUploadAction({
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
      const res = await deleteGiftPhotoAction(giftId);
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
