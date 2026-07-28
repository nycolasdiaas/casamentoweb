import Link from "next/link";
import PhotoSlot from "@/components/templates/PhotoSlot";
import SitePhoto from "@/components/site/SitePhoto";
import Countdown from "@/components/site/Countdown";
import GiftGrid from "@/components/site/GiftGrid";
import { listGifts } from "@/lib/repositories/gifts";
import { listSitePhotos, photoAt, SLOT_CAPACITY } from "@/lib/repositories/sitePhotos";
import type { SectionProps } from "@/lib/templates/contract";

// Seções do molde Toscana — villa italiana ao entardecer.
//
// Mesma regra dos outros moldes: nenhum hex, nenhum nome fixo. O que
// diferencia o Toscana é a temperatura — capa sangrada em foto com véu
// oliva, blocos creme alternando com oliva escuro, caligrafia grande nos
// respiros e legendas em itálico.
//
// Diferença para app/pacotes/estilos/toscana/page.tsx (a prévia com casal
// fictício): lá há horário de portão, legendas de foto ("o brinde de 2019") e
// frases em italiano escritas no código. Aqui só entra o que existe no banco.
//
// Ver docs/sdd-geracao-automatica.md §4.4.

function tinta(percent: number) {
  return `color-mix(in srgb, var(--ink) ${percent}%, transparent)`;
}

function papel(percent: number) {
  return `color-mix(in srgb, var(--paper) ${percent}%, transparent)`;
}

/** Creme: o papel levemente aquecido pela tinta. */
const CREME = "color-mix(in srgb, var(--ink) 4%, var(--paper))";
const CREME_FUNDO = "color-mix(in srgb, var(--ink) 8%, var(--paper))";
/** Dourado clareado, para uso sobre os blocos escuros. */
const DOURADO_CLARO = "color-mix(in srgb, var(--accent) 72%, var(--paper))";

function SectionTitle({
  kicker,
  title,
  onDark = false,
}: {
  kicker: string;
  title: string;
  onDark?: boolean;
}) {
  return (
    <div className="text-center mb-7">
      <div
        className="text-[10px] tracking-[0.4em] uppercase"
        style={{ color: onDark ? DOURADO_CLARO : "var(--accent)" }}
      >
        {kicker}
      </div>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-[36px] font-medium tracking-[0.02em] uppercase leading-none">
        {title}
      </h2>
    </div>
  );
}

/** Medalhão com as iniciais — aparece na capa e no rodapé. */
function Monograma({ content, size }: { content: SectionProps["content"]; size: number }) {
  const iniciais = content.initials;
  if (!iniciais) return null;

  return (
    <div
      className="flex items-center justify-center rounded-full font-[family-name:var(--font-display)]"
      style={{
        width: size,
        height: size,
        border: `1px solid ${papel(55)}`,
        fontSize: size * 0.34,
      }}
    >
      {iniciais[0]}
      {iniciais[1]}
    </div>
  );
}

