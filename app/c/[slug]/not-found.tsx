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
 * H2 · o convite saiu do ar.
 *
 * Diferente do H1 num ponto que importa: aqui o casamento provavelmente
 * EXISTE — o que sumiu foi um convite de grupo. A regra da prancha é oferecer
 * o site do casamento como alternativa sempre que ele continuar de pé.
 *
 * Não dá para linkar o site específico daqui: o `not-found` não recebe os
 * parâmetros da rota que o disparou. Então a saída é a busca da Enlace, e o
 * texto diz explicitamente que o site continua funcionando — para o convidado
 * não concluir que o casamento foi cancelado.
 */
export default function ConviteIndisponivel() {
  return (
    <BecoComSaida
      codigo="Convite indisponível"
      titulo="Este convite não está mais disponível"
      saidaPrincipal={{ rotulo: "Ir para a Enlace", href: "/" }}
      rodape="Acha que é engano? Fale direto com os noivos — eles geram um convite novo em segundos."
    >
      <p>
        Os noivos podem ter atualizado o link ou tirado o convite do ar por
        enquanto. O site do casamento continua funcionando.
      </p>
    </BecoComSaida>
  );
}
