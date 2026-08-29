"use client";

import { useState } from "react";
import Icone from "./Icone";

/**
 * Copiar um endereço, com confirmação no próprio botão.
 *
 * O "Copiado!" fica DENTRO do botão e volta sozinho em 2s. Um brinde (toast)
 * para isto seria movimento demais para uma ação de meio segundo — e a
 * confirmação precisa aparecer onde o dedo está, não no canto da tela.
 *
 * A troca de rótulo sobrevive a `prefers-reduced-motion` de propósito: ela
 * confirma uma ação, é informação, e a Fundação separa isso de decoração.
 */
export default function CopiarLink({
  url,
  rotulo = "Copiar link",
  className,
}: {
  /** Endereço completo. Quem chama monta — este componente não adivinha rota. */
  url: string;
  rotulo?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência (http, navegador antigo): o
      // endereço continua visível e selecionável ao lado. Falhar em silêncio
      // é melhor que um alerta para uma ação que tem alternativa óbvia.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className={`btn btn-quiet btn-sm ${className ?? ""}`}
    >
      <Icone nome={copiado ? "check" : "copiar"} tamanho={16} />
      {copiado ? "Copiado" : rotulo}
    </button>
  );
}
