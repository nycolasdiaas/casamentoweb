"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  responderRsvpAction,
  type EstadoDoRsvp,
} from "@/app/actions/rsvp-actions";
import {
  saudacaoDeConvidados,
  pluralDoConvite,
  perguntaDosLugares,
} from "@/lib/site/saudacao";

/**
 * Prancha F4 · a tela que gente real usa.
 *
 * ── O que esta tela não pode fazer ─────────────────────────────────────────
 *
 * Quem chega aqui não tem conta, não tem suporte e não volta se der errado.
 * Três decisões saem daí:
 *
 * 1. **O `<form>` funciona sem JavaScript.** A escolha sim/não são dois
 *    `<button type="submit" name="vai">` de verdade — não `onClick` guardando
 *    estado. Se o React não hidratar, o convidado ainda consegue responder.
 *    O estado local só melhora a tela (mostra o contador, esconde o que não
 *    se aplica); ele não é o caminho.
 * 2. **Nada é obrigatório além da escolha.** Nome e recado em branco são uma
 *    resposta legítima — a regra §2.3 do produto vale para o convidado também.
 * 3. **O erro aparece e a tela continua de pé**, com o que ele digitou. A
 *    action nunca lança; ela devolve `{ erro }`.
 *
 * ── Por que o contador é `<input type=number>` com botões ──────────────────
 *
 * O desenho tem `−` / número / `+`. Os botões são conforto; o campo é o que
 * garante que o valor chegue ao servidor sem JS e que o teclado numérico
 * abra no celular. Área de toque de 44px nos dois, como a Fundação exige.
 */

type Props = {
  slug: string;
  /** Nomes do casal — o cabeçalho da tela. */
  nomesDoCasal: string | null;
  /**
   * O rótulo do grupo NÃO entra mais aqui.
   *
   * Ele é o nome que o casal dá à família no painel, sob a promessa "Só vocês
   * veem este nome" — e vinha parar no título desta tela (UX-008). A prop
   * saiu em vez de virar opcional: opcional é convite para alguém voltar a
   * passá-la sem perceber o que ela significa.
   *
   * No lugar dele vêm os NOMES DAS PESSOAS CONVIDADAS, que o casal também
   * digitou e que são públicos por natureza: é o convidado lendo o próprio
   * nome no convite dele.
   */
  /** Nomes de quem foi convidado, para a saudação. Ver `lib/site/saudacao.ts`. */
  nomesDosConvidados?: readonly string[] | null;
  /** Lugares reservados para este grupo. */
  lugares: number;
  /** Resposta anterior, quando já respondeu. */
  jaRespondeu: {
    lugares: number;
    nomes: string | null;
    recado: string | null;
  } | null;
  /** "05 de setembro" — já formatado no servidor. */
  prazo: string | null;
  /** Endereço do site do casamento, quando ele está no ar. */
  linkDoSite: string | null;
  /** Endereço do .ics, para "Adicionar à agenda". */
  linkDaAgenda: string | null;
  /** "19 de setembro de 2026" — para a frase de sucesso. */
  dataDoCasamento: string | null;
};

