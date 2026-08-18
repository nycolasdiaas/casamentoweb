"use client";

import { useActionState, useRef, useState } from "react";
import { saveSiteContentAction } from "@/app/actions/content-actions";
import { useHistorico } from "@/components/account/manage/useHistorico";

/**
 * As áreas editáveis do site — cada pedaço nomeado, com o tipo à vista.
 *
 * É a peça que o Anderson apontou no painel do iCasei e chamou de "autonomia".
 * A percepção dele foi exata: autonomia ali não é ter mais recursos, é VER o
 * que dá para mexer. Um formulário pede os mesmos dados e não mostra onde eles
 * caem; esta lista nomeia cada pedaço, diz de que tipo ele é (texto, data,
 * endereço, link) e mostra o valor atual — inclusive quando está vazio.
 *
 * ── Por que o formulário inteiro continua aqui dentro ───────────────────────
 *
 * Cada linha ABRE no lugar, mas o que não está aberto continua no `<form>`
 * como campo oculto, e o salvamento manda TUDO por `saveSiteContentAction` —
 * a mesma action da tela de conteúdo, sem rota nova.
 *
 * Não é preguiça: aquela action lê o fuso de `site_content` antes de gravar, e
 * é isso que impede a cerimônia das 16h virar 19h e ganhar três horas a cada
 * salvamento. Uma gravação campo a campo precisaria repetir essa leitura, e
 * repetir é como ela deixa de acontecer em um dos caminhos.
 *
 * ── O que "vazio" faz aqui ──────────────────────────────────────────────────
 *
 * Campo em branco NÃO é erro: cada seção do molde degrada sozinha quando falta
 * dado (§4.4 do SDD), e preencher aos poucos é uso normal. Por isso o vazio
 * aparece como "—" em cinza e convida, em vez de alertar.
 */

type TipoCampo = "texto" | "data" | "hora" | "endereco" | "link" | "longo";

type Campo = {
  nome: keyof Valores;
  rotulo: string;
  tipo: TipoCampo;
  /** dica curta, só quando o rótulo não basta */
  ajuda?: string;
  maxLength?: number;
};

export type Valores = {
  coupleNames: string;
  weddingDate: string;
  weddingTime: string;
  ceremonyVenue: string;
  ceremonyAddress: string;
  ceremonyMapUrl: string;
  receptionVenue: string;
  receptionAddress: string;
  dressCode: string;
  story: string;
};

// A ORDEM é a da leitura do convite, não a do banco: quem abre isto está
// conferindo o site de cima para baixo.
const CAMPOS: Campo[] = [
  { nome: "coupleNames", rotulo: "Nomes do casal", tipo: "texto", maxLength: 120 },
  { nome: "weddingDate", rotulo: "Data do casamento", tipo: "data" },
  { nome: "weddingTime", rotulo: "Horário", tipo: "hora" },
  { nome: "ceremonyVenue", rotulo: "Local da cerimônia", tipo: "texto", maxLength: 160 },
  { nome: "ceremonyAddress", rotulo: "Endereço da cerimônia", tipo: "endereco", ajuda: "Vira o botão de mapa", maxLength: 300 },
  { nome: "ceremonyMapUrl", rotulo: "Link do mapa", tipo: "link", ajuda: "Opcional — sem ele, montamos pelo endereço", maxLength: 600 },
  { nome: "receptionVenue", rotulo: "Local da festa", tipo: "texto", maxLength: 160 },
  { nome: "receptionAddress", rotulo: "Endereço da festa", tipo: "endereco", maxLength: 300 },
  { nome: "dressCode", rotulo: "Traje", tipo: "texto", ajuda: "A dúvida nº 1 de todo convidado", maxLength: 200 },
  { nome: "story", rotulo: "A história de vocês", tipo: "longo", maxLength: 5000 },
];

