"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import CampoPacoteEscolhido from "@/components/account/CampoPacoteEscolhido";
import PendingVeil from "@/components/ui/PendingVeil";
import CascaDeConta from "@/components/account/CascaDeConta";
import { Botao, Campo } from "@/components/ui/prensa";
import { signupAction } from "@/app/actions/account-actions";
import { mascaraDeWhatsapp } from "@/lib/telefone";

/**
 * C2 · GET /conta/criar → POST signupAction
 *
 * A foto troca de lado em relação a `/conta/entrar` de propósito: são as duas
 * telas que a pessoa alterna quando erra a porta, e o espelhamento é o que
 * deixa claro, antes de ler, que ela mudou de tela.
 *
 * Os quatro campos e o `minLength={8}` continuam exatamente como estavam — o
 * 8 casa com o que `signupAction` exige no servidor.
 */
export default function SignupPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      return signupAction(formData);
    },
    undefined
  );

  return (
    <CascaDeConta
      titulo="Vamos começar"
      chamada="Crie a conta e responda o questionário. O site nasce no fim dele."
      foto={{
        src: "/enlace/noiva.png",
        lado: "direita",
        legenda: "Um site pronto antes do café esfriar.",
      }}
      rodape={
        <div className="flex flex-col gap-4">
          <p className="t-corpo-p text-(--c-ink-2) text-center">
            Já têm conta?{" "}
            <Link
              href="/conta/entrar"
              className="text-(--c-ink) underline underline-offset-4"
            >
              Entrar
            </Link>
          </p>
        </div>
      }
    >
      <PendingVeil
        ativo={pending}
        label="Criando a conta de vocês"
        sublabel="Guardando os dados de vocês com segurança."
      />

      <form action={action} className="flex flex-col gap-5">
        {/* O pacote escolhido na vitrine viaja até o questionário.
            Em <Suspense> porque ele lê a query string — ver o componente. */}
        <Suspense fallback={null}>
          <CampoPacoteEscolhido />
        </Suspense>
        <Campo
          rotulo="Nomes de vocês"
          name="name"
          placeholder={"Ana & Pedro"}
          autoComplete="name"
          required
        />
        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          required
        />
        {/* O campo aceitava "11" — dois dígitos — sem reclamar. É o canal por
            onde a gente avisa quando algo trava, então um número inválido
            aceito em silêncio derruba justamente a rota de socorro.

            O padrão é largo de propósito: aceita com e sem máscara, com e sem
            o nono dígito, e continua opcional. Ele barra o engano óbvio (o
            campo com meia dúzia de caracteres), não a formatação. */}
        <Campo
          rotulo="WhatsApp"
          type="tel"
          name="whatsapp"
          autoComplete="tel"
          inputMode="tel"
          pattern="[\s()+\-0-9]{10,20}"
          title="Com DDD — ex: (11) 98888-7777"
          ajuda="Com DDD. Opcional — é por onde a gente avisa se algo travar."
          /* A máscara enquanto digita: o campo mostrava "(11) 98888-7777" no
             exemplo e aceitava 11999998888 cru. Ver `lib/telefone.ts`. */
          onInput={(e) => {
            const campo = e.currentTarget;
            const fim = campo.selectionStart === campo.value.length;
            campo.value = mascaraDeWhatsapp(campo.value);
            if (fim) campo.setSelectionRange(campo.value.length, campo.value.length);
          }}
        />
        <Campo
          rotulo="Senha"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          ajuda="Mínimo de 8 caracteres."
          erro={state?.error}
        />

        {/* Aqui havia: "Vamos mandar um link no e-mail de vocês para confirmar
            a conta." Não íamos — a verificação de e-mail não existe na `main`
            (AGENTS.md §6: o código só sobrevive na branch órfã). O casal
            procurava no spam um e-mail que ninguém mandou, e alguns criavam a
            conta de novo achando que tinha falhado.

            Não pusemos outra promessa no lugar de propósito: a conta já está
            pronta quando o botão volta, e a próxima tela mostra isso. Quando a
            verificação for reconstruída, a frase volta — aí sendo verdade. */}
        <Botao type="submit" carregando={pending} larguraCheia className="mt-1">
          Criar conta
        </Botao>
      </form>
    </CascaDeConta>
  );
}
