import Link from "next/link";
import PhotoSlot from "@/components/templates/PhotoSlot";
import SitePhoto from "@/components/site/SitePhoto";
import Countdown from "@/components/site/Countdown";
import GiftGrid from "@/components/site/GiftGrid";
import SplitReveal from "@/components/site/SplitReveal";
import { loadGiftSection } from "@/lib/site/giftSection";
import { listSitePhotos, photoAt, SLOT_CAPACITY } from "@/lib/repositories/sitePhotos";
import type { SectionProps } from "@/lib/templates/contract";

// Seções do molde Clássico — papelaria de casamento de luxo.
//
// Porte do desenho widescreen (01/08/2026). O que mudou: a capa virou herói
// sangrado com a moldura dupla dourada POR CIMA da foto (era foto contida numa
// coluna), a história virou duas colunas, informações virou três colunas com
// régua vertical, e a galeria virou grade assimétrica.
//
// DUAS COISAS DO DESENHO QUE NÃO FORAM PORTADAS, de propósito:
//
// 1. Cor. O desenho vinha com hex (#3d4a36, #b8985f). Aqui é var(--ink),
//    var(--accent), var(--paper): o mesmo molde serve N casais com paletas
//    diferentes, e `npm run verify:template` reprova hex escrito na seção.
// 2. Conteúdo fictício. O desenho trazia DUAS histórias com citação, legenda
//    de foto ("o pedido, 2025") e hashtag. O banco tem UMA `story`, não tem
//    legenda e não tem hashtag. Portar é omitir o que não existe — senão o
//    site de um casal real anuncia coisa que não vai acontecer.
//
// A largura responde a `@container`, não a media query: o site vive dentro de
// um <iframe> na prévia do painel, onde a janela tem 1440px e o quadro pode
// ter 390px. Ver o comentário no SiteRenderer.
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
    <div className="text-center mb-6 @min-[900px]:mb-11">
      <div className="font-[family-name:var(--font-script)] text-[29px] @min-[900px]:text-[42px] text-(--accent) leading-tight">
        {script}
      </div>
      <h2 className="mt-1 mb-3.5 font-[family-name:var(--font-display)] text-[23px] @min-[900px]:text-[38px] font-semibold tracking-[0.2em] uppercase">
        {title}
      </h2>
      <div className="w-[72px] h-px bg-(--accent) mx-auto" />
      <div className="w-11 h-px bg-(--accent) mx-auto mt-[5px]" />
    </div>
  );
}

