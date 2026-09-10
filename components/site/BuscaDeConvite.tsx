"use client";

import { useActionState } from "react";

export type BuscaState = { erro: true; nome: string } | undefined;

/**
 * A busca "não recebi meu link", do lado do convidado.
 *
 * ── Por que é um componente cliente ────────────────────────────────────────
 *
 * Para o nome digitado sobreviver ao erro SEM passar pela URL.
 *
 * Antes, não encontrar o nome redirecionava para
 * `?erro=1&nome=Maria%20Souza`. O texto voltava preenchido — que é o
 * comportamento certo, ninguém deve redigitar o nome inteiro —, mas o preço
 * era o nome de uma pessoa real gravado no log do servidor, no histórico do
 * navegador e no cabeçalho `Referer` de tudo que a página carregasse depois.
 * Num produto que faz questão de nunca gravar IP do convidado (o
 * `visitor_hash` das métricas é HMAC com sal que gira a cada 24h), o nome
 * completo dele viajando em query string destoava.
 *
 * `useActionState` devolve o valor pelo estado do formulário: mesma
 * experiência, sem deixar rastro.
 */
export default function BuscaDeConvite({
  acao,
  cores,
}: {
  acao: (prev: BuscaState, formData: FormData) => Promise<BuscaState>;
  cores: { ink: string; paper: string; accent: string };
}) {
  const [estado, formAction, pendente] = useActionState<BuscaState, FormData>(
    acao,
    undefined
  );

  return (
    <>
      <form action={formAction} className="mt-8 flex flex-col gap-3">
        <input
          type="text"
          name="nome"
          required
          minLength={3}
          defaultValue={estado?.nome ?? ""}
          autoComplete="name"
          placeholder="Maria Souza"
          aria-label="Seu nome completo"
          className="min-h-12 w-full border px-4 text-center text-[16px] outline-none"
          style={{
            borderColor: `color-mix(in srgb, ${cores.ink} 30%, transparent)`,
            background: `color-mix(in srgb, ${cores.paper} 85%, white)`,
            color: cores.ink,
          }}
        />
        <button
          type="submit"
          disabled={pendente}
          className="min-h-12 w-full text-[11.5px] uppercase tracking-[0.24em] transition-opacity hover:opacity-85 disabled:opacity-60"
          style={{ background: cores.ink, color: cores.paper }}
        >
          {pendente ? "Procurando…" : "Encontrar meu convite"}
        </button>
      </form>

      {estado?.erro && (
        <p
          role="alert"
          className="mt-5 text-[14px] leading-relaxed"
          style={{ color: cores.accent }}
        >
          Não encontramos esse nome na lista. Tente com o nome completo, do
          jeito que os noivos devem ter escrito — ou peça o link para eles.
        </p>
      )}
    </>
  );
}
