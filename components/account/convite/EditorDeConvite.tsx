"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  FORMAS,
  novoId,
  prenderNaTela,
  type Bloco,
  type FormaId,
  type InviteDoc,
} from "@/lib/site/inviteDoc";
import { clipPathDe, NOME_DA_FORMA } from "@/lib/site/inviteShapes";
import { salvarConviteAction } from "@/app/actions/invite-actions";
import {
  confirmPhotoUploadAction,
  requestPhotoUploadAction,
} from "@/app/actions/photo-actions";
import { prepararFoto } from "@/lib/site/prepararFoto";
import { useHistorico } from "@/components/account/manage/useHistorico";
import BlocoNaTela from "./BlocoNaTela";
import BarraDoBloco from "./BarraDoBloco";
import Camadas from "./Camadas";
import FormatoDoConvite from "./FormatoDoConvite";
import { LINKS_DO_CONVITE, linkDaSecao } from "@/lib/site/ancoras";
import { FONTES, Numero } from "./controles";

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
  /** Para montar os links das seções do site do casal. */
  baseUrl: string;
  slug: string;
};

export default function EditorDeConvite({
  siteId,
  orderId,
  inviteId,
  nomeInicial,
  docInicial,
  fotos,
  baseUrl,
  slug,
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
  const [menuBaixar, setMenuBaixar] = useState(false);

  // As fotos vivem em estado porque o editor agora SOBE foto: a lista que veio
  // do servidor deixa de ser a verdade no instante em que a primeira sobe.
  const [minhasFotos, setMinhasFotos] = useState(fotos);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const telaRef = useRef<HTMLDivElement>(null);
  const molduraRef = useRef<HTMLDivElement>(null);
  const antesDoGesto = useRef<InviteDoc>(docInicial);

  // Zoom da TELA, não do convite: mexe em como o casal enxerga, nunca no
  // documento. Por isso não entra no histórico nem marca "não salvo" — dar
  // desfazer depois de aproximar seria desfazer a coisa errada.
  const [zoom, setZoom] = useState(1);

  // Deslocamento da tela dentro da moldura, em px. Existe porque com zoom o
  // convite passa do tamanho da janela e é preciso ALCANÇAR o canto de baixo.
  // Barra de rolagem resolveria — e foi o que estava lá —, mas arrastar com o
  // dedo é o gesto de todo editor de imagem, e a barra ainda comia altura da
  // área de desenho.
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Onde está o bloco escolhido NA JANELA. A barra flutuante é `fixed`, então
  // precisa de coordenada de viewport — e ela muda com o arrasto, o zoom, a
  // rolagem da moldura e a da própria página.
  const [alvo, setAlvo] = useState<DOMRect | null>(null);
  const blocosRef = useRef(new Map<string, HTMLElement>());

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
    | { tipo: "canto"; id: string; x0: number; y0: number; w0: number; p0: number }
    | { tipo: "girar"; id: string; cx: number; cy: number; a0: number; r0: number }
    | { tipo: "pan"; x0: number; y0: number; px: number; py: number }
    | null
  >(null);

  /** Arrastar o FUNDO move a tela — não desenha nada, só navega. */
  function aoPegarFundo(e: React.PointerEvent) {
    // Só o fundo: um `pointerdown` que veio de um bloco já foi tratado lá.
    if (e.target !== e.currentTarget) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelecionado(null);
    gesto.current = {
      tipo: "pan",
      x0: e.clientX,
      y0: e.clientY,
      px: pan.x,
      py: pan.y,
    };
  }

  function medidas(): DOMRect {
    return telaRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 1, 1);
  }

  function aoPegar(
    e: React.PointerEvent,
    alvo: Bloco,
    tipo: "mover" | "largura" | "canto" | "girar"
  ) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const r = medidas();
    antesDoGesto.current = doc;
    setSelecionado(alvo.id);

    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    if (tipo === "mover") {
      gesto.current = {
        tipo,
        id: alvo.id,
        dx: px - alvo.x,
        dy: py - alvo.y,
      };
      return;
    }
    if (tipo === "largura") {
      gesto.current = { tipo, id: alvo.id, x0: px, w0: alvo.w };
      return;
    }
    if (tipo === "girar") {
      // O ângulo se mede do CENTRO do bloco até o ponteiro, em pixels da
      // janela — em fração da tela a conta sairia torta, porque o convite
      // não é quadrado e um grau na horizontal não vale um grau na vertical.
      const caixa = blocosRef.current.get(alvo.id)?.getBoundingClientRect();
      const cx = caixa ? caixa.left + caixa.width / 2 : e.clientX;
      const cy = caixa ? caixa.top + caixa.height / 2 : e.clientY;
      gesto.current = {
        tipo,
        id: alvo.id,
        cx,
        cy,
        // Guarda o ângulo do PONTEIRO e o do bloco no início, e aplica só a
        // diferença: sem isso o bloco pularia para o ângulo do cursor no
        // primeiro movimento, em vez de girar a partir de onde estava.
        a0: (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI,
        r0: alvo.rotacao,
      };
      return;
    }
    gesto.current = {
      tipo,
      id: alvo.id,
      x0: px,
      y0: py,
      w0: alvo.w,
      p0: alvo.tipo === "foto" || alvo.tipo === "forma" ? alvo.proporcao : 1,
    };
  }

  function aoMover(e: React.PointerEvent) {
    const g = gesto.current;
    if (!g) return;

    // Mover a tela é o único gesto que não mexe no documento.
    if (g.tipo === "pan") {
      setPan({ x: g.px + (e.clientX - g.x0), y: g.py + (e.clientY - g.y0) });
      return;
    }

    if (g.tipo === "girar") {
      const agora = (Math.atan2(e.clientY - g.cy, e.clientX - g.cx) * 180) / Math.PI;
      let graus = g.r0 + (agora - g.a0);
      // Com Shift, trava de 15 em 15 — é o que Figma e Canva fazem, e o que
      // permite deixar duas formas com a MESMA inclinação sem digitar nada.
      if (e.shiftKey) graus = Math.round(graus / 15) * 15;
      // Normaliza para -180..180: sem isso, dar três voltas guardaria 1080°,
      // que é o mesmo desenho com um número que ninguém entende.
      graus = ((((graus + 180) % 360) + 360) % 360) - 180;
      mudar((d) => ({
        ...d,
        blocos: d.blocos.map((b) =>
          b.id === g.id ? { ...b, rotacao: Math.round(graus) } : b
        ),
      }));
      return;
    }

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
        if (g.tipo === "largura") {
          return prenderNaTela({ ...b, w: g.w0 + (px - g.x0) });
        }

        // CANTO: largura e altura ao mesmo tempo — é o que permite achatar e
        // esticar. A altura não é um campo: ela sai de `proporcao`
        // (largura/altura), então mexer no canto significa recalcular a
        // proporção a partir das duas medidas novas.
        if (b.tipo !== "foto" && b.tipo !== "forma") return b;
        const alturaTela = r.height / r.width; // altura da tela em unidades de largura
        const w = Math.max(g.w0 + (px - g.x0), 0.03);
        const h0 = g.w0 / (g.p0 || 1);
        const h = Math.max(h0 + (py - g.y0) / alturaTela, 0.03);
        return prenderNaTela({ ...b, w, proporcao: w / h });
      }),
    }));
  }

  function aoSoltar() {
    const g = gesto.current;
    if (!g) return;
    gesto.current = null;
    // Mover a tela não é edição: não vira passo de desfazer.
    if (g.tipo !== "pan") registrar(antesDoGesto.current);
  }

  // ── acrescentar e remover ────────────────────────────────────────────────

  function acrescentar(novo: Bloco) {
    const antes = doc;
    mudar((d) => ({ ...d, blocos: [...d.blocos, novo] }));
    registrar(antes);
    setSelecionado(novo.id);
  }

  /**
   * Reordena a pilha. `de` e `para` são índices do DOCUMENTO, onde o último
   * desenha por cima — a inversão para "frente/trás" mora em `Camadas`.
   */
  const moverCamada = useCallback(
    (de: number, para: number) => {
      if (de === para) return;
      const antes = doc;
      mudar((d) => {
        const blocos = [...d.blocos];
        const [movido] = blocos.splice(de, 1);
        blocos.splice(Math.min(Math.max(para, 0), blocos.length), 0, movido);
        return { ...d, blocos };
      });
      registrar(antes);
    },
    [doc, mudar, registrar]
  );

  const apagarSelecionado = useCallback(() => {
    if (!selecionado) return;
    // Confirmação porque apagar é o único gesto do editor que TIRA trabalho:
    // mexer numa cor errada se vê e se desfaz olhando; um bloco apagado sem
    // querer some da tela e nem sempre se percebe na hora.
    //
    // O Desfazer cobre o arrependimento tardio, mas ele só ajuda quem sabe
    // que perdeu algo. Uma pergunta antes custa um clique e evita o susto.
    if (!confirm("Remover este bloco do convite?")) return;
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
      if (e.key === "Escape") {
        setSelecionado(null);
        setMenuBaixar(false);
      }
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

  // Remede o retângulo do bloco escolhido sempre que algo possa tê-lo movido.
  // `doc` entra nas dependências de propósito: arrastar muda o documento, e é
  // o que faz a barra acompanhar o bloco durante o gesto.
  useEffect(() => {
    function medir() {
      // Bloco apagado deixa entrada morta no mapa; sem isto a barra mediria
      // um elemento que saiu do documento.
      const vivos = new Set(doc.blocos.map((b) => b.id));
      for (const id of blocosRef.current.keys()) {
        if (!vivos.has(id)) blocosRef.current.delete(id);
      }
      const el = selecionado ? blocosRef.current.get(selecionado) : null;
      setAlvo(el ? el.getBoundingClientRect() : null);
    }
    medir();
    const moldura = molduraRef.current;
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    moldura?.addEventListener("scroll", medir);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
      moldura?.removeEventListener("scroll", medir);
    };
  }, [selecionado, doc, zoom]);

  /**
   * Sobe foto pelo próprio editor.
   *
   * Reusa o caminho de sempre: prepara no navegador (`prepararFoto` — o mesmo
   * do PhotoManager, inclusive o EXIF), pede a URL assinada, envia direto ao
   * Storage e confirma. Nada aqui é um segundo caminho de foto; a imagem entra
   * no álbum do site como qualquer outra.
   *
   * Vai para o slot `gallery` porque é o de uso geral — foto de convite não
   * é capa nem álbum da festa.
   */
  async function subirFotos(lista: FileList) {
    setErroFoto(null);
    setEnviandoFoto(true);
    try {
      for (const file of Array.from(lista)) {
        const pronta = await prepararFoto(file);

        const pedido = await requestPhotoUploadAction({
          siteId,
          slot: "gallery",
          contentType: "image/jpeg",
          sizeBytes: pronta.blob.size,
        });
        if ("error" in pedido) {
          setErroFoto(pedido.error);
          break;
        }

        const envio = await fetch(pedido.uploadUrl, {
          method: "PUT",
          headers: { "content-type": "image/jpeg" },
          body: pronta.blob,
        });
        if (!envio.ok) {
          setErroFoto("O envio falhou no meio do caminho. Tente de novo.");
          break;
        }

        const confirmada = await confirmPhotoUploadAction({
          siteId,
          slot: "gallery",
          storagePath: pedido.storagePath,
          width: pronta.width,
          height: pronta.height,
          blurDataUrl: pronta.blurDataUrl,
          originalName: file.name,
        });
        if ("error" in confirmada) {
          setErroFoto(confirmada.error);
          break;
        }

        setMinhasFotos((atuais) => [
          ...atuais,
          { id: confirmada.photoId, alt: file.name },
        ]);
      }
    } catch (e) {
      console.error("[convite/foto]", e);
      setErroFoto(
        e instanceof Error && e.message
          ? e.message
          : "Não consegui enviar essa foto. Tente outra."
      );
    } finally {
      setEnviandoFoto(false);
    }
  }

  function salvar() {
    iniciarSalvamento(async () => {
      const r = await salvarConviteAction(siteId, inviteId, orderId, doc, nome);
      if (r && "saved" in r) {
        zerar(doc);
        setSalvo(true);
      }
    });
  }

  // Guarda o elemento de cada bloco para a barra flutuante saber ONDE ele
  // está na janela. Fora do JSX de propósito: o lint do React reprova
  // qualquer leitura de ref durante o render, e um callback definido aqui
  // (que só roda na montagem) não é leitura durante o render.
  // UM callback só, estável entre renders: o id vem do `data-bloco` do próprio
  // elemento. Uma closure por bloco (`registrarBloco(id)`) seria recriada a
  // cada render — o React a chamaria duas vezes por atualização, e o lint não
  // tem como provar que a escrita no ref é segura.
  const avisarElemento = useCallback(
    (id: string, el: HTMLDivElement | null) => {
      if (el) blocosRef.current.set(id, el);
      else blocosRef.current.delete(id);
    },
    []
  );

  const baixar = `/api/convite/${siteId}/${inviteId}`;
  const marcarGesto = () => {
    antesDoGesto.current = doc;
  };
  const fecharGesto = () => registrar(antesDoGesto.current);

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      {/* ── a tela ──────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        {/* A MOLDURA não rola: quem navega é o arrasto do fundo. Barra de
            rolagem obrigava a mirar num trilho de 10px para chegar ao canto
            do convite, e ainda comia altura da área de desenho. Com
            `overflow: hidden` + deslocamento, o gesto é o de qualquer editor
            de imagem.

            `getBoundingClientRect` já devolve a medida COM zoom e
            deslocamento aplicados, então a conta do arrasto de bloco
            (posição em fração da largura) continua valendo sem correção. */}
        <div
          ref={molduraRef}
          onPointerDown={aoPegarFundo}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          className="relative flex touch-none items-center justify-center overflow-hidden rounded-[3px] border border-(--c-rule) bg-(--c-sunken)/50"
          style={{
            height: "calc(100svh - 11rem)",
            // Declara o container para o `100cqh` da tela medir ESTA moldura.
            containerType: "size",
            cursor: "grab",
          }}
        >
          <div
            ref={telaRef}
            className="relative touch-none select-none overflow-hidden border border-(--c-rule) shadow-[0_3px_16px_rgba(26,29,33,0.16)]"
            style={{
              // A tela cabe na moldura pelos DOIS lados: `min()` compara a
              // largura disponível com a que a ALTURA DA MOLDURA permite,
              // dada a proporção do convite — sem isso um story 9:16
              // estouraria a altura e um paisagem desperdiçaria a largura.
              //
              // A conta usa `100cqh` (a altura da própria moldura), não a da
              // janela: medido, a diferença era 692px reais contra os ~660
              // que a fórmula com `svh` supunha, e a tela nascia com 528px
              // numa moldura de 1068 — metade da área desperdiçada.
              width: `calc(min(100%, calc(100cqh * ${doc.largura / doc.altura})) * ${zoom})`,
              aspectRatio: `${doc.largura} / ${doc.altura}`,
              translate: `${pan.x}px ${pan.y}px`,
              background: doc.fundo,
              containerType: "size",
            }}
          >
          {doc.blocos.map((b) => (
            <BlocoNaTela
              key={b.id}
              bloco={b}
              ativo={b.id === selecionado}
              aoAvisarElemento={avisarElemento}
              aoPegar={aoPegar}
            />
          ))}
          </div>
        </div>

        {bloco && (
          <BarraDoBloco
            bloco={bloco}
            alvo={alvo}
            aoTrocar={(campos) => trocarBloco(bloco.id, campos)}
            aoApagar={apagarSelecionado}
            marcarGesto={marcarGesto}
            fecharGesto={fecharGesto}
            trocarEregistrar={(campos) => {
              const antes = doc;
              trocarBloco(bloco.id, campos);
              registrar(antes);
            }}
          />
        )}

        {/* A régua de baixo: formato à esquerda, zoom à direita. */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-(--c-ink-2)">
          <FormatoDoConvite
            largura={doc.largura}
            altura={doc.altura}
            aoTrocar={(largura, altura) => {
              const antes = doc;
              mudar((d) => ({ ...d, largura, altura }));
              registrar(antes);
            }}
            marcarGesto={marcarGesto}
            fecharGesto={fecharGesto}
          />
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

        {/* CAMADAS — a lista de tudo que existe no convite, e a ordem em que
            se empilham. Resolve dois problemas: bloco pequeno ou escondido
            atrás de outro é difícil de acertar com o dedo (pela lista sempre
            dá para escolher), e colocar uma coisa na frente da outra não
            tinha caminho nenhum antes. */}
        <Camadas
          blocos={doc.blocos}
          selecionado={selecionado}
          aoEscolher={setSelecionado}
          aoMover={moverCamada}
        />

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

          <span className="meta mt-1 text-(--c-ink-2)">Fotos</span>

          {/* SUBIR AQUI: antes era preciso sair para a tela de Fotos e voltar.
              A foto vai para o mesmo álbum do site — serve ao convite E ao
              site, em vez de virar uma segunda pilha de arquivos. */}
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-(--c-ink) px-3 text-[13px] transition-colors hover:bg-(--c-ink) hover:text-white">
            <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 11V3.5M5 6l3-3 3 3M2.5 11.5v1.5h11v-1.5" />
            </svg>
            {enviandoFoto ? "Enviando…" : "Subir foto"}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={enviandoFoto}
              onChange={(e) => {
                if (e.target.files?.length) subirFotos(e.target.files);
                e.target.value = "";
              }}
              className="sr-only"
            />
          </label>

          {erroFoto && (
            <p className="text-[12px] leading-relaxed text-(--c-mark)">
              {erroFoto}
            </p>
          )}

          {minhasFotos.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {minhasFotos.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  title={f.alt ?? "Usar esta foto"}
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
                  <img src={`/f/${f.id}`} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px] leading-relaxed text-(--c-ink-2)">
              Suba uma foto para usar no convite. Ela fica guardada e serve
              também para o site.
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
                        aria-label={a === "center" ? "Centralizar" : `Alinhar à ${a === "left" ? "esquerda" : "direita"}`}
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

                {/* LINK: escolhe-se uma seção DO PRÓPRIO SITE, não se digita
                    URL. O casal não sabe (nem tem por que saber) que a lista
                    de presentes mora em `/s/<slug>#presentes` — e digitado à
                    mão, um endereço errado só aparece quando o convidado
                    clica. A opção "outro endereço" fica para o que é de fora
                    (um mapa, um formulário). */}
                <div className="flex flex-col gap-1.5 text-[13px]">
                  Link (opcional)
                  <select
                    value={
                      bloco.link === ""
                        ? ""
                        : LINKS_DO_CONVITE.some(
                              (l) => bloco.link === linkDaSecao(baseUrl, slug, l.chave)
                            )
                          ? bloco.link
                          : "outro"
                    }
                    onChange={(e) => {
                      const antes = doc;
                      const v = e.target.value;
                      trocarBloco(bloco.id, {
                        link: v === "outro" ? "https://" : v,
                      });
                      registrar(antes);
                    }}
                    className="min-h-11 border border-(--c-rule) bg-white px-2 text-[13px]"
                  >
                    <option value="">Sem link</option>
                    {LINKS_DO_CONVITE.map((l) => (
                      <option
                        key={l.chave}
                        value={linkDaSecao(baseUrl, slug, l.chave)}
                      >
                        {l.rotulo}
                      </option>
                    ))}
                    <option value="outro">Outro endereço…</option>
                  </select>

                  {bloco.link !== "" &&
                    !LINKS_DO_CONVITE.some(
                      (l) => bloco.link === linkDaSecao(baseUrl, slug, l.chave)
                    ) && (
                      <input
                        type="url"
                        value={bloco.link}
                        placeholder="https://…"
                        aria-label="Endereço do link"
                        onChange={(e) =>
                          trocarBloco(bloco.id, { link: e.target.value })
                        }
                        onFocus={marcarGesto}
                        onBlur={fecharGesto}
                        className="min-h-11 border border-(--c-rule) bg-white px-2 text-[13px]"
                      />
                    )}
                </div>
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

        {/* BAIXAR: um botão, e o menu abre com os formatos.
            Três botões lado a lado ocupavam a largura toda para uma escolha
            que se faz uma vez — e nenhum deles dizia PARA QUE serve, que é a
            dúvida real de quem nunca exportou nada. */}
        <div className="relative">
          {!salvo && (
            <p className="mb-2 text-[12px] leading-relaxed text-(--c-mark)">
              Salvem antes de baixar — o arquivo sai da última versão salva.
            </p>
          )}
          <button
            type="button"
            onClick={() => setMenuBaixar((v) => !v)}
            aria-expanded={menuBaixar}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] border border-(--c-ink) bg-(--c-ink) text-[13px] text-white transition-opacity hover:opacity-90"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v8M4.5 7L8 10.5L11.5 7M2.5 13.5h11" />
            </svg>
            Baixar
            <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 3.5l3 3 3-3" />
            </svg>
          </button>

          {menuBaixar && (
            <div className="surface-raised absolute left-0 right-0 top-[calc(100%+4px)] z-20 flex flex-col rounded-[3px] shadow-lg">
              {(
                [
                  ["png", "PNG", "melhor qualidade — WhatsApp e Instagram"],
                  ["jpeg", "JPEG", "arquivo menor, para mandar em lote"],
                  ["pdf", "PDF", "para imprimir numa gráfica"],
                ] as const
              ).map(([f, ext, para]) => (
                <a
                  key={f}
                  href={`${baixar}?formato=${f}`}
                  download
                  onClick={() => setMenuBaixar(false)}
                  className="flex min-h-11 items-center gap-2.5 border-b border-(--c-rule) px-3 py-2 transition-colors last:border-b-0 hover:bg-(--c-sunken)"
                >
                  <span className="meta w-9 shrink-0 text-(--c-ink)">{ext}</span>
                  <span className="text-[11.5px] leading-snug text-(--c-ink-2)">
                    {para}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
