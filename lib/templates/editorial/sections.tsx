import Link from "next/link";
import PhotoSlot from "@/components/templates/PhotoSlot";
import SitePhoto from "@/components/site/SitePhoto";
import Countdown from "@/components/site/Countdown";
import GiftGrid from "@/components/site/GiftGrid";
import { loadGiftSection } from "@/lib/site/giftSection";
import { listSitePhotos, photoAt, SLOT_CAPACITY } from "@/lib/repositories/sitePhotos";
import type { SectionProps, SiteContentView } from "@/lib/templates/contract";

// Seções do molde Editorial — revista de moda.
//
// Mesma regra do Clássico: nenhum hex, nenhum nome fixo. Cor sai de
// var(--ink)/var(--paper)/var(--accent), conteúdo sai de `content`. O que
// diferencia o Editorial é a gramática visual: caixa alta com muito
// espacejamento, serifa dramática, filetes finos, cantos vivos e blocos
// escuros de sangria total.
//
// Diferença para app/pacotes/estilos/editorial/page.tsx (a prévia com casal
// fictício): lá o roteiro do dia e o mural são fixos no código. Aqui só
// entra o que existe no banco — seção sem dado não é inventada, é omitida.
//
// Ver docs/sdd-geracao-automatica.md §4.4.

/** Filete de 1px na cor da tinta, com a opacidade certa. */
const HAIRLINE = "color-mix(in srgb, var(--ink) 16%, transparent)";
/** Mesmo filete, para uso sobre fundo escuro. */
const HAIRLINE_DARK = "color-mix(in srgb, var(--paper) 20%, transparent)";

function fade(percent: number) {
  return `color-mix(in srgb, var(--ink) ${percent}%, transparent)`;
}

function fadePaper(percent: number) {
  return `color-mix(in srgb, var(--paper) ${percent}%, transparent)`;
}

/** Micro-rótulo em caixa alta — a assinatura tipográfica do molde. */
function Kicker({
  children,
  onDark = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <div
      className="text-[9.5px] tracking-[0.34em] uppercase lg:text-[10.5px]"
      style={{ color: onDark ? fadePaper(65) : fade(55) }}
    >
      {children}
    </div>
  );
}

function Head({
  kicker,
  title,
  onDark = false,
}: {
  kicker: string;
  title: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <div className="text-center mb-6">
      <Kicker onDark={onDark}>{kicker}</Kicker>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-[38px] font-medium tracking-[0.02em] uppercase leading-none lg:text-[60.8px]">
        {title}
      </h2>
    </div>
  );
}

/**
 * "#MarinaERafael" a partir do nome do casal.
 *
 * A hashtag é elemento de desenho do Editorial, não dado do banco — mas
 * inventar um nome seria pior do que derivar do que o casal já escreveu.
 * Sem separador reconhecível, cai no nome sem espaços.
 */
function hashtagFor(content: SiteContentView): string {
  const base =
    content.partnerA && content.partnerB
      ? `${content.partnerA} e ${content.partnerB}`
      : content.coupleNames;

  const partes = base.split(/\s*(?:&|\se\s|\sand\s)\s*/i).filter(Boolean);
  const junto = (partes.length === 2 ? partes.join("E") : base).replace(/\s+/g, "");
  return `#${junto}`;
}