/** Moldura dupla dourada — a assinatura visual do Clássico. */
function GoldFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-(--accent) p-[5px] ${className}`}>
      <div className="border border-(--accent)/50 p-[5px]">{children}</div>
    </div>
  );
}

/** Largura útil do conteúdo no desktop. Texto de 1120px de ponta a ponta é
 *  ilegível; o respiro é que cresce, não a linha. */
const MIOLO = "mx-auto w-full max-w-[1160px]";

export async function Cover({ content, siteId }: SectionProps) {
  const [a, b] = content.initials ?? [null, null];
  const capa = photoAt(await listSitePhotos(siteId), "cover");

  return (
    <section
      className="relative flex min-h-[78svh] items-center justify-center overflow-hidden text-center @min-[900px]:min-h-[88svh]"
      style={{ background: "var(--outer)", color: "var(--paper)" }}
    >
      {/* Foto sangrando o quadro inteiro. `priority` porque é o LCP. */}
      <div className="absolute inset-0">
        <SitePhoto
          photo={capa}
          label="Foto principal do casal"
          className="size-full"
          priority
        />
      </div>

      {/* Véu de contraste, em duas camadas.
          A primeira escurece o quadro inteiro em degradê. A segunda é um foco
          radial atrás do texto — sem ele, o dourado do "Save the Date" some
          quando a foto é clara bem no meio (véu de noiva, praia ao meio-dia,
          parede branca). Escurecer o degradê inteiro até resolver isso
          apagaria a foto; o foco resolve só onde o texto está.
          Derivados da tinta do casal, nunca de preto fixo. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--outer) 62%, transparent), color-mix(in srgb, var(--outer) 30%, transparent) 42%, color-mix(in srgb, var(--outer) 68%, transparent))",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 42% at 50% 52%, color-mix(in srgb, var(--outer) 62%, transparent), transparent 72%)",
        }}
      />

      {/* A moldura dupla por cima da foto — assinatura do molde. */}
      <div className="pointer-events-none absolute inset-4 border border-(--accent)/75 @min-[900px]:inset-8" />
      <div className="pointer-events-none absolute inset-[22px] border border-(--accent)/40 @min-[900px]:inset-11" />

      <div className="relative z-10 px-7 py-14 @min-[900px]:px-20">
        {a && b && (
          <div className="mb-5 flex justify-center">
            <div className="flex size-[76px] items-center justify-center rounded-full border border-(--accent) @min-[900px]:size-24">
              <div className="flex size-16 items-center justify-center gap-1 rounded-full border border-(--accent)/50 @min-[900px]:size-20">
                <span className="font-[family-name:var(--font-display)] text-xl font-medium @min-[900px]:text-2xl">
                  {a}
                </span>
                <span className="font-[family-name:var(--font-script)] text-lg text-(--accent) @min-[900px]:text-xl">
                  &amp;
                </span>
                <span className="font-[family-name:var(--font-display)] text-xl font-medium @min-[900px]:text-2xl">
                  {b}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="font-[family-name:var(--font-script)] text-[37px] leading-none text-(--accent) @min-[900px]:text-[56px]">
          Save the Date
        </div>

        {/* Tamanho fluido em `cqi` (1% da largura do cartão), não degrau fixo:
            "Ana & Pedro" e "Maria Fernanda & João Guilherme" têm o dobro de
            comprimento um do outro, e um degrau que serve ao primeiro estoura
            com o segundo. O clamp dá o piso e o teto; o meio se ajusta. */}
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(34px,11cqi,104px)] font-medium leading-[1.04] tracking-wide">
          <SplitReveal text={content.coupleNames} atraso={260} />
        </h1>

        <div className="mx-auto mt-5 h-px w-[90px] bg-(--accent)" />

        {(content.weddingDateLabel || content.weddingTimeLabel) && (
          <div className="mt-4 text-[11px] uppercase tracking-[0.28em] @min-[900px]:text-[15px]">
            {content.weddingDateLabel}
            {content.weddingDateLabel && content.weddingTimeLabel ? " · " : ""}
            {content.weddingTimeLabel}
          </div>
        )}

        {content.ceremonyVenue && (
          <div className="mt-2 font-[family-name:var(--font-display)] text-[15px] italic @min-[900px]:text-[21px]">
            {content.ceremonyVenue}
            {content.ceremonyAddress ? ` — ${content.ceremonyAddress}` : ""}
          </div>
        )}
      </div>
    </section>
  );
}

export function CountdownSection({ content }: SectionProps) {
  if (!content.weddingDate) return null;

  return (
    <section
      className="border-y px-7 py-14 @min-[900px]:px-20 @min-[900px]:py-20"
      style={{
        background: "color-mix(in srgb, var(--ink) 4%, var(--paper))",
        borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
      }}
    >
      <div className={`${MIOLO} text-center`}>
        <div className="font-[family-name:var(--font-script)] text-[29px] leading-none text-(--accent) @min-[900px]:text-[44px]">
          falta pouco
        </div>
        <div className="mt-5">
          <Countdown targetDate={content.weddingDate.toISOString()} />
        </div>
        <div className="mt-6 text-sm italic opacity-75">
          para o nosso grande dia
        </div>
      </div>
    </section>
  );
}

export async function Story({ content, siteId }: SectionProps) {
  if (!content.story) return null;

  const foto = photoAt(await listSitePhotos(siteId), "story");

  return (
    <section className="px-7 py-16 @min-[900px]:px-20 @min-[900px]:py-24">
      <div className={MIOLO}>
        <SectionHeading script="a nossa" title="História" />

        {/* UM bloco, não dois: o banco guarda uma `story`. O desenho trazia
            duas, com citações que não existem em lugar nenhum. */}
        <div className="flex flex-col gap-7 @min-[900px]:flex-row @min-[900px]:items-center @min-[900px]:gap-14">
          <div className="@min-[900px]:flex-1">
            <GoldFrame>
              <SitePhoto
                photo={foto}
                label="O pedido"
                className="aspect-[4/5] w-full"
              />
            </GoldFrame>
          </div>
          <div className="@min-[900px]:flex-1">
            <p className="whitespace-pre-line text-center text-[15.5px] leading-[1.8] opacity-90 @min-[900px]:text-left @min-[900px]:text-[17px]">
              {content.story}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Details({ content }: SectionProps) {
  const items = [
    content.ceremonyVenue && {
      label: "Cerimônia",
      destaque: content.weddingTimeLabel ?? content.ceremonyVenue,
      value: content.weddingTimeLabel ? content.ceremonyVenue : null,
      extra: content.ceremonyAddress,
    },
    content.receptionVenue && {
      label: "Festa",
      destaque: content.receptionVenue,
      value: null,
      extra: content.receptionAddress,
    },
    content.dressCode && {
      label: "Traje",
      destaque: content.dressCode,
      value: null,
      extra: null,
    },
  ].filter(Boolean) as {
    label: string;
    destaque: string;
    value: string | null;
    extra: string | null;
  }[];

  if (items.length === 0) return null;

  return (
    <section
      className="border-y px-7 py-16 @min-[900px]:px-20 @min-[900px]:py-24"
      style={{
        background: "color-mix(in srgb, var(--ink) 4%, var(--paper))",
        borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
      }}
    >
      <div className={MIOLO}>
        <SectionHeading script="o grande dia" title="Informações" />

        {/* A régua troca de eixo junto com o layout: borda no topo quando
            empilhado, borda à esquerda quando lado a lado. */}
        <div className="flex flex-col @min-[900px]:flex-row">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`py-6 text-center @min-[900px]:flex-1 @min-[900px]:px-10 @min-[900px]:py-2 ${
                i > 0
                  ? "border-t border-(--accent)/45 @min-[900px]:border-t-0 @min-[900px]:border-l"
                  : "@min-[900px]:pl-0"
              }`}
            >
              <div className="text-[10px] uppercase tracking-[0.3em] text-(--accent)">
                {item.label}
              </div>
              <div className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-medium leading-tight @min-[900px]:text-[38px]">
                {item.destaque}
              </div>
              {item.value && (
                <div className="mt-1.5 text-[15px] opacity-80">{item.value}</div>
              )}
              {item.extra && (
                <div className="mt-1.5 text-[13.5px] leading-relaxed opacity-75">
                  {item.extra}
                </div>
              )}
            </div>
          ))}
        </div>

        {content.ceremonyMapUrl && (
          <div className="mt-8 text-center">
            <a
              href={content.ceremonyMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3.5 text-[11px] uppercase tracking-[0.24em] transition-opacity hover:opacity-85"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              Ver no mapa
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

const MOMENTOS = ["Noivado", "Ensaio", "Viagem"];

export async function Gallery({ siteId }: SectionProps) {
  const fotos = (await listSitePhotos(siteId))
    .filter((p) => p.slot === "gallery")
    .slice(0, SLOT_CAPACITY.gallery);

  // Grade assimétrica: a primeira ocupa duas linhas à esquerda, as outras
  // empilham à direita. No celular volta a grade uniforme, que é o que cabe
  // em 480px.
  const destaque =
    "col-span-2 @min-[900px]:col-span-1 @min-[900px]:row-span-2";
  const proporcao = (i: number) =>
    i === 0
      ? "aspect-[16/10] w-full @min-[900px]:aspect-[3/4]"
      : "aspect-square w-full";

  return (
    <section className="px-7 py-16 @min-[900px]:px-20 @min-[900px]:py-24">
      <div className={MIOLO}>
        <SectionHeading script="momentos" title="Galeria" />

        <div className="grid grid-cols-2 gap-3 @min-[900px]:grid-cols-[1.7fr_1fr] @min-[900px]:grid-rows-2 @min-[900px]:gap-4">
          {fotos.length > 0
            ? fotos.slice(0, 3).map((foto, i) => (
                <GoldFrame key={foto.id} className={i === 0 ? destaque : ""}>
                  <SitePhoto
                    photo={foto}
                    label={`Momento ${i + 1}`}
                    className={proporcao(i)}
                  />
                </GoldFrame>
              ))
            : // Sem foto do casal, os quadros de exemplo seguram o desenho da
              // seção. Não se mistura os dois: meia grade de fotos reais e
              // meia de desconhecidos ficaria pior que só o exemplo.
              MOMENTOS.map((label, i) => (
                <GoldFrame key={label} className={i === 0 ? destaque : ""}>
                  <PhotoSlot label={label} className={proporcao(i)} />
                </GoldFrame>
              ))}
        </div>
      </div>
    </section>
  );
}

export function Rsvp({ content, slug }: SectionProps) {
  return (
    <section className="px-7 py-16 @min-[900px]:px-20 @min-[900px]:py-24">
      <div className={MIOLO}>
        <SectionHeading script="você vem?" title="Confirmação" />
        <p className="mb-6 text-center text-[15.5px] leading-relaxed opacity-85 @min-[900px]:text-[17px]">
          Sua presença é o nosso presente mais querido.
          {content.coupleNames &&
            " Confirme sua presença pelo link que enviamos."}
        </p>

        <div
          className="mx-auto max-w-[640px] border px-[22px] py-7 text-center @min-[900px]:px-14 @min-[900px]:py-10"
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
            className="mt-5 inline-block border px-7 py-3.5 text-[11.5px] uppercase tracking-[0.24em] transition-opacity hover:opacity-85"
            style={{
              background: "var(--ink)",
              borderColor: "var(--ink)",
              color: "var(--paper)",
            }}
          >
            Não recebi meu link
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
      className="border-y px-7 py-16 @min-[900px]:px-20 @min-[900px]:py-24"
      style={{
        background: "color-mix(in srgb, var(--ink) 4%, var(--paper))",
        borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
      }}
    >
      <div className={MIOLO}>
        <SectionHeading script="com carinho" title="Lista de presentes" />
        <p className="mb-6 text-center text-[15.5px] leading-relaxed opacity-85 @min-[900px]:text-[17px]">
          {content.giftMessage ??
            "Ter você conosco já é presente. Mas, se o coração pedir, cada mimo abaixo vira uma lembrança da nossa lua de mel."}
        </p>
        <GiftGrid gifts={gifts} pix={pix} siteId={siteId} />
      </div>
    </section>
  );
}

export function Album({ content }: SectionProps) {
  const dataLabel = content.weddingDateLabel;

  return (
    <section
      className="px-7 py-16 @min-[900px]:px-20 @min-[900px]:py-24"
      style={{ background: "var(--outer)", color: "var(--paper)" }}
    >
      <div className={`${MIOLO} text-center`}>
        <div className="text-[10px] uppercase tracking-[0.3em] text-(--accent)">
          Depois da festa
        </div>
        <div className="mt-3 font-[family-name:var(--font-script)] text-[34px] leading-none text-(--accent) @min-[900px]:text-[56px]">
          O álbum
        </div>
        <p className="mx-auto mt-4 max-w-[44ch] text-sm leading-relaxed opacity-80">
          {dataLabel
            ? `As fotos da festa entram aqui depois de ${dataLabel}.`
            : "As fotos da festa entram aqui depois do casamento."}{" "}
          Aproveite o dia; depois volte para reviver tudo.
        </p>
      </div>
    </section>
  );
}

export function Footer({ content }: SectionProps) {
  return (
    <footer
      className="px-7 py-14 text-center @min-[900px]:px-20 @min-[900px]:py-20"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      <div className="font-[family-name:var(--font-script)] text-[34px] leading-none text-(--accent) @min-[900px]:text-[60px]">
        {content.coupleNames}
      </div>
      {content.weddingDateLabel && (
        <div className="mt-3 text-[10px] uppercase tracking-[0.3em] opacity-75">
          {content.weddingDateLabel}
        </div>
      )}
    </footer>
  );
}
