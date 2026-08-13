"use client";

import { deleteGroupAction } from "@/app/actions/admin-actions";
import CopyLinkButton from "./CopyLinkButton";
import type { RsvpStatus } from "@/components/RsvpGuestRow";

type Guest = { id: string; name: string; rsvpStatus: RsvpStatus };
type Group = { id: string; slug: string; label: string | null; guests: Guest[] };

const STATUS_LABEL: Record<RsvpStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Recusado",
};

export default function GroupList({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return (
      <p className="font-serif text-sm text-(--c-ink-2)">
        Nenhum convidado cadastrado ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {groups.map((group) => (
        <li
          key={group.id}
          className="border border-(--c-rule) p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-serif text-sm text-(--c-ink)">
              {group.label || group.guests.map((g) => g.name).join(" & ")}
            </span>
            <div className="flex gap-2">
              <CopyLinkButton slug={group.slug} />
              <button
                type="button"
                onClick={() => deleteGroupAction(group.id)}
                className="text-xs font-serif text-red-700 underline"
              >
                Excluir
              </button>
            </div>
          </div>

          <ul className="flex flex-col gap-1">
            {group.guests.map((guest) => (
              <li
                key={guest.id}
                className="flex items-center justify-between text-xs font-serif"
              >
                <span>{guest.name}</span>
                <span className="text-(--c-ink-2)">
                  {STATUS_LABEL[guest.rsvpStatus]}
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
