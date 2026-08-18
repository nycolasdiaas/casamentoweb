"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  CONVITE_ALTURA,
  CONVITE_LARGURA,
  FORMAS,
  novoId,
  prenderNaTela,
  type Bloco,
  type FormaId,
  type InviteDoc,
} from "@/lib/site/inviteDoc";
import { clipPathDe, NOME_DA_FORMA } from "@/lib/site/inviteShapes";
import { salvarConviteAction } from "@/app/actions/invite-actions";
import { useHistorico } from "@/components/account/manage/useHistorico";
import BlocoVisual, { estiloDoBloco } from "./BlocoVisual";

/**
 * O editor de convites — blocos livres.
 *
 * ── Por que ponteiro, e não uma biblioteca de arrastar ─────────────────────
 *
 * O arrasto aqui é `setPointerCapture` e três handlers. Uma biblioteca de
 * drag-and-drop resolve o problema difícil — listas que reordenam, alvos de
 * soltura, acessibilidade de reordenação — e nada disso existe neste editor:
 * o bloco só segue o dedo, num plano, sem alvo. `pointer*` cobre mouse e toque
 * pelo mesmo caminho, e o casal desenha o convite do celular.
 *
 * ── Coordenadas em fração ──────────────────────────────────────────────────
 *
 * Tudo é 0..1 sobre a área do convite (ver `inviteDoc`). O que a pessoa desenha
 * numa tela de 400px é o mesmo que sai no arquivo de 1080px.
 *
 * ── O salvamento é explícito ───────────────────────────────────────────────
 *
 * Cada gesto NÃO vai ao servidor: arrastar um bloco por dois segundos são
 * dezenas de posições, e gravar cada uma é ruído no banco e respostas fora de
 * ordem. O botão salva; o histórico local — o mesmo `useHistorico` das áreas
 * editáveis — segura desfazer e refazer enquanto isso.
 *
 * ── O que conta como um passo do histórico ─────────────────────────────────
 *
 * Um GESTO: um arrasto inteiro, um campo de texto que perdeu o foco, um puxão
 * completo de um controle deslizante. Por isso `antesDoGesto` guarda o estado
 * no início e `registrar` só é chamado no fim — empilhar a cada pixel daria um
 * histórico que ninguém percorre.
 */

type Props = {
  siteId: string;
  orderId: string;
  inviteId: string;
  nomeInicial: string;
  docInicial: InviteDoc;
  fotos: { id: string; alt: string | null }[];
};

const FONTES = [
  { id: "serif", rotulo: "Serifada" },
  { id: "sans", rotulo: "Sem serifa" },
  { id: "script", rotulo: "Manuscrita" },
] as const;

/**
 * Campo numérico no lugar de barra deslizante.
 *
 * A barra não diz em que valor está nem deixa repetir o mesmo número em dois
 * blocos — e "espessura 2" é exatamente o tipo de coisa que o casal quer
 * igual nas duas linhas do convite. Com número dá para ler, digitar e copiar.
 *
 * As setas continuam existindo (é `type="number"`), então ajustar de um em um
 * segue fácil para quem prefere clicar.
 */
function Numero({
  rotulo,
  valor,
  min,
  max,
  passo = 1,
  sufixo,
  aoMudar,
  aoComecar,
  aoTerminar,
}: {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  passo?: number;
  sufixo?: string;
  aoMudar: (v: number) => void;
  aoComecar: () => void;
  aoTerminar: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-[13px]">
      {rotulo}
      <span className="flex items-center gap-1">
        <input
          type="number"
          value={Number.isFinite(valor) ? Math.round(valor * 1000) / 1000 : min}
          min={min}
          max={max}
          step={passo}
          onFocus={aoComecar}
          onBlur={aoTerminar}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            aoMudar(Math.min(Math.max(v, min), max));
          }}
          className="min-h-11 w-[5.5rem] border border-(--c-rule) bg-white px-2 text-right text-[13px]"
        />
        {sufixo && <span className="text-(--c-ink-2)">{sufixo}</span>}
      </span>
    </label>
  );
}

