"use client";

import { useActionState, useState } from "react";
import { trocarSenhaAction } from "@/app/actions/account-actions";
import { Botao, Campo } from "@/components/ui/prensa";

/**
 * Trocar a senha dentro da conta.
 *
 * Fica fechado até o casal pedir: é uma ação rara, e três campos abertos no
 * meio de "Dados da conta" fariam a tela parecer um formulário de cadastro
 * em vez de um resumo. Ver `trocarSenhaAction` para o porquê de pedir a senha
 * atual.
 */
export default function TrocarSenha() {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState(trocarSenhaAction, undefined);

  if (estado?.ok) {
    return (
      <p role="status" className="text-[13.5px] text-(--c-ink-2)">
        Senha trocada ✓ A próxima vez que entrarem, é a nova.
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="self-start text-[13.5px] text-(--c-ink) underline underline-offset-4"
      >
        Alterar senha
      </button>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-3">
      <Campo
        rotulo="Senha atual"
        type="password"
        name="senhaAtual"
        autoComplete="current-password"
        required
      />
      <Campo
        rotulo="Senha nova"
        type="password"
        name="senhaNova"
        autoComplete="new-password"
        minLength={8}
        required
        ajuda="Mínimo de 8 caracteres."
        erro={estado?.error}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Botao type="submit" carregando={pendente}>
          Salvar senha nova
        </Botao>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-[13px] text-(--c-ink-2) underline underline-offset-4"
        >
          Deixar como está
        </button>
      </div>
    </form>
  );
}
