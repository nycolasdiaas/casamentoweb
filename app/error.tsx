"use client";

import BecoComSaida from "@/components/site/BecoComSaida";

/**
 * A tela de quando o produto falha — em português, e com saída.
 *
 * ── Por que ela não existia, e o que isso custou ───────────────────────────
 *
 * Sem um `error.tsx`, quem falha é o Next: a página inteira é trocada por
 *
 *     This page couldn't load
 *     A server error occurred. Reload to try again.
 *     ERROR 4188337955
 *
 * Em inglês, com um número, e sem nada clicável além de "Reload". Foi o que a
 * auditoria de 11/09/2026 encontrou quando o casal clicava em "Criar convite"
 * (UX-002): o convite é o produto inteiro do pacote de R$ 9,90, e o casal
 * batia numa tela que não é do produto, não fala a língua dele e não leva a
 * lugar nenhum.
 *
 * As três regras de `BecoComSaida` valem aqui como valem para o convidado:
 * dizer o que houve, não culpar ninguém, e sempre oferecer uma saída. A
 * diferença é que aqui existe uma saída a mais — tentar de novo —, porque
 * falha de servidor costuma ser passageira, e o casal está logado.
 */
export default function ErroDoProduto({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <BecoComSaida
      codigo="Alguma coisa falhou"
      titulo="Essa tela não abriu"
      saidaPrincipal={{ rotulo: "Ir para meus pedidos", href: "/conta/pedidos" }}
      saidaSecundaria={{ rotulo: "Início", href: "/" }}
      rodape="Se acontecer de novo na mesma tela, vale tentar daqui a alguns minutos — o problema é do nosso lado, não do que vocês fizeram."
      cartao={
        <button type="button" onClick={reset} className="btn-primary">
          Tentar de novo
        </button>
      }
    >
      <p>
        O problema foi do nosso lado. Nada do que vocês já salvaram se perdeu —
        o site, as fotos e as respostas continuam guardados.
      </p>
    </BecoComSaida>
  );
}
