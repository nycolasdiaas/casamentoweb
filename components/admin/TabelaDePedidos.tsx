"use client";

import { useState, type ReactNode } from "react";
import { EtiquetaDoPedido } from "@/components/ui/prensa";
import type { OrderStatus } from "@/lib/orderStatus";

export type LinhaDePedido = {
  id: string;
  numero: string;
  casal: string;
  email: string;
  pacote: string;
  valor: string;
  status: OrderStatus;
  /** O `OrderCard`, renderizado no servidor e passado pronto. */
  detalhe: ReactNode;
};

/**
 * G4 · a tabela de `/admin/pedidos`.
 *
 * Eram cartões empilhados em três seções, cada um com o pedido inteiro aberto.
 * Cartão serve para NAVEGAR; quem entra em `/admin` não está navegando — está
 * procurando **um** pedido específico para socorrer. As regras de negócio §3
 * são literais: *"o /admin existe para exceção, não para operação"*. Tabela com
 * busca serve para encontrar.
 *
 * `Editar` abre o `OrderCard` numa linha abaixo, em vez de navegar: o operador
 * que está comparando três pedidos não pode perder a lista a cada clique — e
 * perder a lista significa refazer o filtro e a busca que o trouxeram até ali.
 *
 * O `OrderCard` vem do servidor como `children`. Ele carrega o histórico de
 * auditoria e o JSON do pedido; transformar isso em JavaScript no navegador do
 * operador não compraria nada.
 */
export default function TabelaDePedidos({
  linhas,
}: {
  linhas: LinhaDePedido[];
}) {
  const [aberto, setAberto] = useState<string | null>(null);

  const alternar = (id: string) =>
    setAberto((atual) => (atual === id ? null : id));

  const Botao = ({ id }: { id: string }) => (
    <button
      type="button"
      onClick={() => alternar(id)}
      aria-expanded={aberto === id}
      className="text-[13px] text-(--c-ink) underline underline-offset-4"
    >
      {aberto === id ? "Fechar" : "Editar"}
    </button>
  );

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-(--c-surface)">
              {["Pedido", "Casal", "E-mail", "Pacote", "Valor", "Status"].map(
                (c) => (
                  <th
                    key={c}
                    className="meta border-b border-(--c-rule) px-3 py-2.5 text-(--c-ink-2)"
                  >
                    {c}
                  </th>
                )
              )}
              <th className="w-[80px] border-b border-(--c-rule) px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <FragmentoDaLinha key={l.id}>
                {/* Listra alternada: com sete colunas, o olho perde a linha
                    entre `E-MAIL` e `STATUS` sem ela. */}
                <tr className={i % 2 === 1 ? "bg-(--c-sunken)/40" : undefined}>
                  <td className="t-data border-b border-(--c-rule) px-3 py-3 text-[12.5px]">
                    #{l.numero}
                  </td>
                  <td className="border-b border-(--c-rule) px-3 py-3 text-[13.5px]">
                    {l.casal}
                  </td>
                  <td className="border-b border-(--c-rule) px-3 py-3 text-[13px] text-(--c-ink-2)">
                    {l.email}
                  </td>
                  <td className="border-b border-(--c-rule) px-3 py-3 text-[13px]">
                    {l.pacote}
                  </td>
                  <td className="t-data border-b border-(--c-rule) px-3 py-3 text-[12.5px]">
                    {l.valor}
                  </td>
                  <td className="border-b border-(--c-rule) px-3 py-3">
                    <EtiquetaDoPedido status={l.status} />
                  </td>
                  <td className="border-b border-(--c-rule) px-3 py-3 text-right">
                    <Botao id={l.id} />
                  </td>
                </tr>
                {aberto === l.id && (
                  <tr>
                    <td colSpan={7} className="border-b border-(--c-rule) p-3">
                      {l.detalhe}
                    </td>
                  </tr>
                )}
              </FragmentoDaLinha>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sete colunas não cabem em 390px, e espremer viraria rolagem lateral —
          que esconde justamente a coluna de ação. O artboard de celular desenha
          esta pilha. */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {linhas.map((l) => (
          <li
            key={l.id}
            className="surface-raised flex flex-col gap-2.5 rounded-[3px] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="t-data text-[12px] text-(--c-ink-2)">
                  #{l.numero}
                </span>
                <span className="text-[14px]">{l.casal}</span>
                <span className="truncate text-[12.5px] text-(--c-ink-2)">
                  {l.email}
                </span>
              </div>
              <EtiquetaDoPedido status={l.status} />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-(--c-rule) pt-2.5">
              <span className="text-[12.5px] text-(--c-ink-2)">
                {l.pacote} · <span className="t-data">{l.valor}</span>
              </span>
              <Botao id={l.id} />
            </div>
            {aberto === l.id && l.detalhe}
          </li>
        ))}
      </ul>
    </>
  );
}

/** `<>` com `key` — duas `<tr>` irmãs por pedido, sem embrulho inválido. */
function FragmentoDaLinha({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
