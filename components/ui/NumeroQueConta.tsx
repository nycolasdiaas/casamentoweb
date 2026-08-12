"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Um número que sobe até o valor, em vez de já estar lá.
 *
 * Onde ele cabe e onde NÃO cabe:
 *
 * - Cabe na contagem regressiva ("faltam 102 dias"): o número É a informação,
 *   e vê-lo subir reforça o que ele significa.
 * - NÃO cabe em preço. Contar de zero faz piscar "R$ 0,00" numa tela de
 *   pagamento, e um valor errado por um instante numa tela de dinheiro vale
 *   menos que o efeito. Se um dia entrar lá, tem de começar de um piso alto,
 *   não de zero.
 *
 * O valor final é o que sai no HTML do servidor: se o JS não rodar, o número
 * certo já está na tela. A contagem só decide COMO ele chega — a mesma regra
 * do `gsap.from` da coreografia de rolagem.
 */
export default function NumeroQueConta({
  valor,
  duracao = 900,
  className = "",
}: {
  valor: number;
  /** ms da contagem inteira */
  duracao?: number;
  className?: string;
}) {
  const [mostrado, setMostrado] = useState(valor);
  const alvo = useRef<HTMLSpanElement>(null);
  const jaContou = useRef(false);

  useEffect(() => {
    const el = alvo.current;
    if (!el || jaContou.current) return;

    // Movimento reduzido: o número aparece pronto. Contagem é movimento —
    // não é o que confirma uma ação, então sai.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Só conta quando entra na tela; contar fora da vista é contar para
    // ninguém, e ao rolar até lá o número já estaria parado.
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting || jaContou.current) return;
        jaContou.current = true;
        io.disconnect();

        const inicio = performance.now();
        let quadro = 0;
        const passo = (agora: number) => {
          const t = Math.min((agora - inicio) / duracao, 1);
          // Desaceleração forte, o mesmo peso do --e-saida do resto.
          const suave = 1 - Math.pow(1 - t, 3);
          setMostrado(Math.round(valor * suave));
          if (t < 1) quadro = requestAnimationFrame(passo);
        };
        setMostrado(0);
        quadro = requestAnimationFrame(passo);
        return () => cancelAnimationFrame(quadro);
      },
      { rootMargin: "0px 0px -10% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [valor, duracao]);

  return (
    <span ref={alvo} className={className}>
      {mostrado.toLocaleString("pt-BR")}
    </span>
  );
}
