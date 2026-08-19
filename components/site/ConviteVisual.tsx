import { CONVITE_ALTURA, CONVITE_LARGURA, type InviteDoc } from "@/lib/site/inviteDoc";
import BlocoVisual, { estiloDoBloco } from "@/components/account/convite/BlocoVisual";

/**
 * O convite publicado, para o convidado.
 *
 * Mesmo desenho do editor e da miniatura — `BlocoVisual` é compartilhado, e é
 * o que garante que o que o casal posicionou seja o que o convidado vê.
 *
 * A diferença que justifica este componente: aqui o bloco com link vira um
 * `<a>` DE VERDADE. É a razão de o convite ter virado página — numa imagem, o
 * botão "Lista de presentes" é desenho; aqui ele leva à lista.
 */
export default function ConviteVisual({ doc }: { doc: InviteDoc }) {
  return (
    <div
      className="relative w-full overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.12)]"
      style={{
        aspectRatio: `${doc.largura || CONVITE_LARGURA} / ${doc.altura || CONVITE_ALTURA}`,
        background: doc.fundo,
        // O `cqw` dos blocos mede contra ESTA caixa: o convite fica igual em
        // qualquer tela, do celular ao monitor.
        containerType: "size",
      }}
    >
      {doc.blocos.map((b) => {
        const conteudo = <BlocoVisual bloco={b} />;
        const temLink = b.tipo === "texto" && b.link.trim() !== "";

        if (!temLink) {
          return (
            <div key={b.id} style={estiloDoBloco(b)}>
              {conteudo}
            </div>
          );
        }

        const link = (b as { link: string }).link.trim();
        // Link externo abre em aba nova; link para o próprio site do casal
        // navega na mesma — o convidado continua "dentro do convite".
        const externo = !link.startsWith("/") && !link.includes("/s/");

        return (
          <a
            key={b.id}
            href={link}
            {...(externo
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            style={{ ...estiloDoBloco(b), cursor: "pointer" }}
            className="transition-opacity hover:opacity-80"
          >
            {conteudo}
          </a>
        );
      })}
    </div>
  );
}
