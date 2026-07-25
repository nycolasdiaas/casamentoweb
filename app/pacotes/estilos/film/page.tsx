"use client";

import { Suspense, type ReactNode } from "react";
import { Cormorant_Garamond, EB_Garamond, Great_Vibes } from "next/font/google";
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
  style: ["normal", "italic"],
  variable: "--font-serif",
});
const body = EB_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-body",
});
const script = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

const ACCENT = "#a5603a"; // terracota
const INK = "#3f342a";
const PAPER = "#f3ebda";
const DARK = "#3c3227";
const DEEP = "#2f271e";
const CREAM = "#ece2cf";
const CARD = "#f6efdf";
const GOLD_LT = "#e9c9a6";

const MAPS =
  "https://maps.google.com/?q=Espa%C3%A7o+Jardim+das+Oliveiras,+Fortaleza";
const serifFamily = "var(--font-serif)";
const scriptFamily = "var(--font-script)";

const GUESTS = ["Carlos Martins", "Regina Martins", "Júlia Martins"];
const GIFTS = [
  { name: "Café da manhã na rede", priceReais: 80 },
  { name: "Passeio de buggy nas dunas", priceReais: 150 },
  { name: "Jantar pé na areia em Jeri", priceReais: 180 },
  { name: "Noite em bangalô à beira-mar", priceReais: 260 },
  { name: "Ensaio pós-wedding em Cumbuco", priceReais: 200 },
  { name: "Kit ressaca pós-festa", priceReais: 70 },
];
const SEED_MESSAGES = [
  {
    name: "Tia Regina",
    when: "12 de julho",
    text: "Que a vida de vocês tenha sempre essa luz de fim de tarde. Muitas felicidades!",
  },
  {
    name: "Bia, madrinha",
    when: "8 de julho",
    text: "Ana e Pedro, vocês são o meu casal favorito de amar. Mal posso esperar pela festa!",
  },
];

function Ornament({ color = GOLD_LT }: { color?: string }) {
  return (
    <svg
      width="52"
      height="34"
      viewBox="0 0 52 34"
      fill="none"
      stroke={color}
      strokeWidth="1"
      aria-hidden="true"
    >
      <path d="M26 30 C 20 24 18 16 26 6 C 34 16 32 24 26 30 Z" />
      <path d="M26 30 V16" opacity=".7" />
      <path d="M18 27 q -6 -1 -8 -8 q 7 0 8 8" fill={color} stroke="none" opacity=".9" />
      <path d="M34 27 q 6 -1 8 -8 q -7 0 -8 8" fill={color} stroke="none" opacity=".9" />
    </svg>
  );
}

function Head({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center mb-7">
      <div
        className="text-[10px] tracking-[0.4em] uppercase"
        style={{ color: ACCENT }}
      >
        {kicker}
      </div>
      <div
        className="mt-1 text-[46px] leading-[0.9]"
        style={{ fontFamily: scriptFamily, color: DARK }}
      >
        {title}
      </div>
    </div>
  );
}

export default function FilmTemplatePage() {
  return (
    <Suspense fallback={null}>
      <FilmTemplateInner />
    </Suspense>
  );
}

