"use client";

import { Cormorant_Garamond, EB_Garamond, Pinyon_Script } from "next/font/google";
import TemplateChrome from "@/components/templates/TemplateChrome";
import PhotoSlot from "@/components/templates/PhotoSlot";
import FakeQrCanvas from "@/components/templates/FakeQrCanvas";
import { useWeddingDemoState } from "@/components/templates/useWeddingDemoState";
import { buildDemoPixCode } from "@/lib/demoPix";
import { DEMO_COUPLE } from "@/lib/packages";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const body = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-body",
});
const script = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

const GUESTS = ["Carlos Martins", "Regina Martins", "Júlia Martins"];
const GIFTS = [
  { name: "Café coado a dois", priceReais: 90 },
  { name: "Jantar à beira-mar em Jericoacoara", priceReais: 180 },
  { name: "Passeio de buggy nas dunas", priceReais: 150 },
  { name: "Uma noite a mais na pousada", priceReais: 250 },
  { name: "Taças para os brindes", priceReais: 160 },
  { name: "Aula de forró para o noivo", priceReais: 120 },
];
const SEED_MESSAGES = [
  {
    name: "Tia Regina",
    when: "12 de julho",
    text: "Que a vida de vocês dois seja como este convite: feita com calma, capricho e muito amor.",
  },
  {
    name: "Bia, madrinha",
    when: "8 de julho",
    text: "Ana e Pedro, ver esse amor de perto é um privilégio. Que venha a festa!",
  },
];

