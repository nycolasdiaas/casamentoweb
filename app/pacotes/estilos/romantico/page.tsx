"use client";

import { Suspense } from "react";
import { Great_Vibes, Lora } from "next/font/google";
import TemplateChrome from "@/components/templates/TemplateChrome";
import PhotoSlot from "@/components/templates/PhotoSlot";
import FakeQrCanvas from "@/components/templates/FakeQrCanvas";
import { useWeddingDemoState } from "@/components/templates/useWeddingDemoState";
import { usePackageTier } from "@/components/templates/usePackageTier";
import { buildDemoPixCode } from "@/lib/demoPix";
import { DEMO_COUPLE, tierIncludes } from "@/lib/packages";

const script = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});
const body = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
});

const GUESTS = ["Carlos Martins", "Regina Martins", "Júlia Martins"];
const GIFTS = [
  { name: "Café da manhã na cama", priceReais: 80 },
  { name: "Piquenique ao pôr do sol", priceReais: 140 },
  { name: "Uma noite na pousada do campo", priceReais: 260 },
  { name: "Sessão de fotos na lua de mel", priceReais: 200 },
  { name: "Mudas para o nosso jardim", priceReais: 100 },
  { name: "Dança da primeira chuva", priceReais: 60 },
];
const SEED_MESSAGES = [
  {
    name: "Tia Regina",
    when: "12 de julho",
    text: "Que o amor de vocês floresça em todas as estações — e que o bolo seja o meu, claro.",
  },
  {
    name: "Bia, madrinha",
    when: "8 de julho",
    text: "Ana, você sempre sonhou com um casamento no jardim. Ver esse sonho de pé me emociona.",
  },
];

function Branch() {
  return (
    <div className="flex justify-center py-2.5">
      <svg width="150" height="26" viewBox="0 0 150 26" fill="none" aria-hidden>
        <path d="M10 13 H 62 M88 13 H 140" stroke="#d9a3ae" strokeWidth="1" />
        <path d="M68 13 q 3 -7 7 -9 q 1 6 -4 9 z" fill="#a8b89a" />
        <path d="M82 13 q -3 -7 -7 -9 q -1 6 4 9 z" fill="#a8b89a" />
        <circle cx="75" cy="15" r="3.2" fill="#d9a3ae" />
        <circle cx="75" cy="15" r="1.3" fill="#b96a78" />
      </svg>
    </div>
  );
}

function DotDivider() {
  return (
    <div className="mt-3.5 mx-auto flex items-center justify-center gap-2.5">
      <div className="w-11 h-px bg-[#d9a3ae]" />
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <circle cx="6" cy="6" r="2.8" fill="#d9a3ae" />
      </svg>
      <div className="w-11 h-px bg-[#d9a3ae]" />
    </div>
  );
}

export default function RomanticoTemplatePage() {
  return (
    <Suspense fallback={null}>
      <RomanticoTemplateInner />
    </Suspense>
  );
}

