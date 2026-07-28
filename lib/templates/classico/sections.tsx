import Link from "next/link";
import PhotoSlot from "@/components/templates/PhotoSlot";
import Countdown from "@/components/site/Countdown";
import GiftGrid from "@/components/site/GiftGrid";
import { listGifts } from "@/lib/repositories/gifts";
import type { SectionProps } from "@/lib/templates/contract";

// Seções do molde Clássico, agora dirigidas por dados.
//
// Diferença para app/pacotes/estilos/classico/page.tsx (a prévia com casal
// fictício): aqui não há hex fixo nem "Ana & Pedro". Cor vem de var(--ink),
// var(--accent); conteúdo vem de `content`. É o mesmo desenho servindo N
// casais.
//
// Ver docs/sdd-geracao-automatica.md §4.4.

/** Cabeçalho ornamentado reaproveitado por várias seções do molde. */
function SectionHeading({
  script,
  title,
}: {
  script: string;
  title: string;
}) {
  return (
    <div className="text-center mb-6">
      <div className="font-[family-name:var(--font-script)] text-[29px] text-(--accent) leading-tight">
        {script}
      </div>
      <h2 className="mt-1 mb-3.5 font-[family-name:var(--font-display)] text-[23px] font-semibold tracking-[0.24em] uppercase">
        {title}
      </h2>
      <div className="w-[72px] h-px bg-(--accent) mx-auto" />
      <div className="w-11 h-px bg-(--accent) mx-auto mt-[5px]" />
    </div>
  );
}

/** Moldura dupla dourada — a assinatura visual do Clássico. */
function GoldFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-(--accent) p-[5px]">
      <div className="border border-(--accent)/50 p-[5px]">{children}</div>
    </div>
  );
}

