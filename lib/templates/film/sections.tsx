import Link from "next/link";
import AlbumPorCategoria from "@/components/site/AlbumPorCategoria";
import PhotoSlot from "@/components/templates/PhotoSlot";
import SitePhoto from "@/components/site/SitePhoto";
import Countdown from "@/components/site/Countdown";
import GiftGrid from "@/components/site/GiftGrid";
import SplitReveal from "@/components/site/SplitReveal";
import { loadGiftSection } from "@/lib/site/giftSection";
import { listSitePhotos, photoAt, SLOT_CAPACITY } from "@/lib/repositories/sitePhotos";
import type { SectionProps } from "@/lib/templates/contract";

// Seções do molde Film — fotografia analógica, luz de fim de tarde.
//
// Parente próximo do Toscana na estrutura (capa sangrada com véu, blocos
// creme e escuro alternando), mas com temperatura e ritmo diferentes: aqui a
// caligrafia entra em frases inteiras, o ornamento vegetal separa as seções e
// os títulos são manuscritos, não caixa alta.
//
// Ver docs/sdd-geracao-automatica.md §4.4.

function tinta(percent: number) {
  return `color-mix(in srgb, var(--ink) ${percent}%, transparent)`;
}

function papel(percent: number) {
  return `color-mix(in srgb, var(--paper) ${percent}%, transparent)`;
}

const CREME = "color-mix(in srgb, var(--ink) 5%, var(--paper))";
const DOURADO_CLARO = "color-mix(in srgb, var(--accent) 65%, var(--paper))";

/** Folha estilizada que assina o molde — divide seções e abre a capa. */
function Ornament({ onDark = false }: { onDark?: boolean }) {
  const cor = onDark ? DOURADO_CLARO : "var(--accent)";
  return (
    <svg
      width="52"
      height="34"
      viewBox="0 0 52 34"
      fill="none"
      stroke={cor}
      strokeWidth="1"
      aria-hidden
    >
      <path d="M26 30 C 20 24 18 16 26 6 C 34 16 32 24 26 30 Z" />
      <path d="M26 30 V16" opacity=".7" />
      <path d="M18 27 q -6 -1 -8 -8 q 7 0 8 8" fill={cor} stroke="none" opacity=".9" />
      <path d="M34 27 q 6 -1 8 -8 q -7 0 -8 8" fill={cor} stroke="none" opacity=".9" />
    </svg>
  );
}

function Head({
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
        className="text-[10px] tracking-[0.4em] uppercase lg:text-[11px]"
        style={{ color: onDark ? DOURADO_CLARO : "var(--accent)" }}
      >
        {kicker}
      </div>
      <div className="mt-1 font-[family-name:var(--font-script)] text-[46px] leading-[0.9] lg:text-[73.6px]">
        {title}
      </div>
    </div>
  );
}

