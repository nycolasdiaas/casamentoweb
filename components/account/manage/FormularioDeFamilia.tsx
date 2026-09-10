"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { criarFamiliaAction } from "@/app/actions/site-actions";

/**
 * Cadastrar uma família que vai confirmar presença.
 *
 * ── A ordem das perguntas ──────────────────────────────────────────────────
 *
 * O nome da família vem primeiro e é o único obrigatório, porque é o que o
 * casal sempre sabe ("os Silva", "pessoal do trabalho"). Os nomes de cada
 * pessoa são opcionais: pedir cinco nomes completos antes de conseguir criar
 * o primeiro convite transformaria o cadastro numa tarefa de escritório — e a
 * promessa do produto é que o casal não trabalha.
 *
 * Quando os nomes existem, eles viram os lugares do grupo e aparecem para o
 * convidado na hora de confirmar, um a um. Quando não existem, o casal escreve
 * só quantos lugares a família tem.
 *
 * ── Por que o formulário não some depois de salvar ─────────────────────────
 *
 * Porque ninguém cadastra uma família só. Ele se limpa e mantém o foco no
 * primeiro campo, para a próxima entrar sem tirar a mão do teclado.
 */
export default function FormularioDeFamilia({ siteId }: { siteId: string }) {
  const [estado, acao, pendente] = useActionState(criarFamiliaAction, undefined);
  const [pessoas, setPessoas] = useState<number>(1);
  const formRef = useRef<HTMLFormElement>(null);
  const primeiroCampo = useRef<HTMLInputElement>(null);

  const salvou = estado && "saved" in estado;

  /* Só efeitos de DOM aqui: limpar o formulário e devolver o foco.
     `setPessoas(1)` ficaria bonito, mas é setState dentro de efeito — cascata
     de render que o React desaconselha. As linhas extras seguem visíveis e
     vazias depois de salvar, o que não atrapalha: a action filtra nome em
     branco, e quem acabou de cadastrar uma família de cinco provavelmente vai
     cadastrar outra parecida. */
  useEffect(() => {
    if (!salvou) return;
    formRef.current?.reset();
    primeiroCampo.current?.focus();
  }, [salvou]);

  return (
    <form
      ref={formRef}
      action={acao}
      className="surface-raised flex flex-col gap-4 rounded-[3px] p-5"
    >
      <input type="hidden" name="siteId" value={siteId} />

      <div className="flex flex-col gap-1">
        <h2 className="t-corpo text-(--c-ink)">Cadastrar uma família</h2>
        <p className="text-[12.5px] leading-relaxed text-(--c-ink-2)">
          Cada família cadastrada ganha um endereço próprio. É esse link que
          vocês mandam no WhatsApp dela.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nome da família</span>
        <input
          ref={primeiroCampo}
          type="text"
          name="label"
          required
          maxLength={120}
          placeholder="Ex: Família Silva"
          className="campo"
        />
        <span className="text-xs text-(--c-ink-2)">
          Do jeito que vocês chamam eles. Só vocês veem este nome.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Quantos lugares</span>
        <input
          type="number"
          name="lugares"
          min={1}
          max={20}
          defaultValue={2}
          className="campo w-28"
        />
        <span className="text-xs text-(--c-ink-2)">
          Quantas pessoas dessa família estão convidadas. Se escreverem os
          nomes abaixo, a conta sai deles.
        </span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">
          Quem foi convidado{" "}
          <span className="text-xs font-normal text-(--c-ink-2)">
            opcional
          </span>
        </legend>
        <p className="text-xs leading-relaxed text-(--c-ink-2)">
          Escrevendo os nomes, cada pessoa aparece com um botão próprio para
          confirmar. Deixando em branco, a família responde quantos vão.
        </p>

        {Array.from({ length: pessoas }).map((_, i) => (
          <input
            key={i}
            type="text"
            name="nome"
            maxLength={120}
            placeholder={`Pessoa ${i + 1}`}
            className="campo"
          />
        ))}

        {pessoas < 20 && (
          <button
            type="button"
            onClick={() => setPessoas((n) => n + 1)}
            className="self-start text-[12.5px] text-(--c-ink-2) underline underline-offset-4 hover:text-(--c-ink)"
          >
            + acrescentar pessoa
          </button>
        )}
      </fieldset>

      {estado && "error" in estado && (
        <p role="alert" className="text-sm text-(--c-danger)">
          {estado.error}
        </p>
      )}

      {/* A confirmação fica aqui, junto do botão que a causou. Um aviso no
          topo da página seria lido depois da próxima família já digitada. */}
      {salvou && (
        <p role="status" className="text-sm text-(--c-ink-2)">
          {estado.message} Cadastrem a próxima ou copiem o link na lista.
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="btn btn-ink btn-sm self-start"
      >
        {pendente ? "Cadastrando…" : "Cadastrar família"}
      </button>
    </form>
  );
}
