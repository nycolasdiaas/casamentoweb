"use client";

import { LazyMotion } from "motion/react";

/**
 * Carrega o motor do Motion sob demanda.
 *
 * O `motion` completo pesa ~34 KB gzip. Com `LazyMotion` + o componente `m`,
 * o custo inicial cai para ~4,6 KB e o resto chega depois da primeira pintura.
 * A diferença é a que decide se dá para usar no site do convidado, que abre
 * pelo WhatsApp no celular.
 *
 * `domAnimation` (e não `domMax`) de propósito: traz entrada/saída, gestos e
 * variantes — não traz layout animation nem drag, que nada aqui usa. `domMax`
 * dobraria o pacote para pagar por recurso que ninguém pediu.
 */
const carregarMotor = () =>
  import("motion/react").then((mod) => mod.domAnimation);

export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LazyMotion features={carregarMotor} strict>
      {children}
    </LazyMotion>
  );
}
