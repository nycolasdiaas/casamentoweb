import { Icone } from "@/components/ui/prensa";
import { tierAllowsSection } from "@/lib/templates/contract";
import type { PackageTier } from "@/lib/packages";

/**
 * E10 · a faixa de "seu site está pronto — e ainda invisível".
 *
 * ── O defeito que ela conserta ─────────────────────────────────────────────
 *
 * A prévia do painel é boa demais. O casal abre a tela, vê o site inteiro
 * montado, com as fotos e os textos dele, e conclui que já está no ar. Só
 * descobre que não quando manda o link para alguém — e aí a descoberta chega
 * pela pessoa errada.
 *
 * A faixa diz a mesma coisa três vezes, e é de propósito: em texto aqui, na
 * marca d'água sobre a miniatura, e no cartão do lado que lista o que muda ao
 * publicar. Uma pessoa lendo rápido pega pelo menos uma.
 *
 * ── O que ela NÃO faz ──────────────────────────────────────────────────────
 *
 * Não cobra. O botão rola até o `PaymentButton` que já existe. O artboard 10.2
 * desenha um checkout embutido — QR Pix, copia-e-cola, "aguardando pagamento…"
 * — e isso foi **cancelado pelo dono**: quem faz essas quatro coisas é o
 * AbacatePay. Um segundo caminho de pagamento seria um segundo lugar para
 * manter, e o lugar onde o dinheiro passa é o pior para se ter dois.
 */
export default function PublicarAgora({
  endereco,
  tier,
}: {
  /** O endereço REAL do site, sem esquema. Nunca um exemplo. */
  endereco: string;
  tier: PackageTier;
}) {
  /* Num pacote Convite não há confirmação de presença. Prometer que ela
     "ativa ao publicar" seria vender o que não foi comprado. */
  const temRsvp = tierAllowsSection(tier, "rsvp");

  const oQueMuda: { texto: string; ok: boolean }[] = [
    { texto: "O endereço entra no ar para os convidados", ok: true },
    { texto: "A marca d'água de prévia some", ok: true },
    ...(temRsvp
      ? [{ texto: "Convites e confirmação de presença ativam", ok: true }]
      : []),
    /* A quarta não é um ganho, é uma garantia — e é a que tira o medo de
       publicar. Por isso ponto neutro, não check verde. */
    { texto: "Vocês podem continuar editando depois de publicar", ok: false },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div
        className="surface-raised flex items-start gap-4 rounded-[3px] p-5"
        style={{ borderLeft: "3px solid var(--c-ink)" }}
      >
        <span
          aria-hidden="true"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-(--c-sunken)"
        >
          {/* 16, e não os 17px do artboard: a escala de ícone da Prensa
              tem três degraus (16/20/24) e é fechada de propósito — um
              tamanho fora dela quebra a espessura de traço que faz os ~60
              ícones parecerem a mesma família. */}
          <Icone nome="cadeado" tamanho={16} />
        </span>

        <div className="flex min-w-0 flex-col gap-2">
          <p className="t-display text-[19px] leading-snug text-(--c-ink)">
            Seu site está pronto — e ainda invisível para os convidados.
          </p>
          <p className="t-corpo-p text-(--c-ink-2)">
            A prévia é de vocês para revisar à vontade. O endereço{" "}
            <span className="t-data text-[13px] text-(--c-ink)">{endereco}</span>{" "}
            só entra no ar depois do pagamento.
          </p>
          {/* Âncora, não rota nova: a decisão de pagar já mora no
              `PaymentButton` lá embaixo. */}
          <a href="#pagar" className="btn btn-ink mt-1 self-start">
            Publicar site →
          </a>
        </div>
      </div>

      <div className="surface-flat flex flex-col gap-2.5 rounded-[3px] p-5">
        <span className="meta text-(--c-ink-2)">O que muda ao publicar</span>
        <ul className="flex flex-col gap-2 text-[13.5px] leading-snug">
          {oQueMuda.map((l) => (
            <li key={l.texto} className="flex items-start gap-2.5">
              {l.ok ? (
                <span className="shrink-0 text-(--c-ok)" aria-hidden="true">
                  <Icone nome="check" tamanho={16} />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-[6px] shrink-0 rounded-full bg-(--c-ink-3)"
                />
              )}
              <span className="text-(--c-ink-2)">{l.texto}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
