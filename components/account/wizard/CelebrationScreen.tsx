"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import MotionProvider from "@/components/ui/MotionProvider";
import SiteSkeleton from "@/components/ui/SiteSkeleton";

/**
 * A tela que cobre a criação do site — a que o Anderson apontou como faltando
 * ("quando eu crio o pedido não acontece nada").
 *
 * O motivo de não acontecer nada era uma decisão minha errada: a versão
 * anterior atrasava o aparecer em 180 ms e não tinha tempo mínimo, então numa
 * resposta rápida ela simplesmente nunca era vista. Aqui é o contrário —
 * **aparece na hora e dura o tempo REAL do provisionamento**.
 *
 * Ela NÃO segura nada. Uma versão intermediária tinha um piso de 2,6 s para
 * a animação ser vista por inteiro — e isso virou a crítica "ter que aguardar
 * o site", contra um concorrente que entrega em minutos. O provisionamento
 * leva ~1 s; o resto era espera inventada. Se o servidor responder em 800 ms,
 * esta tela dura 800 ms.
 */

// Ritmo da cascata, NÃO tempo de espera.
//
// Era 2600ms, e eu o havia escolhido para a animação ser vista por inteiro.
// Só que o provisionamento leva ~1s: o resto era espera que eu inventei — e
// "ter que aguardar o site" foi exatamente a crítica que voltou, contra um
// concorrente que entrega em minutos e não faz o casal esperar.
//
// Agora só distribui as etapas dentro do tempo REAL. A tela vive enquanto
// `ativo`, que é do clique até o redirecionamento; se o servidor responder em
// 800ms, ela dura 800ms.
const RITMO_MS = 1200;

const ETAPAS = [
  "Registrando o pedido de vocês",
  "Criando o site com o estilo escolhido",
  "Montando as seções do pacote",
  "Preparando o link da prévia",
] as const;

/** Pétalas caindo. Posição e ritmo fixos por índice — nada de Math.random(),
 *  que geraria marcação diferente no servidor e no cliente (erro de hidratação). */
const PETALAS = Array.from({ length: 14 }, (_, i) => ({
  esquerda: (i * 37) % 100,
  atraso: (i % 7) * 0.45,
  duracao: 4.5 + (i % 5) * 0.7,
  tamanho: 6 + (i % 4) * 3,
  giro: (i % 3) * 40,
}));

export default function CelebrationScreen({
  ativo,
  accent,
  nome,
  onTerminou,
}: {
  ativo: boolean;
  accent?: string | null;
  /** primeiro nome do casal, para a tela falar com quem está olhando */
  nome?: string | null;
  /** avisa que o mínimo já passou — quem chama decide o que fazer */
  onTerminou?: () => void;
}) {
  const [etapa, setEtapa] = useState(0);
  const [progresso, setProgresso] = useState(4);

  useEffect(() => {
    if (!ativo) return;

    const passoMs = RITMO_MS / ETAPAS.length;
    const timers = ETAPAS.slice(1).map((_, i) =>
      setTimeout(() => setEtapa(i + 1), passoMs * (i + 1))
    );

    // A barra sobe até 92% no tempo mínimo e PARA. Os 8% que faltam só
    // fecham quando o servidor responde de verdade: uma barra que chega a
    // 100% e continua girando é a mentira clássica de tela de carregamento.
    const subida = setInterval(() => {
      setProgresso((p) => (p >= 92 ? 92 : p + 2));
    }, RITMO_MS / 46);

    const fim = setTimeout(() => onTerminou?.(), RITMO_MS);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(subida);
      clearTimeout(fim);
      setEtapa(0);
      setProgresso(4);
    };
  }, [ativo, onTerminou]);

  if (!ativo) return null;

  const tinta = accent || "#2f3a29";

  return (
    <div
      role="status"
      aria-live="polite"
      className="motion-fade-in fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{
        background: `linear-gradient(160deg, var(--color-paper), color-mix(in srgb, ${tinta} 12%, var(--color-paper)))`,
      }}
    >
      {/* Pétalas. `aria-hidden` porque é enfeite: anunciar 14 divs vazias a
          quem usa leitor de tela seria ruído puro. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {PETALAS.map((p, i) => (
          <span
            key={i}
            className="motion-petal absolute top-0 block rounded-full"
            style={{
              left: `${p.esquerda}%`,
              width: p.tamanho,
              height: p.tamanho,
              background: `color-mix(in srgb, ${tinta} ${45 + (i % 4) * 12}%, transparent)`,
              animationDelay: `${p.atraso}s`,
              animationDuration: `${p.duracao}s`,
              ["--giro" as string]: `${p.giro}deg`,
            }}
          />
        ))}
      </div>

      {/* O ESQUELETO É O PROTAGONISTA, não um enfeite ao lado do texto.
          Ele estava em `hidden sm:block` com teto de 260px: sumia no celular —
          que é de onde a maioria envia o pedido — e no desktop era pequeno
          demais para ser lido como "o site está nascendo". Agora ele lidera, e
          o texto o acompanha. */}
      <div className="relative flex w-full max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
        <div className="order-2 w-full max-w-[300px] sm:max-w-[360px] lg:order-1 lg:max-w-[420px]">
          <MotionProvider>
            <SiteSkeleton accent={accent} className="shadow-2xl" />
          </MotionProvider>
        </div>

        <div className="order-1 flex flex-col items-center gap-6 lg:order-2 lg:items-start lg:text-left">
          <Image
            src="/logo-enlace.png"
            alt=""
            aria-hidden
            width={72}
            height={72}
            className="motion-breathe size-16 object-contain"
          />

          <div className="flex flex-col items-center gap-2 lg:items-start">
            <h2 className="text-2xl font-semibold text-(--color-olive) sm:text-3xl">
              {nome ? `Vamos criar o site de vocês, ${nome}!` : "Vamos criar o site de vocês!"}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-(--color-olive)/70">
              Falta pouco para deixarmos tudo pronto para o grande dia.
            </p>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-olive)/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progresso}%`,
                  background: tinta,
                  transition: "width 400ms var(--e-saida)",
                }}
              />
            </div>
            <p
              key={etapa}
              className="motion-fade-in text-xs text-(--color-olive)/70"
            >
              {ETAPAS[etapa]}…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
