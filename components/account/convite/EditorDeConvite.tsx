"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  CONVITE_ALTURA,
  CONVITE_LARGURA,
  novoId,
  prenderNaTela,
  type Bloco,
  type InviteDoc,
} from "@/lib/site/inviteDoc";
import { quebrarLinhas } from "@/lib/site/inviteRender";
import { salvarConviteAction } from "@/app/actions/invite-actions";
import { useHistorico } from "@/components/account/manage/useHistorico";

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

function familia(fonte: "serif" | "sans" | "script"): string {
  if (fonte === "sans") return "var(--font-sans, sans-serif)";
  if (fonte === "script") return "cursive";
  return "var(--font-serif, serif)";
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
  const antesDoGesto = useRef<InviteDoc>(docInicial);

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
      <div className="flex-1">
        <div
          ref={telaRef}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onPointerDown={() => setSelecionado(null)}
          className="relative mx-auto w-full max-w-[420px] touch-none select-none overflow-hidden rounded-[3px] border border-(--c-rule)"
          style={{
            aspectRatio: `${CONVITE_LARGURA} / ${CONVITE_ALTURA}`,
            background: doc.fundo,
            containerType: "inline-size",
          }}
        >
          {doc.blocos.map((b) => {
            const ativo = b.id === selecionado;
            return (
              <div
                key={b.id}
                onPointerDown={(e) => aoPegar(e, b, "mover")}
                style={{
                  position: "absolute",
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `${b.w * 100}%`,
                  outline: ativo ? "1.5px solid var(--c-mark)" : undefined,
                  outlineOffset: 2,
                  cursor: "grab",
                }}
              >
                {b.tipo === "linha" && (
                  <div
                    style={{
                      height: `${(b.espessura / CONVITE_ALTURA) * 100}cqh`,
                      minHeight: 1,
                      background: b.cor,
                    }}
                  />
                )}

                {b.tipo === "foto" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/f/${b.fotoId}`}
                    alt=""
                    draggable={false}
                    style={{
                      width: "100%",
                      aspectRatio: String(b.proporcao || 1),
                      objectFit: "cover",
                      borderRadius: `${(b.raio / CONVITE_LARGURA) * 100}%`,
                    }}
                  />
                )}

                {b.tipo === "texto" && (
                  <div
                    style={{
                      fontSize: `${b.tamanho * 100}cqw`,
                      color: b.cor,
                      fontWeight: b.peso,
                      textAlign: b.alinhamento,
                      letterSpacing: `${b.espacamento}em`,
                      lineHeight: 1.25,
                      whiteSpace: "pre-wrap",
                      fontFamily: familia(b.fonte),
                    }}
                  >
                    {quebrarLinhas(
                      b.texto,
                      b.w * CONVITE_LARGURA,
                      b.tamanho * CONVITE_LARGURA,
                      b.fonte
                    ).join("\n")}
                  </div>
                )}

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

        <p className="mt-3 text-center text-[12px] text-(--c-ink-2)">
          Arraste os blocos. Toque num bloco para editar; a bolinha muda a
          largura.
        </p>
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

        <div className="surface-raised flex flex-col gap-2 rounded-[3px] p-4">
          <span className="meta text-(--c-ink-2)">Acrescentar</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                acrescentar({
                  tipo: "texto",
                  id: novoId(),
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

                <label className="flex items-center justify-between text-[13px]">
                  Tamanho
                  <input
                    type="range"
                    min={0.015}
                    max={0.16}
                    step={0.005}
                    value={bloco.tamanho}
                    onPointerDown={marcarGesto}
                    onPointerUp={fecharGesto}
                    onChange={(e) =>
                      trocarBloco(bloco.id, { tamanho: Number(e.target.value) })
                    }
                    className="w-[55%]"
                  />
                </label>

                <label className="flex items-center justify-between text-[13px]">
                  Espaçamento
                  <input
                    type="range"
                    min={0}
                    max={0.6}
                    step={0.05}
                    value={bloco.espacamento}
                    onPointerDown={marcarGesto}
                    onPointerUp={fecharGesto}
                    onChange={(e) =>
                      trocarBloco(bloco.id, {
                        espacamento: Number(e.target.value),
                      })
                    }
                    className="w-[55%]"
                  />
                </label>

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
                <label className="flex items-center justify-between text-[13px]">
                  Formato
                  <input
                    type="range"
                    min={0.6}
                    max={1.8}
                    step={0.05}
                    value={bloco.proporcao}
                    onPointerDown={marcarGesto}
                    onPointerUp={fecharGesto}
                    onChange={(e) =>
                      trocarBloco(bloco.id, {
                        proporcao: Number(e.target.value),
                      })
                    }
                    className="w-[55%]"
                  />
                </label>
                <label className="flex items-center justify-between text-[13px]">
                  Cantos
                  <input
                    type="range"
                    min={0}
                    max={540}
                    step={20}
                    value={bloco.raio}
                    onPointerDown={marcarGesto}
                    onPointerUp={fecharGesto}
                    onChange={(e) =>
                      trocarBloco(bloco.id, { raio: Number(e.target.value) })
                    }
                    className="w-[55%]"
                  />
                </label>
              </>
            )}

            {bloco.tipo === "linha" && (
              <>
                <label className="flex items-center justify-between text-[13px]">
                  Espessura
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={bloco.espessura}
                    onPointerDown={marcarGesto}
                    onPointerUp={fecharGesto}
                    onChange={(e) =>
                      trocarBloco(bloco.id, {
                        espessura: Number(e.target.value),
                      })
                    }
                    className="w-[55%]"
                  />
                </label>
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
