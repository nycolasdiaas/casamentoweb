"use client";

import { useState } from "react";

const DEMO_GUESTS = ["Maria Silva", "João Silva", "Sofia Silva"];

type Answer = "yes" | "no" | null;

// RSVP de demonstração: mesma experiência do real, mas as respostas ficam
// só na tela — nada é enviado.
export default function DemoRsvp() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = DEMO_GUESTS.every((guest) => answers[guest]);

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 border border-(--color-gold) bg-white/50 p-8 text-center">
        <p className="font-script text-2xl text-(--color-olive)">
          Presença confirmada!
        </p>
        <p className="font-serif text-sm text-(--color-olive) max-w-xs leading-relaxed">
          É assim que seus convidados confirmam presença — e você acompanha
          tudo em tempo real no painel do casal.
        </p>
        <button
          type="button"
          onClick={() => {
            setAnswers({});
            setSubmitted(false);
          }}
          className="mt-2 font-serif text-xs text-(--color-olive) underline"
        >
          Testar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 border border-(--color-gold) bg-white/50 p-6 sm:p-8">
      <div className="flex flex-col gap-1 text-center">
        <p className="font-serif text-xs tracking-[0.2em] uppercase text-(--color-muted)">
          Convite da família
        </p>
        <p className="font-script text-2xl text-(--color-olive)">
          Família Silva
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {DEMO_GUESTS.map((guest) => {
          const answer = answers[guest] ?? null;
          return (
            <li
              key={guest}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-gold)/40 pb-3"
            >
              <span className="font-serif text-sm text-(--color-olive)">
                {guest}
              </span>
              <div className="flex gap-2">
                {(
                  [
                    ["yes", "Vou 💚"],
                    ["no", "Não vou"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [guest]: value }))
                    }
                    className={`font-serif text-xs px-4 py-2 border transition-colors ${
                      answer === value
                        ? "bg-(--color-olive) border-(--color-olive) text-white"
                        : "border-(--color-gold) text-(--color-olive) hover:bg-(--color-blush)"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        disabled={!allAnswered}
        onClick={() => setSubmitted(true)}
        className="bg-(--color-olive) text-white py-3 font-serif text-xs tracking-[0.15em] uppercase disabled:opacity-40 transition-opacity"
      >
        Confirmar respostas
      </button>
      <p className="font-serif text-[11px] text-(--color-muted) text-center">
        Exemplo interativo — nenhuma resposta é enviada.
      </p>
    </div>
  );
}
