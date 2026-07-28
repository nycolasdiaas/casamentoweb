import Link from "next/link";
import PhotoSlot from "@/components/templates/PhotoSlot";
import SitePhoto from "@/components/site/SitePhoto";
import Countdown from "@/components/site/Countdown";
import GiftGrid from "@/components/site/GiftGrid";
import { listGifts } from "@/lib/repositories/gifts";
import { listSitePhotos, photoAt, SLOT_CAPACITY } from "@/lib/repositories/sitePhotos";
import type { SectionProps } from "@/lib/templates/contract";

// Seções do molde Romântico — jardim ao entardecer.
//
// O que distingue este molde: molduras OVAIS (rounded-[50%/38%]), ornamentos
// botânicos e caligrafia grande assinando os títulos, em vez de caixa alta.
//
// Os ornamentos da prévia tinham cor fixa (rosa #d9a3ae, verde-sálvia
// #a8b89a). Aqui eles seguem a paleta do casal: a flor usa var(--accent) e a
// folha um tom apagado da tinta. Um ramo rosa num site azul-marinho seria
// exatamente o tipo de detalhe que denuncia molde mal portado.
//
// Ver docs/sdd-geracao-automatica.md §4.4.

function tinta(percent: number) {
  return `color-mix(in srgb, var(--ink) ${percent}%, transparent)`;
}

/** Tom botânico derivado da tinta — folhas e caules. */
const FOLHA = "color-mix(in srgb, var(--ink) 42%, var(--paper))";
/** Accent aprofundado, para o miolo das flores e os micro-rótulos. */
const FLOR_FUNDA = "color-mix(in srgb, var(--accent) 72%, var(--ink))";
/** Fundo pêssego: o papel puxado para o accent. */
const FUNDO_SUAVE = "color-mix(in srgb, var(--accent) 22%, var(--paper))";
const BORDA = "color-mix(in srgb, var(--accent) 55%, var(--paper))";

/** Ramo horizontal que separa as seções. */
function Branch() {
  return (
    <div className="flex justify-center py-2.5">
      <svg width="150" height="26" viewBox="0 0 150 26" fill="none" aria-hidden>
        <path d="M10 13 H 62 M88 13 H 140" stroke="var(--accent)" strokeWidth="1" />
        <path d="M68 13 q 3 -7 7 -9 q 1 6 -4 9 z" fill={FOLHA} />
        <path d="M82 13 q -3 -7 -7 -9 q -1 6 4 9 z" fill={FOLHA} />
        <circle cx="75" cy="15" r="3.2" fill="var(--accent)" />
        <circle cx="75" cy="15" r="1.3" fill={FLOR_FUNDA} />
      </svg>
    </div>
  );
}

/** Filete com um ponto no meio, sob os títulos. */
function DotDivider() {
  return (
    <div className="mt-3.5 mx-auto flex items-center justify-center gap-2.5">
      <div className="w-11 h-px" style={{ background: "var(--accent)" }} />
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <circle cx="6" cy="6" r="2.8" fill="var(--accent)" />
      </svg>
      <div className="w-11 h-px" style={{ background: "var(--accent)" }} />
    </div>
  );
}

/** Título manuscrito — a assinatura do molde. */
function ScriptTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-[family-name:var(--font-script)] text-[44px] leading-tight">
      {children}
    </div>
  );
}

/** Moldura oval com o filete externo acompanhando a curva. */
function OvalFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute -inset-2.5 rounded-[50%/38%] pointer-events-none"
        style={{ border: `1px solid var(--accent)` }}
      />
      {children}
    </div>
  );
}