export default function EditorDeConvite({
  siteId,
  orderId,
  inviteId,
  nomeInicial,
  docInicial,
  fotos,
}: Props) {
  const {
    presente: doc,
    escrever: setDoc,
    registrar,
    desfazer,
    refazer,
    zerar,
    podeDesfazer,
    podeRefazer,
  } = useHistorico<InviteDoc>(docInicial);

  const [nome, setNome] = useState(nomeInicial);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [salvando, iniciarSalvamento] = useTransition();
  const [salvo, setSalvo] = useState(true);
  const telaRef = useRef<HTMLDivElement>(null);
  const molduraRef = useRef<HTMLDivElement>(null);
  const antesDoGesto = useRef<InviteDoc>(docInicial);

  // Zoom da TELA, não do convite: mexe em como o casal enxerga, nunca no
  // documento. Por isso não entra no histórico nem marca "não salvo" — dar
  // desfazer depois de aproximar seria desfazer a coisa errada.
  const [zoom, setZoom] = useState(1);

  const bloco = doc.blocos.find((b) => b.id === selecionado) ?? null;

  const mudar = useCallback(
    (fn: (d: InviteDoc) => InviteDoc) => {
      setDoc((d) => fn(d));
      setSalvo(false);
    },
    [setDoc]
  );

  const trocarBloco = useCallback(
    (id: string, campos: Partial<Bloco>) => {
      mudar((d) => ({
        ...d,
        blocos: d.blocos.map((b) =>
          b.id === id ? ({ ...b, ...campos } as Bloco) : b
        ),
      }));
    },
    [mudar]
  );

  // ── arrastar e redimensionar ─────────────────────────────────────────────

  const gesto = useRef<
    | { tipo: "mover"; id: string; dx: number; dy: number }
    | { tipo: "largura"; id: string; x0: number; w0: number }
    | null
  >(null);

  function medidas(): DOMRect {
    return telaRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 1, 1);
  }

  function aoPegar(
    e: React.PointerEvent,
    alvo: Bloco,
    tipo: "mover" | "largura"
  ) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const r = medidas();
    antesDoGesto.current = doc;
    setSelecionado(alvo.id);
    gesto.current =
      tipo === "mover"
        ? {
            tipo,
            id: alvo.id,
            dx: (e.clientX - r.left) / r.width - alvo.x,
            dy: (e.clientY - r.top) / r.height - alvo.y,
          }
        : { tipo, id: alvo.id, x0: (e.clientX - r.left) / r.width, w0: alvo.w };
  }

  function aoMover(e: React.PointerEvent) {
    const g = gesto.current;
    if (!g) return;
    const r = medidas();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    mudar((d) => ({
      ...d,
      blocos: d.blocos.map((b) => {
        if (b.id !== g.id) return b;
        if (g.tipo === "mover") {
          return prenderNaTela({ ...b, x: px - g.dx, y: py - g.dy });
        }
        return prenderNaTela({ ...b, w: g.w0 + (px - g.x0) });
      }),
    }));
  }

  function aoSoltar() {
    if (!gesto.current) return;
    gesto.current = null;
    registrar(antesDoGesto.current);
  }

  // ── acrescentar e remover ────────────────────────────────────────────────

  function acrescentar(novo: Bloco) {
    const antes = doc;
    mudar((d) => ({ ...d, blocos: [...d.blocos, novo] }));
    registrar(antes);
    setSelecionado(novo.id);
  }

  const apagarSelecionado = useCallback(() => {
    if (!selecionado) return;
    const antes = doc;
    mudar((d) => ({ ...d, blocos: d.blocos.filter((b) => b.id !== selecionado) }));
    registrar(antes);
    setSelecionado(null);
  }, [doc, mudar, registrar, selecionado]);

  // Delete apaga o bloco escolhido — nunca enquanto a pessoa digita, senão
  // apagar uma letra apagaria o bloco inteiro.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const digitando =
        alvo?.tagName === "INPUT" ||
        alvo?.tagName === "TEXTAREA" ||
        alvo?.isContentEditable === true;
      if (digitando) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selecionado) {
        e.preventDefault();
        apagarSelecionado();
      }
      if (e.key === "Escape") setSelecionado(null);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [apagarSelecionado, selecionado]);

  /**
   * Zoom com a roda do mouse.
   *
   * Escuta em `wheel` com `passive: false` porque precisa de `preventDefault`
   * — sem isso a página rola junto e o convite foge da tela. React registra
   * `onWheel` como passivo, então o listener vai à mão, no efeito.
   *
   * Sem Ctrl também dá zoom: aqui a tela É o documento, e rolar a página no
   * meio do desenho não é o que a pessoa quer. Trackpad manda `deltaMode` em
   * pixels e roda de mouse em linhas — normalizar pelo sinal, e não pela
   * magnitude, deixa os dois com o mesmo passo.
   */
  useEffect(() => {
    const el = molduraRef.current;
    if (!el) return;
    function aoRolar(e: WheelEvent) {
      if (e.deltaY === 0) return;
      e.preventDefault();
      setZoom((z) =>
        Math.min(Math.max(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 0.4), 4)
      );
    }
    el.addEventListener("wheel", aoRolar, { passive: false });
    return () => el.removeEventListener("wheel", aoRolar);
  }, []);

  function salvar() {
    iniciarSalvamento(async () => {
      const r = await salvarConviteAction(siteId, inviteId, orderId, doc, nome);
      if (r && "saved" in r) {
        zerar(doc);
        setSalvo(true);
      }
    });
  }

  const baixar = `/api/convite/${siteId}/${inviteId}`;
  const marcarGesto = () => {
    antesDoGesto.current = doc;
  };
  const fecharGesto = () => registrar(antesDoGesto.current);

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      {/* ── a tela ──────────────────────────────────────────────────────── */}
      {/* A tela cresce até 900px e usa a ALTURA da janela como limite: o
          convite é 4:5, então limitar só a largura numa tela larga faria o
          cartão passar do rodapé. `min()` resolve os dois de uma vez. */}
      <div className="flex-1">
        {/* A moldura rola quando o zoom passa do tamanho dela; a tela dentro
            é que cresce. `getBoundingClientRect` já devolve a medida COM o
            zoom aplicado, então a conta do arrasto (posição em fração da
            largura) continua valendo sem correção — foi por isso que o
            arrasto não precisou mudar. */}
        <div
          ref={molduraRef}
          className="mx-auto overflow-auto overscroll-contain rounded-[3px] bg-(--c-sunken)/40 p-3"
          style={{ maxHeight: "calc(100svh - 13rem)" }}
        >
          <div
            ref={telaRef}
            onPointerMove={aoMover}
            onPointerUp={aoSoltar}
            onPointerCancel={aoSoltar}
            onPointerDown={() => setSelecionado(null)}
            className="relative mx-auto touch-none select-none overflow-hidden border border-(--c-rule)"
            style={{
              width: `calc(min(100%, 820px, calc((100svh - 16rem) * 0.8)) * ${zoom})`,
              aspectRatio: `${CONVITE_LARGURA} / ${CONVITE_ALTURA}`,
              background: doc.fundo,
              containerType: "size",
            }}
          >
          {doc.blocos.map((b) => {
            const ativo = b.id === selecionado;
            return (
              <div
                key={b.id}
                onPointerDown={(e) => aoPegar(e, b, "mover")}
                style={{
                  ...estiloDoBloco(b),
                  outline: ativo ? "1.5px solid var(--c-mark)" : undefined,
                  outlineOffset: 2,
                  cursor: "grab",
                }}
              >
                <BlocoVisual bloco={b} />

                {/* Alça de largura: só no bloco escolhido, para a tela não
                    virar um campo de bolinhas. */}
                {ativo && (
                  <span
                    onPointerDown={(e) => aoPegar(e, b, "largura")}
                    className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border border-white bg-(--c-mark)"
                    style={{ cursor: "ew-resize" }}
                  />
                )}
              </div>
            );
          })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[12px] text-(--c-ink-2)">
          <span>Arraste os blocos. A roda do mouse aproxima e afasta.</span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z / 1.2, 0.4))}
              aria-label="Afastar"
              className="size-8 border border-(--c-rule) transition-colors hover:bg-white"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="min-w-14 border border-(--c-rule) px-2 py-1 tabular-nums transition-colors hover:bg-white"
              title="Voltar ao tamanho normal"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z * 1.2, 4))}
              aria-label="Aproximar"
              className="size-8 border border-(--c-rule) transition-colors hover:bg-white"
            >
              +
            </button>
          </span>
        </div>
      </div>

      {/* ── o painel ────────────────────────────────────────────────────── */}
      <aside className="flex w-full flex-col gap-4 lg:w-[320px]">
        <div className="surface-raised flex flex-col gap-3 rounded-[3px] p-4">
          <input
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setSalvo(false);
            }}
            aria-label="Nome do convite"
            className="min-h-11 w-full border border-(--c-rule) bg-white px-3 text-[14px]"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={desfazer}
              disabled={!podeDesfazer}
              className="min-h-11 flex-1 border border-(--c-rule) text-[13px] text-(--c-ink-2) transition-colors hover:text-(--c-ink) disabled:opacity-40"
            >
              Desfazer
            </button>
            <button
              type="button"
              onClick={refazer}
              disabled={!podeRefazer}
              className="min-h-11 flex-1 border border-(--c-rule) text-[13px] text-(--c-ink-2) transition-colors hover:text-(--c-ink) disabled:opacity-40"
            >
              Refazer
            </button>
          </div>

          <button
            type="button"
            onClick={salvar}
            disabled={salvando || salvo}
            className="min-h-11 w-full bg-(--c-ink) text-[13px] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {salvando ? "Salvando…" : salvo ? "Tudo salvo" : "Salvar convite"}
          </button>
        </div>

        {/* ÁREAS EDITÁVEIS — a lista de tudo que existe no convite.
            Vem da tela de gerenciamento do iCasei, e resolve um problema real:
            bloco pequeno, atrás de outro ou arrastado para o canto é difícil
            de acertar com o dedo. Pela lista, sempre dá para escolher.
            Também é o que mostra que aquele texto invisível AINDA EXISTE. */}
        {doc.blocos.length > 0 && (
          <div className="surface-raised flex flex-col rounded-[3px]">
            <span className="meta border-b border-(--c-rule) px-4 py-3 text-(--c-ink-2)">
              Áreas editáveis
            </span>
            <ul className="max-h-64 overflow-y-auto">
              {doc.blocos.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelecionado(b.id)}
                    className={`flex min-h-11 w-full items-center gap-2 border-b border-(--c-rule) px-4 py-2 text-left text-[13px] transition-colors last:border-b-0 ${
                      b.id === selecionado
                        ? "bg-(--c-sunken) text-(--c-ink)"
                        : "text-(--c-ink-2) hover:bg-white"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="w-5 shrink-0 text-center text-[11px] uppercase"
                    >
                      {b.tipo === "texto"
                        ? "Aa"
                        : b.tipo === "foto"
                          ? "▣"
                          : b.tipo === "linha"
                            ? "―"
                            : "◆"}
                    </span>
                    <span className="truncate">
                      {b.tipo === "texto"
                        ? b.texto.trim() || "Texto vazio"
                        : b.tipo === "foto"
                          ? "Foto"
                          : b.tipo === "linha"
                            ? "Divisor"
                            : NOME_DA_FORMA[b.forma]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="surface-raised flex flex-col gap-2 rounded-[3px] p-4">
          <span className="meta text-(--c-ink-2)">Acrescentar</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                acrescentar({
                  tipo: "texto",
                  id: novoId(),
      rotacao: 0,
                  x: 0.15,
                  y: 0.45,
                  w: 0.7,
                  texto: "Texto novo",
                  tamanho: 0.04,
                  cor: "#1a1d21",
                  fonte: "serif",
                  peso: "normal",
                  alinhamento: "center",
                  espacamento: 0,
                  link: "",
                })
              }
              className="min-h-11 flex-1 border border-(--c-rule) px-3 text-[13px] transition-colors hover:bg-white"
            >
              Texto
            </button>
            <button
              type="button"
              onClick={() =>
                acrescentar({
                  tipo: "linha",
                  id: novoId(),
      rotacao: 0,
                  x: 0.4,
                  y: 0.5,
                  w: 0.2,
                  cor: "#b8985f",
                  espessura: 2,
                })
              }
              className="min-h-11 flex-1 border border-(--c-rule) px-3 text-[13px] transition-colors hover:bg-white"
            >
              Linha
            </button>
          </div>

          {/* As formas. O botão MOSTRA a forma em vez de nomeá-la: numa paleta
              de oito, ler "hexágono" é mais lento que ver o hexágono. O nome
              fica no title e no aria-label, para quem navega por leitor de
              tela ou passa o mouse. */}
          <span className="meta mt-1 text-(--c-ink-2)">Formas</span>
          <div className="grid grid-cols-4 gap-2">
            {FORMAS.map((f) => (
              <button
                key={f}
                type="button"
                title={NOME_DA_FORMA[f]}
                aria-label={`Acrescentar ${NOME_DA_FORMA[f]}`}
                onClick={() =>
                  acrescentar({
                    tipo: "forma",
                    id: novoId(),
      rotacao: 0,
                    x: 0.3,
                    y: 0.35,
                    w: 0.4,
                    forma: f,
                    proporcao: 1,
                    preenchimento: "#b8985f",
                    contorno: "#b8985f",
                    espessura: 0,
                    opacidade: 1,
                    raio: 24,
                  })
                }
                className="flex aspect-square items-center justify-center border border-(--c-rule) transition-colors hover:border-(--c-ink) hover:bg-white"
              >
                <span
                  aria-hidden
                  className="size-5 bg-(--c-ink-2)"
                  style={{
                    clipPath: clipPathDe(f) ?? undefined,
                    borderRadius:
                      f === "circulo" ? "50%" : f === "arredondado" ? 5 : 0,
                  }}
                />
              </button>
            ))}
          </div>

          {fotos.length > 0 ? (
            <>
              <span className="meta mt-1 text-(--c-ink-2)">Suas fotos</span>
              <div className="grid grid-cols-4 gap-2">
                {fotos.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    title={f.alt ?? "Foto"}
                    onClick={() =>
                      acrescentar({
                        tipo: "foto",
                        id: novoId(),
      rotacao: 0,
                        x: 0.25,
                        y: 0.2,
                        w: 0.5,
                        proporcao: 1,
                        fotoId: f.id,
                        raio: 0,
                      })
                    }
                    className="aspect-square overflow-hidden rounded-[2px] border border-(--c-rule) transition-colors hover:border-(--c-ink)"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/f/${f.id}`}
                      alt=""
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[12px] leading-relaxed text-(--c-ink-2)">
              Para usar fotos no convite, subam elas em{" "}
              <a
                href={`/conta/pedidos/${orderId}/fotos`}
                className="underline underline-offset-2"
              >
                Fotos
              </a>
              .
            </p>
          )}
        </div>

        {bloco && (
          <div className="surface-raised flex flex-col gap-3 rounded-[3px] p-4">
            <div className="flex items-center justify-between">
              <span className="meta text-(--c-ink-2)">
                {bloco.tipo === "texto"
                  ? "Texto"
                  : bloco.tipo === "foto"
                    ? "Foto"
                    : "Linha"}
              </span>
              <button
                type="button"
                onClick={apagarSelecionado}
                className="text-[12px] text-(--c-mark) underline underline-offset-2"
              >
                Remover
              </button>
            </div>

            {bloco.tipo === "texto" && (
              <>
                <textarea
                  value={bloco.texto}
                  onChange={(e) =>
                    trocarBloco(bloco.id, { texto: e.target.value })
                  }
                  onFocus={marcarGesto}
                  onBlur={fecharGesto}
                  rows={3}
                  aria-label="Texto do bloco"
                  className="w-full resize-y border border-(--c-rule) bg-white p-2 text-[14px]"
                />

                {/* O tamanho é guardado em FRAÇÃO da largura (0.04), que não
                    quer dizer nada para quem edita. O campo mostra px do
                    convite de 1080 — o número que a pessoa reconhece de
                    qualquer editor — e converte na entrada e na saída. */}
                <Numero
                  rotulo="Tamanho"
                  sufixo="px"
                  valor={bloco.tamanho * CONVITE_LARGURA}
                  min={8}
                  max={220}
                  aoMudar={(v) =>
                    trocarBloco(bloco.id, { tamanho: v / CONVITE_LARGURA })
                  }
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />

                <Numero
                  rotulo="Espaçamento"
                  valor={bloco.espacamento * 100}
                  min={0}
                  max={100}
                  passo={5}
                  aoMudar={(v) => trocarBloco(bloco.id, { espacamento: v / 100 })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />

                <Numero
                  rotulo="Rotação"
                  sufixo="°"
                  valor={bloco.rotacao}
                  min={-180}
                  max={180}
                  aoMudar={(v) => trocarBloco(bloco.id, { rotacao: v })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />

                <label className="flex items-center justify-between text-[13px]">
                  Fonte
                  <select
                    value={bloco.fonte}
                    onChange={(e) => {
                      const antes = doc;
                      trocarBloco(bloco.id, {
                        fonte: e.target.value as "serif" | "sans" | "script",
                      });
                      registrar(antes);
                    }}
                    className="min-h-11 border border-(--c-rule) bg-white px-2 text-[13px]"
                  >
                    {FONTES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.rotulo}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-center justify-between text-[13px]">
                  Alinhamento
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        aria-label={`Alinhar à ${a === "left" ? "esquerda" : a === "center" ? "ao centro" : "direita"}`}
                        onClick={() => {
                          const antes = doc;
                          trocarBloco(bloco.id, { alinhamento: a });
                          registrar(antes);
                        }}
                        className={`size-11 border text-[11px] ${
                          bloco.alinhamento === a
                            ? "border-(--c-ink) bg-(--c-ink) text-white"
                            : "border-(--c-rule)"
                        }`}
                      >
                        {a === "left" ? "◧" : a === "center" ? "▣" : "◨"}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between text-[13px]">
                  Cor
                  <input
                    type="color"
                    value={bloco.cor}
                    onChange={(e) => {
                      const antes = doc;
                      trocarBloco(bloco.id, { cor: e.target.value });
                      registrar(antes);
                    }}
                    className="size-11 border border-(--c-rule)"
                  />
                </label>

                <label className="flex flex-col gap-1 text-[13px]">
                  Link (opcional)
                  <input
                    type="url"
                    value={bloco.link}
                    placeholder="https://…"
                    onChange={(e) =>
                      trocarBloco(bloco.id, { link: e.target.value })
                    }
                    onFocus={marcarGesto}
                    onBlur={fecharGesto}
                    className="min-h-11 border border-(--c-rule) bg-white px-2 text-[13px]"
                  />
                </label>
              </>
            )}

            {bloco.tipo === "foto" && (
              <>
                <Numero
                  rotulo="Proporção"
                  valor={bloco.proporcao}
                  min={0.3}
                  max={3}
                  passo={0.05}
                  aoMudar={(v) => trocarBloco(bloco.id, { proporcao: v })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />
                <Numero
                  rotulo="Cantos"
                  sufixo="px"
                  valor={bloco.raio}
                  min={0}
                  max={540}
                  passo={10}
                  aoMudar={(v) => trocarBloco(bloco.id, { raio: v })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />
                <Numero
                  rotulo="Rotação"
                  sufixo="°"
                  valor={bloco.rotacao}
                  min={-180}
                  max={180}
                  aoMudar={(v) => trocarBloco(bloco.id, { rotacao: v })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />
              </>
            )}

            {bloco.tipo === "linha" && (
              <>
                <Numero
                  rotulo="Espessura"
                  sufixo="px"
                  valor={bloco.espessura}
                  min={1}
                  max={60}
                  aoMudar={(v) => trocarBloco(bloco.id, { espessura: v })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />
                <Numero
                  rotulo="Rotação"
                  sufixo="°"
                  valor={bloco.rotacao}
                  min={-180}
                  max={180}
                  aoMudar={(v) => trocarBloco(bloco.id, { rotacao: v })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />
                <label className="flex items-center justify-between text-[13px]">
                  Cor
                  <input
                    type="color"
                    value={bloco.cor}
                    onChange={(e) => {
                      const antes = doc;
                      trocarBloco(bloco.id, { cor: e.target.value });
                      registrar(antes);
                    }}
                    className="size-11 border border-(--c-rule)"
                  />
                </label>
              </>
            )}

            {bloco.tipo === "forma" && (
              <>
                <label className="flex items-center justify-between text-[13px]">
                  Forma
                  <select
                    value={bloco.forma}
                    onChange={(e) => {
                      const antes = doc;
                      trocarBloco(bloco.id, {
                        forma: e.target.value as FormaId,
                      });
                      registrar(antes);
                    }}
                    className="min-h-11 border border-(--c-rule) bg-white px-2 text-[13px]"
                  >
                    {FORMAS.map((f) => (
                      <option key={f} value={f}>
                        {NOME_DA_FORMA[f]}
                      </option>
                    ))}
                  </select>
                </label>

                <Numero
                  rotulo="Proporção"
                  valor={bloco.proporcao}
                  min={0.2}
                  max={4}
                  passo={0.05}
                  aoMudar={(v) => trocarBloco(bloco.id, { proporcao: v })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />

                {bloco.forma === "arredondado" && (
                  <Numero
                    rotulo="Cantos"
                    sufixo="px"
                    valor={bloco.raio}
                    min={0}
                    max={400}
                    passo={4}
                    aoMudar={(v) => trocarBloco(bloco.id, { raio: v })}
                    aoComecar={marcarGesto}
                    aoTerminar={fecharGesto}
                  />
                )}

                <Numero
                  rotulo="Contorno"
                  sufixo="px"
                  valor={bloco.espessura}
                  min={0}
                  max={40}
                  aoMudar={(v) => trocarBloco(bloco.id, { espessura: v })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />

                <Numero
                  rotulo="Opacidade"
                  sufixo="%"
                  valor={bloco.opacidade * 100}
                  min={0}
                  max={100}
                  passo={5}
                  aoMudar={(v) => trocarBloco(bloco.id, { opacidade: v / 100 })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />

                <Numero
                  rotulo="Rotação"
                  sufixo="°"
                  valor={bloco.rotacao}
                  min={-180}
                  max={180}
                  aoMudar={(v) => trocarBloco(bloco.id, { rotacao: v })}
                  aoComecar={marcarGesto}
                  aoTerminar={fecharGesto}
                />

                {/* Preenchimento com botão de LIMPAR: forma só de contorno é
                    metade do uso (moldura em volta do texto), e sem um jeito
                    de esvaziar a cor não dá para chegar lá. */}
                <div className="flex items-center justify-between text-[13px]">
                  Preenchimento
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const antes = doc;
                        trocarBloco(bloco.id, {
                          preenchimento: bloco.preenchimento ? "" : "#b8985f",
                        });
                        registrar(antes);
                      }}
                      className="text-[12px] underline underline-offset-2 text-(--c-ink-2)"
                    >
                      {bloco.preenchimento ? "sem cor" : "com cor"}
                    </button>
                    <input
                      type="color"
                      value={bloco.preenchimento || "#b8985f"}
                      aria-label="Cor de preenchimento"
                      onChange={(e) => {
                        const antes = doc;
                        trocarBloco(bloco.id, { preenchimento: e.target.value });
                        registrar(antes);
                      }}
                      className="size-11 border border-(--c-rule)"
                    />
                  </span>
                </div>

                <label className="flex items-center justify-between text-[13px]">
                  Cor do contorno
                  <input
                    type="color"
                    value={bloco.contorno || "#b8985f"}
                    onChange={(e) => {
                      const antes = doc;
                      trocarBloco(bloco.id, { contorno: e.target.value });
                      registrar(antes);
                    }}
                    className="size-11 border border-(--c-rule)"
                  />
                </label>
              </>
            )}
          </div>
        )}

        <div className="surface-raised flex items-center justify-between rounded-[3px] p-4 text-[13px]">
          Fundo do convite
          <input
            type="color"
            value={doc.fundo}
            aria-label="Cor de fundo do convite"
            onChange={(e) => {
              const antes = doc;
              mudar((d) => ({ ...d, fundo: e.target.value }));
              registrar(antes);
            }}
            className="size-11 border border-(--c-rule)"
          />
        </div>

        <div className="surface-raised flex flex-col gap-2 rounded-[3px] p-4">
          <span className="meta text-(--c-ink-2)">Baixar</span>
          {/* O arquivo sai do que está NO BANCO, não da tela: dizer isso evita
              o casal baixar uma versão sem a última mudança e achar que o
              export está quebrado. */}
          {!salvo && (
            <p className="text-[12px] leading-relaxed text-(--c-mark)">
              Salvem antes de baixar — o arquivo sai da última versão salva.
            </p>
          )}
          <div className="flex gap-2">
            {(
              [
                ["png", "PNG"],
                ["jpeg", "JPEG"],
                ["pdf", "PDF"],
              ] as const
            ).map(([f, rotulo]) => (
              <a
                key={f}
                href={`${baixar}?formato=${f}`}
                download
                className="min-h-11 flex-1 border border-(--c-ink) text-center text-[13px] leading-[2.6] text-(--c-ink) transition-colors hover:bg-(--c-ink) hover:text-white"
              >
                {rotulo}
              </a>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