export async function Cover({ content, siteId }: SectionProps) {
  const fotos = await listSitePhotos(siteId);
  const capa = photoAt(fotos, "cover");
  const lado = fotos.filter((f) => f.slot === "gallery");
  const data = content.weddingDateParts;

  return (
    <section className="px-6 pt-5 pb-12 lg:px-20 lg:pt-8 lg:pb-20">
      <div
        className="flex justify-between items-center gap-2 pb-4"
        style={{ borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <span
          className="text-[8.5px] tracking-[0.3em] uppercase lg:text-[9.4px]"
          style={{ color: fade(55) }}
        >
          Nossa história
        </span>
        <span className="font-[family-name:var(--font-display)] text-[17px] tracking-[0.08em] truncate lg:text-[20.4px]">
          {content.coupleNames}
        </span>
        <span
          className="text-[8.5px] tracking-[0.22em] uppercase px-2.5 py-1.5 shrink-0 lg:text-[9.4px]"
          style={{ border: `1px solid ${fade(40)}` }}
        >
          RSVP
        </span>
      </div>

      <div className="mt-10 text-center">
        {/* clamp() nas miniaturas e na data: em 320px, larguras fixas dos dois
            lados não deixavam espaço para "19 · 09 · 26" sem quebrar linha. */}
        <div className="flex items-center justify-center gap-3.5">
          {/* O teto de 64px é do celular. Num cartão de 1120px a miniatura
              some ao lado de uma data de 73px — vira sujeira, não composição. */}
          <div className="w-[clamp(44px,14vw,64px)] shrink-0 lg:w-[150px]">
            <SitePhoto
              photo={lado[0]}
              label="Foto"
              className="w-full aspect-[3/4]"
            />
          </div>
          {data ? (
            <h1 style={{ "--motion-delay": "260ms" } as React.CSSProperties} className="motion-word font-[family-name:var(--font-display)] text-[clamp(30px,11vw,46px)] font-medium leading-[0.92] tracking-[0.01em] whitespace-nowrap">
              {data.day}
              <span style={{ color: fade(35) }}> · </span>
              {data.month}
              <span style={{ color: fade(35) }}> · </span>
              {data.year}
            </h1>
          ) : (
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(26px,9vw,38px)] font-medium leading-[0.95] tracking-[0.02em] uppercase">
              Save the date
            </h1>
          )}
          {/* O teto de 64px é do celular. Num cartão de 1120px a miniatura
              some ao lado de uma data de 73px — vira sujeira, não composição. */}
          <div className="w-[clamp(44px,14vw,64px)] shrink-0 lg:w-[150px]">
            <SitePhoto
              photo={lado[1]}
              label="Foto"
              className="w-full aspect-[3/4]"
            />
          </div>
        </div>

        {/* Retrato da capa: 250px é a medida do celular. No desktop ele é o
            centro da primeira dobra e precisa de presença. */}
        <div className="mt-5.5 mx-auto max-w-[250px] lg:max-w-[520px]">
          <SitePhoto
            photo={capa}
            label="Foto principal do casal"
            className="w-full aspect-[3/4]"
            priority
          />
        </div>

        <p
          className="mt-5.5 mx-auto max-w-[34ch] text-[10px] tracking-[0.24em] uppercase leading-[2] lg:text-[11px]"
          style={{ color: fade(62) }}
        >
          Junte-se a nós em uma jornada de amor, alegria e felicidade eterna
        </p>
      </div>
    </section>
  );
}

export async function CountdownSection({ content, siteId }: SectionProps) {
  if (!content.weddingDate) return null;

  const fotos = await listSitePhotos(siteId);
  // A contagem do Editorial vive sobre uma foto escurecida. Prefere a da
  // história para não repetir a capa logo acima.
  const fundo = photoAt(fotos, "story") ?? photoAt(fotos, "cover");

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "var(--ink)" }}
    >
      <div className="absolute inset-0 opacity-45">
        <SitePhoto photo={fundo} label="" className="w-full h-full" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--ink) 72%, transparent), color-mix(in srgb, var(--ink) 86%, transparent))",
        }}
      />
      <div
        className="relative z-10 px-6 py-16 text-center lg:px-20 lg:py-28"
        style={{ color: "var(--paper)" }}
      >
        <Kicker onDark>Que a contagem comece</Kicker>
        <div className="mt-6">
          <Countdown targetDate={content.weddingDate.toISOString()} />
        </div>
      </div>
    </section>
  );
}