export default function ConfirmacaoDePresenca({
  slug,
  nomesDoCasal,
  lugares,
  nomesDosConvidados,
  jaRespondeu,
  prazo,
  linkDoSite,
  linkDaAgenda,
  dataDoCasamento,
}: Props) {
  const [estado, enviar, enviando] = useActionState(
    responderRsvpAction.bind(null, slug),
    undefined as EstadoDoRsvp
  );

  /* A escolha começa no que já foi respondido.
     Quem volta ao link (o "Editar resposta" do desenho) precisa ver a própria
     resposta, não um formulário em branco — senão parece que ela sumiu. */
  const [vai, setVai] = useState<"sim" | "nao" | null>(
    jaRespondeu ? (jaRespondeu.lugares > 0 ? "sim" : "nao") : null
  );
  const [quantos, setQuantos] = useState(
    jaRespondeu && jaRespondeu.lugares > 0 ? jaRespondeu.lugares : lugares
  );
  const [reabrir, setReabrir] = useState(false);

  const saudacao = saudacaoDeConvidados(nomesDosConvidados);
  const tratamento = pluralDoConvite(lugares);

  const respondeuAgora = estado && "ok" in estado;

  if (respondeuAgora && !reabrir) {
    return (
      <Sucesso
        lugares={estado.lugares}
        dataDoCasamento={dataDoCasamento}
        linkDoSite={linkDoSite}
        linkDaAgenda={linkDaAgenda}
        aoEditar={() => setReabrir(true)}
      />
    );
  }

  const erro = estado && "erro" in estado ? estado.erro : null;

  return (
    <div className="w-full max-w-[560px] flex flex-col">
      <header className="flex flex-col items-center gap-2 text-center">
        {nomesDoCasal && (
          <p className="t-display text-[22px] leading-none text-(--c-ink)">
            {nomesDoCasal}
          </p>
        )}
        {prazo && (
          <p className="meta text-(--c-mark)">Confirme até {prazo}</p>
        )}
        <h1 className="t-d1 text-(--c-ink) mt-2">
          {saudacao ? `${saudacao}, ` : ""}
          {tratamento.pronome} {tratamento.verbo}?
        </h1>
        {jaRespondeu && (
          <p className="t-corpo-p text-(--c-ink-2) mt-1">
            {tratamento.pronome === "você" ? "Você já respondeu" : "Vocês já responderam"}
            . Dá para mudar aqui mesmo.
          </p>
        )}
      </header>

      <form action={enviar} className="mt-8 flex flex-col gap-5">
        {/* AS DUAS ESCOLHAS.
            `type="submit"` com `name="vai"` faz cada uma enviar o próprio
            valor — é o que mantém a tela respondível sem JavaScript. O
            `onClick` só ajusta o que a tela mostra depois. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Escolha
            valor="sim"
            ativo={vai === "sim"}
            titulo="Sim, vamos!"
            nota="mal podemos esperar"
            onEscolher={() => setVai("sim")}
          />
          <Escolha
            valor="nao"
            ativo={vai === "nao"}
            titulo="Não posso"
            nota="vamos sentir sua falta"
            onEscolher={() => setVai("nao")}
          />
        </div>

        {/* O formulário só aparece depois da escolha: mostrar um contador de
            lugares antes de saber se a pessoa vem é pedir uma decisão que
            ainda não faz sentido. */}
        {vai && (
          <div className="surface-raised rounded-[3px] p-6 flex flex-col gap-6">
            {vai === "sim" && (
              <>
                <div className="flex flex-col gap-3">
                  <label htmlFor="lugares" className="rotulo text-(--c-ink-2)">
                    {perguntaDosLugares(lugares)}
                  </label>
                  <div className="flex items-center gap-4">
                    <BotaoDoContador
                      rotulo="Um a menos"
                      sinal="−"
                      desabilitado={quantos <= 1}
                      onClick={() => setQuantos((n) => Math.max(1, n - 1))}
                    />
                    <input
                      id="lugares"
                      name="lugares"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={lugares}
                      value={quantos}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) return;
                        setQuantos(Math.min(Math.max(1, Math.round(n)), lugares));
                      }}
                      className="t-display w-16 bg-transparent text-center text-[32px] leading-none text-(--c-ink) outline-none focus-visible:outline-2 focus-visible:outline-(--c-mark)"
                    />
                    <BotaoDoContador
                      rotulo="Um a mais"
                      sinal="+"
                      desabilitado={quantos >= lugares}
                      onClick={() =>
                        setQuantos((n) => Math.min(lugares, n + 1))
                      }
                    />
                    <span className="meta text-(--c-ink-2)">
                      de {lugares} {lugares === 1 ? "reservado" : "reservados"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="nomes" className="rotulo text-(--c-ink-2)">
                    Nomes de quem vai
                  </label>
                  <input
                    id="nomes"
                    name="nomes"
                    type="text"
                    defaultValue={jaRespondeu?.nomes ?? ""}
                    maxLength={300}
                    autoComplete="off"
                    className="campo"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="recado" className="rotulo text-(--c-ink-2)">
                Recado para o casal (opcional)
              </label>
              <textarea
                id="recado"
                name="recado"
                rows={3}
                maxLength={500}
                defaultValue={jaRespondeu?.recado ?? ""}
                placeholder="Deixe um carinho…"
                className="campo"
              />
            </div>

            {erro && (
              <p role="alert" className="erro-do-campo">
                {erro}
              </p>
            )}

            {/* O botão de baixo é o que envia de verdade quando a pessoa já
                escolheu: repete o `vai` escolhido num campo escondido. */}
            <input type="hidden" name="vai" value={vai} />
            <button
              type="submit"
              disabled={enviando}
              className="btn btn-ink btn-g w-full text-[16px]"
            >
              {vai === "sim" ? "Enviar confirmação" : "Enviar resposta"}
              {enviando && <span className="btn-rodinha" aria-hidden="true" />}
            </button>
          </div>
        )}

        {/* Erro antes de qualquer escolha (prazo vencido no meio do caminho,
            limite de tentativas) precisa aparecer mesmo sem o card aberto. */}
        {erro && !vai && (
          <p role="alert" className="erro-do-campo text-center">
            {erro}
          </p>
        )}
      </form>
    </div>
  );
}

