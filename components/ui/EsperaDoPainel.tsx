"use client";

import { useState } from "react";
import BrandLoader from "@/components/ui/BrandLoader";
import MotionProvider from "@/components/ui/MotionProvider";
import SiteSkeleton from "@/components/ui/SiteSkeleton";

/** Marca que a próxima espera dentro de /conta é a continuação de um envio. */
export const CHAVE_CRIANDO = "enlace:criando-site";

/**
 * A espera do painel — que precisa saber DE ONDE a pessoa veio.
 *
 * O defeito que isto conserta:
 *
 *   1. O casal clica em "Criar nosso site" e vê o ESQUELETO do site sendo
 *      montado (`CelebrationScreen`, fixed z-[60]).
 *   2. `submitOrderAction` provisiona e termina em `redirect("/conta")`.
 *   3. O `template.tsx` de /conta REMONTA na navegação — é assim que ele faz a
 *      transição tocar de novo — e mostra o fallback do seu `<Suspense>`.
 *   4. A árvore antiga morre junto com o esqueleto, e no lugar aparece a tela
 *      da logo ("Abrindo…").
 *
 * Não era sobreposição: o `BrandLoader` não tem `z-index` nem `fixed`. Era
 * SUBSTITUIÇÃO. E o resultado é que o casal via duas telas de espera
 * diferentes para uma ação só — sendo que a boa, a que mostra o site
 * nascendo, era justamente a que era cortada no meio.
 *
 * Aqui a espera continua a frase anterior em vez de começar outra.
 *
 * O sinal vai por `sessionStorage` e não por query string de propósito: a URL
 * de destino é a do hub e não deve carregar estado de navegação — se o casal
 * salvar ou compartilhar o link, ele não pode vir com "?criando=1" grudado.
 */
export default function EsperaDoPainel() {
  // Leitura síncrona no inicializador: se fosse num efeito, o BrandLoader
  // apareceria por um quadro antes de dar lugar ao esqueleto — e um flash de
  // tela errada é pior que a tela errada inteira.
  //
  // Sem risco de divergência de hidratação: no servidor cai no `false`, e a
  // única vez em que a bandeira existe é durante uma navegação no cliente,
  // que não passa por SSR.
  const [criandoSite] = useState(() => {
    if (typeof window === "undefined") return false;
    const marcado = window.sessionStorage.getItem(CHAVE_CRIANDO) === "1";
    // Consome na leitura: vale para a PRÓXIMA espera, uma vez só. Sem isto,
    // qualquer navegação seguinte dentro do painel herdaria o esqueleto.
    if (marcado) window.sessionStorage.removeItem(CHAVE_CRIANDO);
    return marcado;
  });

  if (!criandoSite) {
    return (
      <BrandLoader
        label="Abrindo…"
        sublabel="Buscando as informações de vocês."
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="w-full max-w-[300px] sm:max-w-[360px]">
        <MotionProvider>
          <SiteSkeleton className="shadow-2xl" />
        </MotionProvider>
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-base font-semibold text-(--color-olive)">
          Site criado!
        </p>
        <p className="text-sm text-(--color-olive)/70">
          Abrindo o painel de vocês.
        </p>
      </div>
    </div>
  );
}