function Icone({ tipo }: { tipo: TipoCampo }) {
  const comum = { width: 15, height: 15, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;
  if (tipo === "data" || tipo === "hora") {
    return (
      <svg {...comum} aria-hidden>
        <rect x="2.5" y="3.5" width="11" height="10" rx="1" />
        <path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" />
      </svg>
    );
  }
  if (tipo === "endereco") {
    return (
      <svg {...comum} aria-hidden>
        <path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.8 8 14 8 14Z" />
        <circle cx="8" cy="6.5" r="1.6" />
      </svg>
    );
  }
  if (tipo === "link") {
    return (
      <svg {...comum} aria-hidden>
        <path d="M6.6 9.4a3 3 0 0 0 4.2 0l1.7-1.7a3 3 0 1 0-4.2-4.2l-.9.9" />
        <path d="M9.4 6.6a3 3 0 0 0-4.2 0L3.5 8.3a3 3 0 1 0 4.2 4.2l.9-.9" />
      </svg>
    );
  }
  if (tipo === "longo") {
    return (
      <svg {...comum} aria-hidden>
        <path d="M3 4.5h10M3 8h10M3 11.5h6" />
      </svg>
    );
  }
  return (
    <svg {...comum} aria-hidden>
      <path d="M3.5 4.5h9M8 4.5v7" />
    </svg>
  );
}

function resumo(campo: Campo, valor: string): string {
  if (!valor.trim()) return "—";
  if (campo.tipo === "data") {
    const d = new Date(`${valor}T12:00:00`);
    return Number.isNaN(d.getTime())
      ? valor
      : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  }
  if (campo.tipo === "longo") {
    return valor.length > 60 ? `${valor.slice(0, 60)}…` : valor;
  }
  return valor;
}

const entrada =
  "w-full rounded-[3px] border border-(--c-rule) bg-(--c-surface) px-3 py-2.5 text-[14px] text-(--c-ink) outline-none focus:border-(--c-ink)";

export default function AreasEditaveis({
  siteId,
  valores,
}: {
  siteId: string;
  valores: Valores;
}) {
  const [state, action, pending] = useActionState(saveSiteContentAction, undefined);
  const [aberto, setAberto] = useState<string | null>(null);

  // O histórico guarda UM passo por campo editado, não por tecla. Ver
  // useHistorico — dentro do campo aberto vale o ⌘Z nativo do input.
  const {
    presente: rascunho,
    escrever: setRascunho,
    registrar,
    desfazer,
    refazer,
    podeDesfazer,
    podeRefazer,
  } = useHistorico<Valores>(valores);

  // O valor de quando a linha ABRIU. É ele que vai para o passado quando a
  // edição fecha — sem isso não há "antes" para desfazer.
  const aoAbrir = useRef<Valores>(valores);

  const alternar = (nome: string) => {
    if (aberto === nome) {
      registrar(aoAbrir.current);
      setAberto(null);
      return;
    }
    // Trocar de linha também fecha a anterior: um campo por passo.
    if (aberto !== null) registrar(aoAbrir.current);
    aoAbrir.current = rascunho;
    setAberto(nome);
  };

  const mudou = (CAMPOS as Campo[]).some(
    (c) => (rascunho[c.nome] ?? "") !== (valores[c.nome] ?? "")
  );

  return (
    <form action={action} className="surface-raised flex flex-col rounded-[3px]">
      <input type="hidden" name="siteId" value={siteId} />

      <div className="flex items-center justify-between gap-3 border-b border-(--c-rule) bg-(--c-sunken) px-4 py-2.5">
        <span className="meta text-(--c-ink-2)">Áreas editáveis</span>
        <span className="t-data text-[11px] text-(--c-ink-2)">
          {CAMPOS.filter((c) => (rascunho[c.nome] ?? "").trim()).length}/{CAMPOS.length}
        </span>
      </div>

      <ul className="flex flex-col">
        {CAMPOS.map((campo) => {
          const estaAberto = aberto === campo.nome;
          const valor = rascunho[campo.nome] ?? "";
          const vazio = !valor.trim();

          return (
            <li key={campo.nome} className="border-b border-(--c-rule) last:border-b-0">
              {/* Fechado: o campo continua no formulário como oculto, para o
                  salvamento mandar o conjunto inteiro e nada se perder. */}
              {!estaAberto && (
                <input type="hidden" name={campo.nome} value={valor} />
              )}

              <button
                type="button"
                onClick={() => alternar(campo.nome)}
                aria-expanded={estaAberto}
                className="flex min-h-11 w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-(--c-sunken)"
              >
                <span className="flex shrink-0 text-(--c-ink-2)">
                  <Icone tipo={campo.tipo} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13.5px] font-medium text-(--c-ink)">
                    {campo.rotulo}
                  </span>
                  <span
                    className={`truncate text-[12.5px] ${
                      vazio ? "text-(--c-rule)" : "text-(--c-ink-2)"
                    }`}
                  >
                    {resumo(campo, valor)}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`shrink-0 text-(--c-ink-2) transition-transform ${
                    estaAberto ? "rotate-90" : ""
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 3.5L10.5 8L6 12.5" />
                  </svg>
                </span>
              </button>

              {estaAberto && (
                <div className="flex flex-col gap-2 px-4 pb-4">
                  {campo.ajuda && (
                    <span className="text-[12.5px] text-(--c-ink-2)">{campo.ajuda}</span>
                  )}
                  {campo.tipo === "longo" ? (
                    <textarea
                      name={campo.nome}
                      rows={6}
                      maxLength={campo.maxLength}
                      value={valor}
                      onChange={(e) =>
                        setRascunho((r) => ({ ...r, [campo.nome]: e.target.value }))
                      }
                      autoFocus
                      className={`${entrada} resize-y`}
                    />
                  ) : (
                    <input
                      name={campo.nome}
                      type={
                        campo.tipo === "data"
                          ? "date"
                          : campo.tipo === "hora"
                            ? "time"
                            : campo.tipo === "link"
                              ? "url"
                              : "text"
                      }
                      maxLength={campo.maxLength}
                      value={valor}
                      onChange={(e) =>
                        setRascunho((r) => ({ ...r, [campo.nome]: e.target.value }))
                      }
                      autoFocus
                      className={entrada}
                    />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2 border-t border-(--c-rule) px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={desfazer}
            disabled={!podeDesfazer}
            className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-(--c-ink-2) transition-colors hover:text-(--c-ink) disabled:opacity-40 disabled:hover:text-(--c-ink-2)"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 4L2.5 7.5L6 11" />
              <path d="M2.5 7.5H9a4 4 0 0 1 0 8H7" />
            </svg>
            Desfazer
          </button>
          <button
            type="button"
            onClick={refazer}
            disabled={!podeRefazer}
            className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-(--c-ink-2) transition-colors hover:text-(--c-ink) disabled:opacity-40 disabled:hover:text-(--c-ink-2)"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 4L13.5 7.5L10 11" />
              <path d="M13.5 7.5H7a4 4 0 0 0 0 8h2" />
            </svg>
            Refazer
          </button>
        </div>

        <button
          type="submit"
          disabled={pending || !mudou}
          className="btn btn-ink btn-sm w-full"
        >
          {pending ? "Salvando…" : mudou ? "Salvar" : "Tudo salvo"}
        </button>

        <div aria-live="polite" className="min-h-4">
          {state && "error" in state && (
            <p className="text-[12.5px] text-(--c-mark)">{state.error}</p>
          )}
          {state && "saved" in state && !mudou && (
            <p className="text-[12.5px] text-(--c-ink-2)">
              Salvo. Atualize a prévia para ver.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