export async function Cover({ content, siteId }: SectionProps) {
  const capa = photoAt(await listSitePhotos(siteId), "cover");
  const [a, b] = [content.partnerA, content.partnerB];

  return (
    <section className="relative px-6.5 pt-13 pb-12 overflow-hidden">
      {/* Ramo florido no canto — o enquadramento de jardim do molde. */}
      <svg
        width="190"
        height="190"
        viewBox="0 0 190 190"
        fill="none"
        aria-hidden
        className="absolute -top-9 -left-10 opacity-50"
      >
        <path d="M20 170 C 40 120, 60 90, 110 60" stroke={FOLHA} strokeWidth="1.6" fill="none" />
        <path d="M48 132 q -16 -4 -20 -20 q 18 0 20 20" fill={FOLHA} />
        <path d="M66 110 q -18 -2 -24 -18 q 19 -1 24 18" fill={FOLHA} />
        <path d="M88 88 q -14 -8 -14 -24 q 16 4 14 24" fill={FOLHA} />
        <circle cx="112" cy="58" r="9" fill="var(--accent)" />
        <circle cx="112" cy="58" r="4" fill={FLOR_FUNDA} />
        <circle cx="130" cy="78" r="6.5" fill={BORDA} />
        <circle cx="96" cy="42" r="5" fill={BORDA} />
      </svg>

      <div className="relative text-center">
        <div
          className="text-[11px] tracking-[0.34em] uppercase"
          style={{ color: FLOR_FUNDA }}
        >
          Com a bênção de suas famílias
        </div>

        <h1 className="mt-4.5 font-[family-name:var(--font-script)] font-normal text-[56px] sm:text-[64px] leading-[1.02]">
          {a && b ? (
            <>
              {a}
              <span
                className="block text-[30px] sm:text-[34px] leading-none"
                style={{ color: "var(--accent)" }}
              >
                e
              </span>
              {b}
            </>
          ) : (
            content.coupleNames
          )}
        </h1>

        <DotDivider />

        <p className="mt-4.5 italic text-[15px] leading-relaxed" style={{ color: tinta(85) }}>
          convidam você para celebrar
          <br />o dia do seu &ldquo;sim&rdquo;
        </p>

        <OvalFrame className="mt-6.5 mx-auto w-[220px] sm:w-[236px]">
          <SitePhoto
            photo={capa}
            label="Foto do casal"
            className="w-full aspect-[236/300] rounded-[50%/38%]"
            priority
          />
        </OvalFrame>

        {(content.weekdayLabel || content.weddingTimeLabel) && (
          <div
            className="mt-7 text-[11px] tracking-[0.3em] uppercase"
            style={{ color: tinta(70) }}
          >
            {[content.weekdayLabel, content.weddingTimeLabel].filter(Boolean).join(" · ")}
          </div>
        )}

        {content.weddingDateLabel && (
          <div className="mt-2 font-[family-name:var(--font-script)] text-[34px] sm:text-[37px] leading-tight">
            {content.weddingDateLabel}
          </div>
        )}

        {content.ceremonyVenue && (
          <div className="mt-2.5 text-sm italic" style={{ color: tinta(85) }}>
            {[content.ceremonyVenue, content.ceremonyAddress].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
    </section>
  );
}

export function CountdownSection({ content }: SectionProps) {
  if (!content.weddingDate) return null;

  return (
    <>
      <Branch />
      <section className="px-6.5 pt-11 pb-13" style={{ background: FUNDO_SUAVE }}>
        <div className="text-center mb-6.5">
          <div
            className="font-[family-name:var(--font-script)] text-4xl leading-tight"
            style={{ color: FLOR_FUNDA }}
          >
            Falta pouco…
          </div>
          <div
            className="mt-2 text-[11px] tracking-[0.3em] uppercase"
            style={{ color: tinta(65) }}
          >
            para o nosso grande dia
          </div>
        </div>
        <Countdown targetDate={content.weddingDate.toISOString()} />
      </section>
    </>
  );
}

export async function Story({ content, siteId }: SectionProps) {
  if (!content.story) return null;

  const fotos = await listSitePhotos(siteId);
  const principal = photoAt(fotos, "story");
  const duas = fotos.filter((f) => f.slot === "gallery").slice(0, 2);

  return (
    <section className="px-6.5 pt-14 pb-15">
      <div className="text-center mb-6">
        <ScriptTitle>Nossa história</ScriptTitle>
        <DotDivider />
      </div>

      <p
        className="text-center text-[15.5px] leading-[1.8] whitespace-pre-line"
        style={{ color: tinta(90) }}
      >
        {content.story}
      </p>

      <OvalFrame className="mt-8 mx-auto w-[230px] sm:w-[250px]">
        <SitePhoto
          photo={principal}
          label="A nossa história"
          className="w-full aspect-[250/318] rounded-[50%/38%]"
        />
      </OvalFrame>

      {duas.length === 2 && (
        <div className="mt-9 grid grid-cols-2 gap-4">
          {duas.map((foto, i) => (
            <figure key={foto.id} className="m-0 relative">
              <div
                className="absolute -inset-1.5 rounded-[50%/40%] pointer-events-none"
                style={{ border: `1px solid ${BORDA}` }}
              />
              <SitePhoto
                photo={foto}
                label={`Momento ${i + 1}`}
                className="aspect-[4/5] w-full rounded-[50%/40%]"
              />
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

/** Cartão arredondado com ícone — o formato das informações neste molde. */
function GardenCard({
  icon,
  kicker,
  title,
  lines,
  href,
  cta,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
  lines: (string | null)[];
  href?: string | null;
  cta?: string;
}) {
  return (
    <div
      className="rounded-[26px] px-6 py-7 text-center"
      style={{ background: "var(--paper)", border: `1px solid ${BORDA}` }}
    >
      <div className="flex justify-center">{icon}</div>
      <div
        className="mt-2.5 text-[10.5px] tracking-[0.32em] uppercase"
        style={{ color: FLOR_FUNDA }}
      >
        {kicker}
      </div>
      <div className="mt-2 font-semibold text-[19px]">{title}</div>
      {lines.filter(Boolean).map((line) => (
        <div key={line} className="mt-1.5 text-sm leading-relaxed" style={{ color: tinta(80) }}>
          {line}
        </div>
      ))}
      {href && cta && (
        <div className="mt-4 flex justify-center">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] tracking-[0.22em] uppercase px-6.5 py-3.5 rounded-full transition-opacity hover:opacity-85"
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
              border: `1px solid var(--ink)`,
            }}
          >
            {cta}
          </a>
        </div>
      )}
    </div>
  );
}

function IconGota() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <path
        d="M15 4 C 11 9, 8 12, 8 17 a 7 7 0 0 0 14 0 c 0 -5 -3 -8 -7 -13z"
        stroke={FLOR_FUNDA}
        strokeWidth="1.3"
      />
      <circle cx="15" cy="18" r="2.4" fill="var(--accent)" />
    </svg>
  );
}

function IconTaca() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <path d="M8 25 c 0 -6 3 -9 7 -9 s 7 3 7 9" stroke={FLOR_FUNDA} strokeWidth="1.3" fill="none" />
      <path d="M15 16 v -5" stroke={FLOR_FUNDA} strokeWidth="1.3" />
      <circle cx="15" cy="8" r="2.6" fill="var(--accent)" />
    </svg>
  );
}

export function Details({ content }: SectionProps) {
  const temAlgo =
    content.ceremonyVenue || content.receptionVenue || content.dressCode;
  if (!temAlgo) return null;

  return (
    <>
      <Branch />
      <section className="px-6.5 pt-12 pb-14" style={{ background: FUNDO_SUAVE }}>
        <div className="text-center mb-6.5">
          <ScriptTitle>O grande dia</ScriptTitle>
        </div>

        <div className="flex flex-col gap-4">
          {content.ceremonyVenue && (
            <GardenCard
              icon={<IconGota />}
              kicker={
                content.weddingTimeLabel
                  ? `Cerimônia · ${content.weddingTimeLabel}`
                  : "Cerimônia"
              }
              title={content.ceremonyVenue}
              lines={[content.ceremonyAddress]}
              href={content.ceremonyMapUrl}
              cta="Ver no mapa"
            />
          )}

          {content.receptionVenue && (
            <GardenCard
              icon={<IconTaca />}
              kicker="Recepção"
              title={content.receptionVenue}
              lines={[content.receptionAddress]}
            />
          )}

          {content.dressCode && (
            <div
              className="rounded-[26px] px-6 py-7 text-center"
              style={{ background: "var(--paper)", border: `1px solid ${BORDA}` }}
            >
              <div
                className="text-[10.5px] tracking-[0.32em] uppercase"
                style={{ color: FLOR_FUNDA }}
              >
                Traje
              </div>
              <div className="mt-2 font-[family-name:var(--font-script)] text-[34px] leading-tight">
                {content.dressCode}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export async function Gallery({ siteId }: SectionProps) {
  const fotos = (await listSitePhotos(siteId))
    .filter((f) => f.slot === "gallery")
    .slice(0, SLOT_CAPACITY.gallery);

  return (
    <section className="px-6.5 pt-14 pb-15">
      <div className="text-center mb-7">
        <ScriptTitle>Momentos</ScriptTitle>
        <DotDivider />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {fotos.length > 0
          ? fotos.map((foto, i) => (
              <figure key={foto.id} className="m-0 relative">
                <div
                  className="absolute -inset-1.5 rounded-[50%/40%] pointer-events-none"
                  style={{ border: `1px solid ${BORDA}` }}
                />
                <SitePhoto
                  photo={foto}
                  label={`Momento ${i + 1}`}
                  className="aspect-[4/5] w-full rounded-[50%/40%]"
                />
              </figure>
            ))
          : // Sem foto do casal, os quadros de exemplo seguram o desenho.
            ["Noivado", "Ensaio", "Viagem", "Nós dois"].map((label) => (
              <figure key={label} className="m-0 relative">
                <div
                  className="absolute -inset-1.5 rounded-[50%/40%] pointer-events-none"
                  style={{ border: `1px solid ${BORDA}` }}
                />
                <PhotoSlot label={label} className="aspect-[4/5] w-full rounded-[50%/40%]" />
              </figure>
            ))}
      </div>
    </section>
  );
}

export function Rsvp({ slug }: SectionProps) {
  return (
    <>
      <Branch />
      <section className="px-6.5 pt-12 pb-14">
        <div className="text-center mb-6">
          <ScriptTitle>Confirme sua presença</ScriptTitle>
          <DotDivider />
        </div>

        <div
          className="rounded-[26px] px-6 py-7 text-center"
          style={{ background: FUNDO_SUAVE, border: `1px solid ${BORDA}` }}
        >
          <p className="text-sm leading-relaxed" style={{ color: tinta(85) }}>
            Cada família recebeu um link pessoal, com os nomes de quem foi
            convidado. Procure a mensagem que enviamos para confirmar.
          </p>
          <Link
            href={`/s/${slug}`}
            className="inline-block mt-5 text-[11px] tracking-[0.22em] uppercase px-6.5 py-3.5 rounded-full transition-opacity hover:opacity-85"
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
              border: `1px solid var(--ink)`,
            }}
          >
            Não recebi meu link
          </Link>
        </div>
      </section>
    </>
  );
}

export async function Gifts({ siteId, content }: SectionProps) {
  const gifts = await listGifts(siteId);
  if (gifts.length === 0) return null;

  return (
    <section className="px-6.5 pt-12 pb-14" style={{ background: FUNDO_SUAVE }}>
      <div className="text-center mb-6">
        <ScriptTitle>Lista de presentes</ScriptTitle>
        <DotDivider />
      </div>
      <p className="mb-6 text-center text-[15px] leading-relaxed" style={{ color: tinta(85) }}>
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
    <section className="px-6.5 pt-12 pb-14">
      <div className="text-center mb-6">
        <ScriptTitle>Álbum da festa</ScriptTitle>
        <DotDivider />
      </div>

      <div
        className="rounded-[26px] px-6 py-8 text-center"
        style={{ background: FUNDO_SUAVE, border: `1px solid ${BORDA}` }}
      >
        <div className="flex justify-center">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke={FLOR_FUNDA}
            strokeWidth="1.3"
            aria-hidden
          >
            <rect x="5" y="10" width="14" height="10" rx="1" />
            <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
          </svg>
        </div>
        <div className="mt-3 font-[family-name:var(--font-script)] text-[34px] leading-tight">
          Um presente para depois
        </div>
        <p className="mt-2.5 text-sm leading-relaxed" style={{ color: tinta(80) }}>
          As fotos da festa aparecem aqui
          {content.weddingDateLabel
            ? ` depois de ${content.weddingDateLabel}`
            : " depois do casamento"}
          . Volte para matar a saudade.
        </p>
      </div>
    </section>
  );
}

export function Footer({ content }: SectionProps) {
  return (
    <footer
      className="px-6.5 pt-13 pb-12 text-center"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      <div className="font-[family-name:var(--font-script)] text-[46px] leading-tight">
        {content.coupleNames}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2.5">
        <div
          className="w-11 h-px"
          style={{ background: "color-mix(in srgb, var(--paper) 45%, transparent)" }}
        />
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <circle cx="6" cy="6" r="2.8" fill="var(--accent)" />
        </svg>
        <div
          className="w-11 h-px"
          style={{ background: "color-mix(in srgb, var(--paper) 45%, transparent)" }}
        />
      </div>

      {content.weddingDateLabel && (
        <div
          className="mt-4 text-[11px] tracking-[0.3em] uppercase"
          style={{ color: "color-mix(in srgb, var(--paper) 75%, transparent)" }}
        >
          {content.weddingDateLabel}
        </div>
      )}
    </footer>
  );
}
