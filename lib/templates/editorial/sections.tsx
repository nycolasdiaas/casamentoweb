import Link from "next/link";
import AlbumPorCategoria from "@/components/site/AlbumPorCategoria";
import PhotoSlot from "@/components/templates/PhotoSlot";
import SitePhoto from "@/components/site/SitePhoto";
import Countdown from "@/components/site/Countdown";
import GiftGrid from "@/components/site/GiftGrid";
import { loadGiftSection } from "@/lib/site/giftSection";
import { listSitePhotos, photoAt, SLOT_CAPACITY } from "@/lib/repositories/sitePhotos";
import type { SectionProps, SiteContentView } from "@/lib/templates/contract";
import Mural from "@/components/site/Mural";

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
    /*
      A capa a 1920 é DUAS COLUNAS com um fio no meio: texto à esquerda, foto
      sangrando à direita (`Enlace - Estilos Completos.dc.html`, bloco 01).
      No celular ela continua sendo a coluna centrada de sempre.

      A ordem do DOM é a do CELULAR — cabeçalho, data, retrato, legenda — e
      NÃO muda. Quem move o retrato para a segunda coluna é a colocação
      explícita da grade (`xl:col-start-2 xl:row-span-3`), não a ordem dos
      elementos. Reordenar o DOM seria o caminho curto, e mudaria o celular:
      a legenda subiria para cima do retrato. A regra da spec 002 é que as
      capturas de 390px saiam idênticas, e é ela que decide isto.
    */
    <section className="px-6 pt-5 pb-12 xl:grid xl:grid-cols-2 xl:grid-rows-[auto_1fr_auto] xl:min-h-[100svh] xl:px-0 xl:pt-0 xl:pb-0 xl:items-stretch">
      <div
        className="flex justify-between items-center gap-2 pb-4 xl:col-start-1 xl:row-start-1 xl:mx-14 xl:mt-14 xl:mb-0"
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
          Confirme
        </span>
      </div>

      {/* clamp() nas miniaturas e na data: em 320px, larguras fixas dos dois
          lados não deixavam espaço para "19 · 09 · 26" sem quebrar linha.

          A 1920 a data é o que o catálogo vende ("Editorial: data gigante") e
          continua sendo a peça grande — o desenho recompõe a MOLDURA, não a
          hierarquia. É o que o próprio arquivo do desenho diz: "o que muda é
          a composição, não a identidade". */}
      <div className="mt-10 text-center xl:col-start-1 xl:row-start-2 xl:mx-14 xl:my-0 xl:flex xl:flex-col xl:justify-center xl:text-left">
        <div className="flex items-center justify-center gap-3.5 xl:flex-wrap xl:justify-start xl:gap-x-4 xl:gap-y-7">
          {/* O teto de 64px é do celular. Num cartão de 1120px a miniatura
              some ao lado de uma data de 73px — vira sujeira, não composição. */}
          <div className="w-[clamp(44px,14vw,64px)] shrink-0 lg:w-[150px] xl:w-[110px]">
            <SitePhoto
              photo={lado[0]}
              label="Foto"
              className="w-full aspect-[3/4]"
            />
          </div>
          {data ? (
            <h1 style={{ "--motion-delay": "260ms" } as React.CSSProperties} className="motion-word font-[family-name:var(--font-display)] text-[clamp(30px,11vw,46px)] font-medium leading-[0.92] tracking-[0.01em] whitespace-nowrap xl:order-first xl:w-full xl:text-[72px]">
              {data.day}
              <span style={{ color: fade(35) }}> · </span>
              {data.month}
              <span style={{ color: fade(35) }}> · </span>
              {data.year}
            </h1>
          ) : (
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(26px,9vw,38px)] font-medium leading-[0.95] tracking-[0.02em] uppercase xl:order-first xl:w-full xl:text-[60px]">
              Save the date
            </h1>
          )}
          {/* O teto de 64px é do celular. Num cartão de 1120px a miniatura
              some ao lado de uma data de 73px — vira sujeira, não composição. */}
          <div className="w-[clamp(44px,14vw,64px)] shrink-0 lg:w-[150px] xl:w-[110px]">
            <SitePhoto
              photo={lado[1]}
              label="Foto"
              className="w-full aspect-[3/4]"
            />
          </div>
        </div>

        {/* O fio de 140px e a linha de horários que o desenho põe sob a data.
            Só no widescreen: no celular a coluna já é curta e este bloco
            competiria com a legenda logo abaixo.

            Cerimônia, festa e local saem de `content` — os três campos
            existem. O desenho também escreve "DESDE 2019 — Nº 01" no canto da
            foto, e isso NÃO foi portado: não há campo de "desde quando" no
            modelo, e §4.4.1 é explícita — o que não existe no banco não é
            transplantado. */}
        <div className="hidden xl:block">
          <div className="mt-10 h-px w-[140px]" style={{ background: "var(--ink)" }} />
          <div className="mt-8 flex flex-wrap gap-x-14 gap-y-5">
            {content.weddingTimeLabel && (
              <div>
                <Kicker>Cerimônia</Kicker>
                <div className="mt-1.5 font-[family-name:var(--font-display)] text-[26px]">
                  {content.weddingTimeLabel}
                </div>
              </div>
            )}
            {content.ceremonyVenue && (
              <div>
                <Kicker>Local</Kicker>
                <div className="mt-1.5 font-[family-name:var(--font-display)] text-[26px]">
                  {content.ceremonyVenue}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Retrato da capa: 250px é a medida do celular. No widescreen ele deixa
          de ser retrato centrado e vira a COLUNA DIREITA inteira, sangrando de
          topo a base — é o movimento que o desenho faz.

          `xl:row-span-3` é o que o põe ao lado das três linhas da esquerda sem
          que ele precise vir antes delas no DOM. */}
      <div className="mt-5.5 mx-auto max-w-[250px] lg:max-w-[520px] xl:mt-0 xl:mx-0 xl:max-w-none xl:col-start-2 xl:row-start-1 xl:row-span-3 xl:relative xl:overflow-hidden">
        <SitePhoto
          photo={capa}
          label="Foto principal do casal"
          /* `xl:max-h-none!` nao e enfeite. A regra global
             `.site-canvas [class*="aspect-"] { max-height: 74vh }` casa pelo
             TEXTO da classe, e `aspect-[3/4]` continua escrito aqui mesmo com
             `xl:aspect-auto` desligando a proporcao. Sem o `!`, a foto que
             deveria preencher a coluna de 100svh pararia em 74vh e deixaria
             uma faixa de papel no pe da capa. A utilitaria sozinha nao vence:
             o seletor global tem especificidade maior. */
          className="w-full aspect-[3/4] xl:h-full xl:aspect-auto xl:max-h-none! xl:absolute xl:inset-0"
          priority
        />
        {/* O degradê que o desenho põe no pé da foto, para a legenda clara ter
            onde pousar. Deriva da tinta do tema — nunca de preto fixo. */}
        <div
          className="hidden xl:block xl:absolute xl:inset-x-0 xl:bottom-0 xl:h-[32%] xl:pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent, color-mix(in srgb, var(--ink) 55%, transparent))`,
          }}
          aria-hidden
        />
      </div>

      <p
        /* `max-xl:text-center` e não `text-center`: a regra global
           `.site-canvas p[class~="text-center"] { margin-inline: auto }` tem
           especificidade maior que a utilitária `xl:mx-14` e recentralizaria o
           parágrafo justamente onde o desenho o quer na margem esquerda. O
           seletor casa o token exato — `max-xl:text-center` não é ele. */
        className="mt-5.5 mx-auto max-w-[34ch] max-xl:text-center text-[10px] tracking-[0.24em] uppercase leading-[2] lg:text-[11px] xl:col-start-1 xl:row-start-3 xl:mx-14 xl:mb-14 xl:max-w-[46ch] xl:text-left"
        style={{ color: fade(62) }}
      >
        Junte-se a nós no dia em que a gente diz sim
      </p>
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
      {/* A 1920 a contagem deixa de ser bloco centrado e vira FAIXA: rótulo
          ancorado à esquerda, números à direita, de ponta a ponta — o desenho
          usa a largura inteira aqui, e é uma das seções que ganham com ela.
          No celular segue centrada. */}
      <div
        className="relative z-10 px-6 py-16 text-center lg:flex lg:items-center lg:justify-between lg:gap-16 lg:px-14 lg:py-24 lg:text-left"
        style={{ color: "var(--paper)" }}
      >
        <Kicker onDark>Que a contagem comece</Kicker>
        <div className="mt-6 lg:mt-0 lg:shrink-0">
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
    <section className="px-6 py-16 lg:px-14 lg:py-28">
      <div className="text-center mb-2">
        <Kicker>Capítulo um</Kicker>
      </div>
      <h2 className="text-center font-[family-name:var(--font-display)] text-[40px] font-medium leading-none tracking-[0.01em] uppercase lg:text-[64px]">
        Nossa
        <br />
        história
      </h2>

      {/* A 1920 a história é DUAS COLUNAS: retrato de 4/5 à esquerda, texto à
          direita, alinhados pelo centro — o desenho repete esse par duas
          vezes, alternando o lado.

          Aqui ele aparece UMA vez, e é de propósito: `content.story` é UM
          campo de texto livre. O desenho preenche o segundo par com "2025 — o
          pedido" e uma segunda citação, que sairiam de um modelo de linha do
          tempo que não existe. §4.4.1 — o que não está no banco não é
          transplantado. Fica registrado como campo pendente, não inventado. */}
      <div className="lg:mt-16 lg:grid lg:grid-cols-2 lg:gap-[72px] lg:items-center">
        <div className="my-8 lg:my-0">
          <SitePhoto
            photo={principal}
            label="A nossa história"
            className="w-full aspect-[16/11] lg:aspect-[4/5]"
          />
        </div>

        <p
          className="max-lg:text-center text-[14.5px] leading-[1.85] whitespace-pre-line lg:text-[22px] lg:leading-[1.55]"
          style={{ color: fade(75) }}
        >
          {content.story}
        </p>
      </div>

      {duas.length === 2 && (
        <div className="mt-8 grid grid-cols-2 gap-3.5 lg:mt-16 lg:gap-[72px]">
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
          className="px-6 pt-16 pb-14 lg:px-14 lg:pt-24 lg:pb-20"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          <Head kicker="Uma prévia de" title={<>O nosso dia</>} onDark />

          {/* Cerimônia e festa lado a lado, separadas por um fio vertical — a
              faixa de três colunas do desenho. São duas e não três porque o
              traje tem seção própria neste molde e movê-lo para cá mudaria o
              celular, onde ele fecha a página com o par de filetes. */}
          <div className="mt-8 flex flex-col gap-8 lg:mt-14 lg:grid lg:grid-cols-2 lg:gap-0">
            {content.ceremonyVenue && (
              <div className="text-center lg:pr-14">
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
              /* O filete muda de lado no widescreen: no celular ele separa
                 por cima, entre dois blocos empilhados; a 1920 ele é a régua
                 vertical entre as duas colunas. */
              <div
                className="text-center pt-8 max-lg:border-t lg:pt-0 lg:border-l lg:pl-14"
                style={{ borderColor: HAIRLINE_DARK }}
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
        <section className="px-6 py-14 lg:px-14 lg:py-24">
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
    <section className="px-6 py-16 lg:px-14 lg:py-28">
      <Head kicker="Antes do grande dia" title="Pré-wedding" />

      {/* Uma grade só, não duas.

          No celular o resultado é o de sempre — a foto larga ocupando as três
          colunas e o resto embaixo, com os mesmos 12px de intervalo (o `mb-3`
          que separava os dois blocos era exatamente o `gap-3` de dentro).

          A 1920 essa mesma grade vira o mosaico do desenho: `2fr 1fr 1fr` com
          a primeira foto ocupando as duas fileiras de 300px. Dois blocos
          irmãos não conseguiriam fazer isso — um `row-span` só atravessa as
          fileiras da PRÓPRIA grade. */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-[2fr_1fr_1fr] lg:auto-rows-[300px] lg:gap-4">
        <SitePhoto
          photo={larga}
          label="Ensaio"
          className="w-full aspect-[16/10] col-span-3 lg:col-span-1 lg:row-span-2 lg:h-full lg:aspect-auto"
        />

        {resto.length > 0
          ? resto.map((foto, i) => (
              <SitePhoto
                key={foto.id}
                photo={foto}
                label={`Momento ${i + 1}`}
                className="w-full aspect-[3/4] lg:h-full lg:aspect-auto"
              />
            ))
          : // Sem fotos do casal, os quadros de exemplo seguram o desenho —
            // não se mistura foto real com foto de desconhecido.
            ["Noivado", "Ensaio", "Nós dois"].map((label) => (
              <PhotoSlot
                key={label}
                label={label}
                className="w-full aspect-[3/4] lg:h-full lg:aspect-auto"
              />
            ))}
      </div>
    </section>
  );
}

export function Rsvp({ slug }: SectionProps) {
  return (
    <section className="px-6 py-16 lg:px-14 lg:py-28">
      <div className="text-center mb-6">
        <Kicker>Confirme sua presença</Kicker>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-[40px] font-medium tracking-[0.02em] uppercase lg:text-[64px]">
          Você vem?
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
            href={`/s/${slug}/meu-convite`}
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
  const { gifts, pix, fotos, presenteados } = await loadGiftSection(siteId);
  if (gifts.length === 0) return null;

  return (
    <section
      className="px-6 py-16 lg:px-14 lg:py-28"
      style={{ background: "color-mix(in srgb, var(--ink) 6%, var(--paper))" }}
    >
      <Head kicker="Se o coração pedir" title="Presentes" />
      <p
        className="mb-6 whitespace-pre-line text-center text-[14px] leading-[1.7] lg:text-[16.8px]"
        style={{ color: fade(72) }}
      >
        {content.giftMessage ??
          "Sem faqueiro, sem lista de loja. Cada cota é um pedaço da nossa lua de mel — via Pix."}
      </p>
      <GiftGrid
        gifts={gifts}
        pix={pix}
        siteId={siteId}
        fotos={fotos}
        presenteados={presenteados}
      />
    </section>
  );
}

/**
 * Mural de recados (pacote Para Sempre).
 *
 * A lista e o formulário são os mesmos dos seis moldes — ver
 * `components/site/Mural.tsx`. Aqui entra só o enquadramento deste molde.
 */
export async function Guestbook({ siteId, slug }: SectionProps) {
  return (
    <section className="px-6 py-16 lg:px-14 lg:py-28">
      <Head kicker="Escreva para nós" title="Mural" />
      <Mural
        siteId={siteId}
        slug={slug}
        convite="Duas linhas bastam. A gente guarda todas."
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
  const data = content.weddingDateParts;

  return (
    <section
      className="px-6 py-16 text-center lg:px-14 lg:py-28"
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
      className="px-6 pt-14 pb-11 text-center lg:px-14"
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
