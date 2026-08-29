"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth-actions";
import { Botao, Campo } from "@/components/ui/prensa";
import { SITE_NAME } from "@/lib/site";

/**
 * G1 · GET /admin/login → POST loginAction
 *
 * A tela estava em `font-serif` — a Italiana dos MOLDES, que não é fonte da
 * plataforma — com os dois campos usando placeholder no lugar de rótulo e um
 * botão pálido que sumia no fundo escuro. O tema escuro do admin já existia no
 * layout; o que faltava era esta tela usá-lo.
 *
 * O botão fica em `--mark`, e não em tinta: no escuro, um botão de tinta sobre
 * fundo de tinta é um retângulo invisível. É a inversão documentada em
 * `globals.css`, sob `.ui-prensa.admin`.
 *
 * O que NÃO entrou do artboard: a linha "Sessão protegida · 2FA ativo". Não
 * existe segundo fator neste login — escrever isso seria anunciar uma
 * proteção que não protege, e num painel que dá acesso a todos os pedidos.
 */
export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(
    async (_prevState: { error?: string } | undefined, formData: FormData) => {
      return loginAction(formData);
    },
    undefined
  );

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-[340px] flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-enlace.png"
              alt=""
              width={30}
              height={30}
              className="h-[30px] w-auto object-contain"
            />
            <span className="t-display text-[26px] leading-none text-(--c-ink)">
              {SITE_NAME}
            </span>
          </div>
          <span className="meta text-[11px] text-(--c-ink-2)">
            Painel interno · acesso restrito
          </span>
        </div>

        <form action={action} className="flex flex-col gap-5">
          <Campo
            rotulo="E-mail"
            type="email"
            name="email"
            autoComplete="username"
            required
          />
          <Campo
            rotulo="Senha"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            erro={state?.error}
          />
          <Botao type="submit" carregando={pending} larguraCheia className="mt-1">
            Entrar no painel
          </Botao>
        </form>
      </div>
    </main>
  );
}