export async function Cover({ content, siteId }: SectionProps) {
  const capa = photoAt(await listSitePhotos(siteId), "cover");
  const [a, b] = content.initials ?? [null, null];
  const local = content.ceremonyVenue;

  return (
    <section
      className="relative flex flex-col overflow-hidden"
      style={{ minHeight: "92vh", background: "var(--ink)" }}
    >
      <div className="absolute inset-0">
        <SitePhoto photo={capa} label="Foto principal do casal" className="w-full h-full" priority />
      </div>
      {/* O véu escuro não é enfeite: sem ele o texto claro some sobre foto
          clara, e não dá para saber que foto o casal vai subir. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${tinta(70)} 0%, ${tinta(22)} 38%, ${tinta(32)} 62%, ${tinta(82)} 100%)`,
        }}
      />

      <div
        className="relative z-10 flex justify-between items-center gap-3 px-5 py-5"
        style={{ color: "var(--paper)" }}
      >
        <Monograma content={content} size={38} />
        {content.ceremonyAddress && (
          <div className="text-[9.5px] tracking-[0.34em] uppercase opacity-85 text-right">
            {content.ceremonyAddress}
          </div>
        )}
      </div>

      <div
        className="relative z-10 mt-auto px-6 pb-14 text-center"
        style={{ color: "var(--paper)" }}
      >
        {content.weddingDateParts && (
          <div
            className="font-[family-name:var(--font-script)] text-[44px] leading-none"
            style={{ color: DOURADO_CLARO }}
          >
            {content.weddingDateParts.day}.{content.weddingDateParts.month}.
            {content.weddingDate?.getFullYear()}
          </div>
        )}

        <h1 className="mt-3.5 font-[family-name:var(--font-display)] text-[58px] font-medium leading-[0.98] tracking-[0.02em] uppercase">
          {a && b && content.partnerA && content.partnerB ? (
            <>
              {content.partnerA}
              <br />
              <span
                className="font-[family-name:var(--font-script)] text-[46px]"
                style={{ color: DOURADO_CLARO }}
              >
                &amp;
              </span>
              <br />
              {content.partnerB}
            </>
          ) : (
            <span className="text-[44px] leading-[1.06]">{content.coupleNames}</span>
          )}
        </h1>

        <div className="mt-5 flex items-center justify-center gap-3">
          <span className="h-px w-10" style={{ background: papel(60) }} />
          <span className="text-[10px] tracking-[0.42em] uppercase">Save the Date</span>
          <span className="h-px w-10" style={{ background: papel(60) }} />
        </div>

        {(local || content.weddingTimeLabel) && (
          <div className="mt-4 italic text-[17px] opacity-90">
            {[local, content.weddingTimeLabel].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
    </section>
  );
}

export function CountdownSection({ content }: SectionProps) {
  if (!content.weddingDate) return null;

  return (
    <section className="px-8 py-14" style={{ background: CREME }}>
      <div className="text-center mb-8">
        <div className="text-[10px] tracking-[0.4em] uppercase text-(--accent)">
          A contagem começou
        </div>
        <div className="mt-2 font-[family-name:var(--font-script)] text-[46px] leading-none">
          falta pouco…
        </div>
      </div>
      <Countdown targetDate={content.weddingDate.toISOString()} />
    </section>
  );
}

export async function Story({ content, siteId }: SectionProps) {
  if (!content.story) return null;

  const fotos = await listSitePhotos(siteId);
  const larga = photoAt(fotos, "story");
  const duas = fotos.filter((f) => f.slot === "gallery").slice(0, 2);

  return (
    <section className="py-16">
      <div className="px-8">
        <SectionTitle kicker="Il nostro racconto" title="Nossa história" />
      </div>

      {/* Sangrada de propósito: é a única foto do molde que encosta nas duas
          bordas, e é o que dá o respiro de revista de viagem. */}
      <div className="mb-7">
        <SitePhoto photo={larga} label="A nossa história" className="w-full aspect-[16/10]" />
      </div>

      <div className="px-8">
        <p className="text-center text-[16px] leading-[1.8] whitespace-pre-line">
          {content.story}
        </p>
      </div>

      {duas.length === 2 && (
        <div className="mt-8 px-8 grid grid-cols-2 gap-4">
          {duas.map((foto, i) => (
            <figure key={foto.id} className={`m-0 ${i === 1 ? "mt-6" : ""}`}>
              <SitePhoto photo={foto} label={`Momento ${i + 1}`} className="w-full aspect-[3/4]" />
            </figure>
          ))}
        </div>
      )}

      <div
        className="mt-9 px-8 text-center font-[family-name:var(--font-script)] text-[36px] leading-tight"
        style={{ color: "var(--accent)" }}
      >
        la dolce vita, insieme
      </div>
    </section>
  );
}

function InfoCard({
  kicker,
  title,
  lines,
  href,
  cta,
  filled = false,
}: {
  kicker: string;
  title: string;
  lines: (string | null)[];
  href?: string | null;
  cta?: string;
  filled?: boolean;
}) {
  return (
    <div
      className="p-6 text-center"
      style={{
        border: `1px solid ${tinta(18)}`,
        background: filled ? "var(--paper)" : "transparent",
      }}
    >
      <div className="text-[10px] tracking-[0.34em] uppercase text-(--accent)">
        {kicker}
      </div>
      <div className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-medium leading-tight">
        {title}
      </div>
      {lines.filter(Boolean).map((line) => (
        <div key={line} className="mt-1.5 text-[14.5px] leading-[1.7]" style={{ color: tinta(72) }}>
          {line}
        </div>
      ))}
      {href && cta && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-[10px] tracking-[0.24em] uppercase border-b pb-0.5"
          style={{ borderColor: "var(--accent)" }}
        >
          {cta}
        </a>
      )}
    </div>
  );
}

