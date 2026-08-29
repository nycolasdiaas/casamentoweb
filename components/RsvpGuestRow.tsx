"use client";

import { useState, useTransition } from "react";

export type RsvpStatus = "pending" | "confirmed" | "declined";

type RsvpGuestRowProps = {
  guestId: string;
  name: string;
  status: RsvpStatus;
  onRespond: (
    guestId: string,
    status: "confirmed" | "declined"
  ) => Promise<unknown>;
};

const FEEDBACK: Record<RsvpStatus, string> = {
  pending: "",
  confirmed: "Que alegria! Mal podemos esperar para celebrar com você.",
  declined: "Sentiremos sua falta, mas obrigado por nos avisar.",
};

/**
 * A escolha do convidado — o desenho da prancha F4.
 *
 * ── O que muda, e por quê ──────────────────────────────────────────────────
 *
 * Eram dois botões estreitos lado a lado, com o rótulo em CAIXA ALTA e
 * `tracking` aberto num tamanho pequeno. No celular — que é de onde
 * praticamente todo convidado abre o link do WhatsApp — "NÃO VOU PODER
 * COMPARECER" quebrava em três linhas dentro de uma caixa apertada, e o
 * não-selecionado saía em `--color-muted`, que é o cinza mais claro da paleta
 * sobre um fundo já claro.
 *
 * A prancha resolve com DUAS FICHAS grandes, empilhadas no celular, cada uma
 * com uma segunda linha na voz dos noivos. A segunda linha não é enfeite: ela
 * é o que faz "não posso" deixar de parecer o botão errado.
 *
 * ── O que NÃO muda ─────────────────────────────────────────────────────────
 *
 * O rótulo e o contrato. `onRespond(guestId, status)` é o mesmo, a resposta
 * continua sendo por CONVIDADO (a prancha desenha por grupo, que é outro
 * modelo de dados — ver o relatório), e o texto dos botões continua o mesmo
 * para os testes que protegem esta tela seguirem valendo. Este é o `/rsvp` com
 * 22 confirmações de gente real e link já no WhatsApp: aqui se melhora o
 * desenho sem mexer no que responde.
 *
 * A cor sai do tema do CASAL (`--color-*`), nunca da Prensa. No site e no RSVP
 * a Enlace desaparece — quem convida são os noivos (Voz e Microcopy V2).
 */
export default function RsvpGuestRow({
  guestId,
  name,
  status,
  onRespond,
}: RsvpGuestRowProps) {
  const [currentStatus, setCurrentStatus] = useState<RsvpStatus>(status);
  const [isPending, startTransition] = useTransition();

  function handleClick(next: "confirmed" | "declined") {
    setCurrentStatus(next);
    startTransition(async () => {
      await onRespond(guestId, next);
    });
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="font-script text-3xl text-(--color-gold)">{name}</p>

      {/* Empilhado no celular, lado a lado a partir de 480px: duas fichas com
          duas linhas de texto não cabem em 390px sem virar caixa apertada. */}
      <div className="flex flex-col min-[480px]:flex-row gap-3 w-full">
        <RsvpButton
          label="Sim, vou comparecer"
          nota="mal podemos esperar"
          active={currentStatus === "confirmed"}
          disabled={isPending}
          onClick={() => handleClick("confirmed")}
        />
        <RsvpButton
          label="Não vou poder comparecer"
          nota="vamos sentir sua falta"
          active={currentStatus === "declined"}
          disabled={isPending}
          onClick={() => handleClick("declined")}
        />
      </div>

      {currentStatus !== "pending" && (
        <p
          aria-live="polite"
          className="font-script text-2xl text-(--color-olive) leading-snug"
        >
          {FEEDBACK[currentStatus]}
        </p>
      )}
    </div>
  );
}

function RsvpButton({
  label,
  nota,
  active,
  disabled,
  onClick,
}: {
  label: string;
  nota: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      // `aria-pressed` faltava: sem ele o leitor de tela anuncia dois botões
      // idênticos e não diz qual está escolhido.
      aria-pressed={active}
      className={`flex-1 min-h-[76px] px-4 py-4 border text-center transition-colors disabled:opacity-60 ${
        active
          ? "bg-(--color-olive) border-(--color-olive) text-white"
          : "bg-transparent border-(--color-gold) text-(--color-olive) hover:bg-(--color-gold)/10"
      }`}
    >
      <span className="block font-serif text-[17px] leading-tight">
        {label}
      </span>
      <span
        className={`block text-[12.5px] leading-snug mt-1 ${
          active ? "text-white/75" : "text-(--color-olive)/65"
        }`}
      >
        {nota}
      </span>
    </button>
  );
}
