import { listarRecados } from "@/lib/repositories/guestbook";
import FormularioDeRecado from "@/components/site/FormularioDeRecado";

/**
 * O mural de recados — a última seção do contrato que não existia.
 *
 * ── Por que é UM componente para os seis moldes ─────────────────────────────
 *
 * Mesma razão do `AlbumPorCategoria`: corrigir aqui corrige nos seis, e um
 * molde novo herda sem saber que existe. Cada molde entra só com o cabeçalho
 * e o enquadramento da própria seção.
 *
 * ── O desenho sai de TOKEN, nunca de hex ────────────────────────────────────
 *
 * `var(--ink)`, `var(--paper)`, `var(--accent)` e `currentColor`.
 * `npm run verify:template` reprova cor escrita à mão na marcação de seção, e
 * é essa regra que impede um recado com fundo bege aparecer num site
 * azul-marinho.
 *
 * ── A degradação ────────────────────────────────────────────────────────────
 *
 * Sem nenhum recado, a lista não vira "nenhum recado ainda" — isso seria
 * anunciar ao convidado que ninguém escreveu, e o primeiro a chegar ficaria
 * constrangido de ser o primeiro. Fica só o convite para escrever, que é o
 * que a seção quer de qualquer forma.
 */
export default async function Mural({
  siteId,
  slug,
  convite,
}: {
  siteId: string;
  slug: string;
  /** Frase do molde acima do formulário. */
  convite?: string;
}) {
  const recados = await listarRecados(siteId);

  return (
    <div className="flex flex-col gap-8">
      {recados.length > 0 && (
        <ul className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-5">
          {recados.map((recado) => (
            <li
              key={recado.id}
              className="flex flex-col gap-2 p-5 lg:p-6"
              style={{
                // Papel sobre papel: o recado afunda um passo em relação ao
                // fundo da seção, sem ganhar cor própria.
                background: "color-mix(in srgb, var(--ink) 4%, var(--paper))",
                border: "1px solid color-mix(in srgb, var(--ink) 10%, transparent)",
              }}
            >
              <p
                className="text-[15px] leading-[1.7] lg:text-[16px]"
                style={{ color: "color-mix(in srgb, var(--ink) 82%, transparent)" }}
              >
                {recado.message}
              </p>
              <p
                className="text-[13px] tracking-[0.08em] uppercase"
                style={{ color: "var(--accent)" }}
              >
                {recado.guestName}
              </p>
            </li>
          ))}
        </ul>
      )}

      <FormularioDeRecado slug={slug} convite={convite} />
    </div>
  );
}
