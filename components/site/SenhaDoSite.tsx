"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  entrarNoSiteAction,
  type EntrarNoSiteResult,
} from "@/app/actions/site-actions";
import { uiPrensa } from "@/lib/fonts/ui";

/**
 * H4 · o site está protegido por senha.
 *
 * ── Por que esta tela mostra tão pouco ─────────────────────────────────────
 *
 * Ela mostra **os nomes do casal e nada mais**. Nem data, nem local, nem foto
 * do casal. O site é privado por decisão de quem casa, e uma tela de senha que
 * vaza metade do conteúdo protege metade — que é o mesmo que não proteger.
 *
 * A foto de fundo é a única imagem, e é de PAPELARIA (`aneis.png`), não do
 * casal: ela dá a temperatura da tela sem entregar ninguém. Quem tem o link
 * mas não a senha vê que existe um casamento e de quem é — o suficiente para
 * saber que está no lugar certo e pedir a senha a quem convidou.
 *
 * ── O erro fica embaixo do campo ───────────────────────────────────────────
 *
 * Regra da prancha H, literal: "errar a senha não recarrega a página; mostra
 * erro embaixo do campo". `useActionState` mantém a tela montada e o campo
 * onde estava.
 */
export default function SenhaDoSite({
  slug,
  nomesDoCasal,
}: {
  slug: string;
  nomesDoCasal: string | null;
}) {
  const [estado, entrar, entrando] = useActionState(
    entrarNoSiteAction.bind(null, slug),
    undefined as EntrarNoSiteResult
  );

  return (
    <main
      className={`${uiPrensa} flex-1 grid grid-cols-1 lg:grid-cols-2 bg-(--c-paper-warm) text-(--c-ink)`}
    >
      {/* A foto fica em cima no celular e à esquerda no desktop, como o
          desenho. `order-first` para o `lg:order-none` devolver a ordem. */}
      <div className="relative min-h-[190px] overflow-hidden lg:min-h-[520px]">
        <Image
          src="/enlace/aneis.png"
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          style={{ filter: "saturate(.9) brightness(.94) sepia(.05)" }}
          priority
        />
        <div
          className="absolute inset-0 bg-linear-to-b from-black/15 to-black/35"
          aria-hidden="true"
        />
      </div>

      <div className="flex items-center justify-center px-6 py-14 lg:px-14">
        <div className="w-full max-w-[360px]">
          <p className="meta text-(--c-ink-2)">Site privado</p>

          <h1 className="t-d2 mt-3 text-(--c-ink)">
            {nomesDoCasal ?? "Este casamento"}
          </h1>

          <p className="t-corpo-p mt-3 text-(--c-ink-2)">
            Os noivos protegeram este site. Digite a senha que veio no convite.
          </p>

          <form action={entrar} className="mt-6 flex flex-col gap-3">
            <label htmlFor="senha" className="sr-only">
              Senha do site
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="off"
              // `tracking` largo porque o campo é de senha e o desenho mostra
              // os pontos espaçados — ajuda a conferir o que se digitou.
              className="campo tracking-[0.2em]"
              aria-invalid={estado?.erro ? true : undefined}
              aria-describedby={estado?.erro ? "erro-da-senha" : undefined}
            />

            {estado?.erro && (
              <p id="erro-da-senha" role="alert" className="erro-do-campo">
                {estado.erro}
              </p>
            )}

            <button
              type="submit"
              disabled={entrando}
              className="btn btn-ink btn-g mt-1 w-full"
            >
              Entrar
              {entrando && <span className="btn-rodinha" aria-hidden="true" />}
            </button>
          </form>

          <p className="t-corpo-p mt-5 text-(--c-ink-2)">
            Não tem a senha? Peça para quem te convidou.
          </p>
        </div>
      </div>
    </main>
  );
}