export async function Story({ content, siteId }: SectionProps) {
  if (!content.story) return null;

  const fotos = await listSitePhotos(siteId);
  const principal = photoAt(fotos, "story");
  const duas = fotos.filter((f) => f.slot === "gallery").slice(0, 2);

  return (
    <section className="px-6 py-16 lg:px-20 lg:py-28">
      <div className="text-center mb-2">
        <Kicker>Capítulo um</Kicker>
      </div>
      <h2 className="text-center font-[family-name:var(--font-display)] text-[40px] font-medium leading-none tracking-[0.01em] uppercase lg:text-[64px]">
        Nossa
        <br />
        história
      </h2>

      <div className="my-8">
        <SitePhoto
          photo={principal}
          label="A nossa história"
          className="w-full aspect-[16/11]"
        />
      </div>

      <p
        className="text-center text-[14.5px] leading-[1.85] whitespace-pre-line lg:text-[17.4px]"
        style={{ color: fade(75) }}
      >
        {content.story}
      </p>

      {duas.length === 2 && (
        <div className="mt-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {duas.map((foto, i) => (
            <SitePhoto
              key={foto.id}
              photo={foto}
              label={`Momento ${i + 1}`}
              className="w-full aspect-[4/5]"
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function Details({ content }: SectionProps) {
  const temLocal = Boolean(content.ceremonyVenue || content.receptionVenue);
  if (!temLocal && !content.dressCode) return null;

  return (
    <>
      {temLocal && (
        <section
          className="px-6 pt-16 pb-14 lg:px-20"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          <Head kicker="Uma prévia de" title={<>O nosso dia</>} onDark />

          <div className="mt-8 flex flex-col gap-8">
            {content.ceremonyVenue && (
              <div className="text-center">
                <div
                  className="text-[8.5px] tracking-[0.26em] uppercase lg:text-[9.4px]"
                  style={{ color: fadePaper(60) }}
                >
                  Cerimônia
                </div>
                <div className="mt-2 font-[family-name:var(--font-display)] text-[27px] font-medium leading-tight lg:text-[39.2px]">
                  {content.ceremonyVenue}
                </div>
                {content.weddingTimeLabel && (
                  <div
                    className="mt-1.5 text-[10px] tracking-[0.24em] uppercase lg:text-[11px]"
                    style={{ color: fadePaper(70) }}
                  >
                    {content.weddingTimeLabel}
                  </div>
                )}
                {content.ceremonyAddress && (
                  <div
                    className="mt-2 text-[10px] tracking-[0.2em] uppercase leading-[1.9] lg:text-[11px]"
                    style={{ color: fadePaper(70) }}
                  >
                    {content.ceremonyAddress}
                  </div>
                )}
              </div>
            )}

            {content.receptionVenue && (
              <div
                className="text-center pt-8"
                style={{ borderTop: `1px solid ${HAIRLINE_DARK}` }}
              >
                <div
                  className="text-[8.5px] tracking-[0.26em] uppercase lg:text-[9.4px]"
                  style={{ color: fadePaper(60) }}
                >
                  Festa
                </div>
                <div className="mt-2 font-[family-name:var(--font-display)] text-[27px] font-medium leading-tight lg:text-[39.2px]">
                  {content.receptionVenue}
                </div>
                {content.receptionAddress && (
                  <div
                    className="mt-2 text-[10px] tracking-[0.2em] uppercase leading-[1.9] lg:text-[11px]"
                    style={{ color: fadePaper(70) }}
                  >
                    {content.receptionAddress}
                  </div>
                )}
              </div>
            )}
          </div>

          {content.ceremonyMapUrl && (
            <div className="mt-9 flex justify-center">
              <a
                href={content.ceremonyMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9.5px] tracking-[0.24em] uppercase px-8 py-3.5 transition-opacity hover:opacity-80 lg:text-[10.5px]"
                style={{ background: "var(--paper)", color: "var(--ink)" }}
              >
                Ver no mapa
              </a>
            </div>
          )}
        </section>
      )}

      {content.dressCode && (
        <section className="px-6 py-14 lg:px-20 lg:py-24">
          <div
            className="py-7 text-center lg:py-12"
            style={{
              borderTop: `1px solid ${HAIRLINE}`,
              borderBottom: `1px solid ${HAIRLINE}`,
            }}
          >
            <Kicker>Dress code</Kicker>
            <div className="mt-2 font-[family-name:var(--font-display)] text-[30px] font-medium tracking-[0.02em] uppercase lg:text-[48px]">
              {content.dressCode}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export async function Gallery({ siteId }: SectionProps) {
  const fotos = (await listSitePhotos(siteId))
    .filter((f) => f.slot === "gallery")
    .slice(0, SLOT_CAPACITY.gallery);

  // O Editorial abre a galeria com uma foto larga e segue numa grade de três.
  const [larga, ...resto] = fotos;

  return (
    <section className="px-6 py-16 lg:px-20 lg:py-28">
      <Head kicker="Antes do grande dia" title="Pré-wedding" />

      <div className="mb-3">
        <SitePhoto
          photo={larga}
          label="Ensaio"
          className="w-full aspect-[16/10]"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 lg:grid-cols-4">
        {resto.length > 0
          ? resto.map((foto, i) => (
              <SitePhoto
                key={foto.id}
                photo={foto}
                label={`Momento ${i + 1}`}
                className="w-full aspect-[3/4]"
              />
            ))
          : // Sem fotos do casal, os quadros de exemplo seguram o desenho —
            // não se mistura foto real com foto de desconhecido.
            ["Noivado", "Ensaio", "Nós dois"].map((label) => (
              <PhotoSlot
                key={label}
                label={label}
                className="w-full aspect-[3/4]"
              />
            ))}
      </div>
    </section>
  );
}

export function Rsvp({ slug }: SectionProps) {
  return (
    <section className="px-6 py-16 lg:px-20 lg:py-28">
      <div className="text-center mb-6">
        <Kicker>Confirme sua presença</Kicker>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-[40px] font-medium tracking-[0.02em] uppercase lg:text-[64px]">
          RSVP
        </h2>
        <p
          className="mt-4 mx-auto max-w-[36ch] text-[14px] leading-[1.7] lg:text-[16.8px]"
          style={{ color: fade(72) }}
        >
          Cada família recebeu um link pessoal, com os nomes de quem foi
          convidado. Procure a mensagem que enviamos para confirmar.
        </p>
      </div>

      <div className="text-center" style={{ border: `1px solid ${fade(20)}` }}>
        <div
          className="px-4.5 py-3.5 text-[9px] tracking-[0.28em] uppercase lg:text-[9.9px]"
          style={{ borderBottom: `1px solid ${fade(20)}` }}
        >
          Não recebi meu link
        </div>
        <div className="p-4.5">
          <Link
            href={`/s/${slug}`}
            className="block w-full text-[10px] tracking-[0.26em] uppercase py-4 transition-opacity hover:opacity-85 lg:text-[11px]"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            Falar com o casal
          </Link>
        </div>
      </div>
    </section>
  );
}

export async function Gifts({ siteId, content }: SectionProps) {
  const { gifts, pix } = await loadGiftSection(siteId);
  if (gifts.length === 0) return null;

  return (
    <section
      className="px-6 py-16 lg:px-20 lg:py-28"
      style={{ background: "color-mix(in srgb, var(--ink) 6%, var(--paper))" }}
    >
      <Head kicker="Se o coração pedir" title="Presentes" />
      <p
        className="mb-6 text-center text-[14px] leading-[1.7] lg:text-[16.8px]"
        style={{ color: fade(72) }}
      >
        {content.giftMessage ??
          "Sem faqueiro, sem lista de loja. Cada cota é um pedaço da nossa lua de mel — via Pix."}
      </p>
      <GiftGrid gifts={gifts} pix={pix} siteId={siteId}
      />
    </section>
  );
}

export function Album({ content }: SectionProps) {
  const data = content.weddingDateParts;

  return (
    <section
      className="px-6 py-16 text-center lg:px-20 lg:py-28"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      <Kicker onDark>Depois da festa · álbum trancado</Kicker>
      <div className="mt-4 flex justify-center">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden
        >
          <rect x="5" y="10" width="14" height="10" rx="1" />
          <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
        </svg>
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-display)] text-[38px] font-medium leading-[1.02] tracking-[0.02em] uppercase lg:text-[60.8px]">
        As fotos
        <br />
        chegam em
      </h2>
      {data && (
        <div className="mt-2.5 font-[family-name:var(--font-display)] text-[34px] font-medium tracking-[0.05em] lg:text-[54.4px]">
          {data.day} · {data.month} · {data.year}
        </div>
      )}
      <p
        className="mt-4.5 mx-auto max-w-[32ch] text-[13px] leading-[1.7] lg:text-[14.3px]"
        style={{ color: fadePaper(68) }}
      >
        Aproveite a festa sem tela. Depois, volte aqui para reviver tudo.
      </p>
    </section>
  );
}

export function Footer({ content }: SectionProps) {
  const local = content.receptionVenue ?? content.ceremonyVenue;

  return (
    <footer
      className="px-6 pt-14 pb-11 text-center lg:px-20"
      style={{
        background: "color-mix(in srgb, var(--ink) 92%, black)",
        color: "var(--paper)",
      }}
    >
      {/* clamp(): a hashtag é uma palavra só, sem espaço para quebrar linha —
          em tamanho fixo não cabia em 320px de largura. */}
      <div className="font-[family-name:var(--font-display)] text-[clamp(38px,15vw,60px)] font-medium leading-[0.9] tracking-[0.01em] break-all">
        {hashtagFor(content)}
      </div>

      <div
        className="mt-5.5 flex flex-wrap items-center justify-center gap-3.5 text-[9px] tracking-[0.24em] uppercase lg:text-[9.9px]"
        style={{ color: fadePaper(60) }}
      >
        {content.weddingDateLabel && <span>{content.weddingDateLabel}</span>}
        {content.weddingDateLabel && local && (
          <span
            className="inline-block rounded-full"
            style={{ width: 4, height: 4, background: fadePaper(50) }}
          />
        )}
        {local && <span>{local}</span>}
      </div>
    </footer>
  );
}
