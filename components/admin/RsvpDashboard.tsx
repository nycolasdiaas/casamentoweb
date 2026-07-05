"use client";

import { useMemo, useState } from "react";
import type { RsvpStatus } from "@/components/RsvpGuestRow";

type Guest = {
  id: string;
  name: string;
  rsvpStatus: RsvpStatus;
  respondedAt: Date | null;
  position: number;
};

type Group = {
  id: string;
  slug: string;
  label: string | null;
  guests: Guest[];
};

type FilterOption = "all" | RsvpStatus;

const STATUS_LABEL: Record<RsvpStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Recusado",
};

const STATUS_BADGE_CLASS: Record<RsvpStatus, string> = {
  pending: "bg-(--color-muted) text-white",
  confirmed: "bg-(--color-olive) text-white",
  declined: "bg-red-700 text-white",
};

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "confirmed", label: "Confirmados" },
  { value: "declined", label: "Recusados" },
  { value: "pending", label: "Pendentes" },
];

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function RsvpDashboard({ groups }: { groups: Group[] }) {
  const [filter, setFilter] = useState<FilterOption>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      groups.flatMap((group) =>
        group.guests.map((guest) => ({ group, guest }))
      ),
    [groups]
  );

  const counts = useMemo(() => {
    const result = { confirmed: 0, declined: 0, pending: 0 };
    for (const { guest } of rows) {
      result[guest.rsvpStatus] += 1;
    }
    return result;
  }, [rows]);

  const filteredRows =
    filter === "all" ? rows : rows.filter(({ guest }) => guest.rsvpStatus === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Confirmados" count={counts.confirmed} />
        <SummaryCard label="Recusados" count={counts.declined} />
        <SummaryCard label="Pendentes" count={counts.pending} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`font-serif text-xs tracking-[0.05em] px-3 py-2 border transition-colors ${
              filter === option.value
                ? "bg-(--color-olive) border-(--color-olive) text-white"
                : "border-(--color-gold) text-(--color-olive)"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredRows.length === 0 ? (
        <p className="font-serif text-sm text-(--color-muted)">
          Nenhum convidado nesta categoria.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredRows.map(({ group, guest }) => {
            const isExpanded = expandedId === guest.id;
            return (
              <li
                key={guest.id}
                className="border border-(--color-gold)"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : guest.id)
                  }
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="font-serif text-sm text-(--color-olive)">
                    {guest.name}
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className={`font-serif text-xs px-2 py-1 ${STATUS_BADGE_CLASS[guest.rsvpStatus]}`}
                    >
                      {STATUS_LABEL[guest.rsvpStatus]}
                    </span>
                    <span className="font-serif text-xs text-(--color-muted)">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </span>
                </button>

                {isExpanded && (
                  <dl className="px-4 pb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-serif text-xs text-(--color-olive)">
                    <dt className="text-(--color-muted)">Grupo</dt>
                    <dd>
                      {group.label ||
                        group.guests.map((g) => g.name).join(" & ")}
                    </dd>

                    <dt className="text-(--color-muted)">Convite</dt>
                    <dd>/rsvp/{group.slug}</dd>

                    <dt className="text-(--color-muted)">Respondido em</dt>
                    <dd>{formatDate(guest.respondedAt)}</dd>
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="border border-(--color-gold) px-3 py-4 flex flex-col items-center gap-1">
      <span className="font-serif text-2xl text-(--color-olive)">{count}</span>
      <span className="font-serif text-xs text-(--color-muted) text-center">
        {label}
      </span>
    </div>
  );
}
