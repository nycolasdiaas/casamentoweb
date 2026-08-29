import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Recados from "@/components/account/manage/Recados";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { listarRecadosParaOCasal } from "@/lib/repositories/guestbook";
import { tierAllowsSection } from "@/lib/templates/contract";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Recados | ${SITE_NAME}`,
};

/**
 * A aba do mural. Só existe no pacote que tem mural.
 *
 * Quem chega aqui por URL num pacote menor volta para o início do pedido em
 * vez de ver uma tela vazia com um recurso que ele não comprou — cobrar
 * atenção por algo que o pacote não inclui é a mesma falha que a lista "o que
 * falta" evita ao respeitar o pacote (regras §2.3).
 */
export default async function RecadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  if (!tierAllowsSection(order.packageTier, "guestbook")) {
    redirect(`/conta/pedidos/${order.id}`);
  }

  const recados = site ? await listarRecadosParaOCasal(site.id) : [];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="meta text-(--c-mark)">Mural</span>
        <h1 className="t-d2 text-(--c-ink)">Recados dos convidados</h1>
        <p className="t-corpo text-(--c-ink-2) medida">
          Tudo que escreverem no site aparece aqui. Se algum recado não puder
          ficar, dá para escondê-lo — ele sai do site na hora e continua nesta
          lista.
        </p>
      </header>

      <Recados orderId={order.id} recados={recados} />
    </div>
  );
}
