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
      className="flex flex-col gap-3 border border-(--c-rule) p-4"
    >
      <h2 className="t-corpo text-(--c-ink)">
        Novo convidado ou casal
      </h2>

      <input
        type="text"
        name="label"
        placeholder="Etiqueta (opcional, ex: Família Silva)"
        className="campo"
      />

      {Array.from({ length: guestCount }).map((_, index) => (
        <input
          key={index}
          type="text"
          name="name"
          placeholder={`Nome ${index + 1}`}
          required
          className="campo"
        />
      ))}

      {guestCount < 2 && (
        <button
          type="button"
          onClick={() => setGuestCount((count) => count + 1)}
          className="text-[12.5px] text-(--c-ink-2) underline underline-offset-4 self-start hover:text-(--c-ink)"
        >
          + adicionar pessoa
        </button>
      )}

      <button
        type="submit"
        className="btn btn-ink btn-sm w-full"
      >
        Criar convite
      </button>
    </form>
  );
}
