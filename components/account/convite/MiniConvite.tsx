import {
  CONVITE_ALTURA,
  CONVITE_LARGURA,
  type InviteDoc,
} from "@/lib/site/inviteDoc";
import { quebrarLinhas } from "@/lib/site/inviteRender";

/**
 * A miniatura do convite na lista.
 *
 * Desenha em HTML, não chama a rota de export: gerar uma imagem por convite só
 * para preencher uma grade custaria uma rasterização por miniatura, e a lista
 * tem até cinco. Fotos aparecem por `/f/<id>`, o mesmo caminho do site.
 *
 * As proporções são todas em `%` da caixa, então a mesma marcação serve para
 * a miniatura e para a tela do editor.
 */
export default function MiniConvite({ doc }: { doc: InviteDoc }) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: `${CONVITE_LARGURA} / ${CONVITE_ALTURA}`,
        background: doc.fundo,
        // O `cqw` do texto mede contra ESTA caixa. Sem o container declarado
        // ele cairia para o viewport e o convite mudaria de tamanho conforme
        // a janela, não conforme o cartão.
        containerType: "inline-size",
      }}
    >
      {doc.blocos.map((b) => {
        const base = {
          position: "absolute" as const,
          left: `${b.x * 100}%`,
          top: `${b.y * 100}%`,
          width: `${b.w * 100}%`,
        };

        if (b.tipo === "linha") {
          return (
            <div
              key={b.id}
              style={{ ...base, height: `${(b.espessura / CONVITE_ALTURA) * 100}%`, background: b.cor }}
            />
          );
        }

        if (b.tipo === "foto") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={b.id}
              src={`/f/${b.fotoId}`}
              alt=""
              style={{
                ...base,
                aspectRatio: String(b.proporcao || 1),
                objectFit: "cover",
                borderRadius: `${(b.raio / CONVITE_LARGURA) * 100}%`,
              }}
            />
          );
        }

        return (
          <div
            key={b.id}
            style={{
              ...base,
              // `cqw` em vez de px: o texto acompanha a largura do cartão, e a
              // miniatura fica igual ao export em qualquer tamanho de tela.
              fontSize: `${b.tamanho * 100}cqw`,
              color: b.cor,
              fontWeight: b.peso,
              textAlign: b.alinhamento,
              letterSpacing: `${b.espacamento}em`,
              lineHeight: 1.25,
              fontFamily:
                b.fonte === "sans"
                  ? "var(--font-sans, sans-serif)"
                  : b.fonte === "script"
                    ? "cursive"
                    : "var(--font-serif, serif)",
              whiteSpace: "pre-wrap",
            }}
          >
            {quebrarLinhas(b.texto, b.w * CONVITE_LARGURA, b.tamanho * CONVITE_LARGURA, b.fonte).join("\n")}
          </div>
        );
      })}
    </div>
  );
}
