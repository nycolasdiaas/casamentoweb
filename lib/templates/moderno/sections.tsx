import Link from "next/link";
import PhotoSlot from "@/components/templates/PhotoSlot";
import SitePhoto from "@/components/site/SitePhoto";
import Countdown from "@/components/site/Countdown";
import GiftGrid from "@/components/site/GiftGrid";
import { loadGiftSection } from "@/lib/site/giftSection";
import { listSitePhotos, photoAt, SLOT_CAPACITY } from "@/lib/repositories/sitePhotos";
import type { SectionProps } from "@/lib/templates/contract";

// Seções do molde Moderno — editorial brutalista.
//
// A gramática visual: seções NUMERADAS com filete atravessando, display em
// peso extremo com tracking negativo, fotos sangradas com legenda técnica
// ("FIG. 01"), e o accent usado como pontuação — um ponto final, uma barra
// lateral, um número.
//
// Diferença para app/pacotes/estilos/moderno/page.tsx: lá o título da
// história ("A fila do pastel"), as legendas das fotos e o horário de portão
// são escritos no código. Aqui só entra o que existe no banco.
//
// Ver docs/sdd-geracao-automatica.md §4.4.

function tinta(percent: number) {
  return `color-mix(in srgb, var(--ink) ${percent}%, transparent)`;
}

/** Cabeçalho numerado com filete — a espinha dorsal do molde. */
function NumberedHead({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span
        className="font-[family-name:var(--font-script)] text-[11px] lg:text-[12.1px]"
        style={{ color: "var(--accent)" }}
      >
        {n}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--ink)" }} />
      <span className="font-[family-name:var(--font-script)] text-[10.5px] tracking-[0.2em] uppercase lg:text-[11.6px]">
        {label}
      </span>
    </div>
  );
}

/** Legenda técnica sob as fotos sangradas. */
function Caption({ left, right }: { left: string; right?: string | null }) {
  return (
    <div
      className="flex justify-between gap-3 px-5 pt-2.5 font-[family-name:var(--font-script)] text-[9.5px] tracking-[0.18em] uppercase lg:px-14 lg:text-[10.5px]"
      style={{ color: tinta(60) }}
    >
      <span>{left}</span>
      {right && <span className="text-right">{right}</span>}
    </div>
  );
}

export async function Cover({ content, siteId }: SectionProps) {
  const capa = photoAt(await listSitePhotos(siteId), "cover");
  const data = content.weddingDateParts;

  return (
    <section className="pt-8">
      <div className="flex items-start justify-between gap-2 px-5 lg:px-14">
        <h1 style={{ "--motion-delay": "260ms" } as React.CSSProperties} className="motion-word font-[family-name:var(--font-display)] font-black text-[clamp(44px,15vw,72px)] leading-[0.88] tracking-[-0.04em] uppercase">
          {content.partnerA && content.partnerB ? (
            <>
              {content.partnerA}
              <span
                className="block text-[clamp(38px,12.5vw,60px)] leading-[0.95]"
                style={{ color: "var(--accent)" }}
              >
                &amp;
              </span>
              {content.partnerB}
            </>
          ) : (
            content.coupleNames
          )}
        </h1>
      </div>

      <div className="flex justify-between items-baseline gap-3 px-5 pt-5 pb-4 lg:px-14 lg:pt-8">
        {data && (
          <div className="font-[family-name:var(--font-display)] font-extrabold text-3xl tracking-[-0.02em] tabular-nums">
            {data.day}.{data.month}.{content.weddingDate?.getFullYear()}
          </div>
        )}
        <div className="font-[family-name:var(--font-script)] text-[10.5px] tracking-[0.12em] uppercase text-right leading-relaxed lg:text-[11.6px]">
          {content.weddingTimeLabel && (
            <>
              {content.weddingTimeLabel}
              <br />
            </>
          )}
          {content.ceremonyVenue}
        </div>
      </div>

      <SitePhoto
        photo={capa}
        label="Foto do casal"
        className="aspect-[4/5] w-full"
        priority
      />

      <div
        className="flex justify-between px-5 py-3 font-[family-name:var(--font-script)] text-[10px] tracking-[0.16em] uppercase lg:px-14 lg:py-5 lg:text-[11px]"
        style={{ borderBottom: `1px solid var(--ink)` }}
      >
        <span>Save the date</span>
        <span style={{ color: "var(--accent)" }}>↓ role</span>
      </div>
    </section>
  );
}