export function Cover({ content }: SectionProps) {
  const [a, b] = content.initials ?? [null, null];

  return (
    <section className="px-[18px] pt-[52px] pb-11">
      <div className="border border-(--accent) p-1">
        <div className="border border-(--accent)/55 px-[22px] pb-9">
          {a && b && (
            <div className="flex justify-center -mt-[38px]">
              <div className="bg-(--paper) px-3.5">
                <div className="size-[76px] rounded-full border border-(--accent) flex items-center justify-center">
                  <div className="size-16 rounded-full border border-(--accent)/50 flex items-center justify-center gap-1">
                    <span className="font-[family-name:var(--font-display)] text-xl font-medium">
                      {a}
                    </span>
                    <span className="font-[family-name:var(--font-script)] text-lg text-(--accent)">
                      &amp;
                    </span>
                    <span className="font-[family-name:var(--font-display)] text-xl font-medium">
                      {b}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mt-6">
            <div className="font-[family-name:var(--font-script)] text-[37px] text-(--accent) leading-tight">
              Save the Date
            </div>
            <h1 className="font-[family-name:var(--font-display)] font-medium text-[46px] leading-[1.08] tracking-wide mt-4">
              {content.coupleNames}
            </h1>

            <div className="w-[72px] h-px bg-(--accent) mx-auto mt-5" />
            <div className="w-11 h-px bg-(--accent) mx-auto mt-[5px]" />

            {content.weekdayLabel && (
              <div className="mt-5 text-[11px] tracking-[0.35em] uppercase opacity-70">
                {content.weekdayLabel}
              </div>
            )}
            {content.weddingDateLabel && (
              <div className="mt-1.5 font-[family-name:var(--font-display)] text-2xl font-medium">
                {content.weddingDateLabel}
              </div>
            )}
            {content.weddingTimeLabel && (
              <div className="mt-0.5 italic text-[15px] opacity-80">
                {content.weddingTimeLabel}
              </div>
            )}
            {content.ceremonyVenue && (
              <div className="mt-4 font-[family-name:var(--font-display)] text-lg font-medium">
                {content.ceremonyVenue}
              </div>
            )}
            {content.ceremonyAddress && (
              <div className="mt-1 text-[10.5px] tracking-[0.3em] uppercase opacity-65">
                {content.ceremonyAddress}
              </div>
            )}
          </div>

          <div className="mt-6">
            <GoldFrame>
              <PhotoSlot
                label="Foto principal do casal"
                className="aspect-[3/4] w-full"
              />
            </GoldFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CountdownSection({ content }: SectionProps) {
  if (!content.weddingDate) return null;

  return (
    <section className="px-7 py-14 border-y border-(--accent)/35 bg-(--ink)/[0.04]">
      <SectionHeading script="falta pouco" title="Contagem regressiva" />
      <Countdown targetDate={content.weddingDate.toISOString()} />
      <div className="text-center mt-6 italic text-sm opacity-75">
        para o nosso grande dia
      </div>
    </section>
  );
}

export function Story({ content }: SectionProps) {
  if (!content.story) return null;

  return (
    <section className="px-7 py-16">
      <SectionHeading script="a nossa" title="História" />
      <p className="text-center text-base leading-[1.75] opacity-90 whitespace-pre-line">
        {content.story}
      </p>
      <div className="my-7">
        <GoldFrame>
          <PhotoSlot label="O pedido" className="aspect-[4/3] w-full" />
        </GoldFrame>
      </div>
    </section>
  );
}

export function Details({ content }: SectionProps) {
  const items = [
    content.ceremonyVenue && {
      label: "Cerimônia",
      value: content.ceremonyVenue,
      extra: content.ceremonyAddress,
      href: content.ceremonyMapUrl,
    },
    content.receptionVenue && {
      label: "Festa",
      value: content.receptionVenue,
      extra: content.receptionAddress,
      href: null,
    },
    content.dressCode && {
      label: "Traje",
      value: content.dressCode,
      extra: null,
      href: null,
    },
  ].filter(Boolean) as {
    label: string;
    value: string;
    extra: string | null;
    href: string | null;
  }[];

  if (items.length === 0) return null;

  return (
    <section className="px-7 py-16 border-y border-(--accent)/35">
      <SectionHeading script="o grande dia" title="Informações" />
      <div className="flex flex-col gap-7">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-[10px] tracking-[0.28em] uppercase opacity-65">
              {item.label}
            </div>
            <div className="mt-1.5 font-[family-name:var(--font-display)] text-lg font-medium">
              {item.value}
            </div>
            {item.extra && (
              <div className="mt-1 text-sm opacity-75">{item.extra}</div>
            )}
            {item.href && (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2.5 text-[11px] tracking-[0.2em] uppercase border-b border-(--accent) pb-0.5"
              >
                Ver no mapa
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Gallery() {
  return (
    <section className="px-7 py-16">
      <SectionHeading script="momentos" title="Galeria" />
      <div className="grid grid-cols-2 gap-3">
        {["Noivado", "Ensaio", "Viagem", "Nós dois"].map((label) => (
          <GoldFrame key={label}>
            <PhotoSlot label={label} className="aspect-square w-full" />
          </GoldFrame>
        ))}
      </div>
    </section>
  );
}

export function Rsvp({ content, slug }: SectionProps) {
  return (
    <section className="px-7 py-16">
      <SectionHeading script="você vem?" title="Confirmação" />
      <p className="mb-6 text-center text-[15.5px] leading-relaxed opacity-85">
        Sua presença é o nosso presente mais querido.
        {content.coupleNames && " Confirme sua presença pelo link que enviamos."}
      </p>

      <div
        className="border px-[22px] py-7 text-center"
        style={{
          borderColor: "color-mix(in srgb, var(--accent) 55%, transparent)",
          background: "color-mix(in srgb, var(--paper) 88%, white)",
        }}
      >
        <p className="text-sm leading-relaxed opacity-80">
          Cada família recebeu um link pessoal, com os nomes de quem foi
          convidado. Procure a mensagem que enviamos para confirmar.
        </p>
        <Link
          href={`/s/${slug}`}
          className="inline-block mt-5 text-[11.5px] tracking-[0.24em] uppercase px-7 py-3.5 border transition-opacity hover:opacity-85"
          style={{
            background: "var(--ink)",
            borderColor: "var(--ink)",
            color: "var(--paper)",
          }}
        >
          Não recebi meu link
        </Link>
      </div>
    </section>
  );
}

export async function Gifts({ siteId, content }: SectionProps) {
  const gifts = await listGifts(siteId);
  if (gifts.length === 0) return null;

  return (
    <section
      className="px-7 py-16 border-y"
      style={{
        background: "color-mix(in srgb, var(--ink) 4%, var(--paper))",
        borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
      }}
    >
      <SectionHeading script="com carinho" title="Lista de presentes" />
      <p className="mb-6 text-center text-[15.5px] leading-relaxed opacity-85">
        {content.giftMessage ??
          "Ter você conosco já é presente. Mas, se o coração pedir, cada mimo abaixo vira uma lembrança da nossa lua de mel."}
      </p>
      <GiftGrid
        gifts={gifts.map((g) => ({
          id: g.id,
          category: g.category,
          name: g.name,
          priceCents: g.priceCents,
        }))}
      />
    </section>
  );
}

export function Album({ content }: SectionProps) {
  const dataLabel = content.weddingDateLabel;

  return (
    <section
      className="px-7 py-16 border-t"
      style={{
        background: "color-mix(in srgb, var(--ink) 4%, var(--paper))",
        borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
      }}
    >
      <SectionHeading script="para matar a saudade" title="Álbum da festa" />
      <div
        className="border px-6 py-8 text-center"
        style={{
          borderColor: "color-mix(in srgb, var(--accent) 55%, transparent)",
          background: "color-mix(in srgb, var(--paper) 88%, white)",
        }}
      >
        <div className="flex justify-center">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.3"
            aria-hidden
          >
            <rect x="5" y="10" width="14" height="10" rx="1" />
            <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
          </svg>
        </div>
        <div className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium">
          Um presente para depois
        </div>
        <p className="mt-2.5 text-sm leading-relaxed opacity-80">
          As fotos da festa aparecem aqui
          {dataLabel ? ` depois de ${dataLabel}` : " depois do casamento"}.
          Volte para matar a saudade.
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 opacity-65">
          {Array.from({ length: 6 }).map((_, i) => (
            <PhotoSlot key={i} label="" className="aspect-square w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer({ content }: SectionProps) {
  return (
    <footer
      className="px-7 py-14 text-center"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      <div className="font-[family-name:var(--font-script)] text-[32px] text-(--accent)">
        {content.coupleNames}
      </div>
      {content.weddingDateLabel && (
        <div className="mt-2 text-[11px] tracking-[0.3em] uppercase opacity-80">
          {content.weddingDateLabel}
        </div>
      )}
    </footer>
  );
}
