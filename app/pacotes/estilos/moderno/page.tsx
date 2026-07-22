"use client";

import { Suspense } from "react";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import TemplateChrome from "@/components/templates/TemplateChrome";
import PhotoSlot from "@/components/templates/PhotoSlot";
import FakeQrCanvas from "@/components/templates/FakeQrCanvas";
import { useWeddingDemoState } from "@/components/templates/useWeddingDemoState";
import { usePackageTier } from "@/components/templates/usePackageTier";
import { buildDemoPixCode } from "@/lib/demoPix";
import { DEMO_COUPLE, tierIncludes } from "@/lib/packages";

const display = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const ACCENT = "#bd5b32";

const GUESTS = ["Carlos Martins", "Regina Martins", "Júlia Martins"];
const GIFTS = [
  { name: "Lua de mel: diária em Jeri", priceReais: 300 },
  { name: "Jantar japonês (o do pedido)", priceReais: 180 },
  { name: "Vinho da primeira noite", priceReais: 120 },
  { name: "Assinatura de café especial", priceReais: 90 },
  { name: "Prancha de surf pro Pedro", priceReais: 250 },
  { name: "Kit ressaca pós-festa", priceReais: 70 },
];
const SEED_MESSAGES = [
  {
    name: "Camila, da facul",
    when: "12.07",
    text: "Finalmente! Achei que ia ter que pedir a mão de vocês eu mesma.",
  },
  {
    name: "Duda",
    when: "08.07",
    text: "Já reservei meu lugar na pista. Não me decepcionem com a playlist.",
  },
];

export default function ModernoTemplatePage() {
  return (
    <Suspense fallback={null}>
      <ModernoTemplateInner />
    </Suspense>
  );
}

