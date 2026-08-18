import { CONVITE_ALTURA, CONVITE_LARGURA, type InviteDoc } from "@/lib/site/inviteDoc";
import BlocoVisual, { estiloDoBloco } from "./BlocoVisual";

/**
 * A miniatura do convite na lista.
 *
 * Não chama a rota de export: gerar uma imagem por convite só para preencher
 * uma grade custaria uma rasterização por miniatura, e a lista tem até cinco.
 * Fotos aparecem por `/f/<id>`, o mesmo caminho do site.
 *
 * O desenho de cada bloco vem de `BlocoVisual`, o mesmo do editor — é o que
 * garante que a miniatura mostre o convite que o casal desenhou.
 */
export default function MiniConvite({ doc }: { doc: InviteDoc }) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: `${CONVITE_LARGURA} / ${CONVITE_ALTURA}`,
        background: doc.fundo,
        // O `cqw` dos blocos mede contra ESTA caixa. Sem o container declarado
        // ele cairia para o viewport e o convite mudaria de tamanho conforme a
        // janela, não conforme o cartão.
        containerType: "size",
      }}
    >
      {doc.blocos.map((b) => (
        <div key={b.id} style={estiloDoBloco(b)}>
          <BlocoVisual bloco={b} />
        </div>
      ))}
    </div>
  );
}