export async function Cover({ content, siteId }: SectionProps) {
  const capa = photoAt(await listSitePhotos(siteId), "cover");

  return (
    <section
      className="relative flex flex-col overflow-hidden"
      style={{ minHeight: "92vh", background: "var(--ink)" }}
    >
      <div className="absolute inset-0">
        <SitePhoto photo={capa} label="Foto principal do casal" className="w-full h-full" priority />
      </div>
      {/* Véu mais leve no topo que no Toscana: o Film quer a luz da foto
          aparecendo, não a foto submersa. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${tinta(58)} 0%, ${tinta(14)} 38%, ${tinta(36)} 62%, ${tinta(84)} 100%)`,
        }}
      />

      <div className="relative z-10 flex justify-center py-6" style={{ color: "var(--paper)" }}>
        <div className="text-[9.5px] tracking-[0.42em] uppercase opacity-85 lg:text-[10.5px]">
          Save the date
        </div>
      </div>

      <div
        className="relative z-10 mt-auto px-7 pb-14 text-center lg:px-24"
        style={{ color: "var(--paper)" }}
      >
        <div className="flex justify-center mb-1.5">
          <Ornament onDark />
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-[52px] font-medium leading-[0.96] tracking-[0.04em] uppercase lg:text-[83.2px]">
          {content.partnerA && content.partnerB ? (
            <>
              {content.partnerA}{" "}
              <span
                className="font-[family-name:var(--font-script)] text-[52px] normal-case lg:text-[83.2px]"
                style={{ color: DOURADO_CLARO }}
              >
                &amp;
              </span>{" "}
              {content.partnerB}
            </>
          ) : (
            <span className="text-[40px] lg:text-[64px]"><SplitReveal text={content.coupleNames} atraso={260} /></span>
          )}
        </h1>

        <div
          className="mt-1 font-[family-name:var(--font-script)] text-[40px] leading-none lg:text-[64px]"
          style={{ color: DOURADO_CLARO }}
        >
          para sempre
        </div>

        <div className="mt-4.5 flex items-center justify-center gap-3">
          <span className="h-px w-8" style={{ background: papel(60) }} />
          <span className="text-[9.5px] tracking-[0.36em] uppercase lg:text-[10.5px]">O nosso dia</span>
          <span className="h-px w-8" style={{ background: papel(60) }} />
        </div>

        {content.weddingDateLabel && (
          <div className="mt-3.5 font-[family-name:var(--font-display)] text-[20px] lg:text-[29px]">
            {[content.weddingDateLabel, content.weddingTimeLabel].filter(Boolean).join(" · ")}
          </div>
        )}

        {content.ceremonyVenue && (
          <div className="mt-1 text-[12.5px] tracking-[0.12em] opacity-90 lg:text-[13.8px]">
            {[content.ceremonyVenue, content.ceremonyAddress].filter(Boolean).join(" — ")}
          </div>
        )}
      </div>
    </section>
  );
}

export function CountdownSection({ content }: SectionProps) {
  if (!content.weddingDate) return null;

  return (
    <section className="px-8 py-14 lg:py-24" style={{ background: CREME }}>
      <Head kicker="A contagem começou" title="falta pouco" />
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
    <section className="py-16 lg:py-28">
      <div className="px-8">
        <Head kicker="Como tudo começou" title="Nossa história" />
      </div>

      <div className="mb-7">
        <SitePhoto photo={larga} label="A nossa história" className="w-full aspect-[16/10]" />
      </div>

      <p
        className="px-8 text-center text-[16px] leading-[1.8] whitespace-pre-line lg:text-[19.2px]"
        style={{ color: tinta(90) }}
      >
        {content.story}
      </p>

      {duas.length === 2 && (
        <div className="mt-8 px-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {duas.map((foto, i) => (
            <SitePhoto
              key={foto.id}
              photo={foto}
              label={`Momento ${i + 1}`}
              className="w-full aspect-[3/4]"
            />
          ))}
        </div>
      )}

      <div className="mt-9 flex justify-center">
        <Ornament />
      </div>
    </section>
  );
}

export function Details({ content }: SectionProps) {
  const itens = [
    content.ceremonyVenue && {
      kicker: content.weddingTimeLabel
        ? `Cerimônia · ${content.weddingTimeLabel}`
        : "Cerimônia",
      title: content.ceremonyVenue,
      text: content.ceremonyAddress,
      href: content.ceremonyMapUrl,
    },
    content.receptionVenue && {
      kicker: "Recepção",
      title: content.receptionVenue,
      text: content.receptionAddress,
      href: null,
    },
    content.dressCode && {
      kicker: "Traje",
      title: content.dressCode,
      text: null,
      href: null,
    },
  ].filter(Boolean) as {
    kicker: string;
    title: string;
    text: string | null;
    href: string | null;
  }[];

  if (itens.length === 0) return null;

  return (
    <section className="px-8 py-16 lg:py-28" style={{ background: CREME }}>
      <Head kicker="Quando & onde" title="O grande dia" />

      <div className="flex flex-col gap-7">
        {itens.map((item, i) => (
          <div
            key={item.kicker}
            className="text-center"
            style={
              i > 0 ? { borderTop: `1px solid ${tinta(15)}`, paddingTop: "1.75rem" } : undefined
            }
          >
            <div
              className="text-[10px] tracking-[0.34em] uppercase lg:text-[11px]"
              style={{ color: "var(--accent)" }}
            >
              {item.kicker}
            </div>
            <div className="mt-2 font-[family-name:var(--font-display)] text-[23px] leading-tight lg:text-[33.4px]">
              {item.title}
            </div>
            {item.text && (
              <div className="mt-1.5 italic text-[14.5px] leading-[1.7] lg:text-[17.4px]" style={{ color: tinta(75) }}>
                {item.text}
              </div>
            )}
            {item.href && (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-[10px] tracking-[0.24em] uppercase border-b pb-0.5 lg:text-[11px]"
                style={{ borderColor: "var(--accent)" }}
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

export async function Gallery({ siteId }: SectionProps) {
  const fotos = (await listSitePhotos(siteId))
    .filter((f) => f.slot === "gallery")
    .slice(0, SLOT_CAPACITY.gallery);

  const [larga, ...resto] = fotos;

  return (
    <section className="py-16 lg:py-28">
      <div className="px-8">
        <Head kicker="Antes do grande dia" title="Nosso ensaio" />
      </div>

      <div className="mb-3">
        <SitePhoto photo={larga} label="Ensaio" className="w-full aspect-[16/10]" />
      </div>

      <div className="grid grid-cols-2 gap-3 px-8 lg:grid-cols-4">
        {resto.length > 0
          ? resto.map((foto, i) => (
              <SitePhoto
                key={foto.id}
                photo={foto}
                label={`Momento ${i + 1}`}
                className="w-full aspect-square"
              />
            ))
          : // Sem foto do casal, os quadros de exemplo seguram o desenho.
            ["Noivado", "Ensaio"].map((label) => (
              <PhotoSlot key={label} label={label} className="w-full aspect-square" />
            ))}
      </div>
    </section>
  );
}

export function Rsvp({ slug }: SectionProps) {
  return (
    <section className="px-8 py-16 lg:py-28" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <Head kicker="Confirme sua presença" title="você vem?" onDark />

      <div className="px-6 py-8 text-center lg:px-20 lg:py-14" style={{ border: `1px solid ${papel(28)}` }}>
        <p className="text-[14.5px] leading-[1.7] lg:text-[17.4px]" style={{ color: papel(82) }}>
          Cada família recebeu um link pessoal, com os nomes de quem foi
          convidado. Procure a mensagem que enviamos para confirmar.
        </p>
        <Link
          href={`/s/${slug}`}
          className="inline-block mt-5 text-[10.5px] tracking-[0.24em] uppercase px-8 py-3.5 transition-opacity hover:opacity-85 lg:text-[11.6px]"
          style={{ background: "var(--accent)", color: "var(--ink)" }}
        >
          Não recebi meu link
        </Link>
      </div>
    </section>
  );
}

export async function Gifts({ siteId, content }: SectionProps) {
  const { gifts, pix } = await loadGiftSection(siteId);
  if (gifts.length === 0) return null;

  return (
    <section className="px-8 py-16 lg:py-28" style={{ background: CREME }}>
      <Head kicker="Com carinho" title="Lista de presentes" />
      <p className="mb-6 text-center text-[15px] leading-[1.7] lg:text-[18px]" style={{ color: tinta(85) }}>
        {content.giftMessage ??
          "Ter você conosco já é presente. Mas, se o coração pedir, cada mimo abaixo vira uma lembrança da nossa lua de mel."}
      </p>
      <GiftGrid gifts={gifts} pix={pix} siteId={siteId}
      />
    </section>
  );
}

export async function Album({ content, siteId }: SectionProps) {
  // O placeholder que este molde já desenhava vira o estado VAZIO: sem foto
  // da festa, nada muda para quem visita hoje. Com foto, o álbum aparece
  // separado por momento. Ver AlbumPorCategoria — a lógica é uma só para os
  // seis moldes, então corrigir aqui corrige em todos.
  return <AlbumPorCategoria siteId={siteId} vazio={<Vazio content={content} />} />;
}

function Vazio({ content }: { content: SectionProps["content"] }) {
  return (
    <section className="px-8 py-16 lg:py-28" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <Head kicker="Para matar a saudade" title="Álbum da festa" onDark />

      <div className="px-6 py-9 text-center lg:px-20" style={{ border: `1px solid ${papel(28)}` }}>
        <div className="flex justify-center">
          <Ornament onDark />
        </div>
        <div
          className="mt-3 font-[family-name:var(--font-script)] text-[38px] leading-none lg:text-[60.8px]"
          style={{ color: DOURADO_CLARO }}
        >
          Um presente para depois
        </div>
        <p className="mt-2.5 text-[14.5px] leading-[1.7] lg:text-[17.4px]" style={{ color: papel(78) }}>
          As fotos da festa aparecem aqui
          {content.weddingDateLabel ? (
            <>
              {" "}
              a partir de <span className="italic">{content.weddingDateLabel}</span>.
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
      className="px-8 pt-14 pb-12 text-center lg:pb-20"
      style={{
        background: "color-mix(in srgb, var(--ink) 90%, black)",
        color: "var(--paper)",
      }}
    >
      <div className="flex justify-center mb-3">
        <Ornament onDark />
      </div>

      <div
        className="font-[family-name:var(--font-script)] text-[48px] leading-none lg:text-[76.8px]"
        style={{ color: DOURADO_CLARO }}
      >
        {content.coupleNames}
      </div>

      {(content.weddingDateLabel || local) && (
        <div
          className="mt-5 text-[10px] tracking-[0.32em] uppercase lg:text-[11px]"
          style={{ color: papel(72) }}
        >
          {[content.weddingDateLabel, local].filter(Boolean).join(" — ")}
        </div>
      )}
    </footer>
  );
}
