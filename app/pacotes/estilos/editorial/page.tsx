"use client";

import { Suspense, type ReactNode } from "react";
import { Archivo, Cormorant_Garamond } from "next/font/google";
import TemplateChrome from "@/components/templates/TemplateChrome";
import PhotoSlot from "@/components/templates/PhotoSlot";
import FakeQrCanvas from "@/components/templates/FakeQrCanvas";
import { useWeddingDemoState } from "@/components/templates/useWeddingDemoState";
import { usePackageTier } from "@/components/templates/usePackageTier";
import { buildDemoPixCode } from "@/lib/demoPix";
import { DEMO_COUPLE, tierIncludes } from "@/lib/packages";

const sans = Archivo({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const INK = "#141414";
const PAPER = "#f5f3ef";
const DEEP = "#0f0f0f";
const GIFTBG = "#eeece7";
const GREY = "#7c7c78";

const MAPS =
  "https://maps.google.com/?q=Espa%C3%A7o+Jardim+das+Oliveiras,+Fortaleza";
const serifFamily = "var(--font-serif)";

const GUESTS = ["Carlos Martins", "Regina Martins", "Júlia Martins"];
const GIFTS = [
  { name: "Lua de mel em Paris", priceReais: 320 },
  { name: "Jantar de gala a dois", priceReais: 200 },
  { name: "Garrafa do nosso espumante", priceReais: 140 },
  { name: "Noite em hotel-boutique", priceReais: 260 },
  { name: "Ensaio fotográfico de casados", priceReais: 180 },
  { name: "Vinil da primeira dança", priceReais: 90 },
];
const SEED_MESSAGES = [
  {
    name: "CAMILA",
    when: "12.07",
    text: "Vocês dois em preto e branco: puro estilo. Mal posso esperar pela festa.",
  },
  {
    name: "DUDA",
    when: "08.07",
    text: "Reservei meu lugar na pista. Contem comigo do primeiro brinde ao último fogo.",
  },
];

function Head({ kicker, title }: { kicker: string; title: ReactNode }) {
  return (
    <div className="text-center mb-6">
      <div
        className="text-[9.5px] tracking-[0.34em] uppercase"
        style={{ color: "rgba(20,20,20,.55)" }}
      >
        {kicker}
      </div>
      <h2
        className="mt-3 text-[38px] font-medium tracking-[0.02em] uppercase leading-none"
        style={{ fontFamily: serifFamily }}
      >
        {title}
      </h2>
    </div>
  );
}

export default function EditorialTemplatePage() {
  return (
    <Suspense fallback={null}>
      <EditorialTemplateInner />
    </Suspense>
  );
}

function EditorialTemplateInner() {
  const [tier, setTier] = usePackageTier();
  const hasRsvp = tierIncludes(tier, "site");
  const hasGifts = tierIncludes(tier, "para-sempre");

  const s = useWeddingDemoState({
    storageKey: "tc-editorial",
    targetDate: DEMO_COUPLE.date,
    partyEndsAt: "2026-09-20T06:00:00-03:00",
    guests: GUESTS,
    gifts: GIFTS,
    seedMessages: SEED_MESSAGES,
  });

  return (
    <div className={`${sans.variable} ${serif.variable}`}>
      <TemplateChrome
        styleId="editorial"
        styleName="Editorial"
        outerBg={DEEP}
        cardBg={PAPER}
        ink={INK}
        accent={GREY}
        tier={tier}
        onTierChange={setTier}
      >
        <div style={{ fontFamily: "var(--font-sans)", color: INK }} className="text-[14px]">
          {/* 1. Capa / Save the Date */}
          <section className="px-6 pt-5 pb-12">
            <div
              className="flex justify-between items-center pb-4"
              style={{ borderBottom: "1px solid rgba(20,20,20,.16)" }}
            >
              <span className="text-[8.5px] tracking-[0.3em] uppercase" style={{ color: "rgba(20,20,20,.55)" }}>
                Nossa história
              </span>
              <span className="text-[17px] tracking-[0.08em]" style={{ fontFamily: serifFamily }}>
                Ana &amp; Pedro
              </span>
              <span
                className="text-[8.5px] tracking-[0.22em] uppercase px-2.5 py-1.5"
                style={{ border: "1px solid rgba(20,20,20,.4)" }}
              >
                RSVP
              </span>
            </div>

            <div className="mt-10 text-center">
              {/* Miniaturas e data em clamp(): em 320px, w-16 fixo dos dois
                  lados não deixava espaço pra "19 · 09 · 26" sem quebrar
                  linha (whitespace-nowrap) e a fileira estourava a página. */}
              <div className="flex items-center justify-center gap-3.5">
                <div className="w-[clamp(44px,14vw,64px)] shrink-0">
                  <PhotoSlot label="Foto" className="w-full aspect-[3/4]" />
                </div>
                <h1
                  className="text-[clamp(30px,11vw,46px)] font-medium leading-[0.92] tracking-[0.01em] whitespace-nowrap"
                  style={{ fontFamily: serifFamily }}
                >
                  19<span style={{ color: "rgba(20,20,20,.35)" }}> · </span>09
                  <span style={{ color: "rgba(20,20,20,.35)" }}> · </span>26
                </h1>
                <div className="w-[clamp(44px,14vw,64px)] shrink-0">
                  <PhotoSlot label="Foto" className="w-full aspect-[3/4]" />
                </div>
              </div>
              <div className="mt-5.5 mx-auto max-w-[250px]">
                <PhotoSlot label="Foto principal do casal — retrato 3:4" className="w-full aspect-[3/4]" />
              </div>
              <p
                className="mt-5.5 mx-auto max-w-[34ch] text-[10px] tracking-[0.24em] uppercase leading-[2]"
                style={{ color: "rgba(20,20,20,.62)" }}
              >
                Junte-se a nós em uma jornada de amor, alegria e felicidade
                eterna
              </p>
            </div>
          </section>

          {/* 2. Contagem regressiva (dark) */}
          <section className="relative overflow-hidden" style={{ background: INK }}>
            <div className="absolute inset-0 opacity-45">
              <PhotoSlot label="Foto de fundo — detalhe" className="w-full h-full" />
            </div>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(180deg,rgba(15,15,15,.72),rgba(15,15,15,.82))" }}
            />
            <div className="relative z-10 px-6 py-16 text-center" style={{ color: PAPER }}>
              <div className="text-[9.5px] tracking-[0.34em] uppercase" style={{ color: "rgba(245,243,239,.7)" }}>
                Que a contagem comece
              </div>
              <div className="mt-6 flex items-start justify-center">
                {[
                  ["dias", s.countdown.days],
                  ["horas", s.countdown.hours],
                  ["min", s.countdown.minutes],
                  ["seg", s.countdown.seconds],
                ].map(([label, value]) => (
                  <div key={label} className="flex-1 max-w-[88px]">
                    <div className="text-[52px] font-medium leading-[0.9]" style={{ fontFamily: serifFamily }}>
                      {value}
                    </div>
                    <div className="mt-2 text-[8.5px] tracking-[0.3em] uppercase" style={{ color: "rgba(245,243,239,.6)" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3. Nossa história */}
          <section className="px-6 py-16">
            <div className="text-center mb-2">
              <span className="text-[9px] tracking-[0.34em] uppercase" style={{ color: "rgba(20,20,20,.55)" }}>
                Capítulo um
              </span>
            </div>
            <h2
              className="text-center text-[40px] font-medium leading-none tracking-[0.01em] uppercase"
              style={{ fontFamily: serifFamily }}
            >
              Nossa
              <br />
              história
            </h2>
            <PhotoSlot label="Foto larga em P&B — 16:11" className="w-full aspect-[16/11] my-8" />
            <p
              className="text-center text-[22px] italic leading-[1.5]"
              style={{ fontFamily: serifFamily, color: "#1a1a1a" }}
            >
              &ldquo;Combinamos em preto e branco desde o primeiro café — e nunca
              mais desafinamos.&rdquo;
            </p>
            <p className="mt-6 text-center text-[14.5px] leading-[1.85]" style={{ color: "rgba(20,20,20,.75)" }}>
              Ana editava fotos; Pedro escrevia trilhas. Um projeto em comum
              virou madrugadas de conversa, e as madrugadas viraram uma vida
              inteira planejada a dois. Em setembro, assinamos o roteiro final.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3.5">
              <PhotoSlot label="Foto 4:5" className="w-full aspect-[4/5]" />
              <PhotoSlot label="Foto 4:5" className="w-full aspect-[4/5]" />
            </div>
          </section>

          {/* 4. Informações — roteiro (dark) + localização + dress code */}
          <section className="px-6 pt-16 pb-8" style={{ background: INK, color: PAPER }}>
            <div className="text-center">
              <div className="text-[9.5px] tracking-[0.34em] uppercase" style={{ color: "rgba(245,243,239,.6)" }}>
                Uma prévia de
              </div>
              <h2 className="mt-3 text-[36px] font-medium leading-[1.02] tracking-[0.01em] uppercase" style={{ fontFamily: serifFamily }}>
                O roteiro
                <br />
                do nosso dia
              </h2>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-y-6 gap-x-3">
              {[
                ["16h", "Cerimônia"],
                ["17h30", "Coquetel"],
                ["19h", "Jantar"],
                ["22h", "Pista & fogos"],
              ].map(([time, label]) => (
                <div key={label} className="text-center">
                  <div className="text-[27px] font-medium" style={{ fontFamily: serifFamily }}>
                    {time}
                  </div>
                  <div className="mt-1.5 text-[8.5px] tracking-[0.26em] uppercase" style={{ color: "rgba(245,243,239,.6)" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="px-6 pt-14 pb-8 text-center" style={{ background: PAPER }}>
            <h3 className="text-[32px] font-medium tracking-[0.04em] uppercase" style={{ fontFamily: serifFamily }}>
              Localização
            </h3>
            <div className="my-6 mx-auto max-w-[220px]">
              <PhotoSlot label="Foto do local — 3:4" className="w-full aspect-[3/4]" />
            </div>
            <div className="flex justify-between gap-4 max-w-[360px] mx-auto text-left">
              <div className="text-[10px] tracking-[0.2em] uppercase leading-[1.9]" style={{ color: "rgba(20,20,20,.7)" }}>
                Espaço Jardim
                <br />
                das Oliveiras
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase leading-[1.9] text-right" style={{ color: "rgba(20,20,20,.7)" }}>
                Eusébio
                <br />
                Fortaleza — CE
              </div>
            </div>
            <div className="mt-5.5 flex justify-center">
              <a
                href={MAPS}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9.5px] tracking-[0.24em] uppercase px-8 py-3.5 transition-opacity"
                style={{ background: INK, color: PAPER }}
              >
                Ver no mapa
              </a>
            </div>
          </section>
          <section className="px-6 pt-2 pb-16" style={{ background: PAPER }}>
            <div
              className="py-7 text-center"
              style={{
                borderTop: "1px solid rgba(20,20,20,.16)",
                borderBottom: "1px solid rgba(20,20,20,.16)",
              }}
            >
              <div className="text-[9.5px] tracking-[0.34em] uppercase" style={{ color: "rgba(20,20,20,.55)" }}>
                Dress code
              </div>
              <div className="mt-2 text-[30px] font-medium tracking-[0.02em] uppercase" style={{ fontFamily: serifFamily }}>
                Black tie opcional
              </div>
              <div className="mt-1.5 text-[12px] tracking-[0.06em]" style={{ color: "rgba(20,20,20,.62)" }}>
                tons neutros, preto e off-white são muito bem-vindos
              </div>
            </div>
          </section>

          {/* 5. RSVP — Site do Casamento */}
          {hasRsvp && (
            <section className="px-6 py-16">
              <div className="text-center mb-6">
                <div className="text-[9.5px] tracking-[0.34em] uppercase" style={{ color: "rgba(20,20,20,.55)" }}>
                  Confirme sua presença
                </div>
                <h2 className="mt-3 text-[40px] font-medium tracking-[0.02em] uppercase" style={{ fontFamily: serifFamily }}>
                  RSVP
                </h2>
                <p className="mt-4 mx-auto max-w-[36ch] text-[14px] leading-[1.7]" style={{ color: "rgba(20,20,20,.72)" }}>
                  Responda até <strong className="font-semibold">19 de agosto de 2026</strong>. Cada nome, uma cadeira reservada.
                </p>
              </div>

              {!s.confirmed ? (
                <div style={{ border: "1px solid rgba(20,20,20,.2)" }}>
                  <div className="px-4.5 py-3.5 text-[9px] tracking-[0.28em] uppercase" style={{ borderBottom: "1px solid rgba(20,20,20,.2)" }}>
                    Convite — Família Martins
                  </div>
                  <div className="px-4.5 pt-0.5">
                    {s.guests.map((guest) => {
                      const answer = s.rsvp[guest];
                      return (
                        <div
                          key={guest}
                          className="flex items-center justify-between gap-3 py-4"
                          style={{ borderBottom: "1px solid rgba(20,20,20,.12)" }}
                        >
                          <div
                            className="flex-1 text-[20px] font-medium"
                            style={{ fontFamily: serifFamily, textDecoration: answer === "no" ? "line-through" : "none" }}
                          >
                            {guest}
                          </div>
                          <div className="flex gap-1.5">
                            <RsvpBtn active={answer === "yes"} onClick={() => s.setAnswer(guest, "yes")} activeBg={INK}>
                              Vou
                            </RsvpBtn>
                            <RsvpBtn active={answer === "no"} onClick={() => s.setAnswer(guest, "no")} activeBg={GREY}>
                              Não
                            </RsvpBtn>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4.5">
                    <button
                      type="button"
                      onClick={s.confirm}
                      disabled={!s.canConfirm}
                      className="w-full text-[10px] tracking-[0.26em] uppercase py-4 transition-opacity disabled:opacity-45"
                      style={{ background: INK, color: PAPER, fontFamily: "var(--font-sans)" }}
                    >
                      Enviar confirmação
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-9 text-center" style={{ background: INK, color: PAPER }}>
                  <h3 className="text-[44px] font-medium tracking-[0.02em] uppercase" style={{ fontFamily: serifFamily }}>
                    Até lá
                  </h3>
                  <p className="mt-3.5 text-[14px] leading-[1.7]" style={{ color: "rgba(245,243,239,.82)" }}>
                    Confirmação recebida. Vai ser inesquecível — e você faz parte
                    disso.
                  </p>
                  <button
                    type="button"
                    onClick={s.editAnswers}
                    className="mt-4 text-[10px] tracking-[0.18em] uppercase underline underline-offset-4"
                    style={{ color: PAPER }}
                  >
                    ajustar resposta
                  </button>
                </div>
              )}
            </section>
          )}

          {/* 6. Lista de presentes — Para Sempre */}
          {hasGifts && (
            <section className="px-6 py-16" style={{ background: GIFTBG }}>
              <Head kicker="Se o coração pedir" title="Presentes" />
              <p className="mb-6 text-center text-[14px] leading-[1.7]" style={{ color: "rgba(20,20,20,.72)" }}>
                Sem faqueiro, sem lista de loja. Cada cota é um pedaço da nossa
                lua de mel — via Pix.
              </p>
              <div className="flex flex-col gap-3">
                {s.gifts.map((gift, i) => (
                  <div
                    key={gift.name}
                    className="flex items-center justify-between gap-3.5 px-4.5 py-4.5"
                    style={{ background: PAPER, border: "1px solid rgba(20,20,20,.16)" }}
                  >
                    <div className="flex-1">
                      <div className="text-[19px] font-medium leading-tight" style={{ fontFamily: serifFamily }}>
                        {gift.name}
                      </div>
                      <div className="mt-0.5 text-[11px] tracking-[0.14em] uppercase" style={{ color: "rgba(20,20,20,.6)" }}>
                        R$ {gift.priceReais}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => s.openGift(i)}
                      className="shrink-0 text-[9.5px] tracking-[0.18em] uppercase px-4 py-3 transition-opacity"
                      style={{ background: INK, color: PAPER, fontFamily: "var(--font-sans)" }}
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
            <section className="px-6 py-16">
              <Head kicker="Deixe registrado" title="Mural" />
              <div className="flex flex-col">
                {s.messages.map((msg, i) => (
                  <div key={`${msg.name}-${i}`} className="py-5.5" style={{ borderTop: "1px solid rgba(20,20,20,.16)" }}>
                    <p className="italic text-[19px] leading-[1.55]" style={{ fontFamily: serifFamily, color: "#1a1a1a" }}>
                      &ldquo;{msg.text}&rdquo;
                    </p>
                    <div className="mt-2.5 flex gap-2.5 items-baseline text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(20,20,20,.55)" }}>
                      <span className="font-medium" style={{ color: INK }}>{msg.name}</span>
                      <span>{msg.when}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(20,20,20,.16)" }}>
                <div className="text-[9px] tracking-[0.26em] uppercase" style={{ color: "rgba(20,20,20,.6)" }}>
                  Escreva para os noivos
                </div>
                <div className="mt-4 flex flex-col gap-4.5">
                  <input
                    aria-label="Seu nome"
                    type="text"
                    value={s.guestName}
                    onChange={(e) => s.setGuestName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-transparent text-[18px] px-0.5 py-2 focus:outline-none"
                    style={{ fontFamily: serifFamily, color: INK, borderBottom: "1px solid #141414" }}
                  />
                  <textarea
                    aria-label="Sua mensagem"
                    rows={3}
                    value={s.guestMessage}
                    onChange={(e) => s.setGuestMessage(e.target.value)}
                    placeholder="Sua mensagem"
                    className="w-full resize-y bg-transparent text-[18px] px-0.5 py-2 focus:outline-none"
                    style={{ fontFamily: serifFamily, color: INK, borderBottom: "1px solid #141414" }}
                  />
                  <div>
                    <button
                      type="button"
                      onClick={s.sendMessage}
                      className="text-[10px] tracking-[0.2em] uppercase px-6 py-3.5 transition-opacity"
                      style={{ background: INK, color: PAPER, fontFamily: "var(--font-sans)" }}
                    >
                      Publicar recado
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 8. Galeria pré-wedding + álbum — Para Sempre */}
          {hasGifts && (
            <>
              <section className="px-6 py-16">
                <Head kicker="Antes do grande dia" title="Pré-wedding" />
                <p className="mb-6 text-center mx-auto max-w-[34ch] text-[14px] leading-[1.7]" style={{ color: "rgba(20,20,20,.72)" }}>
                  Nosso ensaio e a contagem para o altar. Uma prévia dos
                  preparativos.
                </p>
                <PhotoSlot label="Ensaio pré-wedding — larga" className="w-full aspect-[16/10] mb-3" />
                <div className="grid grid-cols-3 gap-3">
                  <PhotoSlot label="Foto" className="w-full aspect-[3/4]" />
                  <PhotoSlot label="Foto" className="w-full aspect-[3/4]" />
                  <PhotoSlot label="Foto" className="w-full aspect-[3/4]" />
                </div>
              </section>

              <section className="px-6 py-16" style={{ background: INK, color: PAPER }}>
                {!s.albumUnlocked ? (
                  <div className="text-center">
                    <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(245,243,239,.55)" }}>
                      Depois da festa · álbum trancado
                    </div>
                    <div className="mt-4 flex justify-center" aria-hidden>
                      🔒
                    </div>
                    <h2 className="mt-4 text-[38px] font-medium leading-[1.02] tracking-[0.02em] uppercase" style={{ fontFamily: serifFamily }}>
                      As fotos
                      <br />
                      chegam em
                    </h2>
                    <div className="mt-2.5 text-[34px] font-medium tracking-[0.05em]" style={{ fontFamily: serifFamily }}>
                      20 · 09 · 26
                    </div>
                    <p className="mt-4.5 mx-auto max-w-[32ch] text-[13px] leading-[1.7]" style={{ color: "rgba(245,243,239,.68)" }}>
                      Aproveite a festa sem tela. Depois, volte aqui para reviver
                      tudo.
                    </p>
                    <button
                      type="button"
                      onClick={() => s.setAlbumPreview(true)}
                      className="mt-6 text-[10px] tracking-[0.16em] uppercase underline underline-offset-4"
                      style={{ color: PAPER }}
                    >
                      Ver prévia (demonstração) →
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-center mb-6.5">
                      <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(245,243,239,.55)" }}>
                        Depois da festa
                      </div>
                      <h2 className="mt-3 text-[38px] font-medium tracking-[0.02em] uppercase" style={{ fontFamily: serifFamily }}>
                        O álbum
                      </h2>
                    </div>
                    <PhotoSlot label="Foto da festa — larga" className="w-full aspect-[16/10] mb-3" />
                    <div className="grid grid-cols-2 gap-3">
                      {["Pista", "O brinde", "Padrinhos", "A saída"].map((label) => (
                        <PhotoSlot key={label} label={label} className="w-full aspect-square" />
                      ))}
                    </div>
                    {s.albumPreview && (
                      <div className="mt-3 text-center">
                        <button
                          type="button"
                          onClick={() => s.setAlbumPreview(false)}
                          className="text-[10px] tracking-[0.16em] uppercase underline underline-offset-4"
                          style={{ color: "rgba(245,243,239,.7)" }}
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
          <footer className="px-6 pt-14 pb-11 text-center" style={{ background: DEEP, color: PAPER }}>
            {/* clamp(): "#AnaEPedro" é uma palavra só, sem espaço pra
                quebrar linha — em 60px fixo não cabia em 320px de largura. */}
            <div className="text-[clamp(42px,17vw,60px)] font-medium leading-[0.9] tracking-[0.01em]" style={{ fontFamily: serifFamily }}>
              #AnaEPedro
            </div>
            <div className="mt-5.5 flex items-center justify-center gap-3.5 text-[9px] tracking-[0.24em] uppercase" style={{ color: "rgba(245,243,239,.6)" }}>
              <span>19 · 09 · 2026</span>
              <span className="inline-block rounded-full" style={{ width: 4, height: 4, background: "rgba(245,243,239,.5)" }} />
              <span>Fortaleza — CE</span>
            </div>
            <div className="mt-6 pt-4 text-[9px] tracking-[0.16em] uppercase" style={{ borderTop: "1px solid rgba(245,243,239,.2)", color: "rgba(245,243,239,.4)" }}>
              marque suas fotos · A &amp; P 2026
            </div>
          </footer>
        </div>
      </TemplateChrome>

      {/* Modal Pix */}
      {s.gift && (
        <div
          onClick={s.closeGift}
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          style={{ background: "rgba(10,10,10,.8)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] max-h-[90vh] overflow-y-auto"
            style={{ background: PAPER, border: `1px solid ${INK}` }}
          >
            <div className="flex justify-between items-center px-4.5 py-3.5" style={{ borderBottom: `1px solid ${INK}` }}>
              <span className="text-[9px] tracking-[0.24em] uppercase">Pix — presente</span>
              <button type="button" onClick={s.closeGift} aria-label="Fechar" className="text-[17px] leading-none p-1">
                ×
              </button>
            </div>
            <div className="px-4.5 py-5.5 text-left" style={{ color: INK }}>
              <div className="text-[24px] font-medium leading-tight" style={{ fontFamily: serifFamily }}>
                {s.gift.name}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.14em] uppercase" style={{ color: "rgba(20,20,20,.6)" }}>
                R$ {s.gift.priceReais}
              </div>
              <div className="mt-4 flex justify-center bg-white p-3" style={{ border: "1px solid rgba(20,20,20,.18)" }}>
                <FakeQrCanvas seed={s.gift.name} ink={INK} size={168} />
              </div>
              <div className="mt-4 text-[9px] tracking-[0.26em] uppercase" style={{ color: "rgba(20,20,20,.6)" }}>
                Pix copia e cola
              </div>
              <div
                className="mt-1.5 font-mono text-[10px] leading-[1.55] break-all bg-white p-2.5 max-h-[72px] overflow-y-auto"
                style={{ border: "1px solid rgba(20,20,20,.18)", color: "#3a3a38" }}
              >
                {buildDemoPixCode(s.gift.priceReais)}
              </div>
              <button
                type="button"
                onClick={() => s.copyPixCode(buildDemoPixCode(s.gift!.priceReais))}
                className="mt-3 w-full text-[10px] tracking-[0.22em] uppercase py-4 transition-opacity"
                style={{ background: INK, color: PAPER, fontFamily: "var(--font-sans)" }}
              >
                {s.copied ? "Copiado ✓" : "Copiar código"}
              </button>
              <p className="mt-3 text-[11.5px] leading-[1.6]" style={{ color: "rgba(20,20,20,.6)" }}>
                Caiu o Pix, seu nome entra na lista de agradecimentos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RsvpBtn({
  active,
  onClick,
  activeBg,
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeBg: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[9.5px] tracking-[0.16em] uppercase px-3.5 py-2.5 transition-colors"
      style={{
        fontFamily: "var(--font-sans)",
        background: active ? activeBg : "transparent",
        color: active ? PAPER : INK,
        border: `1px solid ${active ? activeBg : "rgba(20,20,20,.4)"}`,
      }}
    >
      {children}
    </button>
  );
}