export function CountdownSection({ content }: SectionProps) {
  if (!content.weddingDate) return null;

  return (
    <section className="px-5 pt-10 pb-12 lg:px-14 lg:pb-20">
      <NumberedHead n="02" label="Contagem" />
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
    <section className="pt-2 pb-14">
      <div className="mx-5">
        <NumberedHead n="03" label="Nossa história" />
      </div>

      <h2 className="mx-5 font-[family-name:var(--font-display)] font-black text-[38px] leading-[0.95] tracking-[-0.03em] uppercase lg:text-[60.8px]">
        Nossa história
        <span style={{ color: "var(--accent)" }}>.</span>
      </h2>

      <p
        className="mx-5 mt-5 text-[15px] leading-relaxed whitespace-pre-line lg:text-[18px]"
        style={{ color: tinta(90) }}
      >
        {content.story}
      </p>

      <div className="mt-7">
        <SitePhoto photo={larga} label="A nossa história" className="aspect-[16/10] w-full" />
        <Caption left="Fig. 01" right={content.weddingDateLabel} />
      </div>

      {duas.length === 2 && (
        <div className="mt-6 grid grid-cols-2 gap-3.5 px-5 items-start lg:px-14 lg:grid-cols-4">
          {duas.map((foto, i) => (
            // O deslocamento da primeira coluna é o que evita a grade
            // simétrica — no Moderno o ritmo é sempre desalinhado.
            <figure key={foto.id} className={`mb-0 ${i === 0 ? "mt-8" : "m-0"}`}>
              <SitePhoto photo={foto} label={`Momento ${i + 1}`} className="aspect-[3/4] w-full" />
              <figcaption
                className="mt-2 font-[family-name:var(--font-script)] text-[9.5px] tracking-[0.18em] uppercase lg:text-[10.5px]"
                style={{ color: tinta(60) }}
              >
                Fig. {String(i + 2).padStart(2, "0")}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

export function Details({ content }: SectionProps) {
  const itens = [
    content.ceremonyVenue && {
      time: content.weddingTimeLabel ?? "—",
      label: "Cerimônia",
      title: content.ceremonyVenue,
      text: content.ceremonyAddress,
      href: content.ceremonyMapUrl,
      cta: "Ver no mapa →",
    },
    content.receptionVenue && {
      time: "Festa",
      label: "Recepção",
      title: content.receptionVenue,
      text: content.receptionAddress,
      href: null,
      cta: null,
    },
    content.dressCode && {
      time: "Dress",
      label: "Traje",
      title: content.dressCode,
      text: null,
      href: null,
      cta: null,
    },
  ].filter(Boolean) as {
    time: string;
    label: string;
    title: string;
    text: string | null;
    href: string | null;
    cta: string | null;
  }[];

  if (itens.length === 0) return null;

  return (
    <section className="px-5 pt-2 pb-14 lg:px-14">
      <NumberedHead n="04" label="O dia" />

      {itens.map((item, i) => (
        <div
          key={item.label}
          className="flex gap-4 py-6"
          style={
            i < itens.length - 1
              ? { borderBottom: `1px solid ${tinta(25)}` }
              : undefined
          }
        >
          <div
            className="w-16 shrink-0 font-[family-name:var(--font-script)] text-[11px] tracking-[0.16em] uppercase pt-1 lg:text-[12.1px]"
            style={{ color: "var(--accent)" }}
          >
            {item.time}
          </div>
          <div className="flex-1">
            <div
              className="font-[family-name:var(--font-script)] text-[9.5px] tracking-[0.26em] uppercase lg:text-[10.5px]"
              style={{ color: tinta(60) }}
            >
              {item.label}
            </div>
            <div className="mt-1.5 font-[family-name:var(--font-display)] font-bold text-[20px] leading-snug tracking-[-0.01em] lg:text-[29px]">
              {item.title}
            </div>
            {item.text && (
              <p className="mt-1.5 text-[14px] leading-relaxed lg:text-[16.8px]" style={{ color: tinta(80) }}>
                {item.text}
              </p>
            )}
            {item.href && item.cta && (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2.5 font-[family-name:var(--font-script)] text-[10px] tracking-[0.2em] uppercase lg:text-[11px]"
                style={{ color: "var(--accent)" }}
              >
                {item.cta}
              </a>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export async function Gallery({ siteId }: SectionProps) {
  const fotos = (await listSitePhotos(siteId))
    .filter((f) => f.slot === "gallery")
    .slice(0, SLOT_CAPACITY.gallery);

  return (
    <section className="pt-2 pb-14">
      <div className="mx-5">
        <NumberedHead n="05" label="Galeria" />
      </div>

      <div className="grid grid-cols-2 gap-3.5 px-5 lg:px-14 lg:grid-cols-4">
        {fotos.length > 0
          ? fotos.map((foto, i) => (
              <figure key={foto.id} className={`mb-0 ${i % 2 === 0 ? "mt-6" : "m-0"}`}>
                <SitePhoto photo={foto} label={`Momento ${i + 1}`} className="aspect-[3/4] w-full" />
                <figcaption
                  className="mt-2 font-[family-name:var(--font-script)] text-[9.5px] tracking-[0.18em] uppercase lg:text-[10.5px]"
                  style={{ color: tinta(60) }}
                >
                  Fig. {String(i + 1).padStart(2, "0")}
                </figcaption>
              </figure>
            ))
          : // Sem foto do casal, os quadros de exemplo seguram o desenho.
            ["Noivado", "Ensaio", "Viagem", "Nós dois"].map((label, i) => (
              <figure key={label} className={`mb-0 ${i % 2 === 0 ? "mt-6" : "m-0"}`}>
                <PhotoSlot label={label} className="aspect-[3/4] w-full" />
              </figure>
            ))}
      </div>
    </section>
  );
}

export function Rsvp({ slug }: SectionProps) {
  return (
    <section className="px-5 pt-2 pb-14 lg:px-14">
      <NumberedHead n="06" label="Presença" />

      <h2 className="font-[family-name:var(--font-display)] font-black text-[38px] leading-[0.95] tracking-[-0.03em] uppercase lg:text-[60.8px]">
        Você vem
        <span style={{ color: "var(--accent)" }}>?</span>
      </h2>

      <div className="mt-5 pl-4" style={{ borderLeft: `3px solid var(--accent)` }}>
        <p className="text-[15px] leading-relaxed lg:text-[18px]" style={{ color: tinta(85) }}>
          Cada família recebeu um link pessoal, com os nomes de quem foi
          convidado. Procure a mensagem que enviamos para confirmar.
        </p>
      </div>

      <Link
        href={`/s/${slug}`}
        className="inline-block mt-6 font-[family-name:var(--font-script)] text-[10.5px] tracking-[0.22em] uppercase px-7 py-4 transition-opacity hover:opacity-85 lg:text-[11.6px] lg:px-24"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        Não recebi meu link →
      </Link>
    </section>
  );
}

export async function Gifts({ siteId, content }: SectionProps) {
  const { gifts, pix } = await loadGiftSection(siteId);
  if (gifts.length === 0) return null;

  return (
    <section
      className="px-5 pt-10 pb-14 lg:px-14"
      style={{ background: "color-mix(in srgb, var(--ink) 5%, var(--paper))" }}
    >
      <NumberedHead n="07" label="Presentes" />
      <p className="mb-6 text-[15px] leading-relaxed lg:text-[18px]" style={{ color: tinta(85) }}>
        {content.giftMessage ??
          "Sem faqueiro, sem lista de loja. Cada cota é um pedaço da nossa lua de mel — via Pix."}
      </p>
      <GiftGrid gifts={gifts} pix={pix} siteId={siteId}
      />
    </section>
  );
}

export function Album({ content }: SectionProps) {
  return (
    <section className="px-5 pt-2 pb-14 lg:px-14">
      <NumberedHead n="08" label="Álbum" />

      <div className="pl-4" style={{ borderLeft: `3px solid var(--accent)` }}>
        <div className="font-[family-name:var(--font-display)] font-black text-[30px] leading-[0.98] tracking-[-0.03em] uppercase lg:text-[48px]">
          As fotos
          <br />
          vêm depois
          <span style={{ color: "var(--accent)" }}>.</span>
        </div>
        <p className="mt-3 text-[14.5px] leading-relaxed lg:text-[17.4px]" style={{ color: tinta(80) }}>
          Aproveite a festa sem tela. O álbum abre
          {content.weddingDateLabel ? ` depois de ${content.weddingDateLabel}` : " depois do casamento"}
          .
        </p>
      </div>
    </section>
  );
}

export function Footer({ content }: SectionProps) {
  const data = content.weddingDateParts;

  return (
    <footer
      className="px-5 pt-12 pb-11 lg:px-14"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      <div className="font-[family-name:var(--font-display)] font-black text-[clamp(34px,12vw,54px)] leading-[0.9] tracking-[-0.04em] uppercase break-words">
        {content.coupleNames}
      </div>

      <div
        className="mt-6 pt-4 flex justify-between gap-3 font-[family-name:var(--font-script)] text-[10px] tracking-[0.18em] uppercase lg:text-[11px]"
        style={{
          borderTop: `1px solid color-mix(in srgb, var(--paper) 30%, transparent)`,
          color: "color-mix(in srgb, var(--paper) 70%, transparent)",
        }}
      >
        {data && (
          <span className="tabular-nums">
            {data.day}.{data.month}.{content.weddingDate?.getFullYear()}
          </span>
        )}
        <span className="text-right">
          {content.receptionVenue ?? content.ceremonyVenue}
        </span>
      </div>
    </footer>
  );
}
