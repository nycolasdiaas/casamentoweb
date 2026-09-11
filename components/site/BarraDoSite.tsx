import { ANCORA_DA_SECAO, ROTULO_CURTO } from "@/lib/site/ancoras";
import type { SectionKey } from "@/lib/templates/contract";

/**
 * F1 · a barra fixa do site do casal.
 *
 * O convidado abre `/s/<slug>` para fazer UMA coisa: confirmar presença, ou
 * ver a lista de presentes. Num casamento com sete seções, as duas estavam a
 * uma rolagem inteira de distância — e o botão de confirmar só existia no fim
 * da página, depois de tudo. A barra encurta isso para um toque.
 *
 * ── Onde ela mora, e por quê ───────────────────────────────────────────────
 *
 * Aqui, e não dentro dos seis moldes. `SectionKey` é lista fechada (SDD §4.4)
 * e a barra não é seção: é chrome, que atravessa os seis. O `SiteRenderer` já
 * tem o precedente — `RevealOnScroll`, `PhotoLightbox` e o invólucro de
 * âncoras vivem lá pela mesma razão, e um molde novo os herda sem saber que
 * existem. Portar a barra seis vezes seria seis chances de ela ficar
 * diferente.
 *
 * ── Server component ───────────────────────────────────────────────────────
 *
 * Sem diretiva de cliente, e a spec cobra isso com um `grep` — por isso a
 * palavra não aparece nem aqui. A barra é `position: sticky` e âncora
 * `<a href="#">`;
 * o navegador faz as duas coisas sozinho há vinte anos. O que exigiria JS é
 * destacar a seção em que o convidado está durante a rolagem — está fora
 * desta spec de propósito, porque custaria um bundle a mais no aparelho de
 * quem abriu o convite no 4G do casamento.
 *
 * ── Cor ────────────────────────────────────────────────────────────────────
 *
 * Só token do `ThemeSpec` (`var(--paper)`, `var(--ink)`). Nenhum hex: a barra
 * aparece nos seis moldes e em todo tema que o casal montar, e um `#f2efe7`
 * chumbado aqui seria papel bege numa capa preta.
 */
export default function BarraDoSite({
  nomes,
  chaves,
}: {
  /** `content.coupleNames` — o mesmo texto da capa. */
  nomes: string;
  /** As seções que o `SiteRenderer` de fato renderizou, na ordem delas. */
  chaves: SectionKey[];
}) {
  /* As âncoras saem do que renderizou, nunca de uma lista fixa.
     `cover` e `countdown` estão no topo (o convidado já está nelas quando a
     página abre), `footer` não é destino, e `rsvp` sai daqui porque vira o
     botão do fim da barra. */
  const ancoras = chaves.filter(
    (k) => k !== "cover" && k !== "countdown" && k !== "rsvp" && k !== "footer"
  );

  /* O botão só existe se a seção existir. Num pacote Convite não há
     confirmação de presença — e oferecê-la na barra seria vender pelo desenho
     o que o pacote não entrega. */
  const temConfirmacao = chaves.includes("rsvp");

  /* Barra com um item é ruído: ocupa 60px do alto da tela para oferecer um
     atalho que a primeira rolagem já daria.

     A spec escreve "menos de duas âncoras", e o botão de confirmar entra na
     conta como item. Um site com uma seção e o botão ainda vale a barra — o
     botão é o motivo de ela existir, não um enfeite ao lado das âncoras.
     Sem ele e com menos de duas âncoras, some. */
  if (ancoras.length < 2 && !temConfirmacao) return null;

  return (
    <nav
      className="sticky top-0 z-20 flex h-[52px] items-center gap-3 px-4 backdrop-blur-[8px] @[700px]:h-[60px] @[700px]:gap-4 @[700px]:px-10"
      style={{
        background: "color-mix(in srgb, var(--paper) 92%, transparent)",
        borderBottom:
          "1px solid color-mix(in srgb, var(--ink) 14%, transparent)",
      }}
    >
      {/* Os nomes do casal, na fonte de display do tema — é a assinatura da
          peça, e ela continua visível depois que a capa sai de vista.

          `max-w-[30%]` no celular: sem teto, "Maria Fernanda & João Vitor"
          comia a faixa inteira e sobravam 49px de âncoras — uma faixa de
          rolagem onde não cabe um rótulo não é navegação, é enfeite. Os nomes
          cortam com reticências; eles estão na capa logo abaixo, e o convidado
          sabe de quem é o casamento que ele abriu. No desktop o teto sai: lá
          cabe tudo. */}
      <a
        href={`#${ANCORA_DA_SECAO.cover}`}
        className="max-w-[30%] shrink-0 truncate text-[17px] leading-none no-underline @[700px]:max-w-none @[700px]:text-[22px]"
        style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
      >
        {nomes}
      </a>

      {/* No celular a faixa de âncoras rola na horizontal em vez de quebrar
          linha ou espremer os rótulos. `.no-scrollbar` esconde a barra de
          rolagem — ela apareceria por cima do fio de baixo.

          `py-3` não é respiro: é ÁREA DE TOQUE. Medido em 390px na auditoria
          de 11/09/2026, cada âncora tinha 12px de altura clicável — um terço
          do mínimo de ~44px, na navegação principal de um site que o convidado
          abre no celular, em pé, com uma mão (UX-015). O padding vertical
          cresce a área sem mexer no tamanho da letra nem no desenho da faixa;
          `-my-3` devolve o espaço ao layout, então a barra continua com a
          mesma altura. */}
      <div className="no-scrollbar ml-auto flex min-w-0 items-center gap-4 overflow-x-auto @[700px]:gap-7">
        {ancoras.map((k) => (
          <a
            key={k}
            href={`#${ANCORA_DA_SECAO[k] ?? k}`}
            className="-my-3 shrink-0 py-3 text-[12px] leading-none no-underline opacity-75 transition-opacity hover:opacity-100 @[700px]:text-[13px]"
            style={{ color: "var(--ink)" }}
          >
            {ROTULO_CURTO[k] ?? k}
          </a>
        ))}
      </div>

      {/* "Confirmar presença", nunca "RSVP" — a sigla é vocabulário nosso, não
          do convidado (regras de negócio §6).

          O botão não usa classe de molde porque não existe uma: cada um dos
          seis estiliza os próprios CTAs inline. O que os seis têm em comum é
          a inversão `--ink` sobre `--paper`, e é ela que a barra repete. */}
      {temConfirmacao && (
        <a
          href={`#${ANCORA_DA_SECAO.rsvp}`}
          /* py-3.5 no celular: o botão tinha 30px de altura, e é o alvo mais
             importante da barra — é por ele que passa a confirmação de
             presença, que é o que o casal comprou (UX-015). */
          className="shrink-0 whitespace-nowrap px-4 py-3.5 text-[10px] uppercase leading-none tracking-[0.06em] no-underline transition-opacity hover:opacity-85 @[700px]:px-6 @[700px]:py-3 @[700px]:text-[11px] @[700px]:tracking-[0.18em]"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          Confirmar presença
        </a>
      )}
    </nav>
  );
}
