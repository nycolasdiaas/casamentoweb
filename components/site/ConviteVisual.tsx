import { CONVITE_ALTURA, CONVITE_LARGURA, type InviteDoc } from "@/lib/site/inviteDoc";
import BlocoVisual, { estiloDoBloco } from "@/components/account/convite/BlocoVisual";
import { linkDoBotaoDoConvite } from "@/lib/site/ancoras";

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
export default function ConviteVisual({
  doc,
  slug,
  baseUrl,
}: {
  doc: InviteDoc;
  /** Slug do SITE do casal — o destino dos botões. */
  slug?: string;
  baseUrl?: string;
}) {
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

        /* O botão vira `<a>` DE VERDADE, e o endereço é resolvido AGORA — não
           gravado no `doc`. É isso que faz o convite continuar certo quando o
           site muda de endereço: o convite guarda "leva à confirmação", não
           "leva a /s/ana-e-pedro#confirmacao".

           Sem slug (a miniatura do painel, a prévia), o botão não vira link:
           melhor um botão que não faz nada dentro do editor do que um link
           para o lugar errado. */
        if (b.tipo === "botao") {
          const href =
            slug && baseUrl
              ? b.destino === "site"
                ? `${baseUrl.replace(/\/+$/, "")}/s/${slug}`
                : linkDoBotaoDoConvite(baseUrl, slug, b.destino)
              : null;

          return href ? (
            <a
              key={b.id}
              href={href}
              style={{ ...estiloDoBloco(b), cursor: "pointer" }}
              className="transition-opacity hover:opacity-85"
            >
              {conteudo}
            </a>
          ) : (
            <div key={b.id} style={estiloDoBloco(b)}>
              {conteudo}
            </div>
          );
        }

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
