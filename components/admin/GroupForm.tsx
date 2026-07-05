"use client";

import { useState } from "react";
import { createGroupAction } from "@/app/actions/admin-actions";

export default function GroupForm() {
  const [guestCount, setGuestCount] = useState(1);

  return (
    <form
      action={async (formData) => {
        await createGroupAction(formData);
        setGuestCount(1);
      }}
      className="flex flex-col gap-3 border border-(--color-gold) p-4"
    >
      <h2 className="font-serif text-sm text-(--color-olive)">
        Novo convidado ou casal
      </h2>

      <input
        type="text"
        name="label"
        placeholder="Etiqueta (opcional, ex: Família Silva)"
        className="border border-(--color-gold) px-3 py-2 text-sm font-serif"
      />

      {Array.from({ length: guestCount }).map((_, index) => (
        <input
          key={index}
          type="text"
          name="name"
          placeholder={`Nome ${index + 1}`}
          required
          className="border border-(--color-gold) px-3 py-2 text-sm font-serif"
        />
      ))}

      {guestCount < 2 && (
        <button
          type="button"
          onClick={() => setGuestCount((count) => count + 1)}
          className="text-xs font-serif text-(--color-olive) underline self-start"
        >
          + adicionar pessoa
        </button>
      )}

      <button
        type="submit"
        className="bg-(--color-olive) text-white py-2 font-serif text-xs tracking-[0.1em]"
      >
        Criar convite
      </button>
    </form>
  );
}
