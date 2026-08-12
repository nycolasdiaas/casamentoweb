"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHAVE = "enlace:movimento";
const CONSULTA = "(prefers-reduced-motion: reduce)";

/**
 * Deixa a pessoa LIGAR o movimento mesmo com o sistema pedindo menos.
 *
 * Por que isto existe, e por que não é furar a acessibilidade:
 *
 * `prefers-reduced-motion` é a preferência do SISTEMA — vale para tudo, e é a
 * resposta certa por padrão. Mas ela é grossa: quem desligou os efeitos do
 * Windows por causa de parallax e carrossel automático não necessariamente
 * quer perder uma entrada suave de 320ms. Um override POR SITE, guardado
 * localmente e **desligado por padrão**, é o padrão aceito para isso — o
 * sistema continua mandando até que a pessoa, naquele site, diga outra coisa.
 *
 * O botão só aparece para quem tem `reduce` ligado: para os demais não há o
 * que ligar, e um interruptor que não faz nada é pior que interruptor nenhum.
 *
 * `useSyncExternalStore` e não `useState` + `useEffect`: o estado mora fora do
 * React (media query e localStorage). Com efeito, a primeira pintura viria
 * errada e seria corrigida no quadro seguinte — além de tropeçar no
 * `react-hooks/set-state-in-effect`. Aqui o snapshot do servidor é `false`,
 * então o botão não existe no HTML e aparece já com o valor certo.
 */

function assinarMedia(aoMudar: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", aoMudar);
  return () => mq.removeEventListener("change", aoMudar);
}

/** Ouve `storage` (outra aba) e um evento próprio (esta aba). */
function assinarPreferencia(aoMudar: () => void) {
  window.addEventListener("storage", aoMudar);
  window.addEventListener("enlace:movimento-mudou", aoMudar);
  return () => {
    window.removeEventListener("storage", aoMudar);
    window.removeEventListener("enlace:movimento-mudou", aoMudar);
  };
}

export default function InterruptorDeMovimento({
  className = "",
}: {
  className?: string;
}) {
  const pedeMenos = useSyncExternalStore(
    assinarMedia,
    () => window.matchMedia(CONSULTA).matches,
    () => false
  );

  const ligado = useSyncExternalStore(
    assinarPreferencia,
    () => window.localStorage.getItem(CHAVE) === "ligado",
    () => false
  );

  const alternar = useCallback(() => {
    const novo = !(window.localStorage.getItem(CHAVE) === "ligado");
    if (novo) {
      window.localStorage.setItem(CHAVE, "ligado");
      document.documentElement.dataset.movimento = "ligado";
    } else {
      window.localStorage.removeItem(CHAVE);
      delete document.documentElement.dataset.movimento;
    }
    window.dispatchEvent(new Event("enlace:movimento-mudou"));
  }, []);

  if (!pedeMenos) return null;

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={ligado}
      className={`underline underline-offset-2 transition-opacity hover:opacity-70 ${className}`}
    >
      {ligado ? "Desativar animações" : "Ativar animações"}
    </button>
  );
}