/** Um dos dois cards grandes de escolha. */
function Escolha({
  valor,
  ativo,
  titulo,
  nota,
  onEscolher,
}: {
  valor: "sim" | "nao";
  ativo: boolean;
  titulo: string;
  nota: string;
  onEscolher: () => void;
}) {
  return (
    <button
      type="submit"
      name="vai"
      value={valor}
      onClick={(e) => {
        /* Sem JS, este clique envia o formulário e a resposta é gravada na
           hora — o caminho degradado funciona. Com JS, a gente prefere abrir
           os campos antes de enviar: o convidado ainda vai dizer quantos vão
           e deixar um recado. */
        e.preventDefault();
        onEscolher();
      }}
      aria-pressed={ativo}
      className={`min-h-[88px] rounded-[3px] px-5 py-5 text-center transition-colors duration-(--t-rapido) ${
        ativo
          ? "border-[1.5px] border-(--c-ink) bg-(--c-ink) text-white"
          : "border border-(--c-rule) bg-(--c-surface) text-(--c-ink) hover:border-(--c-ink)"
      }`}
    >
      <span className="t-display block text-[26px] leading-tight">{titulo}</span>
      <span
        className={`mt-1 block text-[12.5px] ${
          ativo ? "text-white/70" : "text-(--c-ink-2)"
        }`}
      >
        {nota}
      </span>
    </button>
  );
}

/** `−` e `+` do contador. 44×44, como a Fundação exige para toque. */
function BotaoDoContador({
  rotulo,
  sinal,
  desabilitado,
  onClick,
}: {
  rotulo: string;
  sinal: string;
  desabilitado: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-[2px] border border-(--c-rule) bg-(--c-base) text-[20px] leading-none text-(--c-ink) transition-colors duration-(--t-rapido) hover:border-(--c-ink) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--c-rule)"
    >
      {sinal}
    </button>
  );
}

/**
 * O estado de sucesso — a recompensa do convidado.
 *
 * O check é DESENHADO (transição #7). Ver `.rsvp-check` em `globals.css`.
 */
function Sucesso({
  lugares,
  dataDoCasamento,
  linkDoSite,
  linkDaAgenda,
  aoEditar,
}: {
  lugares: number;
  dataDoCasamento: string | null;
  linkDoSite: string | null;
  linkDaAgenda: string | null;
  aoEditar: () => void;
}) {
  const vai = lugares > 0;

  return (
    <div
      className="w-full max-w-[560px] flex flex-col items-center text-center"
      role="status"
      aria-live="polite"
    >
      <span
        className={`rsvp-anel flex size-14 items-center justify-center rounded-full ${
          vai ? "bg-(--c-ok)" : "bg-(--c-ink-2)"
        }`}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path className="rsvp-check" d="M20 6 9 17l-5-5" />
        </svg>
      </span>

      <h1 className="t-d1 mt-6 text-(--c-ink)">
        {vai ? "Presença confirmada!" : "Resposta enviada"}
      </h1>

      <p className="t-corpo mt-3 max-w-[38ch] text-(--c-ink-2)">
        {vai ? (
          <>
            Que alegria. Anotamos{" "}
            <strong className="font-semibold text-(--c-ink)">
              {lugares} {lugares === 1 ? "lugar" : "lugares"}
            </strong>
            .{dataDoCasamento ? ` A gente se vê em ${dataDoCasamento}.` : ""}
          </>
        ) : (
          <>
            Avisamos o casal. Vamos sentir sua falta
            {dataDoCasamento ? ` em ${dataDoCasamento}` : ""}.
          </>
        )}
      </p>

      {(linkDaAgenda || linkDoSite) && (
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {vai && linkDaAgenda && (
            <a href={linkDaAgenda} className="btn btn-quiet">
              Adicionar à agenda
            </a>
          )}
          {linkDoSite && (
            <Link href={linkDoSite} className="btn btn-quiet">
              Ver o site
            </Link>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={aoEditar}
        className="mt-5 text-[13.5px] text-(--c-ink-2) underline underline-offset-4 transition-colors hover:text-(--c-ink)"
      >
        Precisa mudar algo? Editar resposta
      </button>
    </div>
  );
}
