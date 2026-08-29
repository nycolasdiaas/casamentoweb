import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listOrdersWithUsers } from "@/lib/repositories/orders";
import { listOrderAuditLog } from "@/lib/repositories/orderAudit";
import { getPackage } from "@/lib/packages";
import { formatPriceCents } from "@/lib/format";
import { orderToJson, type OrderForPrompt } from "@/lib/buildPrompt";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orderStatus";
import OrderCard, { type AdminOrder } from "@/components/admin/OrderCard";
import TabelaDePedidos, {
  type LinhaDePedido,
} from "@/components/admin/TabelaDePedidos";
import { EstadoVazio } from "@/components/ui/prensa";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Os quatro filtros da operação.
 *
 * `previa` junta `preview_ready` e `paid` de propósito: do ponto de vista de
 * quem opera, os dois são "prévia pronta, ainda não no ar" — e separá-los
 * criaria uma pílula para um estado que dura minutos.
 *
 * `Cancelados` nasceu com `painel-casal/013`. Ela ficou fora da primeira
 * versão desta tela porque o estado não existia — cancelar apagava a linha, e
 * uma pílula que só pode mostrar zero é pior que pílula nenhuma. Agora o
 * pedido cancelado fica no banco, e a operação consegue vê-lo.
 *
 * **A contagem começa do zero.** Os cancelamentos anteriores a 27/08/2026
 * foram apagados e não voltam — quem comparar meses precisa saber disso.
 */
const FILTROS = [
  { chave: "todos", rotulo: "Todos", estados: ORDER_STATUSES },
  { chave: "no-ar", rotulo: "No ar", estados: ["published"] },
  { chave: "previa", rotulo: "Prévia", estados: ["preview_ready", "paid"] },
  { chave: "cancelados", rotulo: "Cancelados", estados: ["cancelled"] },
] as const satisfies readonly {
  chave: string;
  rotulo: string;
  estados: readonly OrderStatus[];
}[];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>;
}) {
  await requireAdmin();

  return (
    <main className="flex-1 flex flex-col gap-6 trilho py-12">
      <h1 className="t-display text-[26px] leading-none text-(--c-ink)">
        Pedidos de sites
      </h1>

      {/* `searchParams` é dado não cacheado. Lido no corpo da página, ele
          trava a rota inteira no build com "Uncached data was accessed
          outside of `<Suspense>`" — e o `next dev` não avisa. A promessa
          desce sem `await`. */}
      <Suspense fallback={<p className="t-corpo text-(--c-ink-2)">Carregando…</p>}>
        <Lista busca={searchParams} />
      </Suspense>
    </main>
  );
}

async function Lista({
  busca,
}: {
  busca: Promise<{ estado?: string; q?: string }>;
}) {
  const { estado, q } = await busca;

  /* Valor fora da lista cai em `todos`, com 200. Inclui `?estado=cancelados`,
     que pode chegar de um link guardado por quem viu o desenho. */
  const filtro = FILTROS.find((f) => f.chave === estado) ?? FILTROS[0];
  const termo = (q ?? "").trim();

  const [pedidos, total] = await Promise.all([
    listOrdersWithUsers({
      estados: filtro.chave === "todos" ? undefined : filtro.estados,
      busca: termo,
    }),
    // O número da pílula `Todos` é o total de VERDADE, não o do filtro atual —
    // é ele que diz ao operador o tamanho da operação.
    listOrdersWithUsers(),
  ]);

  const linhas: LinhaDePedido[] = await Promise.all(
    pedidos.map(async (order) => {
      const forPrompt = order as unknown as OrderForPrompt;
      const pkg = getPackage(order.packageTier);
      const auditLog = await listOrderAuditLog(order.id);

      const card: AdminOrder = {
        id: order.id,
        status: order.status,
        coupleName: order.coupleNames ?? order.user.name,
        packageName: pkg?.name ?? order.packageTier,
        whatsapp: order.user.whatsapp,
        updatedAt: dateFmt.format(new Date(order.updatedAt)),
        json: JSON.stringify(orderToJson(forPrompt), null, 2),
        previewUrl: order.previewUrl,
        siteUrl: order.siteUrl,
        priceCents: order.priceCents,
        paymentStatus: order.paymentStatus,
        defaultPriceCents: pkg?.priceCents ?? 0,
        auditLog: auditLog.map((entry) => ({
          adminName: entry.adminName,
          field: entry.field,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          when: dateFmt.format(new Date(entry.createdAt)),
        })),
      };

      return {
        id: order.id,
        numero: order.id.replace(/-/g, "").slice(0, 4).toUpperCase(),
        casal: order.coupleNames ?? order.user.name,
        email: order.user.email,
        pacote: pkg?.name ?? order.packageTier,
        valor: formatPriceCents(order.priceCents ?? pkg?.priceCents ?? null),
        status: order.status,
        detalhe: <OrderCard order={card} />,
      };
    })
  );

  const paraFiltro = (chave: string) => {
    const p = new URLSearchParams();
    if (chave !== "todos") p.set("estado", chave);
    if (termo) p.set("q", termo);
    const resto = p.toString();
    return `/admin/pedidos${resto ? `?${resto}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Os filtros viajam pela URL e não por estado de cliente: é o que
            deixa o operador guardar `/admin/pedidos?estado=previa` e voltar
            direto na segunda-feira. */}
        <nav className="flex flex-wrap items-center gap-2">
          {FILTROS.map((f) => {
            const ativa = f.chave === filtro.chave;
            return (
              <Link
                key={f.chave}
                href={paraFiltro(f.chave)}
                aria-current={ativa ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] leading-none no-underline ${
                  ativa
                    ? "bg-(--c-mark) text-white"
                    : "border border-(--c-rule) text-(--c-ink-2) hover:text-(--c-ink)"
                }`}
              >
                {f.rotulo}
                {f.chave === "todos" && (
                  <span className="t-data"> · {total.length}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* `GET` puro: a busca vira `?q=` no endereço, funciona sem JavaScript
            e o resultado é um link que o operador pode mandar para outra
            pessoa da equipe. */}
        <form method="get" className="flex items-center gap-2">
          {filtro.chave !== "todos" && (
            <input type="hidden" name="estado" value={filtro.chave} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={termo}
            placeholder="Buscar por casal, e-mail, #pedido…"
            aria-label="Buscar pedido"
            className="campo w-[260px] max-w-full"
          />
          <button type="submit" className="btn btn-quiet">
            Buscar
          </button>
        </form>
      </div>

      {linhas.length === 0 ? (
        <EstadoVazio
          titulo={
            termo
              ? "Nenhum pedido com esse texto."
              : filtro.chave === "no-ar"
                ? "Nenhum pedido no ar agora."
                : filtro.chave === "previa"
                  ? "Nenhum pedido em prévia agora."
                  : filtro.chave === "cancelados"
                    ? "Nenhum pedido cancelado."
                    : "Nenhum pedido ainda."
          }
          acao={
            filtro.chave !== "todos" || termo ? (
              <Link href="/admin/pedidos" className="btn btn-quiet">
                Ver todos os pedidos
              </Link>
            ) : undefined
          }
        >
          {termo
            ? "A busca cobre nome do casal, e-mail e o começo do número do pedido."
            : "Quando um casal enviar um pedido, ele aparece aqui."}
        </EstadoVazio>
      ) : (
        <TabelaDePedidos linhas={linhas} />
      )}
    </div>
  );
}
