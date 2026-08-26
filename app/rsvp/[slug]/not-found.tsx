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
 * H2 · confirmação de presença com link quebrado.
 *
 * ATENÇÃO: `/rsvp/<slug>` é a rota com gente real — 22 confirmações e links
 * já no WhatsApp (AGENTS.md §2). Esta tela é só o que aparece quando o slug
 * NÃO casa; o caminho feliz não passa por aqui. Nada neste arquivo pode
 * mudar isso.
 *
 * O que estava aqui era uma frase solta e centralizada, sem saída nenhuma —
 * beco sem saída, que a prancha H trata como bug.
 */
export default function RsvpNaoEncontrado() {
  return (
    <BecoComSaida
      codigo="Convite não encontrado"
      titulo="Não achamos esse convite"
      saidaPrincipal={{ rotulo: "Ir para a Enlace", href: "/" }}
      rodape="Se o link veio pelo WhatsApp, tente abrir no navegador em vez do app — ele às vezes corta o fim do endereço."
    >
      <p>
        O link pode ter sido atualizado pelos noivos, ou ter vindo cortado.
        Peça a eles para reenviar — leva um segundo.
      </p>
    </BecoComSaida>
  );
}
