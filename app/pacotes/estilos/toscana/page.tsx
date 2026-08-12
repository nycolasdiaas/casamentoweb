"use client";

import { Suspense, type ReactNode } from "react";
import { Cormorant_Garamond, EB_Garamond, Italianno } from "next/font/google";
import TemplateChrome from "@/components/templates/TemplateChrome";
import PhotoSlot from "@/components/templates/PhotoSlot";
import FakeQrCanvas from "@/components/templates/FakeQrCanvas";
import { useWeddingDemoState } from "@/components/templates/useWeddingDemoState";
import { usePackageTier } from "@/components/templates/usePackageTier";
import { buildDemoPixCode } from "@/lib/demoPix";
import { DEMO_COUPLE, tierIncludes } from "@/lib/packages";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-serif",
});
const body = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});
const script = Italianno({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

const ACCENT = "#9c8654"; // dourado
const INK = "#33351f"; // oliva escuro
const PAPER = "#f3eddd";
const OLIVE = "#3b3e26";
const DEEP = "#2c2f1c";
const CREAM = "#f8f3e7";
const CREAM2 = "#efe8d4";
const CARD = "#faf6ec";
const GOLD_LT = "#e7dcbf";
const GOLD_ON_DARK = "#c9b98a";

const MAPS =
  "https://maps.google.com/?q=Espa%C3%A7o+Jardim+das+Oliveiras,+Fortaleza";

const GUESTS = ["Carlos Martins", "Regina Martins", "Júlia Martins"];
const GIFTS = [
  { name: "Taça de Chianti na Toscana", priceReais: 120 },
  { name: "Jantar em uma trattoria", priceReais: 180 },
  { name: "Passeio de vespa em Florença", priceReais: 150 },
  { name: "Uma noite em um casale", priceReais: 300 },
  { name: "Aula de massa fresca", priceReais: 130 },
  { name: "Gelato ao entardecer", priceReais: 60 },
];
const SEED_MESSAGES = [
  {
    name: "Tia Regina",
    when: "12 de julho",
    text: "Que a vida de vocês seja como um bom vinho: só melhore com o tempo. Saúde!",
  },
  {
    name: "Bia, madrinha",
    when: "8 de julho",
    text: "Ana e Pedro, esse amor tem elegância de coisa antiga e bonita. Que venha a festa!",
  },
];

const serifFamily = "var(--font-serif)";
const scriptFamily = "var(--font-script)";

export default function ToscanaTemplatePage() {
  return (
    <Suspense fallback={null}>
      <ToscanaTemplateInner />
    </Suspense>
  );
}

function SectionTitle({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <div className="text-center mb-7">
      <div
        className="text-[10px] lg:text-[12px] tracking-[0.4em] uppercase"
        style={{ color: ACCENT }}
      >
        {kicker}
      </div>
      <h2
        className="mt-2 text-[36px] font-medium tracking-[0.02em] uppercase leading-none"
        style={{ fontFamily: serifFamily }}
      >
        {title}
      </h2>
    </div>
  );
}

function ToscanaTemplateInner() {
  const [tier, setTier] = usePackageTier();
  const hasRsvp = tierIncludes(tier, "site");
  const hasGifts = tierIncludes(tier, "para-sempre");

  const s = useWeddingDemoState({
    storageKey: "tc-toscana",
    targetDate: DEMO_COUPLE.date,
    partyEndsAt: "2026-09-20T06:00:00-03:00",
    guests: GUESTS,
    gifts: GIFTS,
    seedMessages: SEED_MESSAGES,
  });

  return (
    <div className={`${serif.variable} ${body.variable} ${script.variable}`}>
      <TemplateChrome
        styleId="toscana"
        styleName="Toscana"
        outerBg={DEEP}
        cardBg={PAPER}
        ink={INK}
        accent={ACCENT}
        tier={tier}
        onTierChange={setTier}
      >
        <div
          style={{ fontFamily: "var(--font-body)", color: INK }}
          className="text-[15px] lg:text-[19px]"
        >
          {/* 1. Capa / Save the Date */}
          <section
            className="relative flex flex-col overflow-hidden"
            style={{ minHeight: "92vh", background: OLIVE }}
          >
            <div className="absolute inset-0">
              <PhotoSlot
                label="Foto principal do casal — vertical, sangrada"
                className="w-full h-full"
              />
            </div>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg,rgba(28,30,16,.66) 0%,rgba(28,30,16,.20) 38%,rgba(28,30,16,.30) 62%,rgba(28,30,16,.78) 100%)",
              }}
            />
            <div
              className="relative z-10 flex justify-between items-center px-5 py-5"
              style={{ color: PAPER }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 38,
                  height: 38,
                  border: "1px solid rgba(243,237,221,.55)",
                  fontFamily: serifFamily,
                }}
              >
                AP
              </div>
              <div className="text-[9.5px] tracking-[0.34em] uppercase opacity-85">
                Fortaleza — CE
              </div>
            </div>
            <div
              className="relative z-10 mt-auto px-6 pb-14 lg:pb-32 text-center"
              style={{ color: PAPER }}
            >
              <div
                className="text-[44px] leading-none"
                style={{ fontFamily: scriptFamily, color: GOLD_LT }}
              >
                19.09.2026
              </div>
              <h1
                className="mt-3.5 text-[58px] font-medium leading-[0.98] tracking-[0.02em] uppercase"
                style={{ fontFamily: serifFamily }}
              >
                Ana
                <br />
                <span
                  className="text-[46px]"
                  style={{ fontFamily: scriptFamily, color: GOLD_LT }}
                >
                  &amp;
                </span>
                <br />
                Pedro
              </h1>
              <div className="mt-5 flex items-center justify-center gap-3">
                <span
                  className="h-px w-10"
                  style={{ background: "rgba(243,237,221,.6)" }}
                />
                <span className="text-[10px] lg:text-[12px] tracking-[0.42em] uppercase">
                  Save the Date
                </span>
                <span
                  className="h-px w-10"
                  style={{ background: "rgba(243,237,221,.6)" }}
                />
              </div>
              <div className="mt-4 italic text-[17px] lg:text-[23px] opacity-90">
                Espaço Jardim das Oliveiras · 16h
              </div>
            </div>
          </section>

          {/* 2. Contagem regressiva */}
          <section className="px-8 lg:px-[8vw] py-14 lg:py-32" style={{ background: CREAM }}>
            <div className="text-center mb-8">
              <div
                className="text-[10px] lg:text-[12px] tracking-[0.4em] uppercase"
                style={{ color: ACCENT }}
              >
                A contagem começou
              </div>
              <div
                className="mt-2 text-[46px] leading-none"
                style={{ fontFamily: scriptFamily }}
              >
                falta pouco…
              </div>
            </div>
            <div className="flex items-stretch justify-center">
              {[
                ["dias", s.countdown.days],
                ["horas", s.countdown.hours],
                ["min", s.countdown.minutes],
                ["seg", s.countdown.seconds],
              ].map(([label, value], i) => (
                <div key={label} className="flex items-stretch flex-1">
                  {i > 0 && (
                    <span
                      className="w-px my-1"
                      style={{ background: "rgba(51,53,31,.22)" }}
                    />
                  )}
                  <div className="flex-1 text-center px-1">
                    <div
                      className="text-[46px] font-medium leading-none"
                      style={{ fontFamily: serifFamily }}
                    >
                      {value}
                    </div>
                    <div
                      className="mt-2 text-[9.5px] tracking-[0.28em] uppercase"
                      style={{ color: "rgba(51,53,31,.62)" }}
                    >
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Nossa história */}
          <section className="py-16 lg:py-36">
            <div className="px-8 lg:px-[8vw]">
              <SectionTitle kicker="Il nostro racconto" title="Nossa história" />
            </div>
            <PhotoSlot
              label="Foto larga do casal — 16:10"
              className="w-full aspect-[16/10] mb-7"
            />
            <div className="px-8 lg:px-[8vw]">
              <p className="text-center text-[16px] leading-[1.8]">
                Foi diante de um mapa da Itália, sonhando uma viagem que nunca
                aconteceu, que a Ana e o Pedro perceberam que já eram o destino
                um do outro. A viagem ficou para a lua de mel; o resto começou
                ali.
              </p>
              <p className="mt-4 text-center text-[16px] leading-[1.8]">
                Sete anos depois, trocamos a Toscana pela nossa Fortaleza — mas
                guardamos o mesmo brinde: à vida boa, devagar, e a dois.
              </p>
            </div>
            <div className="mt-8 px-8 lg:px-[8vw] grid grid-cols-2 gap-4">
              <figure className="m-0">
                <PhotoSlot label="Foto 3:4" className="w-full aspect-[3/4]" />
                <figcaption
                  className="mt-2.5 text-center italic text-[14px]"
                  style={{ color: "rgba(51,53,31,.7)", fontFamily: serifFamily }}
                >
                  o brinde de 2019
                </figcaption>
              </figure>
              <figure className="m-0 mt-6">
                <PhotoSlot label="Foto 3:4" className="w-full aspect-[3/4]" />
                <figcaption
                  className="mt-2.5 text-center italic text-[14px]"
                  style={{ color: "rgba(51,53,31,.7)", fontFamily: serifFamily }}
                >
                  o pedido, 2025
                </figcaption>
              </figure>
            </div>
            <div
              className="mt-9 text-center text-[36px] leading-tight"
              style={{ fontFamily: scriptFamily, color: ACCENT }}
            >
              la dolce vita, insieme
            </div>
          </section>

          {/* 4. Informações */}
          <section className="px-8 lg:px-[8vw] py-16 lg:py-36" style={{ background: CREAM2 }}>
            <SectionTitle kicker="Quando & onde" title="O grande dia" />
            <div className="flex flex-col gap-4.5">
              <InfoCard
                kicker="Cerimônia · 16h"
                title="Espaço Jardim das Oliveiras"
                lines={[
                  "Rua das Oliveiras, 120 · Eusébio",
                  "Fortaleza — CE · portões às 15h15",
                ]}
                cta="Ver no mapa"
                filled
              />
              <InfoCard
                kicker="Recepção · 18h"
                title="Jantar sob as oliveiras"
                lines={[
                  "Aperitivo, jantar lento e brindes",
                  "até a última música da noite",
                ]}
                cta="Como chegar"
              />
              <div
                className="p-6 text-center"
                style={{ border: `1px solid rgba(156,134,84,.55)` }}
              >
                <div
                  className="text-[10px] lg:text-[12px] tracking-[0.34em] uppercase"
                  style={{ color: ACCENT }}
                >
                  Dress code
                </div>
                <div
                  className="mt-2 text-[38px] leading-none"
                  style={{ fontFamily: scriptFamily }}
                >
                  Traje passeio completo
                </div>
                <div
                  className="mt-2 italic text-[14.5px] leading-[1.65]"
                  style={{ color: "rgba(51,53,31,.72)", fontFamily: serifFamily }}
                >
                  tons de oliva, terracota e areia
                  <br />
                  combinam com o nosso jardim
                </div>
              </div>
            </div>
          </section>

          {/* 5. RSVP — a partir do pacote Site do Casamento */}
          {hasRsvp && (
            <section
              className="px-8 lg:px-[8vw] py-16 lg:py-36"
              style={{ background: OLIVE, color: PAPER }}
            >
              <div className="text-center mb-6">
                <div
                  className="text-[10px] lg:text-[12px] tracking-[0.4em] uppercase"
                  style={{ color: GOLD_ON_DARK }}
                >
                  Confirme com carinho
                </div>
                <h2
                  className="mt-2.5 text-[38px] font-medium tracking-[0.02em] uppercase"
                  style={{ fontFamily: serifFamily }}
                >
                  Kindly RSVP
                </h2>
                <p className="mt-4 text-[15px] lg:text-[19px] leading-[1.7]" style={{ color: "rgba(243,237,221,.82)" }}>
                  Sua presença é o brinde mais esperado da festa.
                  <br />
                  Responda até <span className="italic">19 de agosto de 2026</span>.
                </p>
              </div>

              {!s.confirmed ? (
                <div style={{ border: "1px solid rgba(243,237,221,.28)" }} className="px-5 py-6">
                  <div
                    className="text-center text-[9.5px] tracking-[0.32em] uppercase"
                    style={{ color: GOLD_ON_DARK }}
                  >
                    Convite da Família Martins
                  </div>
                  <div className="mt-2.5">
                    {s.guests.map((guest) => {
                      const answer = s.rsvp[guest];
                      return (
                        <div
                          key={guest}
                          className="flex items-center justify-between gap-3 py-4"
                          style={{ borderBottom: "1px solid rgba(243,237,221,.18)" }}
                        >
                          <div
                            className="flex-1 text-[20px] font-medium"
                            style={{ fontFamily: serifFamily }}
                          >
                            {guest}
                          </div>
                          <div className="flex gap-2">
                            <RsvpBtn
                              active={answer === "yes"}
                              onClick={() => s.setAnswer(guest, "yes")}
                              activeBg={ACCENT}
                              activeColor={DEEP}
                            >
                              Vou
                            </RsvpBtn>
                            <RsvpBtn
                              active={answer === "no"}
                              onClick={() => s.setAnswer(guest, "no")}
                              activeBg="#7b7663"
                              activeColor={PAPER}
                            >
                              Não vou
                            </RsvpBtn>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={s.confirm}
                      disabled={!s.canConfirm}
                      className="text-[11px] lg:text-[13px] tracking-[0.24em] uppercase px-9 py-3.5 transition-opacity disabled:opacity-45"
                      style={{ background: ACCENT, color: DEEP, fontFamily: "var(--font-body)" }}
                    >
                      Confirmar presença
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ border: "1px solid rgba(243,237,221,.28)" }} className="px-6 py-9 lg:py-20 text-center">
                  <div
                    className="text-[52px] leading-none"
                    style={{ fontFamily: scriptFamily, color: GOLD_LT }}
                  >
                    Grazie mille!
                  </div>
                  <p className="mt-3.5 text-[15px] lg:text-[19px] leading-[1.7]" style={{ color: "rgba(243,237,221,.85)" }}>
                    Sua resposta chegou.
                    <br />
                    Já estamos guardando um lugar à mesa para você.
                  </p>
                  <button
                    type="button"
                    onClick={s.editAnswers}
                    className="mt-4 text-[11px] lg:text-[13px] tracking-[0.18em] uppercase underline underline-offset-4"
                    style={{ color: GOLD_LT }}
                  >
                    ajustar resposta
                  </button>
                </div>
              )}
            </section>
          )}

          {/* 6. Lista de presentes — só no Para Sempre */}
          {hasGifts && (
            <section className="px-8 lg:px-[8vw] py-16 lg:py-36">
              <SectionTitle kicker="Com carinho" title="Lista de presentes" />
              <p className="mb-7 text-center text-[15.5px] leading-[1.75]">
                Cada mimo abaixo vira um capítulo da nossa lua de mel pela Itália
                — via Pix, com toda a simplicidade.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {s.gifts.map((gift, i) => (
                  <div
                    key={gift.name}
                    className="flex flex-col items-center gap-2.5 text-center px-3.5 pt-6 pb-5 transition-all hover:-translate-y-0.5"
                    style={{ background: CARD, border: "1px solid rgba(51,53,31,.16)" }}
                  >
                    <div
                      className="text-[19px] lg:text-[26px] font-medium leading-tight min-h-12 flex items-center"
                      style={{ fontFamily: serifFamily }}
                    >
                      {gift.name}
                    </div>
                    <div className="text-[14px]" style={{ color: "rgba(51,53,31,.7)" }}>
                      R$ {gift.priceReais}
                    </div>
                    <button
                      type="button"
                      onClick={() => s.openGift(i)}
                      className="mt-0.5 text-[10px] lg:text-[12px] tracking-[0.2em] uppercase px-4 py-2.5 transition-colors"
                      style={{
                        border: "1px solid rgba(51,53,31,.45)",
                        color: INK,
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Presentear
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Mural de recados — a partir do pacote Site do Casamento */}
          {hasRsvp && (
            <section className="px-8 lg:px-[8vw] py-16 lg:py-36" style={{ background: CREAM2 }}>
              <SectionTitle
                kicker="Palavras para guardar"
                title="Mural de recados"
              />
              <div className="flex flex-col gap-3.5">
                {s.messages.map((msg, i) => (
                  <div
                    key={`${msg.name}-${i}`}
                    className="px-5 py-5"
                    style={{ background: CARD, border: "1px solid rgba(51,53,31,.14)" }}
                  >
                    <p
                      className="italic text-[17px] lg:text-[23px] leading-[1.6]"
                      style={{ color: "#3d3f24", fontFamily: serifFamily }}
                    >
                      &ldquo;{msg.text}&rdquo;
                    </p>
                    <div className="mt-2.5 flex items-baseline gap-2">
                      <span
                        className="text-[24px]"
                        style={{ fontFamily: scriptFamily, color: ACCENT }}
                      >
                        {msg.name}
                      </span>
                      <span className="text-[11.5px]" style={{ color: "rgba(51,53,31,.55)" }}>
                        · {msg.when}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="mt-6 px-5 py-6"
                style={{ background: CARD, border: "1px solid rgba(51,53,31,.16)" }}
              >
                <div
                  className="text-center text-[9.5px] tracking-[0.32em] uppercase"
                  style={{ color: ACCENT }}
                >
                  Deixe o seu recado
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <input
                    aria-label="Seu nome"
                    type="text"
                    value={s.guestName}
                    onChange={(e) => s.setGuestName(e.target.value)}
                    placeholder="Maria da Graça"
                    className="w-full text-[15px] lg:text-[19px] px-3.5 py-3 bg-white focus:outline-none"
                    style={{ border: "1px solid rgba(51,53,31,.28)", color: INK }}
                  />
                  <textarea
                    aria-label="Sua mensagem"
                    rows={4}
                    value={s.guestMessage}
                    onChange={(e) => s.setGuestMessage(e.target.value)}
                    placeholder="Escreva com o coração…"
                    className="w-full resize-y text-[15px] lg:text-[19px] px-3.5 py-3 bg-white focus:outline-none"
                    style={{ border: "1px solid rgba(51,53,31,.28)", color: INK }}
                  />
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={s.sendMessage}
                      className="text-[11px] lg:text-[13px] tracking-[0.24em] uppercase px-9 py-3.5 transition-opacity"
                      style={{ background: OLIVE, color: CREAM, fontFamily: "var(--font-body)" }}
                    >
                      Deixar recado
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 8. Galeria pré-wedding + álbum — só no Para Sempre */}
          {hasGifts && (
            <>
              <section className="px-8 lg:px-[8vw] py-16 lg:py-36" style={{ background: CREAM2 }}>
                <SectionTitle
                  kicker="Antes do grande dia"
                  title="Nosso pré-wedding"
                />
                <p className="mb-6 text-center text-[15px] lg:text-[19px] leading-[1.7] max-w-[34ch] mx-auto">
                  Fotos do ensaio e dos preparativos. Uma prévia antes do
                  grande dia.
                </p>
                <PhotoSlot
                  label="Ensaio pré-wedding — larga"
                  className="w-full aspect-[16/10] mb-3"
                />
                <div className="grid grid-cols-2 gap-3">
                  <PhotoSlot label="Foto" className="w-full aspect-square" />
                  <PhotoSlot label="Foto" className="w-full aspect-square" />
                </div>
              </section>

              <section
                className="px-8 lg:px-[8vw] py-16 lg:py-36"
                style={{ background: OLIVE, color: PAPER }}
              >
                <div className="text-center mb-7">
                  <div
                    className="text-[10px] lg:text-[12px] tracking-[0.4em] uppercase"
                    style={{ color: GOLD_ON_DARK }}
                  >
                    Para matar a saudade
                  </div>
                  <h2
                    className="mt-2 text-[36px] font-medium tracking-[0.02em] uppercase"
                    style={{ fontFamily: serifFamily }}
                  >
                    Álbum da festa
                  </h2>
                </div>

                {!s.albumUnlocked ? (
                  <div
                    className="px-6 py-9 lg:py-20 text-center"
                    style={{ border: "1px solid rgba(243,237,221,.28)" }}
                  >
                    <div className="flex justify-center" aria-hidden>
                      🔒
                    </div>
                    <div
                      className="mt-3.5 text-[40px] leading-none"
                      style={{ fontFamily: scriptFamily, color: GOLD_LT }}
                    >
                      Um presente para depois
                    </div>
                    <p className="mt-2.5 text-[14.5px] leading-[1.7]" style={{ color: "rgba(243,237,221,.78)" }}>
                      As fotos da festa aparecem aqui a partir de
                      <br />
                      <span className="italic">20 de setembro de 2026</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => s.setAlbumPreview(true)}
                      className="mt-6 text-[10.5px] tracking-[0.16em] uppercase underline underline-offset-4"
                      style={{ color: GOLD_LT }}
                    >
                      Ver prévia (demonstração) →
                    </button>
                  </div>
                ) : (
                  <div>
                    <PhotoSlot
                      label="Foto da festa — larga"
                      className="w-full aspect-[16/10] mb-3"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      {["Pista", "O brinde", "Padrinhos", "A saída", "Bolo", "Forró"].map(
                        (label) => (
                          <PhotoSlot
                            key={label}
                            label={label}
                            className="w-full aspect-square"
                          />
                        )
                      )}
                    </div>
                    {s.albumPreview && (
                      <div className="mt-3 text-center">
                        <button
                          type="button"
                          onClick={() => s.setAlbumPreview(false)}
                          className="text-[10px] lg:text-[12px] tracking-[0.16em] uppercase underline underline-offset-4"
                          style={{ color: "rgba(243,237,221,.7)" }}
                        >
                          Voltar ao estado bloqueado
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {/* 9. Rodapé */}
          <footer
            className="text-center px-8 lg:px-[8vw] pt-14 lg:pt-32 pb-12 lg:pb-28"
            style={{ background: DEEP, color: PAPER }}
          >
            <div className="flex justify-center">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 56,
                  height: 56,
                  border: "1px solid rgba(201,185,138,.6)",
                  fontFamily: serifFamily,
                }}
              >
                AP
              </div>
            </div>
            <div
              className="mt-4.5 text-[52px] leading-none"
              style={{ fontFamily: scriptFamily, color: GOLD_LT }}
            >
              Ana &amp; Pedro
            </div>
            <div className="mt-4.5 flex items-center justify-center gap-3">
              <span className="h-px w-9" style={{ background: "rgba(201,185,138,.55)" }} />
              <span
                className="text-[17px] lg:text-[23px] tracking-[0.08em]"
                style={{ fontFamily: serifFamily, color: GOLD_ON_DARK }}
              >
                #AnaEPedro
              </span>
              <span className="h-px w-9" style={{ background: "rgba(201,185,138,.55)" }} />
            </div>
            <div className="mt-3 text-[10px] lg:text-[12px] tracking-[0.32em] uppercase" style={{ color: "rgba(243,237,221,.72)" }}>
              19 · 09 · 2026 — Fortaleza, CE
            </div>
          </footer>
        </div>
      </TemplateChrome>

      {/* Modal Pix do presente */}
      {s.gift && (
        <div
          onClick={s.closeGift}
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          style={{ background: "rgba(28,30,16,.66)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[342px] max-h-[90vh] overflow-y-auto"
            style={{ background: CREAM, border: `1px solid ${ACCENT}` }}
          >
            <div className="px-5 py-6 text-center relative" style={{ color: INK }}>
              <button
                type="button"
                onClick={s.closeGift}
                aria-label="Fechar"
                className="absolute top-2.5 right-3 text-lg leading-none p-1"
                style={{ color: "rgba(51,53,31,.65)" }}
              >
                ×
              </button>
              <div className="text-[9.5px] tracking-[0.32em] uppercase" style={{ color: ACCENT }}>
                Presentear com Pix
              </div>
              <div
                className="mt-2.5 text-[24px] font-medium leading-tight"
                style={{ fontFamily: serifFamily }}
              >
                {s.gift.name}
              </div>
              <div className="mt-1 text-[15px] lg:text-[19px]" style={{ color: "rgba(51,53,31,.72)" }}>
                R$ {s.gift.priceReais}
              </div>
              <div className="mt-4 flex justify-center">
                <div className="bg-white p-2.5" style={{ border: "1px solid rgba(51,53,31,.18)" }}>
                  <FakeQrCanvas seed={s.gift.name} ink={INK} size={168} />
                </div>
              </div>
              <div className="mt-4 text-[9.5px] tracking-[0.3em] uppercase" style={{ color: "rgba(51,53,31,.6)" }}>
                Pix copia e cola
              </div>
              <div
                className="mt-2 text-left font-mono text-[10.5px] leading-[1.55] break-all bg-white p-2.5 max-h-[72px] overflow-y-auto"
                style={{ border: "1px solid rgba(51,53,31,.18)", color: "#5b5c40" }}
              >
                {buildDemoPixCode(s.gift.priceReais)}
              </div>
              <button
                type="button"
                onClick={() => s.copyPixCode(buildDemoPixCode(s.gift!.priceReais))}
                className="mt-3.5 w-full text-[11px] lg:text-[13px] tracking-[0.22em] uppercase py-3.5 transition-opacity"
                style={{ background: OLIVE, color: CREAM, fontFamily: "var(--font-body)" }}
              >
                {s.copied ? "Copiado ✓" : "Copiar código"}
              </button>
              <p
                className="mt-3.5 italic text-[13px] lg:text-[16px] leading-[1.6]"
                style={{ color: "rgba(51,53,31,.7)", fontFamily: serifFamily }}
              >
                Assim que o Pix chegar, seu nome entra na nossa lista de
                agradecimentos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  kicker,
  title,
  lines,
  cta,
  filled,
}: {
  kicker: string;
  title: string;
  lines: string[];
  cta: string;
  filled?: boolean;
}) {
  return (
    <div
      className="px-6 py-7 text-center"
      style={{ background: CARD, border: "1px solid rgba(51,53,31,.16)" }}
    >
      <div className="text-[10px] lg:text-[12px] tracking-[0.34em] uppercase" style={{ color: ACCENT }}>
        {kicker}
      </div>
      <div className="mt-3 text-[26px] lg:text-[40px] font-medium" style={{ fontFamily: serifFamily }}>
        {title}
      </div>
      <div className="mt-2 text-[14.5px] leading-[1.7]" style={{ color: "rgba(51,53,31,.78)" }}>
        {lines.map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
      </div>
      <div className="mt-4.5 flex justify-center">
        <a
          href={MAPS}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10.5px] tracking-[0.26em] uppercase px-8 lg:px-[8vw] py-3.5 transition-colors"
          style={
            filled
              ? { background: ACCENT, color: CREAM, fontFamily: "var(--font-body)" }
              : {
                  background: "transparent",
                  color: INK,
                  border: "1px solid rgba(51,53,31,.4)",
                  fontFamily: "var(--font-body)",
                }
          }
        >
          {cta}
        </a>
      </div>
    </div>
  );
}

function RsvpBtn({
  active,
  onClick,
  activeBg,
  activeColor,
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeBg: string;
  activeColor: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[10.5px] tracking-[0.16em] uppercase px-4 py-2.5 transition-colors"
      style={{
        fontFamily: "var(--font-body)",
        background: active ? activeBg : "transparent",
        color: active ? activeColor : PAPER,
        border: `1px solid ${active ? activeBg : "rgba(243,237,221,.4)"}`,
      }}
    >
      {children}
    </button>
  );
}
