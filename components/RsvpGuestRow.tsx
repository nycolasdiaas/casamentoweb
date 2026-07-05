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
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="font-script text-3xl text-(--color-gold)">{name}</p>

      <div className="flex gap-3 w-full">
        <RsvpButton
          label="SIM, VOU COMPARECER"
          active={currentStatus === "confirmed"}
          disabled={isPending}
          onClick={() => handleClick("confirmed")}
        />
        <RsvpButton
          label="NÃO VOU PODER COMPARECER"
          active={currentStatus === "declined"}
          disabled={isPending}
          onClick={() => handleClick("declined")}
        />
      </div>

      {currentStatus !== "pending" && (
        <p className="font-script text-2xl text-(--color-olive) leading-snug">
          {FEEDBACK[currentStatus]}
        </p>
      )}
    </div>
  );
}

function RsvpButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 py-4 px-2 font-serif text-sm tracking-[0.1em] border transition-colors disabled:opacity-50 ${
        active
          ? "bg-(--color-olive) border-(--color-olive) text-white"
          : "bg-transparent border-(--color-gold) text-(--color-muted)"
      }`}
    >
      {label}
    </button>
  );
}
