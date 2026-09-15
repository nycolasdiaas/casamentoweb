import Link from "next/link";
import { Suspense } from "react";
import { PACKAGES, type PackageTier } from "@/lib/packages";
import { tierAllowsSection, type SectionKey } from "@/lib/templates/contract";
import { Icone } from "@/components/ui/prensa";
import CtaPacote, { CtaPacoteFallback } from "@/components/landing/CtaPacote";

/**
 * Faixa B2 · os pacotes, como SEÇÃO da home.
 *
 * `/pacotes` é `redirect("/")` desde que a landing da plataforma virou a home;
 * o desenho B2 mora aqui, no lugar para onde o link vai.
 *
 * A decisão que vale registro é a LISTA DE RECURSOS. O desenho traz as três
 * listas escritas à mão nos cards — e elas estão erradas em relação ao
 * produto: põem confirmação de presença no Convite e mural de recados no
 * Site, quando `TIER_SECTIONS` dá RSVP só do Site para cima e mural só no
 * Para Sempre. Regra do AGENTS.md §5: quando o desenho e o produto discordam,
 * o produto vence.
 *
 * Então a tabela é DERIVADA de `tierAllowsSection` — a mesma função que
 * decide quais seções o site do casal renderiza. Não é elegância: é a
 * garantia de que a vitrine não pode prometer uma seção que o molde não vai
 * mostrar. Pacote novo mexe em `PACKAGES` e em `TIER_SECTIONS`, e a vitrine
 * acompanha sozinha.
 */

/** Só as seções que são ARGUMENTO DE VENDA. `footer` não vende nada. */
const RECURSOS: { chave: SectionKey; rotulo: string }[] = [
  { chave: "cover", rotulo: "Capa e Save the Date" },
  { chave: "countdown", rotulo: "Contagem regressiva" },
  { chave: "story", rotulo: "A história de vocês" },
  { chave: "details", rotulo: "Local, mapa e traje" },
  { chave: "gallery", rotulo: "Galeria de fotos" },
  { chave: "rsvp", rotulo: "Confirmação de presença" },
  { chave: "gifts", rotulo: "Lista de presentes por Pix" },
  { chave: "guestbook", rotulo: "Mural de recados" },
  { chave: "album", rotulo: "Álbum depois da festa" },
];

export default function Pacotes() {
  return (
    <section id="pacotes" className="scroll-mt-20 bg-(--c-base)">
      <div className="trilho py-24 flex flex-col gap-12">
        <div className="flex flex-col gap-3 text-center items-center">
          <span className="meta text-(--c-mark)">
            Pagamento único · sem mensalidade
          </span>
          <h2 className="t-d1 text-(--c-ink)">Escolham uma vez.</h2>
          <p className="t-corpo text-(--c-ink-2) max-w-[46ch]">
            O preço está aqui e é o preço. Sem orçamento, sem conversa antes de
            comprar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PACKAGES.map((pkg) => (
            <CartaoDePacote key={pkg.tier} tier={pkg.tier} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CartaoDePacote({ tier }: { tier: PackageTier }) {
  const pkg = PACKAGES.find((p) => p.tier === tier)!;
  const destaque = pkg.highlight;

  /* O destaque é BORDA, não fundo.
     O card cheio de tinta que estava aqui competia com o carimbo de prova do
     painel pelo mesmo papel — o de único elemento ousado da marca — e a
     Fundação é explícita: se aparecer um segundo elemento ousado, os dois
     viram ruído. Fio de 1.5px, sombra de papel apoiado e a tarja em `--mark`
     dão a mesma hierarquia sem gastar a ousadia. */
  const moldura = destaque
    ? "surface-raised border-[1.5px] border-(--c-ink) shadow-[0_8px_30px_rgb(26_29_33/0.10)]"
    : "surface-raised";

  return (
    <article
      className={`${moldura} relative rounded-[3px] p-7 lg:p-8 flex flex-col`}
    >
      {destaque && (
        <span className="absolute -top-[11px] left-7 bg-(--c-mark) text-white meta text-[10.5px] px-2.5 py-[3px] rounded-[2px]">
          {pkg.priceNote ?? "mais escolhido"}
        </span>
      )}

      <h3 className="t-display text-[28px] leading-none text-(--c-ink)">
        {pkg.name}
      </h3>
      <p className="t-corpo-p text-(--c-ink-2) mt-2 min-h-[40px]">
        {pkg.tagline}
      </p>

      {/* Valor é DADO: mono, tabular. É o papel que a Fundação A2 reserva para
          pedido, data, valor e link — e é o que alinha as três colunas de
          preço na vertical, coisa que a proporcional nunca faz. */}
      <p className="t-data text-[38px] leading-none text-(--c-ink) mt-6">
        {pkg.price}
      </p>
      <span className="meta text-(--c-ink-2) mt-1.5">uma vez</span>

      <hr className="border-0 border-t border-(--c-rule) my-6" />

      <ul className="flex flex-col gap-3 flex-1">
        {RECURSOS.map(({ chave, rotulo }) => {
          const tem = tierAllowsSection(tier, chave);
          return (
            <li
              key={chave}
              /* O ausente era `--c-ink-2` a 60%: sobre o branco dá `#9c9fa3`,
                 2,65:1 — o Lighthouse reprovou (UX-028). A tinta secundária
                 cheia é 6,4:1 e mantém a hierarquia: incluído em tinta
                 principal, ausente um degrau abaixo. */
              className={`flex items-start gap-2.5 text-sm leading-snug ${
                tem ? "text-(--c-ink)" : "text-(--c-ink-2)"
              }`}
            >
              {tem ? (
                <span className="text-(--c-ok) shrink-0 mt-px">
                  <Icone nome="check" tamanho={16} />
                </span>
              ) : (
                /* Ausente é um traço, não um X. X lê como erro; o traço lê
                   como "não faz parte deste", que é o que é. */
                <span
                  className="shrink-0 mt-px w-4 text-center leading-4"
                  aria-hidden="true"
                >
                  —
                </span>
              )}
              <span>{rotulo}</span>
              {!tem && <span className="sr-only">não incluído</span>}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3 pt-7">
        <Suspense
          fallback={
            <CtaPacoteFallback
              className={`btn ${destaque ? "btn-ink" : "btn-quiet"} w-full`}
              rotulo={`Escolher ${pkg.name}`}
              tier={pkg.tier}
            />
          }
        >
          <CtaPacote
            className={`btn ${destaque ? "btn-ink" : "btn-quiet"} w-full`}
            rotulo={`Escolher ${pkg.name}`}
              tier={pkg.tier}
          />
        </Suspense>
        {/* `/pacotes/exemplo/<tier>` é redirect para "/" desde que as demos
            mockadas saíram: o exemplo de verdade é o molde renderizado, que
            já aceita `?pacote=` para abrir com as seções do pacote certo. */}
        <Link
          href={`/pacotes/estilos/classico?pacote=${pkg.tier}`}
          className="text-center text-[13px] text-(--c-ink-2) underline underline-offset-4 hover:text-(--c-ink)"
        >
          Ver um exemplo
        </Link>
      </div>
    </article>
  );
}