function FilmTemplateInner() {
  const [tier, setTier] = usePackageTier();
  const hasRsvp = tierIncludes(tier, "site");
  const hasGifts = tierIncludes(tier, "para-sempre");

  const s = useWeddingDemoState({
    storageKey: "tc-film",
    targetDate: DEMO_COUPLE.date,
    partyEndsAt: "2026-09-20T06:00:00-03:00",
    guests: GUESTS,
    gifts: GIFTS,
    seedMessages: SEED_MESSAGES,
  });

  return (
    <div className={`${serif.variable} ${body.variable} ${script.variable}`}>
      <TemplateChrome
        styleId="film"
        styleName="Film"
        outerBg={DEEP}
        cardBg={PAPER}
        ink={INK}
        accent={ACCENT}
        tier={tier}
        onTierChange={setTier}
      >
        <div style={{ fontFamily: "var(--font-body)", color: INK }} className="text-[15px]">
          {/* 1. Capa / Save the Date */}
          <section
            className="relative flex flex-col overflow-hidden"
            style={{ minHeight: "92vh", background: DARK }}
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
                  "linear-gradient(180deg,rgba(40,33,27,.55) 0%,rgba(40,33,27,.12) 38%,rgba(40,33,27,.34) 62%,rgba(40,33,27,.82) 100%)",
              }}
            />
            <div className="relative z-10 flex justify-center py-6" style={{ color: PAPER }}>
              <div className="text-[9.5px] tracking-[0.42em] uppercase opacity-85">
                Estd · 2019
              </div>
            </div>
            <div className="relative z-10 mt-auto px-7 pb-14 text-center" style={{ color: PAPER }}>
              <div className="flex justify-center mb-1.5">
                <Ornament />
              </div>
              <h1
                className="text-[52px] font-medium leading-[0.96] tracking-[0.04em] uppercase"
                style={{ fontFamily: serifFamily }}
              >
                Ana{" "}
                <span
                  className="text-[52px] normal-case"
                  style={{ fontFamily: scriptFamily, color: GOLD_LT }}
                >
                  &amp;
                </span>{" "}
                Pedro
              </h1>
              <div
                className="mt-1 text-[40px] leading-none"
                style={{ fontFamily: scriptFamily, color: GOLD_LT }}
              >
                para sempre
              </div>
              <div className="mt-4.5 flex items-center justify-center gap-3">
                <span className="h-px w-8" style={{ background: "rgba(243,235,218,.6)" }} />
                <span className="text-[9.5px] tracking-[0.36em] uppercase">Save the Date</span>
                <span className="h-px w-8" style={{ background: "rgba(243,235,218,.6)" }} />
              </div>
              <div className="mt-3.5 text-[20px]" style={{ fontFamily: serifFamily }}>
                19 de setembro de 2026 · 16h
              </div>
              <div className="mt-1 text-[12.5px] tracking-[0.12em] opacity-90">
                Espaço Jardim das Oliveiras — Fortaleza, CE
              </div>
            </div>
          </section>

          {/* 2. Contagem regressiva */}
          <section className="px-8 py-14" style={{ background: CREAM }}>
            <div className="text-center mb-7">
              <div className="text-[10px] tracking-[0.4em] uppercase" style={{ color: ACCENT }}>
                A contagem começou
              </div>
              <div className="mt-1.5 text-[44px] leading-[0.9]" style={{ fontFamily: scriptFamily, color: DARK }}>
                falta pouco
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
                  {i > 0 && <span className="w-px my-1" style={{ background: "rgba(63,52,42,.22)" }} />}
                  <div className="flex-1 text-center px-1">
                    <div className="text-[46px] font-medium leading-none" style={{ fontFamily: serifFamily }}>
                      {value}
                    </div>
                    <div className="mt-2 text-[9.5px] tracking-[0.28em] uppercase" style={{ color: "rgba(63,52,42,.62)" }}>
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Nossa história (colagem film) */}
          <section className="px-8 pt-14 pb-16">
            <h2
              className="text-center text-[33px] font-medium leading-tight tracking-[0.03em] uppercase"
              style={{ fontFamily: serifFamily }}
            >
              A nossa{" "}
              <span
                className="text-[46px] normal-case tracking-normal"
                style={{ fontFamily: scriptFamily, color: ACCENT }}
              >
                história
              </span>{" "}
              de amor
            </h2>

            <div className="relative my-7" style={{ height: 432 }}>
              <div
                className="absolute bg-white p-1.5"
                style={{ left: 6, top: 0, width: 120, transform: "rotate(5deg)", boxShadow: "0 10px 22px rgba(60,50,39,.22)" }}
              >
                <PhotoSlot label="Foto" className="w-full aspect-[4/5]" />
              </div>
              <div
                className="absolute bg-white p-1.5"
                style={{ right: 4, bottom: 0, width: 132, transform: "rotate(-5deg)", boxShadow: "0 10px 22px rgba(60,50,39,.22)" }}
              >
                <PhotoSlot label="Foto" className="w-full aspect-[4/5]" />
              </div>
              <div
                className="absolute bg-white p-2"
                style={{ left: "50%", top: 34, width: 212, transform: "translateX(-50%) rotate(-2deg)", boxShadow: "0 16px 30px rgba(60,50,39,.28)" }}
              >
                <PhotoSlot label="Foto principal — 4:5" className="w-full aspect-[4/5]" />
                <div className="text-center py-1" style={{ fontFamily: scriptFamily, color: "#6b5b49", fontSize: 22 }}>
                  o pedido, 2025
                </div>
              </div>
            </div>

            <p className="text-center text-[16px] leading-[1.8]" style={{ color: "rgba(63,52,42,.9)" }}>
              A Ana fotografava o pôr do sol na praia quando o Pedro entrou no
              enquadramento — e nunca mais saiu. Foi assim, meio sem querer, que
              a nossa história começou a ser revelada, quadro a quadro.
            </p>
            <p className="mt-4 text-center text-[16px] leading-[1.8]" style={{ color: "rgba(63,52,42,.9)" }}>
              Sete verões depois, escolhemos Fortaleza, o mar e vocês para
              revelar o quadro mais importante de todos.
            </p>
            <div className="mt-7 text-center text-[34px] leading-snug" style={{ fontFamily: scriptFamily, color: ACCENT }}>
              do primeiro clique ao para sempre
            </div>
          </section>

          {/* 4. Informações */}
          <section className="px-8 py-16" style={{ background: CREAM }}>
            <Head kicker="Quando & onde" title="o grande dia" />
            <div className="flex flex-col gap-4">
              <InfoCard
                kicker="Cerimônia · 16h"
                title="Espaço Jardim das Oliveiras"
                lines={["Rua das Oliveiras, 120 · Eusébio", "Fortaleza — CE · portões às 15h15"]}
                cta="Ver no mapa"
                filled
              />
              <InfoCard
                kicker="Recepção · 18h"
                title="Festa pé na areia do jardim"
                lines={["Jantar ao entardecer, brindes", "e forró até o filme acabar"]}
                cta="Como chegar"
              />
              <div className="p-6 text-center" style={{ border: "1px solid rgba(165,96,58,.5)" }}>
                <div className="text-[10px] tracking-[0.32em] uppercase" style={{ color: ACCENT }}>
                  Dress code
                </div>
                <div className="mt-1.5 text-[38px] leading-none" style={{ fontFamily: scriptFamily, color: DARK }}>
                  esporte fino boho
                </div>
                <div
                  className="mt-2 italic text-[14.5px] leading-[1.65]"
                  style={{ color: "rgba(63,52,42,.72)", fontFamily: serifFamily }}
                >
                  tons de terra, areia e ferrugem
                  <br />
                  combinam com o nosso filme
                </div>
              </div>
            </div>
          </section>

          {/* 5. RSVP — Site do Casamento */}
          {hasRsvp && (
            <section className="px-8 py-16">
              <div className="text-center mb-5.5">
                <div className="text-[10px] tracking-[0.4em] uppercase" style={{ color: ACCENT }}>
                  Confirme sua presença
                </div>
                <div className="mt-1 text-[48px] leading-[0.9]" style={{ fontFamily: scriptFamily, color: DARK }}>
                  você vem?
                </div>
              </div>
              <p className="mb-6 text-center text-[15px] leading-[1.75]" style={{ color: "rgba(63,52,42,.85)" }}>
                Sua presença é a melhor foto do nosso álbum. Responda com carinho
                até <span className="italic">19 de agosto de 2026</span>.
              </p>

              {!s.confirmed ? (
                <div className="px-5 py-6" style={{ background: CARD, border: "1px solid rgba(63,52,42,.16)" }}>
                  <div className="text-center text-[9.5px] tracking-[0.32em] uppercase" style={{ color: ACCENT }}>
                    Convite da Família Martins
                  </div>
                  <div className="mt-2">
                    {s.guests.map((guest) => {
                      const answer = s.rsvp[guest];
                      return (
                        <div
                          key={guest}
                          className="flex items-center justify-between gap-3 py-4"
                          style={{ borderBottom: "1px solid rgba(63,52,42,.14)" }}
                        >
                          <div className="flex-1 text-[20px] font-medium" style={{ fontFamily: serifFamily }}>
                            {guest}
                          </div>
                          <div className="flex gap-2">
                            <RsvpBtn active={answer === "yes"} onClick={() => s.setAnswer(guest, "yes")} activeBg={ACCENT} activeColor={PAPER}>
                              Vou
                            </RsvpBtn>
                            <RsvpBtn active={answer === "no"} onClick={() => s.setAnswer(guest, "no")} activeBg="#8a7358" activeColor={PAPER}>
                              Não vou
                            </RsvpBtn>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5.5 flex justify-center">
                    <button
                      type="button"
                      onClick={s.confirm}
                      disabled={!s.canConfirm}
                      className="text-[11px] tracking-[0.22em] uppercase px-9 py-4 transition-opacity disabled:opacity-45"
                      style={{ background: ACCENT, color: PAPER, fontFamily: "var(--font-body)" }}
                    >
                      Confirmar presença
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-9 text-center" style={{ background: CARD, border: "1px solid rgba(63,52,42,.16)" }}>
                  <div className="text-[52px] leading-[0.9]" style={{ fontFamily: scriptFamily, color: ACCENT }}>
                    Que alegria!
                  </div>
                  <p className="mt-3 text-[15px] leading-[1.75]" style={{ color: "rgba(63,52,42,.85)" }}>
                    Sua resposta chegou.
                    <br />
                    Já guardamos você no nosso rolo de filme.
                  </p>
                  <button
                    type="button"
                    onClick={s.editAnswers}
                    className="mt-4 text-[11px] tracking-[0.16em] uppercase underline underline-offset-4"
                    style={{ color: DARK }}
                  >
                    ajustar resposta
                  </button>
                </div>
              )}
            </section>
          )}

          {/* 6. Lista de presentes — Para Sempre */}
          {hasGifts && (
            <section className="px-8 py-16" style={{ background: CREAM }}>
              <Head kicker="Com carinho" title="lista de presentes" />
              <p className="mb-6 text-center text-[15.5px] leading-[1.75]" style={{ color: "rgba(63,52,42,.85)" }}>
                Cada mimo vira uma cena da nossa lua de mel pelo litoral cearense
                — tudo via Pix, sem complicação.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {s.gifts.map((gift, i) => (
                  <div
                    key={gift.name}
                    className="flex flex-col items-center gap-2.5 text-center px-3.5 pt-6 pb-5 transition-all hover:-translate-y-0.5"
                    style={{ background: CARD, border: "1px solid rgba(63,52,42,.15)" }}
                  >
                    <div className="text-[18.5px] font-medium leading-tight min-h-12 flex items-center" style={{ fontFamily: serifFamily }}>
                      {gift.name}
                    </div>
                    <div className="text-[14px]" style={{ color: "rgba(63,52,42,.7)" }}>
                      R$ {gift.priceReais}
                    </div>
                    <button
                      type="button"
                      onClick={() => s.openGift(i)}
                      className="mt-0.5 text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 transition-colors"
                      style={{ border: "1px solid rgba(63,52,42,.42)", color: DARK, fontFamily: "var(--font-body)" }}
                    >
                      Presentear
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Mural — Site do Casamento */}
          {hasRsvp && (
            <section className="px-8 py-16">
              <Head kicker="Palavras para guardar" title="mural de recados" />
              <div className="flex flex-col gap-3.5">
                {s.messages.map((msg, i) => (
                  <div key={`${msg.name}-${i}`} className="px-5 py-5" style={{ background: CREAM, border: "1px solid rgba(63,52,42,.14)" }}>
                    <div className="text-[30px] leading-[0.4]" style={{ fontFamily: scriptFamily, color: ACCENT }}>
                      &ldquo;
                    </div>
                    <p className="mt-1.5 italic text-[17px] leading-[1.6]" style={{ color: "#4a3d31", fontFamily: serifFamily }}>
                      {msg.text}
                    </p>
                    <div className="mt-2.5 flex items-baseline gap-2">
                      <span className="text-[24px]" style={{ fontFamily: scriptFamily, color: ACCENT }}>
                        {msg.name}
                      </span>
                      <span className="text-[11.5px]" style={{ color: "rgba(63,52,42,.55)" }}>· {msg.when}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 px-5 py-6" style={{ background: CREAM, border: "1px solid rgba(63,52,42,.16)" }}>
                <div className="text-center text-[9.5px] tracking-[0.32em] uppercase" style={{ color: ACCENT }}>
                  Deixe o seu recado
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <input
                    aria-label="Seu nome"
                    type="text"
                    value={s.guestName}
                    onChange={(e) => s.setGuestName(e.target.value)}
                    placeholder="Maria da Graça"
                    className="w-full text-[15px] px-3.5 py-3 bg-white focus:outline-none"
                    style={{ border: "1px solid rgba(63,52,42,.28)", color: INK }}
                  />
                  <textarea
                    aria-label="Sua mensagem"
                    rows={4}
                    value={s.guestMessage}
                    onChange={(e) => s.setGuestMessage(e.target.value)}
                    placeholder="Escreva com o coração…"
                    className="w-full resize-y text-[15px] px-3.5 py-3 bg-white focus:outline-none"
                    style={{ border: "1px solid rgba(63,52,42,.28)", color: INK }}
                  />
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={s.sendMessage}
                      className="text-[11px] tracking-[0.22em] uppercase px-9 py-4 transition-opacity"
                      style={{ background: DARK, color: PAPER, fontFamily: "var(--font-body)" }}
                    >
                      Deixar recado
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 8. Galeria pré-wedding + álbum — Para Sempre */}
          {hasGifts && (
            <>
              <section className="px-8 py-16" style={{ background: CREAM }}>
                <Head kicker="Antes do grande dia" title="nosso pré-wedding" />
                <p className="mb-6 text-center text-[14.5px] leading-[1.7] max-w-[34ch] mx-auto" style={{ color: "rgba(63,52,42,.78)" }}>
                  Fotos do ensaio e da contagem para o altar. Uma prévia dos
                  preparativos.
                </p>
                <div className="grid grid-cols-[1.2fr_.8fr] gap-3 items-start">
                  <div className="bg-white p-1.5" style={{ boxShadow: "0 8px 18px rgba(63,52,42,.16)" }}>
                    <PhotoSlot label="Ensaio pré-wedding" className="w-full aspect-[3/4]" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="bg-white p-1.5" style={{ boxShadow: "0 8px 18px rgba(63,52,42,.16)" }}>
                      <PhotoSlot label="Foto" className="w-full aspect-square" />
                    </div>
                    <div className="bg-white p-1.5" style={{ boxShadow: "0 8px 18px rgba(63,52,42,.16)" }}>
                      <PhotoSlot label="Foto" className="w-full aspect-square" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="px-8 py-16" style={{ background: DARK, color: PAPER }}>
                <div className="text-center mb-6">
                  <div className="text-[9.5px] tracking-[0.34em] uppercase" style={{ color: "rgba(243,235,218,.6)" }}>
                    Depois da festa
                  </div>
                  <div className="mt-1 text-[46px] leading-[0.9]" style={{ fontFamily: scriptFamily, color: GOLD_LT }}>
                    o álbum
                  </div>
                </div>

                {!s.albumUnlocked ? (
                  <div className="text-center">
                    <div className="flex justify-center" aria-hidden>
                      🔒
                    </div>
                    <div className="mt-3.5 text-[44px] leading-[0.9]" style={{ fontFamily: scriptFamily, color: GOLD_LT }}>
                      o filme revela em breve
                    </div>
                    <p className="mt-3 text-[14.5px] leading-[1.7]" style={{ color: "rgba(243,235,218,.78)" }}>
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
                    <PhotoSlot label="Foto da festa — larga" className="w-full aspect-[16/10] mb-3" />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {["Pista", "O brinde", "Padrinhos", "A saída"].map((label) => (
                        <PhotoSlot key={label} label={label} className="w-full aspect-square" />
                      ))}
                    </div>
                    <PhotoSlot label="Foto" className="w-full aspect-[16/10]" />
                    {s.albumPreview && (
                      <div className="mt-3 text-center">
                        <button
                          type="button"
                          onClick={() => s.setAlbumPreview(false)}
                          className="text-[10px] tracking-[0.16em] uppercase underline underline-offset-4"
                          style={{ color: "rgba(243,235,218,.7)" }}
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
          <footer className="text-center px-8 pt-14 pb-12" style={{ background: DARK, color: PAPER }}>
            <div className="flex justify-center mb-1.5">
              <Ornament />
            </div>
            <div className="text-[52px] leading-[0.9]" style={{ fontFamily: scriptFamily, color: GOLD_LT }}>
              Ana &amp; Pedro
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-8" style={{ background: "rgba(233,201,166,.55)" }} />
              <span className="text-[17px] tracking-[0.06em]" style={{ fontFamily: serifFamily, color: GOLD_LT }}>
                #AnaEPedro
              </span>
              <span className="h-px w-8" style={{ background: "rgba(233,201,166,.55)" }} />
            </div>
            <div className="mt-3 text-[10px] tracking-[0.3em] uppercase" style={{ color: "rgba(243,235,218,.72)" }}>
              19 · 09 · 2026 — Fortaleza, CE
            </div>
            <div className="mt-5 italic text-[13px]" style={{ fontFamily: serifFamily, color: "rgba(243,235,218,.5)" }}>
              revelado com amor — para o nosso grande dia
            </div>
          </footer>
        </div>
      </TemplateChrome>

      {/* Modal Pix */}
      {s.gift && (
        <div
          onClick={s.closeGift}
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          style={{ background: "rgba(40,33,27,.66)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[342px] max-h-[90vh] overflow-y-auto"
            style={{ background: PAPER, border: `1px solid ${ACCENT}` }}
          >
            <div className="px-5 py-6 text-center relative" style={{ color: INK }}>
              <button
                type="button"
                onClick={s.closeGift}
                aria-label="Fechar"
                className="absolute top-2.5 right-3 text-lg leading-none p-1"
                style={{ color: "rgba(63,52,42,.65)" }}
              >
                ×
              </button>
              <div className="text-[9.5px] tracking-[0.3em] uppercase" style={{ color: ACCENT }}>
                Presentear com Pix
              </div>
              <div className="mt-2.5 text-[23px] font-medium leading-tight" style={{ fontFamily: serifFamily }}>
                {s.gift.name}
              </div>
              <div className="mt-1 text-[15px]" style={{ color: "rgba(63,52,42,.72)" }}>
                R$ {s.gift.priceReais}
              </div>
              <div className="mt-4 flex justify-center">
                <div className="bg-white p-2.5" style={{ border: "1px solid rgba(63,52,42,.18)" }}>
                  <FakeQrCanvas seed={s.gift.name} ink={DARK} size={168} />
                </div>
              </div>
              <div className="mt-4 text-[9.5px] tracking-[0.3em] uppercase" style={{ color: "rgba(63,52,42,.6)" }}>
                Pix copia e cola
              </div>
              <div
                className="mt-2 text-left font-mono text-[10.5px] leading-[1.55] break-all bg-white p-2.5 max-h-[72px] overflow-y-auto"
                style={{ border: "1px solid rgba(63,52,42,.18)", color: "#6b5b49" }}
              >
                {buildDemoPixCode(s.gift.priceReais)}
              </div>
              <button
                type="button"
                onClick={() => s.copyPixCode(buildDemoPixCode(s.gift!.priceReais))}
                className="mt-3.5 w-full text-[11px] tracking-[0.22em] uppercase py-3.5 transition-opacity"
                style={{ background: DARK, color: PAPER, fontFamily: "var(--font-body)" }}
              >
                {s.copied ? "Copiado ✓" : "Copiar código"}
              </button>
              <p className="mt-3.5 italic text-[13px] leading-[1.6]" style={{ color: "rgba(63,52,42,.7)", fontFamily: serifFamily }}>
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
    <div className="px-6 py-7 text-center" style={{ background: CARD, border: "1px solid rgba(63,52,42,.15)" }}>
      <div className="text-[10px] tracking-[0.32em] uppercase" style={{ color: ACCENT }}>
        {kicker}
      </div>
      <div className="mt-2.5 text-[25px] font-medium" style={{ fontFamily: serifFamily }}>
        {title}
      </div>
      <div className="mt-2 text-[14.5px] leading-[1.7]" style={{ color: "rgba(63,52,42,.78)" }}>
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
          className="text-[10.5px] tracking-[0.24em] uppercase px-8 py-3.5 transition-colors"
          style={
            filled
              ? { background: ACCENT, color: PAPER, fontFamily: "var(--font-body)" }
              : { background: "transparent", color: DARK, border: "1px solid rgba(63,52,42,.4)", fontFamily: "var(--font-body)" }
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
      className="text-[10.5px] tracking-[0.14em] uppercase px-4 py-2.5 transition-colors"
      style={{
        fontFamily: "var(--font-body)",
        background: active ? activeBg : "#fff",
        color: active ? activeColor : DARK,
        border: `1px solid ${active ? activeBg : "rgba(63,52,42,.32)"}`,
      }}
    >
      {children}
    </button>
  );
}