function RomanticoTemplateInner() {
  const [tier, setTier] = usePackageTier();
  const hasRsvp = tierIncludes(tier, "site");
  const hasGifts = tierIncludes(tier, "para-sempre");

  const s = useWeddingDemoState({
    storageKey: "tc-demo-romantico",
    targetDate: DEMO_COUPLE.date,
    partyEndsAt: "2026-09-20T06:00:00-03:00",
    guests: GUESTS,
    gifts: GIFTS,
    seedMessages: SEED_MESSAGES,
  });

  return (
    <div className={`${script.variable} ${body.variable}`}>
      <TemplateChrome
        styleId="romantico"
        styleName="Romântico"
        outerBg="#6d3f49"
        cardBg="#fdf2f4"
        ink="#7c4a55"
        accent="#d9a3ae"
        tier={tier}
        onTierChange={setTier}
      >
        <div className="font-[family-name:var(--font-body)] text-[#7c4a55]">
          {/* 1. Capa / Save the Date */}
          <section className="relative px-6.5 pt-13 pb-12 overflow-hidden">
            <svg
              width="190"
              height="190"
              viewBox="0 0 190 190"
              fill="none"
              aria-hidden
              className="absolute -top-9 -left-10 opacity-50"
            >
              <path
                d="M20 170 C 40 120, 60 90, 110 60"
                stroke="#a8b89a"
                strokeWidth="1.6"
                fill="none"
              />
              <path d="M48 132 q -16 -4 -20 -20 q 18 0 20 20" fill="#c3d0b6" />
              <path d="M66 110 q -18 -2 -24 -18 q 19 -1 24 18" fill="#a8b89a" />
              <path d="M88 88 q -14 -8 -14 -24 q 16 4 14 24" fill="#c3d0b6" />
              <circle cx="112" cy="58" r="9" fill="#d9a3ae" />
              <circle cx="112" cy="58" r="4" fill="#b96a78" />
              <circle cx="130" cy="78" r="6.5" fill="#e7bcc4" />
              <circle cx="96" cy="42" r="5" fill="#e7bcc4" />
            </svg>

            <div className="relative text-center">
              <div className="text-[11px] tracking-[0.34em] uppercase text-[#b96a78]">
                Com a bênção de suas famílias
              </div>

              <h1 className="mt-4.5 font-[family-name:var(--font-script)] font-normal text-[56px] sm:text-[64px] leading-[1.02] text-[#7c4a55]">
                Ana
                <span className="block text-[30px] sm:text-[34px] text-[#d9a3ae] leading-none">
                  e
                </span>
                Pedro
              </h1>

              <DotDivider />

              <p className="mt-4.5 italic text-[15px] leading-relaxed text-[#7c4a55]/85">
                convidam você para celebrar
                <br />o dia do seu &ldquo;sim&rdquo;
              </p>

              <div className="mt-6.5 mx-auto w-[220px] sm:w-[236px] relative">
                <div className="absolute -inset-2.5 border border-[#d9a3ae] rounded-[50%/38%]" />
                <PhotoSlot
                  label="Foto do casal, moldura oval"
                  className="w-full aspect-[236/300] rounded-[50%/38%]"
                />
              </div>

              <div className="mt-7 text-[11px] tracking-[0.3em] uppercase text-[#7c4a55]/70">
                Sábado · 16h
              </div>
              <div className="mt-2 font-[family-name:var(--font-script)] text-[34px] sm:text-[37px] leading-tight text-[#7c4a55]">
                19 de setembro de 2026
              </div>
              <div className="mt-2.5 text-sm italic text-[#7c4a55]/85">
                {DEMO_COUPLE.venue} · {DEMO_COUPLE.city}
              </div>
            </div>
          </section>

          <Branch />

          {/* 2. Contagem regressiva */}
          <section className="px-6.5 pt-11 pb-13 bg-[#fbe9ec]">
            <div className="text-center mb-6.5">
              <div className="font-[family-name:var(--font-script)] text-4xl leading-tight text-[#b96a78]">
                Falta pouco…
              </div>
              <div className="mt-2 text-[11px] tracking-[0.3em] uppercase text-[#7c4a55]/65">
                para o nosso pôr do sol
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["dias", s.countdown.days],
                ["horas", s.countdown.hours],
                ["minutos", s.countdown.minutes],
                ["segundos", s.countdown.seconds],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-[#fdf2f4] border border-[#ecc9d0] rounded-[70px] py-5.5 px-2 text-center"
                >
                  <div className="font-[family-name:var(--font-body)] font-medium text-[38px] leading-none tabular-nums text-[#7c4a55]">
                    {value}
                  </div>
                  <div className="mt-1.5 text-[10px] tracking-[0.3em] uppercase text-[#b96a78]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Nossa história */}
          <section className="px-6.5 pt-14 pb-15">
            <div className="text-center mb-6">
              <div className="font-[family-name:var(--font-script)] text-[44px] leading-tight text-[#7c4a55]">
                Nossa história
              </div>
              <DotDivider />
            </div>

            <p className="text-center text-[15.5px] leading-[1.8] text-[#7c4a55]/90">
              {DEMO_COUPLE.story}
            </p>

            <div className="mt-8 mx-auto w-[230px] sm:w-[250px] relative">
              <div className="absolute -inset-2.5 border border-[#d9a3ae] rounded-[50%/38%]" />
              <svg
                width="64"
                height="40"
                viewBox="0 0 64 40"
                aria-hidden
                className="absolute -top-6.5 left-1/2 -translate-x-1/2 z-10"
              >
                <path
                  d="M6 30 Q 20 20 32 20 Q 44 20 58 30"
                  stroke="#a8b89a"
                  strokeWidth="1.4"
                  fill="none"
                />
                <circle cx="32" cy="18" r="6" fill="#d9a3ae" />
                <circle cx="32" cy="18" r="2.6" fill="#b96a78" />
                <circle cx="18" cy="23" r="4" fill="#e7bcc4" />
                <circle cx="46" cy="23" r="4" fill="#e7bcc4" />
                <path d="M10 28 q -5 -2 -6 -8 q 7 0 6 8" fill="#c3d0b6" />
                <path d="M54 28 q 5 -2 6 -8 q -7 0 -6 8" fill="#c3d0b6" />
              </svg>
              <PhotoSlot
                label="A primeira dança, retrato"
                className="w-full aspect-[250/318] rounded-[50%/38%]"
              />
              <div className="mt-3 text-center italic text-[13px] text-[#7c4a55]/70">
                a primeira dança, 2019
              </div>
            </div>

            <div className="mt-7.5 grid grid-cols-2 gap-4">
              {[
                ["os girassóis da varanda"],
                ["o pedido, ao pôr do sol"],
              ].map(([caption]) => (
                <figure key={caption} className="m-0 relative">
                  <div className="absolute -inset-1.5 border border-[#ecc9d0] rounded-[50%/40%]" />
                  <PhotoSlot
                    label="Foto 4:5"
                    className="aspect-[4/5] w-full rounded-[50%/40%]"
                  />
                  <figcaption className="mt-3 text-center italic text-xs text-[#7c4a55]/70">
                    {caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <Branch />

          {/* 4. Informações */}
          <section className="px-6.5 pt-12 pb-14 bg-[#fbe9ec]">
            <div className="text-center mb-6.5">
              <div className="font-[family-name:var(--font-script)] text-[44px] leading-tight text-[#7c4a55]">
                O grande dia
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-[#fdf2f4] border border-[#ecc9d0] rounded-[26px] px-6 py-7 text-center">
                <div className="flex justify-center">
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
                    <path
                      d="M15 4 C 11 9, 8 12, 8 17 a 7 7 0 0 0 14 0 c 0 -5 -3 -8 -7 -13z"
                      stroke="#b96a78"
                      strokeWidth="1.3"
                    />
                    <circle cx="15" cy="18" r="2.4" fill="#d9a3ae" />
                  </svg>
                </div>
                <div className="mt-2.5 text-[10.5px] tracking-[0.32em] uppercase text-[#b96a78]">
                  Cerimônia · 16h
                </div>
                <div className="mt-2 font-semibold text-[19px]">
                  {DEMO_COUPLE.venue}
                </div>
                <div className="mt-1.5 text-sm leading-relaxed text-[#7c4a55]/80">
                  Rua das Oliveiras, 120 · Eusébio
                  <br />
                  {DEMO_COUPLE.city}
                </div>
                <div className="mt-1 italic text-[13px] text-[#7c4a55]/65">
                  cheguem cedinho: o sol se põe às 17h30
                </div>
                <div className="mt-4 flex justify-center">
                  <a
                    href="https://maps.google.com/?q=Espa%C3%A7o+Jardim+das+Oliveiras,+Fortaleza"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-[#7c4a55] text-[#fdf2f4] text-[11px] tracking-[0.22em] uppercase px-6.5 py-3.5 rounded-full border border-[#7c4a55] transition-colors hover:bg-[#b96a78] hover:border-[#b96a78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78]"
                  >
                    Ver no mapa
                  </a>
                </div>
              </div>

              <div className="bg-[#fdf2f4] border border-[#ecc9d0] rounded-[26px] px-6 py-7 text-center">
                <div className="flex justify-center">
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
                    <path
                      d="M8 25 c 0 -6 3 -9 7 -9 s 7 3 7 9"
                      stroke="#b96a78"
                      strokeWidth="1.3"
                      fill="none"
                    />
                    <path
                      d="M15 16 v -5 M15 8 m -2.6 0 a 2.6 2.6 0 1 0 5.2 0 a 2.6 2.6 0 1 0 -5.2 0"
                      stroke="#b96a78"
                      strokeWidth="1.3"
                      fill="none"
                    />
                  </svg>
                </div>
                <div className="mt-2.5 text-[10.5px] tracking-[0.32em] uppercase text-[#b96a78]">
                  Recepção · 18h
                </div>
                <div className="mt-2 font-semibold text-[19px]">
                  No mesmo jardim
                </div>
                <div className="mt-1.5 text-sm leading-relaxed text-[#7c4a55]/80">
                  Jantar sob luzinhas, bolo da tia Regina
                  <br />e pista aberta até a última música
                </div>
                <div className="mt-4 flex justify-center">
                  <a
                    href="https://maps.google.com/?q=Espa%C3%A7o+Jardim+das+Oliveiras,+Fortaleza"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-transparent text-[#7c4a55] text-[11px] tracking-[0.22em] uppercase px-6.5 py-3.5 rounded-full border border-[#d9a3ae] transition-colors hover:bg-[#7c4a55] hover:text-[#fdf2f4] hover:border-[#7c4a55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78]"
                  >
                    Como chegar
                  </a>
                </div>
              </div>

              <div className="bg-[#fdf2f4] border border-dashed border-[#d9a3ae] rounded-[26px] px-6 py-6 text-center">
                <div className="text-[10.5px] tracking-[0.32em] uppercase text-[#b96a78]">
                  Traje
                </div>
                <div className="mt-2 font-[family-name:var(--font-script)] text-[33px] leading-tight text-[#7c4a55]">
                  Esporte fino
                </div>
                <div className="mt-2 italic text-[13.5px] leading-relaxed text-[#7c4a55]/75">
                  tons pastel são muito bem-vindos —<br />o rosa antigo é das
                  madrinhas
                </div>
              </div>
            </div>
          </section>

          {/* 5. RSVP — a partir do pacote Site do Casamento */}
          {hasRsvp && (
          <section className="px-6.5 pt-14 pb-15">
            <div className="text-center mb-5.5">
              <div className="font-[family-name:var(--font-script)] text-[44px] leading-tight text-[#7c4a55]">
                Você vem?
              </div>
              <DotDivider />
            </div>

            <p className="mb-6 text-center text-[15px] leading-relaxed text-[#7c4a55]/85">
              Cada cadeira do jardim tem um nome. Confirme o seu com carinho
              até{" "}
              <span className="italic font-medium">19 de agosto de 2026</span>
              .
            </p>

            {!s.confirmed ? (
              <div className="bg-[#fbe9ec] border border-[#ecc9d0] rounded-[26px] px-5 py-6">
                <div className="text-center text-[10.5px] tracking-[0.3em] uppercase text-[#b96a78]">
                  Convite da Família Martins
                </div>
                <div className="mt-2">
                  {s.guests.map((guest) => {
                    const answer = s.rsvp[guest];
                    return (
                      <div
                        key={guest}
                        className="flex items-center justify-between gap-3 py-3.5 border-b border-dashed border-[#ecc9d0]"
                      >
                        <div className="flex-1 font-medium text-[16px]">
                          {guest}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => s.setAnswer(guest, "yes")}
                            className={`text-[11px] tracking-[0.12em] uppercase px-4 py-2.5 rounded-full border transition-colors hover:border-[#b96a78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78] ${
                              answer === "yes"
                                ? "bg-[#7c4a55] border-[#7c4a55] text-[#fdf2f4]"
                                : "bg-[#fdf2f4] border-[#d9a3ae] text-[#7c4a55]"
                            }`}
                          >
                            Vou
                          </button>
                          <button
                            type="button"
                            onClick={() => s.setAnswer(guest, "no")}
                            className={`text-[11px] tracking-[0.12em] uppercase px-4 py-2.5 rounded-full border transition-colors hover:border-[#b96a78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78] ${
                              answer === "no"
                                ? "bg-[#a8877e] border-[#a8877e] text-[#fdf2f4]"
                                : "bg-[#fdf2f4] border-[#d9a3ae] text-[#7c4a55]"
                            }`}
                          >
                            Não vou
                          </button>
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
                    className="text-[11.5px] tracking-[0.22em] uppercase bg-[#7c4a55] text-[#fdf2f4] px-8 py-3.5 rounded-full border border-[#7c4a55] transition-colors hover:bg-[#b96a78] hover:border-[#b96a78] disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78]"
                  >
                    Confirmar presença
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#fbe9ec] border border-[#ecc9d0] rounded-[26px] px-6 py-8.5 text-center">
                <div className="font-[family-name:var(--font-script)] text-[48px] leading-tight text-[#b96a78]">
                  Que alegria!
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-[#7c4a55]/85">
                  Sua resposta chegou direitinho.
                  <br />O jardim ficou mais bonito com você nele.
                </p>
                <button
                  type="button"
                  onClick={s.editAnswers}
                  className="mt-4 text-xs tracking-[0.16em] uppercase text-[#7c4a55] underline underline-offset-4 hover:text-[#b96a78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78]"
                >
                  ajustar resposta
                </button>
              </div>
            )}
          </section>
          )}

          {/* 6. Lista de presentes — só no Para Sempre */}
          {hasGifts && (
          <section className="px-6.5 pt-12 pb-14 bg-[#fbe9ec]">
            <div className="text-center mb-5.5">
              <div className="font-[family-name:var(--font-script)] text-[44px] leading-tight text-[#7c4a55]">
                Lista de presentes
              </div>
            </div>

            <p className="mb-6 text-center text-[15px] leading-relaxed text-[#7c4a55]/85">
              O maior presente é ver o jardim cheio de quem amamos. Mas quem
              quiser deixar um mimo, cada um vira um pedacinho da lua de mel.
            </p>

            <div className="grid grid-cols-2 gap-3.5">
              {s.gifts.map((gift, i) => (
                <div
                  key={gift.name}
                  className="bg-[#fdf2f4] border border-[#ecc9d0] rounded-[22px] pt-5.5 pb-4.5 px-3.5 flex flex-col items-center gap-2 text-center transition-all hover:border-[#d9a3ae] hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="font-medium text-[15.5px] leading-snug min-h-15 flex items-center">
                    {gift.name}
                  </div>
                  <div className="italic text-[13.5px] text-[#7c4a55]/75">
                    R$ {gift.priceReais}
                  </div>
                  <button
                    type="button"
                    onClick={() => s.openGift(i)}
                    className="mt-0.5 text-[10.5px] tracking-[0.18em] uppercase px-4.5 py-2.5 rounded-full border border-[#d9a3ae] text-[#7c4a55] transition-colors hover:bg-[#7c4a55] hover:text-[#fdf2f4] hover:border-[#7c4a55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78]"
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
          <section className="px-6.5 pt-14 pb-15">
            <div className="text-center mb-5.5">
              <div className="font-[family-name:var(--font-script)] text-[44px] leading-tight text-[#7c4a55]">
                Mural de recados
              </div>
              <div className="mt-2 text-[11px] tracking-[0.3em] uppercase text-[#7c4a55]/65">
                palavras que vamos guardar
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {s.messages.map((msg, i) => (
                <div
                  key={`${msg.name}-${i}`}
                  className="relative bg-[#fbe9ec] border border-[#ecc9d0] rounded-[22px] px-5.5 py-5"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    aria-hidden
                    className="absolute -top-2.5 left-6"
                  >
                    <circle cx="10" cy="10" r="6" fill="#d9a3ae" />
                    <circle cx="10" cy="10" r="2.6" fill="#b96a78" />
                  </svg>
                  <p className="mt-1 italic text-[15px] leading-relaxed text-[#7c4a55]">
                    &ldquo;{msg.text}&rdquo;
                  </p>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="font-[family-name:var(--font-script)] text-[22px] text-[#b96a78]">
                      {msg.name}
                    </span>
                    <span className="text-[11.5px] text-[#7c4a55]/55">
                      · {msg.when}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6.5 bg-[#fbe9ec] border border-[#ecc9d0] rounded-[26px] px-5.5 py-6">
              <div className="text-center text-[10.5px] tracking-[0.3em] uppercase text-[#b96a78]">
                Deixe o seu recado
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="ro-nome"
                    className="block text-[10.5px] tracking-[0.22em] uppercase text-[#7c4a55]/70 mb-1.5"
                  >
                    Seu nome
                  </label>
                  <input
                    id="ro-nome"
                    type="text"
                    value={s.guestName}
                    onChange={(e) => s.setGuestName(e.target.value)}
                    placeholder="Maria da Graça"
                    className="w-full text-[15px] text-[#7c4a55] bg-[#fdf2f4] border border-[#ecc9d0] rounded-[14px] px-4 py-3.5 transition-colors focus:border-[#b96a78] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ro-recado"
                    className="block text-[10.5px] tracking-[0.22em] uppercase text-[#7c4a55]/70 mb-1.5"
                  >
                    Sua mensagem
                  </label>
                  <textarea
                    id="ro-recado"
                    rows={4}
                    value={s.guestMessage}
                    onChange={(e) => s.setGuestMessage(e.target.value)}
                    placeholder="Escreva com o coração…"
                    className="w-full resize-y text-[15px] text-[#7c4a55] bg-[#fdf2f4] border border-[#ecc9d0] rounded-[14px] px-4 py-3.5 transition-colors focus:border-[#b96a78] focus:outline-none"
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={s.sendMessage}
                    className="text-[11.5px] tracking-[0.22em] uppercase bg-[#7c4a55] text-[#fdf2f4] px-8 py-3.5 rounded-full border border-[#7c4a55] transition-colors hover:bg-[#b96a78] hover:border-[#b96a78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78]"
                  >
                    Deixar recado
                  </button>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* 8. Álbum pós-festa — só no Para Sempre */}
          {hasGifts && (
          <section className="px-6.5 pt-12 pb-14 bg-[#fbe9ec]">
            <div className="text-center mb-5.5">
              <div className="font-[family-name:var(--font-script)] text-[44px] leading-tight text-[#7c4a55]">
                Álbum da festa
              </div>
              <div className="mt-2 text-[11px] tracking-[0.3em] uppercase text-[#7c4a55]/65">
                para matar a saudade
              </div>
            </div>

            {!s.albumUnlocked ? (
              <div className="bg-[#fdf2f4] border border-dashed border-[#d9a3ae] rounded-[26px] px-6 py-8.5 text-center">
                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#b96a78"
                  strokeWidth="1.2"
                  aria-hidden
                  className="mx-auto"
                >
                  <rect x="5" y="10" width="14" height="10" rx="3" />
                  <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
                  <circle cx="12" cy="15" r="1.6" fill="#d9a3ae" stroke="none" />
                </svg>
                <div className="mt-3 font-[family-name:var(--font-script)] text-[34px] leading-snug text-[#7c4a55]">
                  Um presente para depois
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-[#7c4a55]/80">
                  As fotos florescem aqui a partir de
                  <br />
                  <span className="italic">20 de setembro de 2026</span> —
                  logo depois do buquê.
                </p>
                <div className="mt-5.5 flex justify-center gap-2.5 opacity-70">
                  <div className="w-16 h-20 rounded-[50%/40%] bg-[#f6dde2] border border-[#ecc9d0]" />
                  <div className="w-16 h-20 mt-2.5 rounded-[50%/40%] bg-[#f6dde2] border border-[#ecc9d0]" />
                  <div className="w-16 h-20 rounded-[50%/40%] bg-[#f6dde2] border border-[#ecc9d0]" />
                </div>
                <button
                  type="button"
                  onClick={() => s.setAlbumPreview(true)}
                  className="mt-6 text-xs tracking-[0.16em] uppercase text-[#7c4a55] underline underline-offset-4 hover:text-[#b96a78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78]"
                >
                  ver prévia do álbum (demonstração)
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    "Foto da festa",
                    "Foto da festa",
                    "Foto da festa",
                    "Foto da festa",
                    "Foto da festa",
                    "Foto da festa",
                  ].map((label, i) => (
                    <div
                      key={i}
                      className={`rounded-[50%/40%] overflow-hidden ${i % 2 === 1 ? "mt-3.5" : ""}`}
                    >
                      <PhotoSlot
                        label={label}
                        className="aspect-[4/5] w-full rounded-[50%/40%]"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center italic text-[13px] text-[#7c4a55]/70">
                  arraste para cá as fotos favoritas da festa
                </div>
                {s.albumPreview && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => s.setAlbumPreview(false)}
                      className="text-[11px] tracking-[0.16em] uppercase text-[#7c4a55]/70 underline underline-offset-4 hover:text-[#b96a78]"
                    >
                      voltar ao estado bloqueado
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
          )}

          {/* 9. Rodapé */}
          <footer className="relative bg-[#7c4a55] text-[#fdf2f4] text-center px-6.5 pt-14 pb-12 overflow-hidden">
            <svg
              width="170"
              height="170"
              viewBox="0 0 190 190"
              fill="none"
              aria-hidden
              className="absolute -top-7.5 -right-11 opacity-30"
            >
              <path
                d="M20 170 C 40 120, 60 90, 110 60"
                stroke="#e7bcc4"
                strokeWidth="1.6"
                fill="none"
              />
              <path d="M48 132 q -16 -4 -20 -20 q 18 0 20 20" fill="#d9a3ae" />
              <path d="M66 110 q -18 -2 -24 -18 q 19 -1 24 18" fill="#e7bcc4" />
              <circle cx="112" cy="58" r="9" fill="#e7bcc4" />
              <circle cx="112" cy="58" r="4" fill="#d9a3ae" />
            </svg>
            <div className="relative">
              <div className="font-[family-name:var(--font-script)] text-[46px] leading-tight text-[#e7bcc4]">
                Ana e Pedro
              </div>
              <div className="mt-4 mx-auto flex items-center justify-center gap-2.5">
                <div className="w-11 h-px bg-[#e7bcc4]/60" />
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <circle cx="6" cy="6" r="2.8" fill="#e7bcc4" />
                </svg>
                <div className="w-11 h-px bg-[#e7bcc4]/60" />
              </div>
              <div className="mt-4 text-[19px] tracking-wide text-[#e7bcc4]">
                #AnaEPedroNoJardim
              </div>
              <div className="mt-2 text-[11px] tracking-[0.28em] uppercase text-[#fdf2f4]/75">
                19 · 09 · 2026 — Fortaleza, CE
              </div>
              <div className="mt-5 italic text-[12.5px] text-[#fdf2f4]/55">
                feito com flores e com pressa de dizer sim
              </div>
            </div>
          </footer>
        </div>
      </TemplateChrome>

      {s.gift && (
        <div
          onClick={s.closeGift}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#6d3f49]/60 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] max-h-[90vh] overflow-y-auto bg-[#fdf2f4] border border-[#ecc9d0] rounded-[28px]"
          >
            <div className="px-5.5 py-6.5 text-center relative font-[family-name:var(--font-body)] text-[#7c4a55]">
              <button
                type="button"
                onClick={s.closeGift}
                aria-label="Fechar"
                className="absolute top-3 right-3.5 text-lg text-[#7c4a55]/70 p-1 hover:text-[#b96a78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78]"
              >
                ×
              </button>
              <div className="text-[10px] tracking-[0.3em] uppercase text-[#b96a78]">
                Presentear com Pix
              </div>
              <div className="mt-2.5 font-semibold text-[21px] leading-snug">
                {s.gift.name}
              </div>
              <div className="mt-1 italic text-[14.5px] text-[#7c4a55]/75">
                R$ {s.gift.priceReais}
              </div>

              <div className="mt-4 flex justify-center">
                <div className="bg-white border border-[#ecc9d0] rounded-2xl p-3">
                  <FakeQrCanvas seed={s.gift.name} ink="#5e3540" size={168} />
                </div>
              </div>

              <div className="mt-4 text-[10px] tracking-[0.28em] uppercase text-[#7c4a55]/60">
                Pix copia e cola
              </div>
              <div className="mt-2 font-mono text-[10.5px] leading-relaxed break-all text-left bg-white border border-[#ecc9d0] rounded-xl p-2.5 text-[#8a5a64] max-h-[72px] overflow-y-auto">
                {buildDemoPixCode(s.gift.priceReais)}
              </div>

              <button
                type="button"
                onClick={() => s.copyPixCode(buildDemoPixCode(s.gift!.priceReais))}
                className="mt-3.5 w-full text-[11.5px] tracking-[0.2em] uppercase bg-[#7c4a55] text-[#fdf2f4] py-3.5 rounded-full border border-[#7c4a55] transition-colors hover:bg-[#b96a78] hover:border-[#b96a78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b96a78]"
              >
                {s.copied ? "Copiado ✓" : "Copiar código"}
              </button>

              <p className="mt-3.5 italic text-xs leading-relaxed text-[#7c4a55]/70">
                Seu carinho chega com o seu nome — e entra na nossa lista de
                agradecimentos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
