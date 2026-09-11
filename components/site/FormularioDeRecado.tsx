"use client";

import { useActionState } from "react";
import { enviarRecadoAction } from "@/app/actions/guestbook-actions";
import { LIMITE_RECADO } from "@/lib/site/muralLimites";

/**
 * O formulário do mural, do lado do convidado.
 *
 * Duas regras do produto moram aqui:
 *
 * 1. **O convidado não cria conta, não instala nada, não escolhe nada.** São
 *    dois campos e um botão. Qualquer campo a mais (e-mail, telefone,
 *    "confirme que não é um robô") é trabalho que ele não pediu para fazer, e
 *    ele está aqui por afeto, não por obrigação.
 * 2. **Depois de enviar, ele vê o próprio recado.** O `updateTag` na action
 *    cuida disso; aqui o formulário só troca de estado para a mensagem de
 *    agradecimento — sem "sucesso!", sem exclamação, no passado ("está no
 *    mural"), como manda a Voz.
 *
 * Estilo por token do tema do casal, nunca hex: esta é marcação de seção e
 * `verify:template` reprova cor escrita à mão.
 */
export default function FormularioDeRecado({
  slug,
  convite,
}: {
  slug: string;
  convite?: string;
}) {
  const [estado, acao, pendente] = useActionState(
    async (
      _anterior:
        | { ok?: true; error?: string; valores?: Record<string, string>; marca?: number }
        | undefined,
      formData: FormData
    ) => enviarRecadoAction(slug, formData),
    undefined
  );

  /* O que o convidado escreveu continua na tela quando o envio é recusado.
     `key` no formulário porque `defaultValue` só vale quando o campo monta —
     ver a mesma nota em `ContentEditor`. */
  const recusado = estado && "error" in estado && estado.error ? estado : null;
  const digitado = recusado?.valores ?? {};

  const contorno = "1px solid color-mix(in srgb, var(--ink) 22%, transparent)";

  if (estado && "ok" in estado) {
    return (
      <p
        className="text-center text-[15px] leading-[1.7] py-6"
        style={{ color: "color-mix(in srgb, var(--ink) 75%, transparent)" }}
      >
        Seu recado está no mural. Obrigado por escrever.
      </p>
    );
  }

  return (
    <form
      key={recusado?.marca ?? "inicial"}
      action={acao}
      className="flex flex-col gap-3 max-w-xl mx-auto w-full"
    >
      {convite && (
        <p
          className="text-center text-[14px] leading-[1.7] lg:text-[15px]"
          style={{ color: "color-mix(in srgb, var(--ink) 70%, transparent)" }}
        >
          {convite}
        </p>
      )}

      <label className="sr-only" htmlFor="recado-nome">
        Seu nome
      </label>
      <input
        id="recado-nome"
        name="guestName"
        required
        defaultValue={digitado.guestName ?? ""}
        placeholder="Seu nome"
        autoComplete="name"
        className="w-full px-4 py-3 text-[15px] outline-none"
        style={{ border: contorno, background: "var(--paper)", color: "var(--ink)" }}
      />

      <label className="sr-only" htmlFor="recado-texto">
        Seu recado
      </label>
      <textarea
        id="recado-texto"
        name="message"
        required
        defaultValue={digitado.message ?? ""}
        rows={4}
        maxLength={LIMITE_RECADO}
        placeholder="Escreva para os noivos…"
        className="w-full px-4 py-3 text-[15px] leading-[1.7] outline-none resize-y"
        style={{ border: contorno, background: "var(--paper)", color: "var(--ink)" }}
      />

      {recusado && (
        <p
          role="alert"
          className="text-[13.5px] leading-[1.5]"
          style={{ color: "var(--accent)" }}
        >
          {recusado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        // min-h-11: área de toque de 44px. O convidado escreve isso no
        // celular, quase sempre em pé, no meio de outra coisa.
        className="min-h-11 px-6 py-3 text-[15px] tracking-[0.04em] transition-opacity disabled:opacity-60 cursor-pointer"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        {pendente ? "Enviando…" : "Deixar meu recado"}
      </button>
    </form>
  );
}
