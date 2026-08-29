"use client";

import { useMemo, useState } from "react";
import {
  createGiftAction,
  updateGiftAction,
  deleteGiftAction,
} from "@/app/actions/gift-actions";
import { formatPriceCents } from "@/lib/format";

type Gift = {
  id: string;
  category: string;
  name: string;
  priceCents: number | null;
};

type Contribution = {
  id: string;
  giftName: string;
  guestName: string | null;
  createdAt: Date;
};

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
}: {
  gifts: Gift[];
  contributions: Contribution[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(gifts.map((gift) => gift.category))],
    [gifts]
  );

  return (
    <div className="flex flex-col gap-8">
      <form
        action={async (formData) => {
          await createGiftAction(formData);
        }}
        className="flex flex-col gap-3 border border-(--c-rule) p-4"
      >
        <h2 className="t-corpo text-(--c-ink)">
          Novo presente
        </h2>
        <GiftFields categories={categories} />
        <button
          type="submit"
          className="btn btn-ink btn-sm w-full"
        >
          Adicionar presente
        </button>
      </form>

      {gifts.length === 0 ? (
        <p className="t-corpo text-(--c-ink-2)">
          Nenhum presente cadastrado ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {gifts.map((gift) => (
            <li key={gift.id} className="border border-(--c-rule)">
              {editingId === gift.id ? (
                <form
                  action={async (formData) => {
                    await updateGiftAction(gift.id, formData);
                    setEditingId(null);
                  }}
                  className="flex flex-col gap-3 p-4"
                >
                  <GiftFields categories={categories} gift={gift} />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-ink btn-sm flex-1"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="btn btn-quiet btn-sm flex-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex flex-col min-w-0">
                    <span className="t-corpo-p text-(--c-ink-2)">
                      {gift.category}
                    </span>
                    <span className="t-corpo text-(--c-ink) truncate">
                      {gift.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="t-corpo text-(--c-ink)">
                      {formatPriceCents(gift.priceCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingId(gift.id)}
                      className="text-[13px] text-(--c-ink-2) underline underline-offset-4 transition-colors hover:text-(--c-ink)"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          window.confirm(
                            `Excluir o presente "${gift.name}"?`
                          )
                        ) {
                          await deleteGiftAction(gift.id);
                        }
                      }}
                      className="text-[12.5px] text-(--c-danger) underline underline-offset-4"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
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