function ModernoTemplateInner() {
  const [tier, setTier] = usePackageTier();
  const hasRsvp = tierIncludes(tier, "site");
  const hasGifts = tierIncludes(tier, "para-sempre");

  const s = useWeddingDemoState({
    storageKey: "tc-demo-moderno",
    targetDate: DEMO_COUPLE.date,
    partyEndsAt: "2026-09-20T06:00:00-03:00",
    guests: GUESTS,
    gifts: GIFTS,
    seedMessages: SEED_MESSAGES,
  });

  return (
    <div className={`${display.variable} ${mono.variable}`}>
      <TemplateChrome
        styleName="Moderno"
        outerBg="#e9e8e4"
        cardBg="#fafafa"
        ink="#1c1c1c"
        accent={ACCENT}
        tier={tier}
        onTierChange={setTier}
      >
        <div className="font-[family-name:var(--font-display)] text-[#1c1c1c]">
          {/* 1. Capa / Save the Date */}
          <section>
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-[#1c1c1c] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em]">
              <span className="font-medium">A&amp;P</span>
              <span>FORTALEZA — CE</span>
            </div>

            <div className="pt-8 px-5 flex gap-2.5">
              <h1 className="m-0 flex-1 font-black text-[80px] sm:text-[96px] leading-[0.88] tracking-[-0.035em] uppercase">
                Ana
                <span
                  className="block text-[50px] sm:text-[60px] leading-[0.95]"
                  style={{ color: ACCENT }}
                >
                  &amp;
                </span>
                Pedro
              </h1>
              <div className="flex items-end pb-1">
                <span
                  className="text-[10px] tracking-[0.3em] text-[#1c1c1c]/55"
                  style={{ writingMode: "vertical-rl" }}
                >
                  DESDE 2019
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline gap-3 px-5 pt-5 pb-4">
              <div className="font-extrabold text-3xl tracking-[-0.02em]">
                19.09.2026
              </div>
              <div className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.12em] text-right leading-relaxed">
                16H
                <br />
                ESPAÇO JARDIM DAS OLIVEIRAS
              </div>
            </div>

            <PhotoSlot label="Foto do casal, sangrada" className="aspect-[4/5] w-full" />

            <div className="flex justify-between px-5 py-3 border-b border-[#1c1c1c] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em]">
              <span>SAVE THE DATE</span>
              <span style={{ color: ACCENT }}>↓ ROLE</span>
            </div>
          </section>

          {/* 2. Contagem regressiva */}
          <section className="px-5 pt-10 pb-12">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="font-[family-name:var(--font-mono)] text-[11px]"
                style={{ color: ACCENT }}
              >
                02
              </span>
              <div className="flex-1 h-px bg-[#1c1c1c]" />
              <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.2em]">
                CONTAGEM
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <div
                className="font-black text-[96px] sm:text-[124px] leading-[0.85] tracking-[-0.04em] tabular-nums"
                style={{ color: ACCENT }}
              >
                {s.countdown.days}
              </div>
              <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.28em]">
                DIAS
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 border-y border-[#1c1c1c]">
              {[
                ["HORAS", s.countdown.hours],
                ["MIN", s.countdown.minutes],
                ["SEG", s.countdown.seconds],
              ].map(([label, value], i) => (
                <div
                  key={label}
                  className={`py-4 text-center ${i < 2 ? "border-r border-[#1c1c1c]/25" : ""}`}
                >
                  <div className="font-extrabold text-4xl leading-none tracking-[-0.02em] tabular-nums">
                    {value}
                  </div>
                  <div className="mt-1.5 font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.26em] text-[#1c1c1c]/60">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] text-[#1c1c1c]/55">
              ATÉ O &ldquo;SIM&rdquo; — 19.09.2026, 16H
            </div>
          </section>

          {/* 3. Nossa história */}
          <section className="pt-2 pb-14">
            <div className="flex items-center gap-3 mx-5 mb-6">
              <span
                className="font-[family-name:var(--font-mono)] text-[11px]"
                style={{ color: ACCENT }}
              >
                03
              </span>
              <div className="flex-1 h-px bg-[#1c1c1c]" />
              <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.2em]">
                NOSSA HISTÓRIA
              </span>
            </div>

            <h2 className="mx-5 font-black text-[38px] leading-[0.95] tracking-[-0.03em] uppercase">
              A fila do
              <br />
              pastel
              <span style={{ color: ACCENT }}>.</span>
            </h2>

            <p className="mx-5 mt-5 text-[15px] leading-relaxed text-[#1c1c1c]/90">
              {DEMO_COUPLE.story}
            </p>

            <div className="mt-7">
              <PhotoSlot label="Foto larga, sangrada" className="aspect-[16/10] w-full" />
              <div className="flex justify-between px-5 pt-2.5 font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.18em] text-[#1c1c1c]/60">
                <span>FIG. 01</span>
                <span>A FILA DO PASTEL, 2019</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3.5 px-5 items-start">
              <figure className="mt-8 mb-0">
                <PhotoSlot label="Foto 3:4" className="aspect-[3/4] w-full" />
                <figcaption className="mt-2 font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.18em] text-[#1c1c1c]/60">
                  O SIM — 2025
                </figcaption>
              </figure>
              <figure className="m-0">
                <PhotoSlot label="Foto 3:4" className="aspect-[3/4] w-full" />
                <figcaption className="mt-2 font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.18em] text-[#1c1c1c]/60">
                  FITA, A CACHORRA
                </figcaption>
              </figure>
            </div>

            <div
              className="mx-5 mt-8 pl-4 border-l-[3px]"
              style={{ borderColor: ACCENT }}
            >
              <div className="font-bold text-xl leading-snug tracking-[-0.01em]">
                &ldquo;Nenhuma vontade de terminar a conversa.&rdquo;
              </div>
            </div>
          </section>

          {/* 4. Informações */}
          <section className="px-5 pt-2 pb-14">
            <div className="flex items-center gap-3 mb-1.5">
              <span
                className="font-[family-name:var(--font-mono)] text-[11px]"
                style={{ color: ACCENT }}
              >
                04
              </span>
              <div className="flex-1 h-px bg-[#1c1c1c]" />
              <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.2em]">
                O DIA
              </span>
            </div>

            {[
              {
                time: "16H",
                label: "CERIMÔNIA",
                title: DEMO_COUPLE.venue,
                text: "Rua das Oliveiras, 120 · Eusébio, Fortaleza — CE. Portões abertos a partir das 15h15.",
                cta: "VER NO MAPA →",
                border: "border-b border-[#1c1c1c]/25",
              },
              {
                time: "18H",
                label: "FESTA",
                title: "No mesmo lugar, sem pressa",
                text: "Jantar, brindes e forró depois das 22h — traga sapato confortável.",
                cta: "COMO CHEGAR →",
                border: "border-b border-[#1c1c1c]/25",
              },
              {
                time: "DRESS",
                label: "TRAJE",
                title: "Esporte fino, sem sofrimento",
                text: "Vai ser num jardim: salto fino afunda na grama. Considere-se avisada.",
                cta: null,
                border: "border-b border-[#1c1c1c]",
              },
            ].map((row) => (
              <div
                key={row.label}
                className={`grid grid-cols-[76px_1fr] gap-3.5 py-5 ${row.border}`}
              >
                <div className="font-extrabold text-2xl tracking-[-0.02em]">
                  {row.time}
                </div>
                <div>
                  <div
                    className="font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.26em]"
                    style={{ color: ACCENT }}
                  >
                    {row.label}
                  </div>
                  <div className="mt-1.5 font-bold text-[16.5px]">
                    {row.title}
                  </div>
                  <div className="mt-1 text-[13.5px] leading-relaxed text-[#1c1c1c]/70">
                    {row.text}
                  </div>
                  {row.cta && (
                    <a
                      href="https://maps.google.com/?q=Espa%C3%A7o+Jardim+das+Oliveiras,+Fortaleza"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2.5 font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] text-[#1c1c1c] underline underline-offset-4 hover:text-[#bd5b32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd5b32]"
                    >
                      {row.cta}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* 5. RSVP — a partir do pacote Site do Casamento */}
          {hasRsvp && (
          <section className="px-5 pt-2 pb-14">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="font-[family-name:var(--font-mono)] text-[11px]"
                style={{ color: ACCENT }}
              >
                05
              </span>
              <div className="flex-1 h-px bg-[#1c1c1c]" />
              <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.2em]">
                RSVP
              </span>
            </div>

            <h2 className="font-black text-[34px] leading-[0.95] tracking-[-0.03em] uppercase">
              Você vai
              <span style={{ color: ACCENT }}>?</span>
            </h2>
            <p className="mt-3.5 text-[14.5px] leading-relaxed text-[#1c1c1c]/80">
              Confirme até <strong>19.08.2026</strong>. Sem resposta, a gente
              liga cobrando.
            </p>

            {!s.confirmed ? (
              <div className="mt-6 border border-[#1c1c1c]">
                <div className="px-4 py-3 border-b border-[#1c1c1c] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em]">
                  CONVITE — FAMÍLIA MARTINS
                </div>
                <div className="px-4 pt-1">
                  {s.guests.map((guest) => {
                    const answer = s.rsvp[guest];
                    return (
                      <div
                        key={guest}
                        className="flex items-center justify-between gap-3 py-3.5 border-b border-[#1c1c1c]/15"
                      >
                        <div
                          className={`flex-1 font-bold text-[15.5px] ${answer === "no" ? "line-through" : ""}`}
                        >
                          {guest}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => s.setAnswer(guest, "yes")}
                            className={`font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] px-3.5 py-2.5 border transition-colors hover:border-[#1c1c1c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd5b32] ${
                              answer === "yes"
                                ? "bg-[#1c1c1c] border-[#1c1c1c] text-[#fafafa]"
                                : "border-[#1c1c1c]/40 text-[#1c1c1c]"
                            }`}
                          >
                            VOU
                          </button>
                          <button
                            type="button"
                            onClick={() => s.setAnswer(guest, "no")}
                            className={`font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] px-3.5 py-2.5 border transition-colors hover:border-[#1c1c1c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd5b32] ${
                              answer === "no"
                                ? "text-[#fafafa]"
                                : "border-[#1c1c1c]/40 text-[#1c1c1c]"
                            }`}
                            style={
                              answer === "no"
                                ? { background: ACCENT, borderColor: ACCENT }
                                : undefined
                            }
                          >
                            NÃO
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4">
                  <button
                    type="button"
                    onClick={s.confirm}
                    disabled={!s.canConfirm}
                    className="w-full font-[family-name:var(--font-mono)] bg-[#1c1c1c] text-[#fafafa] text-[11px] tracking-[0.22em] py-4 border border-[#1c1c1c] transition-colors hover:bg-[#bd5b32] hover:border-[#bd5b32] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd5b32]"
                  >
                    CONFIRMAR →
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 border border-[#1c1c1c] px-5 py-7">
                <div
                  className="font-black text-[44px] leading-[0.9] tracking-[-0.03em] uppercase"
                  style={{ color: ACCENT }}
                >
                  Até lá!
                </div>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#1c1c1c]/80">
                  Resposta anotada. Agora é só escolher a roupa e treinar o
                  forró.
                </p>
                <button
                  type="button"
                  onClick={s.editAnswers}
                  className="mt-3.5 font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] text-[#1c1c1c] underline underline-offset-4 hover:text-[#bd5b32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd5b32]"
                >
                  AJUSTAR RESPOSTA
                </button>
              </div>
            )}
          </section>
          )}

          {/* 6. Lista de presentes — só no Para Sempre */}
          {hasGifts && (
          <section className="px-5 pt-2 pb-14">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="font-[family-name:var(--font-mono)] text-[11px]"
                style={{ color: ACCENT }}
              >
                06
              </span>
              <div className="flex-1 h-px bg-[#1c1c1c]" />
              <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.2em]">
                PRESENTES
              </span>
            </div>

            <h2 className="font-black text-[34px] leading-[0.95] tracking-[-0.03em] uppercase">
              Quer mimar
              <br />a gente
              <span style={{ color: ACCENT }}>?</span>
            </h2>
            <p className="mt-3.5 mb-6 text-[14.5px] leading-relaxed text-[#1c1c1c]/80">
              Nada de faqueiro. A lista é a nossa lua de mel, em cotas — via
              Pix, sem burocracia.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {s.gifts.map((gift, i) => (
                <div
                  key={gift.name}
                  className="border border-[#1c1c1c] px-3.5 py-4 flex flex-col gap-2.5 bg-[#fafafa] transition-all hover:bg-[#f1efe9] hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{ boxShadow: "none" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow = `4px 4px 0 ${ACCENT}`)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div className="font-bold text-[15px] leading-tight tracking-[-0.01em] min-h-[56px]">
                    {gift.name}
                  </div>
                  <div className="font-[family-name:var(--font-mono)] text-xs text-[#1c1c1c]/70">
                    R$ {gift.priceReais}
                  </div>
                  <button
                    type="button"
                    onClick={() => s.openGift(i)}
                    className="font-[family-name:var(--font-mono)] bg-[#1c1c1c] text-[#fafafa] text-[10px] tracking-[0.18em] py-2.5 border border-[#1c1c1c] transition-colors hover:bg-[#bd5b32] hover:border-[#bd5b32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd5b32]"
                  >
                    PRESENTEAR
                  </button>
                </div>
              ))}
            </div>
          </section>
          )}

          {/* 7. Mural de recados — a partir do pacote Site do Casamento */}
          {hasRsvp && (
          <section className="px-5 pt-2 pb-14">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="font-[family-name:var(--font-mono)] text-[11px]"
                style={{ color: ACCENT }}
              >
                07
              </span>
              <div className="flex-1 h-px bg-[#1c1c1c]" />
              <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.2em]">
                MURAL
              </span>
            </div>

            <h2 className="font-black text-[34px] leading-[0.95] tracking-[-0.03em] uppercase">
              Deixa registrado
              <span style={{ color: ACCENT }}>.</span>
            </h2>

            <div className="mt-4.5 flex flex-col">
              {s.messages.map((msg, i) => (
                <div
                  key={`${msg.name}-${i}`}
                  className="py-5 border-b border-[#1c1c1c]/20"
                >
                  <div
                    className="font-black text-3xl leading-[0.5]"
                    style={{ color: ACCENT }}
                  >
                    &ldquo;
                  </div>
                  <p className="mt-1.5 text-[15.5px] leading-snug tracking-[-0.005em] text-[#1c1c1c]/90">
                    {msg.text}
                  </p>
                  <div className="mt-2.5 flex gap-2.5 items-baseline font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.18em] text-[#1c1c1c]/55">
                    <span className="text-[#1c1c1c]">
                      {msg.name.toUpperCase()}
                    </span>
                    <span>{msg.when.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] text-[#1c1c1c]/60">
                ESCREVE AÍ:
              </div>
              <div className="mt-3.5 flex flex-col gap-4.5">
                <input
                  aria-label="Seu nome"
                  type="text"
                  value={s.guestName}
                  onChange={(e) => s.setGuestName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full font-[family-name:var(--font-display)] text-[15px] font-medium text-[#1c1c1c] bg-transparent border-0 border-b border-[#1c1c1c] px-0.5 py-2.5 focus:outline-none focus:border-b-2 focus:border-[#bd5b32]"
                />
                <textarea
                  aria-label="Sua mensagem"
                  rows={3}
                  value={s.guestMessage}
                  onChange={(e) => s.setGuestMessage(e.target.value)}
                  placeholder="Seu recado (pode ser curto, pode ser piegas)"
                  className="w-full resize-y font-[family-name:var(--font-display)] text-[15px] font-medium text-[#1c1c1c] bg-transparent border-0 border-b border-[#1c1c1c] px-0.5 py-2.5 focus:outline-none focus:border-b-2 focus:border-[#bd5b32]"
                />
                <div>
                  <button
                    type="button"
                    onClick={s.sendMessage}
                    className="font-[family-name:var(--font-mono)] bg-[#1c1c1c] text-[#fafafa] text-[10.5px] tracking-[0.2em] px-6 py-3.5 border border-[#1c1c1c] transition-colors hover:bg-[#bd5b32] hover:border-[#bd5b32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd5b32]"
                  >
                    PUBLICAR →
                  </button>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* 8. Álbum pós-festa — só no Para Sempre */}
          {hasGifts && (
          <section className="pt-2">
            <div className="flex items-center gap-3 mx-5 mb-5.5">
              <span
                className="font-[family-name:var(--font-mono)] text-[11px]"
                style={{ color: ACCENT }}
              >
                08
              </span>
              <div className="flex-1 h-px bg-[#1c1c1c]" />
              <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.2em]">
                PÓS-FESTA
              </span>
            </div>

            {!s.albumUnlocked ? (
              <div className="bg-[#1c1c1c] text-[#fafafa] px-5 pt-12 pb-13">
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.26em] text-[#fafafa]/60">
                  ÁLBUM TRANCADO
                </div>
                <div className="mt-3.5 font-black text-[38px] sm:text-[44px] leading-[0.92] tracking-[-0.03em] uppercase">
                  As fotos
                  <br />
                  chegam em
                </div>
                <div
                  className="mt-2.5 font-black text-[44px] sm:text-[52px] leading-[0.9] tracking-[-0.03em]"
                  style={{ color: ACCENT }}
                >
                  20.09.26
                </div>
                <p className="mt-4.5 text-sm leading-relaxed text-[#fafafa]/70 max-w-[34ch]">
                  Curta a festa sem pensar no feed. Depois, volte aqui para
                  rever tudo — inclusive o forró.
                </p>
                <button
                  type="button"
                  onClick={() => s.setAlbumPreview(true)}
                  className="mt-6 font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] text-[#fafafa] underline underline-offset-4 hover:text-[#bd5b32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd5b32]"
                >
                  VER PRÉVIA (DEMONSTRAÇÃO) →
                </button>
              </div>
            ) : (
              <div className="pb-2">
                <PhotoSlot label="Foto da festa, larga" className="aspect-[16/10] w-full" />
                <div className="mt-3 grid grid-cols-2 gap-3 px-5">
                  {["Pista lotada", "O brinde", "Os padrinhos", "A saída"].map(
                    (label) => (
                      <PhotoSlot
                        key={label}
                        label={label}
                        className="aspect-square w-full"
                      />
                    )
                  )}
                </div>
                <div className="mt-3 px-5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] text-[#1c1c1c]/55">
                  ARRASTE AS MELHORES PRA CÁ →
                </div>
                {s.albumPreview && (
                  <div className="mt-3 px-5">
                    <button
                      type="button"
                      onClick={() => s.setAlbumPreview(false)}
                      className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] text-[#1c1c1c]/60 underline underline-offset-4 hover:text-[#bd5b32]"
                    >
                      VOLTAR AO ESTADO BLOQUEADO
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
          )}

          {/* 9. Rodapé */}
          <footer className="bg-[#1c1c1c] text-[#fafafa] px-5 pt-11 pb-9 -mt-px">
            <div className="font-black text-[38px] sm:text-[44px] leading-[0.9] tracking-[-0.035em] uppercase break-words">
              #AnaEPedro
              <span style={{ color: ACCENT }}>26</span>
            </div>
            <div className="mt-3.5 flex justify-between gap-2.5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] text-[#fafafa]/65">
              <span>19.09.2026</span>
              <span>FORTALEZA — CE</span>
            </div>
            <div className="mt-6.5 pt-3.5 border-t border-[#fafafa]/25 flex justify-between gap-2.5 font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.14em] text-[#fafafa]/45">
              <span>MARQUE SUAS FOTOS</span>
              <span>A&amp;P — 2026</span>
            </div>
          </footer>
        </div>
      </TemplateChrome>

      {s.gift && (
        <div
          onClick={s.closeGift}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#141414]/78 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] max-h-[90vh] overflow-y-auto bg-[#fafafa] border border-[#1c1c1c]"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-[#1c1c1c]">
              <span
                className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em]"
                style={{ color: ACCENT }}
              >
                PIX — PRESENTE
              </span>
              <button
                type="button"
                onClick={s.closeGift}
                aria-label="Fechar"
                className="text-[17px] text-[#1c1c1c] p-1 leading-none hover:text-[#bd5b32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd5b32]"
              >
                ×
              </button>
            </div>
            <div className="px-4 py-5 text-left font-[family-name:var(--font-display)] text-[#1c1c1c]">
              <div className="font-extrabold text-xl leading-snug tracking-[-0.02em]">
                {s.gift.name}
              </div>
              <div className="mt-1 font-[family-name:var(--font-mono)] text-[13px] text-[#1c1c1c]/70">
                R$ {s.gift.priceReais}
              </div>

              <div className="mt-4 flex justify-center border border-[#1c1c1c]/20 p-3 bg-white">
                <FakeQrCanvas seed={s.gift.name} ink="#141414" size={168} />
              </div>

              <div className="mt-4 font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.24em] text-[#1c1c1c]/60">
                PIX COPIA E COLA
              </div>
              <div className="mt-1.5 font-[family-name:var(--font-mono)] text-[10px] leading-relaxed break-all bg-white border border-[#1c1c1c]/20 p-2.5 text-[#3a3a36] max-h-[72px] overflow-y-auto">
                {buildDemoPixCode(s.gift.priceReais)}
              </div>

              <button
                type="button"
                onClick={() => s.copyPixCode(buildDemoPixCode(s.gift!.priceReais))}
                className="mt-3 w-full font-[family-name:var(--font-mono)] bg-[#1c1c1c] text-[#fafafa] text-[10.5px] tracking-[0.2em] py-3.5 border border-[#1c1c1c] transition-colors hover:bg-[#bd5b32] hover:border-[#bd5b32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd5b32]"
              >
                {s.copied ? "COPIADO ✓" : "COPIAR CÓDIGO"}
              </button>
              <p className="mt-3 text-xs leading-relaxed text-[#1c1c1c]/60">
                Caiu o Pix, seu nome entra na lista de agradecimentos. Simples
                assim.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
