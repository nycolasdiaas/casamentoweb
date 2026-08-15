import type { ReactNode } from "react";
import { listSitePhotos } from "@/lib/repositories/sitePhotos";
import { agruparPorCategoria } from "@/lib/site/albumCategories";
import SitePhoto from "@/components/site/SitePhoto";

/**
 * O álbum da festa, contado por momento.
 *
 * O pedido do Anderson foi direto: "as fotos não contam história aí". Uma
 * grade única de cinquenta fotos é um depósito; separada por momento — entrada
 * dos noivos, os votos, a saída — ela vira a narrativa do dia, que é o que o
 * pacote Para Sempre promete.
 *
 * ── Por que é UM componente para os seis moldes ─────────────────────────────
 *
 * A mesma razão do `ScrollChoreography` morar no `SiteRenderer`: corrigir aqui
 * corrige nos seis, e um molde novo herda sem saber que existe. A alternativa
 * seria seis implementações da mesma lógica de agrupamento, divergindo na
 * primeira correção.
 *
 * O desenho é neutro de propósito e sai de `currentColor` e das variáveis do
 * tema — nunca de hex escrito aqui. `npm run verify:template` reprova cor que
 * não venha do ThemeSpec do casal, e é essa regra que impede um ramo rosa de
 * aparecer num site azul-marinho.
 *
 * ── A degradação ────────────────────────────────────────────────────────────
 *
 * Sem foto de álbum, devolve o `vazio` que o molde passou — o próprio estado
 * de espera que cada um já desenhava ("as fotos aparecem aqui depois do
 * casamento"). E `agruparPorCategoria` descarta categoria sem foto, então
 * nunca se desenha um título de momento com nada embaixo. É a mesma regra do
 * resto do site: seção sem dado não aparece, não aparece quebrada.
 *
 * Foto ainda SEM categoria não some: cai num grupo final sem título, para o
 * casal que subiu tudo e ainda não classificou continuar vendo o álbum
 * inteiro. Perder foto do site por causa de organização pendente seria trocar
 * um problema por outro pior.
 */
export default async function AlbumPorCategoria({
  siteId,
  vazio,
}: {
  siteId: string;
  /** o que o molde mostra quando ainda não há foto da festa */
  vazio: ReactNode;
}) {
  const fotos = (await listSitePhotos(siteId)).filter((f) => f.slot === "album");
  if (fotos.length === 0) return <>{vazio}</>;

  const grupos = agruparPorCategoria(fotos);
  const semCategoria = fotos.filter((f) => !f.category);

  return (
    <div className="flex flex-col gap-10 lg:gap-16">
      {grupos.map((grupo) => (
        <section key={grupo.id} className="flex flex-col gap-4">
          <h3
            className="text-center text-[11px] uppercase tracking-[0.22em] opacity-70 lg:text-[13px]"
            style={{ color: "var(--ink)" }}
          >
            {grupo.rotulo}
          </h3>
          <Grade fotos={grupo.fotos} rotulo={grupo.rotulo} />
        </section>
      ))}

      {semCategoria.length > 0 && (
        <Grade fotos={semCategoria} rotulo="Da festa" />
      )}
    </div>
  );
}

function Grade({
  fotos,
  rotulo,
}: {
  fotos: { id: string }[];
  rotulo: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-3">
      {fotos.map((foto, i) => (
        <SitePhoto
          key={foto.id}
          // O tipo da linha vem do banco; aqui só o que o SitePhoto consome.
          photo={foto as Parameters<typeof SitePhoto>[0]["photo"]}
          label={`${rotulo} ${i + 1}`}
          className="aspect-square w-full"
        />
      ))}
    </div>
  );
}
