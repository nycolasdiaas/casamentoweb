"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { STATUS_META, type OrderStatus } from "@/lib/orderStatus";

export type OrderRow = {
  id: string;
  status: OrderStatus;
  coupleName: string;
  email: string;
  whatsapp: string | null;
  packageName: string;
  priceLabel: string;
  priceIsCustom: boolean;
  previewUrl: string | null;
  siteUrl: string | null;
  paymentStatus: string | null;
  photoCount: number;
  updatedAt: string;
  waitingDays: number;
};

type Filter = "abertos" | "todos" | OrderStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "abertos", label: "Em aberto" },
  { id: "submitted", label: "Recebidos" },
  { id: "in_production", label: "Em produção" },
  { id: "preview_ready", label: "Prévia pronta" },
  { id: "paid", label: "Pagos" },
  { id: "published", label: "No ar" },
  { id: "draft", label: "Rascunhos" },
  { id: "todos", label: "Todos" },
];

// Pedido "em aberto" = tudo que ainda pede ação da equipe.
const OPEN_STATUSES: OrderStatus[] = [
  "submitted",
  "in_production",
  "preview_ready",
  "paid",
];

function StatusPill({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  const tone =
    status === "draft"
      ? "bg-[#f0efe9] text-[#6b6a63]"
      : status === "published"
        ? "bg-[#e7f0e2] text-[#2f3a29]"
        : status === "preview_ready"
          ? "bg-[#fdf0d8] text-[#8a6a1f]"
          : "bg-[#e6ecf5] text-[#2c4470]";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}
    >
      {meta.icon} {meta.adminLabel}
    </span>
  );
}

/** Quanto tempo o pedido está parado nesta etapa. */
function AgeCell({ days, status }: { days: number; status: OrderStatus }) {
  const stale = OPEN_STATUSES.includes(status) && days >= 3;
  return (
    <span
      className={`whitespace-nowrap text-xs ${
        stale ? "font-semibold text-[#a13a2a]" : "text-(--color-muted)"
      }`}
      title={stale ? "Parado há 3 dias ou mais" : undefined}
    >
      {days === 0 ? "hoje" : `${days}d`}
    </span>
  );
}

export default function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const [filter, setFilter] = useState<Filter>("abertos");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map = new Map<Filter, number>();
    map.set("todos", rows.length);
    map.set(
      "abertos",
      rows.filter((r) => OPEN_STATUSES.includes(r.status)).length
    );
    for (const row of rows) {
      map.set(row.status, (map.get(row.status) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesFilter =
        filter === "todos"
          ? true
          : filter === "abertos"
            ? OPEN_STATUSES.includes(row.status)
            : row.status === filter;
      if (!matchesFilter) return false;
      if (!term) return true;
      return (
        row.coupleName.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.packageName.toLowerCase().includes(term)
      );
    });
  }, [rows, filter, query]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros + busca */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          const count = counts.get(item.id) ?? 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-[#2f3a29] bg-[#2f3a29] text-white"
                  : "border-(--color-gold)/50 bg-white text-(--color-olive) hover:bg-(--color-blush)"
              }`}
            >
              {item.label}
              <span className={active ? "opacity-70" : "text-(--color-muted)"}>
                {" "}
                {count}
              </span>
            </button>
          );
        })}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar casal, e-mail ou pacote"
          className="ml-auto w-full max-w-60 rounded-full border border-(--color-gold)/50 bg-white px-4 py-1.5 text-xs focus:border-(--color-gold) focus:outline-none"
        />
      </div>

      {/* Tabela. O overflow-x fica no container — a página em si nunca rola
          na horizontal. */}
      <div className="overflow-x-auto rounded-xl border border-(--color-gold)/40 bg-white">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-(--color-gold)/40 text-left text-[11px] uppercase tracking-[0.08em] text-(--color-muted)">
              <th className="px-4 py-3 font-semibold">Casal</th>
              <th className="px-4 py-3 font-semibold">Pacote</th>
              <th className="px-4 py-3 font-semibold">Etapa</th>
              <th className="px-4 py-3 font-semibold">Valor</th>
              <th className="px-4 py-3 font-semibold">Pagamento</th>
              <th className="px-4 py-3 font-semibold">Links</th>
              <th className="px-4 py-3 font-semibold">Fotos</th>
              <th className="px-4 py-3 font-semibold">Parado</th>
              <th className="px-4 py-3 font-semibold text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-sm text-(--color-muted)"
                >
                  Nenhum pedido neste filtro.
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-(--color-gold)/20 last:border-0 hover:bg-(--color-paper)/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-(--color-olive)">
                        {row.coupleName}
                      </span>
                      <span className="text-xs text-(--color-muted)">
                        {row.whatsapp ?? row.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-(--color-olive)/85">
                    {row.packageName}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.priceLabel}
                    {row.priceIsCustom && (
                      <span
                        className="ml-1 text-[10px] text-(--color-gold)"
                        title="Valor ajustado manualmente"
                      >
                        ●
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    {row.paymentStatus === "PAID" ? (
                      <span className="font-semibold text-[#2f3a29]">
                        pago ✓
                      </span>
                    ) : (
                      <span className="text-(--color-muted)">
                        {row.paymentStatus?.toLowerCase() ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-xs">
                      {row.previewUrl ? (
                        <a
                          href={row.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                        >
                          prévia
                        </a>
                      ) : (
                        <span className="text-(--color-muted)">prévia</span>
                      )}
                      {row.siteUrl ? (
                        <a
                          href={row.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                        >
                          site
                        </a>
                      ) : (
                        <span className="text-(--color-muted)">site</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-(--color-olive)/85">
                    {row.photoCount > 0 ? `${row.photoCount} 📷` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <AgeCell days={row.waitingDays} status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pedidos/${row.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-(--color-muted)">
        {visible.length} de {rows.length} pedidos · &ldquo;Parado&rdquo; conta
        os dias desde a última mudança; vermelho passa de 3 dias.
      </p>
    </div>
  );
}
