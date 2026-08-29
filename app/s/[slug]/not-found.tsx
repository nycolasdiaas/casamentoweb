import type { Metadata } from "next";
import BecoComSaida from "@/components/site/BecoComSaida";

/* Tela de falha nunca é conteúdo de busca. Regra da prancha H:
   "Nenhuma delas indexável (noindex)." Sem isto, o Google acaba
   indexando "Não achamos esse casamento" no endereço de um casal —
   e o resultado de busca passa a anunciar que o casamento não existe. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * H1 · o endereço do casamento não existe.
 *
 * O caso mais comum não é link inventado: é link truncado. O WhatsApp corta o
 * fim de endereços longos em alguns temas, e o convidado cola o pedaço. Por
 * isso a dica do rodapé fala em abrir no navegador — e por isso o texto pede
 * para conferir o fim do link, não acusa o link de estar errado.
 */
export default function SiteNaoEncontrado() {
  return (
    <BecoComSaida
      codigo="Endereço não encontrado"
      titulo="Não achamos esse casamento"
      saidaPrincipal={{ rotulo: "Ir para a Enlace", href: "/" }}
      rodape="Se o link veio pelo WhatsApp, vale tentar abrir no navegador em vez do app — ele às vezes corta o fim do endereço."
    >
      <p>
        Esse endereço não existe ou mudou. Vale conferir o link que os noivos
        mandaram — às vezes falta um pedaço no fim.
      </p>
    </BecoComSaida>
  );
}
