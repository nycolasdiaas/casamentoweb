"use client";

import { useState } from "react";
import CelebrationScreen from "@/components/account/wizard/CelebrationScreen";
import MotionProvider from "@/components/ui/MotionProvider";
import SiteSkeleton from "@/components/ui/SiteSkeleton";
import PendingVeil from "@/components/ui/PendingVeil";

/**
 * Mostra as telas de espera fora do fluxo real.
 *
 * Serve para separar duas causas que se confundem: "o componente não
 * funciona" e "o gatilho não dispara". Se a celebração aparecer aqui e não
 * aparecer ao criar o pedido, o defeito é no gatilho — e foi exatamente esse o
 * caso (o estado era ligado dentro da action, e o React adia atualizações
 * feitas dentro de uma transição).
 */
export default function DiagnosticoTelas() {
  const [celebrando, setCelebrando] = useState(false);
  const [velando, setVelando] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-(--color-gold)/40 bg-white p-5">
      <p className="text-sm font-medium">As telas de espera</p>

      <CelebrationScreen
        ativo={celebrando}
        accent="#b8985f"
        nome="Anderson"
        onTerminou={() => setCelebrando(false)}
      />
      <PendingVeil
        ativo={velando}
        label="Criando a conta de vocês"
        sublabel="Guardando os dados e preparando o e-mail de confirmação."
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCelebrando(true)}
          className="btn btn-primary btn-sm"
        >
          Ver a celebração
        </button>
        <button
          type="button"
          onClick={() => {
            setVelando(true);
            setTimeout(() => setVelando(false), 2500);
          }}
          className="btn btn-secondary btn-sm"
        >
          Ver o véu de carregamento
        </button>
      </div>

      <div className="flex flex-col gap-2 border-t border-(--color-gold)/30 pt-4">
        <p className="text-sm font-medium">O esqueleto do site</p>
        <p className="text-xs text-(--color-olive)/60">
          Os blocos entram em cascata e depois respiram em laço. É o mesmo que
          aparece dentro da celebração.
        </p>
        <div className="max-w-[260px] pt-1">
          <MotionProvider>
            <SiteSkeleton accent="#b8985f" />
          </MotionProvider>
        </div>
      </div>
    </div>
  );
}
