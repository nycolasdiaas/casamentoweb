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
      <p className="t-corpo text-(--c-ink-2)">
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
            <span className="t-corpo text-(--c-ink)">
              {group.label || group.guests.map((g) => g.name).join(" & ")}
            </span>
            <div className="flex gap-2">
              <CopyLinkButton slug={group.slug} />
              <button
                type="button"
                onClick={() => deleteGroupAction(group.id)}
                className="text-[12.5px] text-(--c-danger) underline underline-offset-4"
              >
                Excluir
              </button>
            </div>
          </div>

          <ul className="flex flex-col gap-1">
            {group.guests.map((guest) => (
              <li
                key={guest.id}
                className="flex items-center justify-between text-[12.5px]"
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