export default function ClassicoTemplatePage() {
  const s = useWeddingDemoState({
    storageKey: "tc-demo-classico",
    targetDate: DEMO_COUPLE.date,
    partyEndsAt: "2026-09-20T06:00:00-03:00",
    guests: GUESTS,
    gifts: GIFTS,
    seedMessages: SEED_MESSAGES,
  });

  return (
    <div
      className={`${display.variable} ${body.variable} ${script.variable}`}
    >
      <TemplateChrome
        styleName="Clássico"
        outerBg="#2f3a2a"
        cardBg="#f2efe7"
        ink="#3d4a36"
        accent="#b8985f"
      >
        <div className="font-[family-name:var(--font-body)] text-[#3d4a36]">
          {/* 1. Capa / Save the Date */}
          <section className="px-[18px] pt-[52px] pb-11">
            <div className="border border-[#b8985f] p-1">
              <div className="border border-[#b8985f]/55 px-[22px] pb-9">
                <div className="flex justify-center -mt-[38px]">
                  <div className="bg-[#f2efe7] px-3.5">
                    <div className="size-[76px] rounded-full border border-[#b8985f] flex items-center justify-center">
                      <div className="size-16 rounded-full border border-[#b8985f]/50 flex items-center justify-center gap-1">
                        <span className="font-[family-name:var(--font-display)] text-xl font-medium">
                          A
                        </span>
                        <span className="font-[family-name:var(--font-script)] text-lg text-[#b8985f]">
                          &amp;
                        </span>
                        <span className="font-[family-name:var(--font-display)] text-xl font-medium">
                          P
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <div className="font-[family-name:var(--font-script)] text-[37px] text-[#b8985f] leading-tight">
                    Save the Date
                  </div>
                  <h1 className="font-[family-name:var(--font-display)] font-medium text-[56px] leading-[1.04] tracking-wide mt-4">
                    Ana
                    <span className="block font-[family-name:var(--font-script)] font-normal text-3xl text-[#b8985f] leading-[1.15]">
                      &amp;
                    </span>
                    Pedro
                  </h1>

                  <div className="w-[72px] h-px bg-[#b8985f] mx-auto mt-5" />
                  <div className="w-11 h-px bg-[#b8985f] mx-auto mt-[5px]" />

                  <div className="mt-5 text-[11px] tracking-[0.35em] uppercase text-[#3d4a36]/70">
                    Sábado
                  </div>
                  <div className="mt-1.5 font-[family-name:var(--font-display)] text-2xl font-medium">
                    19 de setembro de 2026
                  </div>
                  <div className="mt-0.5 italic text-[15px] text-[#3d4a36]/80">
                    às quatro da tarde
                  </div>

                  <div className="mt-4 font-[family-name:var(--font-display)] text-lg font-medium">
                    {DEMO_COUPLE.venue}
                  </div>
                  <div className="mt-1 text-[10.5px] tracking-[0.3em] uppercase text-[#3d4a36]/65">
                    {DEMO_COUPLE.city}
                  </div>
                </div>

                <div className="mt-6 border border-[#b8985f] p-[5px]">
                  <div className="border border-[#b8985f]/50 p-[5px]">
                    <PhotoSlot
                      label="Foto principal do casal"
                      className="aspect-[3/4] w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Contagem regressiva */}
          <section className="bg-[#ebefe3] px-7 py-14 border-y border-[#b8985f]/35">
            <div className="text-center mb-7">
              <div className="font-[family-name:var(--font-script)] text-[29px] text-[#b8985f] leading-tight">
                falta pouco
              </div>
              <h2 className="mt-1 mb-3.5 font-[family-name:var(--font-display)] text-[23px] font-semibold tracking-[0.24em] uppercase">
                Contagem regressiva
              </h2>
              <div className="w-[72px] h-px bg-[#b8985f] mx-auto" />
              <div className="w-11 h-px bg-[#b8985f] mx-auto mt-[5px]" />
            </div>

            <div className="flex items-center justify-center">
              {[
                ["dias", s.countdown.days],
                ["horas", s.countdown.hours],
                ["min", s.countdown.minutes],
                ["seg", s.countdown.seconds],
              ].map(([label, value], i) => (
                <div key={label} className="contents">
                  {i > 0 && <div className="w-px h-[38px] bg-[#b8985f]/50" />}
                  <div className="flex-1 text-center">
                    <div className="font-[family-name:var(--font-display)] text-4xl font-medium leading-none tabular-nums">
                      {value}
                    </div>
                    <div className="mt-1.5 text-[10px] tracking-[0.28em] uppercase text-[#3d4a36]/65">
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-6 italic text-sm text-[#3d4a36]/75">
              para o nosso grande dia
            </div>
          </section>

          {/* 3. Nossa história */}
          <section className="px-7 py-16">
            <div className="text-center mb-6">
              <div className="font-[family-name:var(--font-script)] text-[29px] text-[#b8985f] leading-tight">
                a nossa
              </div>
              <h2 className="mt-1 mb-3.5 font-[family-name:var(--font-display)] text-[23px] font-semibold tracking-[0.24em] uppercase">
                História
              </h2>
              <div className="w-[72px] h-px bg-[#b8985f] mx-auto" />
              <div className="w-11 h-px bg-[#b8985f] mx-auto mt-[5px]" />
            </div>

            <p className="text-center text-base leading-[1.75] text-[#3d4a36]/90">
              {DEMO_COUPLE.story}
            </p>

            <div className="my-7 border border-[#b8985f] p-[5px]">
              <div className="border border-[#b8985f]/50 p-[5px]">
                <PhotoSlot
                  label="O pedido"
                  className="aspect-[4/3] w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {[
                ["2019 · o começo", "Foto quadrada"],
                ["2025 · o sim", "Foto quadrada"],
              ].map(([caption, label]) => (
                <figure key={caption} className="m-0">
                  <div className="border border-[#b8985f]/60 p-1">
                    <PhotoSlot label={label} className="aspect-square w-full" />
                  </div>
                  <figcaption className="mt-2 text-center italic text-xs text-[#3d4a36]/70">
                    {caption}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="mt-8 text-center font-[family-name:var(--font-script)] text-[27px] leading-snug text-[#b8985f]">
              do primeiro olhar ao para sempre
            </div>
          </section>

          {/* 4. Informações */}
          <section className="bg-[#ebefe3] px-7 py-16 border-y border-[#b8985f]/35">
            <div className="text-center mb-7">
              <div className="font-[family-name:var(--font-script)] text-[29px] text-[#b8985f] leading-tight">
                quando &amp; onde
              </div>
              <h2 className="mt-1 mb-3.5 font-[family-name:var(--font-display)] text-[23px] font-semibold tracking-[0.24em] uppercase">
                Informações
              </h2>
              <div className="w-[72px] h-px bg-[#b8985f] mx-auto" />
              <div className="w-11 h-px bg-[#b8985f] mx-auto mt-[5px]" />
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-[#f7f5ee] border border-[#b8985f]/55 px-6 py-7 text-center">
                <div className="text-[10.5px] tracking-[0.32em] uppercase text-[#b8985f]">
                  Cerimônia
                </div>
                <div className="mt-2.5 font-[family-name:var(--font-display)] text-[34px] font-medium leading-none">
                  16h
                </div>
                <div className="mt-2.5 font-[family-name:var(--font-display)] text-lg font-medium">
                  {DEMO_COUPLE.venue}
                </div>
                <div className="mt-1 text-sm leading-relaxed text-[#3d4a36]/80">
                  Rua das Oliveiras, 120 · Eusébio
                  <br />
                  {DEMO_COUPLE.city}
                </div>
                <div className="mt-1.5 italic text-[13px] text-[#3d4a36]/65">
                  os portões abrem às 15h15
                </div>
                <div className="mt-4 flex justify-center">
                  <a
                    href="https://maps.google.com/?q=Espa%C3%A7o+Jardim+das+Oliveiras,+Fortaleza"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-[#3d4a36] text-[#f2efe7] text-[11.5px] tracking-[0.24em] uppercase px-6 py-3 border border-[#3d4a36] transition-colors hover:bg-[#b8985f] hover:border-[#b8985f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f]"
                  >
                    Ver no mapa
                  </a>
                </div>
              </div>

              <div className="bg-[#f7f5ee] border border-[#b8985f]/55 px-6 py-7 text-center">
                <div className="text-[10.5px] tracking-[0.32em] uppercase text-[#b8985f]">
                  Recepção
                </div>
                <div className="mt-2.5 font-[family-name:var(--font-display)] text-[34px] font-medium leading-none">
                  18h
                </div>
                <div className="mt-2.5 font-[family-name:var(--font-display)] text-lg font-medium">
                  No mesmo jardim
                </div>
                <div className="mt-1 text-sm leading-relaxed text-[#3d4a36]/80">
                  Jantar, brindes e pista de dança
                  <br />
                  sob as luzes da tenda
                </div>
                <div className="mt-4 flex justify-center">
                  <a
                    href="https://maps.google.com/?q=Espa%C3%A7o+Jardim+das+Oliveiras,+Fortaleza"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-transparent text-[#3d4a36] text-[11.5px] tracking-[0.24em] uppercase px-6 py-3 border border-[#3d4a36]/55 transition-colors hover:bg-[#3d4a36] hover:text-[#f2efe7] hover:border-[#3d4a36] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f]"
                  >
                    Como chegar
                  </a>
                </div>
              </div>

              <div className="border border-[#b8985f] p-1">
                <div className="border border-[#b8985f]/50 px-6 py-5 text-center">
                  <div className="text-[10.5px] tracking-[0.32em] uppercase text-[#b8985f]">
                    Traje
                  </div>
                  <div className="mt-2 font-[family-name:var(--font-display)] text-2xl font-medium">
                    Esporte fino
                  </div>
                  <div className="mt-1.5 italic text-[13.5px] leading-relaxed text-[#3d4a36]/70">
                    fica o pedido: os tons de verde-oliva
                    <br />
                    são das madrinhas e dos padrinhos
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. RSVP */}
          <section className="px-7 py-16">
            <div className="text-center mb-6">
              <div className="font-[family-name:var(--font-script)] text-[29px] text-[#b8985f] leading-tight">
                você vem?
              </div>
              <h2 className="mt-1 mb-3.5 font-[family-name:var(--font-display)] text-[23px] font-semibold tracking-[0.24em] uppercase">
                Confirmação
              </h2>
              <div className="w-[72px] h-px bg-[#b8985f] mx-auto" />
              <div className="w-11 h-px bg-[#b8985f] mx-auto mt-[5px]" />
            </div>

            <p className="mb-6 text-center text-[15.5px] leading-relaxed text-[#3d4a36]/85">
              Sua presença é o nosso presente mais querido. Por gentileza,
              confirme até{" "}
              <span className="font-medium italic">19 de agosto de 2026</span>
              .
            </p>

            {!s.confirmed ? (
              <div className="border border-[#b8985f]/55 bg-[#f7f5ee] px-[22px] py-6">
                <div className="text-center text-[10.5px] tracking-[0.3em] uppercase text-[#b8985f]">
                  Convite da Família Martins
                </div>
                <div className="mt-2.5">
                  {s.guests.map((guest) => {
                    const answer = s.rsvp[guest];
                    return (
                      <div
                        key={guest}
                        className="flex items-center justify-between gap-3 py-3.5 border-b border-[#3d4a36]/[0.14]"
                      >
                        <div className="flex-1 font-[family-name:var(--font-display)] text-lg font-medium">
                          {guest}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => s.setAnswer(guest, "yes")}
                            className={`text-[11px] tracking-[0.16em] uppercase px-4 py-2 border transition-colors hover:border-[#b8985f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f] ${
                              answer === "yes"
                                ? "bg-[#3d4a36] border-[#3d4a36] text-[#f2efe7]"
                                : "border-[#3d4a36]/40 text-[#3d4a36]"
                            }`}
                          >
                            Vou
                          </button>
                          <button
                            type="button"
                            onClick={() => s.setAnswer(guest, "no")}
                            className={`text-[11px] tracking-[0.16em] uppercase px-4 py-2 border transition-colors hover:border-[#b8985f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f] ${
                              answer === "no"
                                ? "bg-[#7b7365] border-[#7b7365] text-[#f2efe7]"
                                : "border-[#3d4a36]/40 text-[#3d4a36]"
                            }`}
                          >
                            Não vou
                          </button>
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
                    className="text-[11.5px] tracking-[0.24em] uppercase bg-[#3d4a36] text-[#f2efe7] px-7 py-3.5 border border-[#3d4a36] transition-colors hover:bg-[#b8985f] hover:border-[#b8985f] disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f]"
                  >
                    Confirmar presença
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-[#b8985f] p-1">
                <div className="border border-[#b8985f]/50 bg-[#ebefe3] px-6 py-7 text-center">
                  <div className="font-[family-name:var(--font-script)] text-4xl text-[#b8985f] leading-tight">
                    Obrigado!
                  </div>
                  <p className="mt-3 text-[15.5px] leading-relaxed text-[#3d4a36]/85">
                    Recebemos a sua resposta.
                    <br />
                    Mal podemos esperar para celebrar com você.
                  </p>
                  <button
                    type="button"
                    onClick={s.editAnswers}
                    className="mt-4 text-xs tracking-[0.18em] uppercase text-[#3d4a36] underline underline-offset-4 hover:text-[#b8985f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f]"
                  >
                    ajustar resposta
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 6. Lista de presentes */}
          <section className="bg-[#ebefe3] px-7 py-16 border-y border-[#b8985f]/35">
            <div className="text-center mb-6">
              <div className="font-[family-name:var(--font-script)] text-[29px] text-[#b8985f] leading-tight">
                com carinho
              </div>
              <h2 className="mt-1 mb-3.5 font-[family-name:var(--font-display)] text-[23px] font-semibold tracking-[0.24em] uppercase">
                Lista de presentes
              </h2>
              <div className="w-[72px] h-px bg-[#b8985f] mx-auto" />
              <div className="w-11 h-px bg-[#b8985f] mx-auto mt-[5px]" />
            </div>

            <p className="mb-6 text-center text-[15.5px] leading-relaxed text-[#3d4a36]/85">
              Ter você conosco já é presente. Mas, se o coração pedir, cada
              mimo abaixo vira uma lembrança da nossa lua de mel.
            </p>

            <div className="grid grid-cols-2 gap-3.5">
              {s.gifts.map((gift, i) => (
                <div
                  key={gift.name}
                  className="bg-[#f7f5ee] border border-[#b8985f]/50 px-3.5 pt-5 pb-4 flex flex-col items-center gap-2 text-center transition-all hover:border-[#b8985f] hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="font-[family-name:var(--font-display)] text-[18.5px] font-medium leading-tight min-h-[46px] flex items-center">
                    {gift.name}
                  </div>
                  <div className="text-sm text-[#3d4a36]/75">
                    R$ {gift.priceReais}
                  </div>
                  <button
                    type="button"
                    onClick={() => s.openGift(i)}
                    className="mt-0.5 text-[10.5px] tracking-[0.2em] uppercase px-4 py-2 border border-[#3d4a36]/50 text-[#3d4a36] transition-colors hover:bg-[#3d4a36] hover:text-[#f2efe7] hover:border-[#3d4a36] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f]"
                  >
                    Presentear
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Mural de recados */}
          <section className="px-7 py-16">
            <div className="text-center mb-6">
              <div className="font-[family-name:var(--font-script)] text-[29px] text-[#b8985f] leading-tight">
                palavras para guardar
              </div>
              <h2 className="mt-1 mb-3.5 font-[family-name:var(--font-display)] text-[23px] font-semibold tracking-[0.24em] uppercase">
                Mural de recados
              </h2>
              <div className="w-[72px] h-px bg-[#b8985f] mx-auto" />
              <div className="w-11 h-px bg-[#b8985f] mx-auto mt-[5px]" />
            </div>

            <div className="flex flex-col gap-3">
              {s.messages.map((msg, i) => (
                <div
                  key={`${msg.name}-${i}`}
                  className="bg-[#ebefe3] border border-[#b8985f]/35 px-5 py-4.5"
                >
                  <p className="italic text-[15.5px] leading-relaxed text-[#47513d]">
                    &ldquo;{msg.text}&rdquo;
                  </p>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-[11px] tracking-[0.18em] uppercase">
                      {msg.name}
                    </span>
                    <span className="text-[11.5px] text-[#3d4a36]/55">
                      · {msg.when}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border border-[#b8985f]/55 bg-[#f7f5ee] p-5">
              <div className="text-center text-[10.5px] tracking-[0.3em] uppercase text-[#b8985f]">
                Deixe o seu recado
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="cl-nome"
                    className="block text-[10.5px] tracking-[0.24em] uppercase text-[#3d4a36]/70 mb-1.5"
                  >
                    Seu nome
                  </label>
                  <input
                    id="cl-nome"
                    type="text"
                    value={s.guestName}
                    onChange={(e) => s.setGuestName(e.target.value)}
                    placeholder="Maria da Graça"
                    className="w-full text-[15px] text-[#3d4a36] bg-white border border-[#3d4a36]/30 px-3.5 py-3 transition-colors focus:border-[#b8985f] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cl-recado"
                    className="block text-[10.5px] tracking-[0.24em] uppercase text-[#3d4a36]/70 mb-1.5"
                  >
                    Sua mensagem
                  </label>
                  <textarea
                    id="cl-recado"
                    rows={4}
                    value={s.guestMessage}
                    onChange={(e) => s.setGuestMessage(e.target.value)}
                    placeholder="Escreva com o coração…"
                    className="w-full resize-y text-[15px] text-[#3d4a36] bg-white border border-[#3d4a36]/30 px-3.5 py-3 transition-colors focus:border-[#b8985f] focus:outline-none"
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={s.sendMessage}
                    className="text-[11.5px] tracking-[0.24em] uppercase bg-[#3d4a36] text-[#f2efe7] px-7 py-3.5 border border-[#3d4a36] transition-colors hover:bg-[#b8985f] hover:border-[#b8985f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f]"
                  >
                    Deixar recado
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 8. Álbum pós-festa */}
          <section className="bg-[#ebefe3] px-7 py-16 border-t border-[#b8985f]/35">
            <div className="text-center mb-6">
              <div className="font-[family-name:var(--font-script)] text-[29px] text-[#b8985f] leading-tight">
                para matar a saudade
              </div>
              <h2 className="mt-1 mb-3.5 font-[family-name:var(--font-display)] text-[23px] font-semibold tracking-[0.24em] uppercase">
                Álbum da festa
              </h2>
              <div className="w-[72px] h-px bg-[#b8985f] mx-auto" />
              <div className="w-11 h-px bg-[#b8985f] mx-auto mt-[5px]" />
            </div>

            {!s.albumUnlocked ? (
              <div className="border border-[#b8985f]/55 bg-[#f7f5ee] px-6 py-8 text-center">
                <div className="flex justify-center">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#b8985f"
                    strokeWidth="1.3"
                    aria-hidden
                  >
                    <rect x="5" y="10" width="14" height="10" rx="1" />
                    <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
                  </svg>
                </div>
                <div className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium">
                  Um presente para depois
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-[#3d4a36]/80">
                  As fotos da festa aparecem aqui a partir de{" "}
                  <span className="italic">20 de setembro de 2026</span>.
                  Volte para matar a saudade.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 opacity-65">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square"
                      style={{
                        background:
                          "repeating-linear-gradient(45deg, #e6e2d2 0px, #e6e2d2 6px, #ede9dc 6px, #ede9dc 12px)",
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => s.setAlbumPreview(true)}
                  className="mt-6 text-xs tracking-[0.18em] uppercase text-[#3d4a36] underline underline-offset-4 hover:text-[#b8985f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f]"
                >
                  ver prévia do álbum (demonstração)
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "A cerimônia",
                    "O sim",
                    "Primeira dança",
                    "A pista",
                    "Os padrinhos",
                    "O bolo",
                  ].map((label) => (
                    <div
                      key={label}
                      className="aspect-square border border-[#b8985f]/60 p-1"
                    >
                      <PhotoSlot label={label} className="w-full h-full" />
                    </div>
                  ))}
                </div>
                <div className="mt-3.5 text-center italic text-[13.5px] text-[#3d4a36]/70">
                  arraste para cá as fotos favoritas da festa
                </div>
                {s.albumPreview && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => s.setAlbumPreview(false)}
                      className="text-[11px] tracking-[0.16em] uppercase text-[#3d4a36]/70 underline underline-offset-4 hover:text-[#b8985f]"
                    >
                      voltar ao estado bloqueado
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 9. Rodapé */}
          <footer className="bg-[#3d4a36] text-[#f2efe7] text-center px-7 pt-14 pb-11">
            <div className="flex justify-center">
              <div className="size-16 rounded-full border border-[#cbb287]/70 flex items-center justify-center gap-1">
                <span className="font-[family-name:var(--font-display)] text-lg">
                  A
                </span>
                <span className="font-[family-name:var(--font-script)] text-base text-[#cbb287]">
                  &amp;
                </span>
                <span className="font-[family-name:var(--font-display)] text-lg">
                  P
                </span>
              </div>
            </div>
            <div className="mt-4.5 font-[family-name:var(--font-script)] text-3xl text-[#cbb287] leading-tight">
              com amor,
            </div>
            <div className="mt-1.5 font-[family-name:var(--font-display)] text-[28px] font-medium tracking-wide">
              Ana &amp; Pedro
            </div>

            <div className="w-14 h-px bg-[#cbb287]/60 mx-auto mt-5" />
            <div className="w-[34px] h-px bg-[#cbb287]/60 mx-auto mt-[5px]" />

            <div className="mt-5 font-[family-name:var(--font-display)] text-xl tracking-wide text-[#cbb287]">
              {DEMO_COUPLE.customUrl.startsWith("#")
                ? DEMO_COUPLE.customUrl
                : "#AnaEPedro"}
            </div>
            <div className="mt-2 text-[11px] tracking-[0.3em] uppercase text-[#f2efe7]/75">
              19 · 09 · 2026 — Fortaleza, CE
            </div>
            <div className="mt-5 italic text-[12.5px] text-[#f2efe7]/55">
              feito à mão para o nosso grande dia
            </div>
          </footer>
        </div>
      </TemplateChrome>

      {s.gift && (
        <div
          onClick={s.closeGift}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2b3426]/60 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] max-h-[90vh] overflow-y-auto bg-[#f2efe7] border border-[#b8985f] p-[5px]"
          >
            <div className="border border-[#b8985f]/55 px-[22px] py-6 text-center relative font-[family-name:var(--font-body)] text-[#3d4a36]">
              <button
                type="button"
                onClick={s.closeGift}
                aria-label="Fechar"
                className="absolute top-2 right-2.5 text-lg text-[#3d4a36]/70 p-1 hover:text-[#b8985f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f]"
              >
                ×
              </button>
              <div className="text-[10px] tracking-[0.32em] uppercase text-[#b8985f]">
                Presentear com Pix
              </div>
              <div className="mt-2.5 font-[family-name:var(--font-display)] text-2xl font-medium leading-snug">
                {s.gift.name}
              </div>
              <div className="mt-1 text-[15px] text-[#3d4a36]/75">
                R$ {s.gift.priceReais}
              </div>

              <div className="mt-4 flex justify-center">
                <div className="bg-white border border-[#3d4a36]/20 p-2.5">
                  <FakeQrCanvas seed={s.gift.name} ink="#2c3529" size={168} />
                </div>
              </div>

              <div className="mt-4 text-[10px] tracking-[0.3em] uppercase text-[#3d4a36]/60">
                Pix copia e cola
              </div>
              <div className="mt-2 font-mono text-[10.5px] leading-relaxed break-all text-left bg-white border border-[#3d4a36]/20 p-2.5 text-[#5a624f] max-h-[72px] overflow-y-auto">
                {buildDemoPixCode(s.gift.priceReais)}
              </div>

              <button
                type="button"
                onClick={() => s.copyPixCode(buildDemoPixCode(s.gift!.priceReais))}
                className="mt-3.5 w-full text-[11.5px] tracking-[0.22em] uppercase bg-[#3d4a36] text-[#f2efe7] py-3.5 border border-[#3d4a36] transition-colors hover:bg-[#b8985f] hover:border-[#b8985f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8985f]"
              >
                {s.copied ? "Copiado ✓" : "Copiar código"}
              </button>

              <p className="mt-3.5 italic text-xs leading-relaxed text-[#3d4a36]/70">
                Assim que o Pix chegar, o seu carinho entra na nossa lista de
                agradecimentos — com nome e sobrenome.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
