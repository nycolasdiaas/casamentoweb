"use client";

import Image from "next/image";
import { useDelayedFlag } from "@/lib/ui/useDelayedFlag";

/**
 * Véu de espera com a marca, para ações que levam tempo de verdade — criar
 * conta (hash de senha + e-mail de confirmação), entrar, redefinir senha.
 *
 * Aparece na hora do clique e fica no mínimo ~700 ms — ver `useDelayedFlag`
 * para o porquê. Resumo: a versão anterior atrasava o aparecer e não segurava
 * nada, então numa resposta rápida ninguém via tela nenhuma. Meio segundo é o
 * preço de confirmar que o clique chegou.
 */
export default function PendingVeil({
  ativo,
  label,
  sublabel,
}: {
  ativo: boolean;
  label: string;
  sublabel?: string;
}) {
  const visivel = useDelayedFlag(ativo);
  if (!visivel) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="motion-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-(--color-paper)/95 px-6 text-center backdrop-blur-sm"
    >
      <Image
        src="/logo-enlace.png"
        alt=""
        aria-hidden
        width={64}
        height={64}
        className="motion-breathe size-14 object-contain"
      />
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-(--color-olive)">{label}</p>
        {sublabel && (
          <p className="max-w-xs text-xs leading-relaxed text-(--color-muted)">
            {sublabel}
          </p>
        )}
      </div>
      <div className="h-px w-32 overflow-hidden bg-(--color-gold)/20 text-(--color-gold)">
        <div className="motion-skeleton h-full w-full" />
      </div>
    </div>
  );
}
