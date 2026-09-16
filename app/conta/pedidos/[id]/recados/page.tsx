import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Recados from "@/components/account/manage/Recados";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { listarRecadosParaOCasal } from "@/lib/repositories/guestbook";
import {
  tierAllowsSection,
  tierRecebeRecados,
} from "@/lib/templates/contract";

export const metadata: Metadata = {
  title: "Recados",
};

/**
 * A caixa de entrada dos recados, do lado do casal.
 *
 * Dois pacotes chegam aqui e a tela não é a mesma nos dois:
 *
 * - **Para Sempre** tem mural. O recado nasce no site, e o casal pode
 *   escondê-lo se alguém escrever bobagem.
 * - **Site do Casamento** não tem mural. O recado chega privado, esta aba é o
 *   único lugar onde ele existe, e não há o que esconder — nada dele está
 *   público.
 *
 * Quem chega por URL no pacote Convite volta para o início do pedido: lá não
 * há confirmação de presença, logo não há de onde sair um recado.
 */
export default async function RecadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  if (!tierRecebeRecados(order.packageTier)) {
    redirect(`/conta/pedidos/${order.id}`);
  }

  const temMural = tierAllowsSection(order.packageTier, "guestbook");
  const recados = site ? await listarRecadosParaOCasal(site.id) : [];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="meta text-(--c-mark)">
          {temMural ? "Mural" : "Só para vocês"}
        </span>
        <h1 className="t-d2 text-(--c-ink)">Recados dos convidados</h1>
        <p className="t-corpo text-(--c-ink-2) medida">
          {temMural
            ? "Tudo que escreverem no site aparece aqui. Se algum recado não puder ficar, dá para escondê-lo — ele sai do site na hora e continua nesta lista."
            : "Os convidados escrevem pelo botão da confirmação de presença. No pacote de vocês esses recados não vão para o site: eles ficam aqui, e só vocês leem."}
        </p>
      </header>

      <Recados orderId={order.id} recados={recados} temMural={temMural} />
    </div>
  );
}