export function Details({ content }: SectionProps) {
  const temAlgo =
    content.ceremonyVenue || content.receptionVenue || content.dressCode;
  if (!temAlgo) return null;

  return (
    <section className="px-8 py-16" style={{ background: CREME_FUNDO }}>
      <SectionTitle kicker="Quando & onde" title="O grande dia" />
      <div className="flex flex-col gap-4.5">
        {content.ceremonyVenue && (
          <InfoCard
            kicker={
              content.weddingTimeLabel
                ? `Cerimônia · ${content.weddingTimeLabel}`
                : "Cerimônia"
            }
            title={content.ceremonyVenue}
            lines={[content.ceremonyAddress]}
            href={content.ceremonyMapUrl}
            cta="Ver no mapa"
            filled
          />
        )}

        {content.receptionVenue && (
          <InfoCard
            kicker="Recepção"
            title={content.receptionVenue}
            lines={[content.receptionAddress]}
          />
        )}

        {content.dressCode && (
          <div className="p-6 text-center" style={{ border: `1px solid ${tinta(20)}` }}>
            <div className="text-[10px] tracking-[0.34em] uppercase text-(--accent)">
              Dress code
            </div>
            <div className="mt-2 font-[family-name:var(--font-script)] text-[38px] leading-none">
              {content.dressCode}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export async function Gallery({ siteId }: SectionProps) {
  const fotos = (await listSitePhotos(siteId))
    .filter((f) => f.slot === "gallery")
    .slice(0, SLOT_CAPACITY.gallery);

  const [larga, ...resto] = fotos;

  return (
    <section className="px-8 py-16" style={{ background: CREME_FUNDO }}>
      <SectionTitle kicker="Antes do grande dia" title="Nosso pré-wedding" />

      <div className="mb-3">
        <SitePhoto photo={larga} label="Ensaio" className="w-full aspect-[16/10]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {resto.length > 0
          ? resto.map((foto, i) => (
              <SitePhoto
                key={foto.id}
                photo={foto}
                label={`Momento ${i + 1}`}
                className="w-full aspect-square"
              />
            ))
          : // Sem foto do casal, os quadros de exemplo seguram o desenho —
            // não se mistura foto real com foto de desconhecido.
            ["Noivado", "Ensaio"].map((label) => (
              <PhotoSlot key={label} label={label} className="w-full aspect-square" />
            ))}
      </div>
    </section>
  );
}

export function Rsvp({ slug }: SectionProps) {
  return (
    <section className="px-8 py-16" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <div className="text-center mb-6">
        <div className="text-[10px] tracking-[0.4em] uppercase" style={{ color: DOURADO_CLARO }}>
          Confirme com carinho
        </div>
        <h2 className="mt-2.5 font-[family-name:var(--font-display)] text-[38px] font-medium tracking-[0.02em] uppercase">
          Kindly RSVP
        </h2>
        <p className="mt-4 text-[15px] leading-[1.7]" style={{ color: papel(82) }}>
          Sua presença é o brinde mais esperado da festa.
        </p>
      </div>

      <div className="px-5 py-7 text-center" style={{ border: `1px solid ${papel(28)}` }}>
        <p className="text-[14.5px] leading-[1.7]" style={{ color: papel(80) }}>
          Cada família recebeu um link pessoal, com os nomes de quem foi
          convidado. Procure a mensagem que enviamos para confirmar.
        </p>
        <Link
          href={`/s/${slug}`}
          className="inline-block mt-5 text-[11px] tracking-[0.24em] uppercase px-9 py-3.5 transition-opacity hover:opacity-85"
          style={{ background: "var(--accent)", color: "var(--ink)" }}
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
    <section className="px-8 py-16" style={{ background: CREME }}>
      <SectionTitle kicker="Con affetto" title="Lista de presentes" />
      <p className="mb-6 text-center text-[15px] leading-[1.7]">
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
  return (
    <section className="px-8 py-16" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <SectionTitle kicker="Para matar a saudade" title="Álbum da festa" onDark />

      <div className="px-6 py-9 text-center" style={{ border: `1px solid ${papel(28)}` }}>
        <div className="flex justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={DOURADO_CLARO}
            strokeWidth="1.3"
            aria-hidden
          >
            <rect x="5" y="10" width="14" height="10" rx="1" />
            <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
          </svg>
        </div>
        <div
          className="mt-3.5 font-[family-name:var(--font-script)] text-[40px] leading-none"
          style={{ color: DOURADO_CLARO }}
        >
          Um presente para depois
        </div>
        <p className="mt-2.5 text-[14.5px] leading-[1.7]" style={{ color: papel(78) }}>
          As fotos da festa aparecem aqui
          {content.weddingDateLabel ? (
            <>
              {" "}
              depois de <span className="italic">{content.weddingDateLabel}</span>.
            </>
          ) : (
            " depois do casamento."
          )}
        </p>
      </div>
    </section>
  );
}

export function Footer({ content }: SectionProps) {
  const local = content.receptionVenue ?? content.ceremonyVenue;

  return (
    <footer
      className="text-center px-8 pt-14 pb-12"
      style={{
        background: "color-mix(in srgb, var(--ink) 88%, black)",
        color: "var(--paper)",
      }}
    >
      <div className="flex justify-center">
        <Monograma content={content} size={56} />
      </div>

      <div
        className="mt-4.5 font-[family-name:var(--font-script)] text-[52px] leading-none"
        style={{ color: DOURADO_CLARO }}
      >
        {content.coupleNames}
      </div>

      {(content.weddingDateLabel || local) && (
        <div className="mt-4.5 flex items-center justify-center gap-3">
          <span className="h-px w-9" style={{ background: papel(45) }} />
          <span
            className="text-[10px] tracking-[0.32em] uppercase"
            style={{ color: papel(72) }}
          >
            {[content.weddingDateLabel, local].filter(Boolean).join(" — ")}
          </span>
          <span className="h-px w-9" style={{ background: papel(45) }} />
        </div>
      )}
    </footer>
  );
}
