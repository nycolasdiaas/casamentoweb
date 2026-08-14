"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { ETAPAS, type EtapaId, type RegraEtapa } from "@/lib/wizard/etapas";
import { CHAVE_CRIANDO } from "@/components/ui/EsperaDoPainel";
import { useActionState } from "react";
import {
  saveOrderAction,
  submitOrderAction,
} from "@/app/actions/account-actions";
import { PACKAGES, type PackageTier } from "@/lib/packages";
import { TEMPLATE_STYLES } from "@/lib/templates";
import {
  FONT_STYLES,
  FONT_CATEGORY_LABELS,
  type FontStyleId,
  type FontCategory,
} from "@/lib/customization";
import { WHATSAPP_LINK } from "@/lib/site";
import type { OrderStatus } from "@/lib/orderStatus";
import LivePreview from "@/components/account/LivePreview";
import WizardShell from "@/components/account/wizard/WizardShell";
import ColorRow from "@/components/account/wizard/ColorRow";
import { useConfirmacaoDeEscolha } from "@/components/account/wizard/useConfirmacaoDeEscolha";
import CelebrationScreen from "@/components/account/wizard/CelebrationScreen";
import { FONT_PREVIEW_CLASS, CATEGORY_PREVIEW_SIZE } from "@/components/account/wizard/fontPreview";

/**
 * O pedido como questionário — uma pergunta por tela.
 *
 * O que havia antes: uma página só com pacote, modelo, duas cores, 34 fontes,
 * observações e material, tudo aberto ao mesmo tempo. O Anderson resumiu bem
 * — parecia jogar um milhão de informações na tela. A referência escolhida
 * (iCasei) faz MAIS perguntas que a gente e parece leve, porque mostra uma de
 * cada vez, com o progresso à vista.
 *
 * Decisão estrutural: **todo o estado vive aqui**, e o formulário só carrega
 * campos ocultos. É o que permite (a) trocar de etapa sem perder resposta,
 * (b) animar a troca, e (c) escolher um modelo pronto e ver as três cores se
 * preencherem embaixo — que com estado local em cada campo não acontecia.
 */

export type OrderData = {
  packageTier: PackageTier;
  templateStyle: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  tertiaryColor: string | null;
  fontStyle: string | null;
  styleNotes: string | null;
  coupleNames: string | null;
  weddingDate: string | null;
  notes: string | null;
  status: OrderStatus;
};

// Derivado das próprias actions em vez de redeclarado à mão: quando elas
// ganharem um estado novo, o wizard não fica com um tipo mentindo.
type ActionResult =
  | Awaited<ReturnType<typeof saveOrderAction>>
  | Awaited<ReturnType<typeof submitOrderAction>>;

const FONT_CATEGORY_ORDER: FontCategory[] = [
  "serifa",
  "manuscrita",
  "sans",
  "rustica",
];

const campoBase =
  "w-full rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3.5 text-sm text-(--color-olive) transition-colors focus:border-(--color-olive) focus:outline-none";

export default function OrderWizard({
  order,
  orderId,
}: {
  order: OrderData | null;
  orderId: string | null;
}) {
  const [passo, setPasso] = useState(0);
  const [direcao, setDirecao] = useState<"frente" | "tras">("frente");
  // Ligado no CLIQUE do botão, nunca dentro da action.
  //
  // A ação de um `useActionState` roda dentro de uma transição do React, e
  // atualizações de estado feitas lá dentro são ADIADAS: o React só as pinta
  // junto com o resultado da transição. Como `submitOrderAction` termina em
  // `redirect`, o resultado nunca chega — e a tela de celebração nunca era
  // pintada. Era por isso que "não acontecia nada" ao criar o pedido.
  //
  // `onClick` dispara antes do envio do formulário e fora da transição, então
  // é atualização urgente: pinta na hora.
  const [enviando, setEnviando] = useState(false);

  // ---- respostas -----------------------------------------------------------
  const [pacote, setPacote] = useState<PackageTier>(
    order?.packageTier ?? (PACKAGES.find((p) => p.highlight)?.tier ?? "site")
  );
  const [nomes, setNomes] = useState(order?.coupleNames ?? "");
  const [data, setData] = useState(order?.weddingDate ?? "");
  // Pedido NOVO nasce com um molde escolhido; pedido EXISTENTE respeita o que
  // o casal salvou — inclusive "do zero" (null), que é escolha legítima.
  //
  // Sem essa distinção, todo pedido novo saía com templateStyle vazio, o site
  // era provisionado com `template_id = null`, e a prévia ficava presa no
  // "estamos preparando" para sempre — porque `getTemplate(null)` não acha
  // molde nenhum. Era isso que travava a prévia.
  const [modelo, setModelo] = useState(
    order ? (order.templateStyle ?? "") : "classico"
  );
  const [cor1, setCor1] = useState(order?.primaryColor ?? "");
  const [cor2, setCor2] = useState(order?.secondaryColor ?? "");
  const [cor3, setCor3] = useState(order?.tertiaryColor ?? "");
  const [fonte, setFonte] = useState(order?.fontStyle ?? "");
  const [estilo, setEstilo] = useState(order?.styleNotes ?? "");
  const [obs, setObs] = useState(order?.notes ?? "");

  // ---- o CONTEÚDO do site ----------------------------------------------
  // Estes campos NÃO moram em `orders`: vão direto para `site_content` no
  // provisionamento. Pedido guarda a escolha (pacote, estilo, cores); o site
  // guarda o que ele diz. Separar assim evitou migração e mantém uma fonte
  // só para cada coisa.
  const [hora, setHora] = useState("");
  const [cerimoniaLocal, setCerimoniaLocal] = useState("");
  const [cerimoniaEndereco, setCerimoniaEndereco] = useState("");
  const [festaLocal, setFestaLocal] = useState("");
  const [festaEndereco, setFestaEndereco] = useState("");
  const [traje, setTraje] = useState("");
  const [historia, setHistoria] = useState("");

  const [state, action, pending] = useActionState(
    async (
      _prev: ActionResult | undefined,
      formData: FormData
    ): Promise<ActionResult> => {
      const ehEnvio = formData.get("intent")?.toString() === "submit";
      try {
        return ehEnvio
          ? await submitOrderAction(formData)
          : await saveOrderAction(formData);
      } finally {
        // O envio bem-sucedido termina em `redirect`, então isto só roda
        // quando a action VOLTA — ou seja, deu erro. Tirar a celebração é o
        // que deixa a mensagem de erro visível.
        setEnviando(false);
      }
    },
    undefined
  );

  /**
   * Escolher um modelo pronto PREENCHE as três cores com a paleta dele.
   *
   * `swatches` é [papel, tinta, acento] — a mesma tripla que o molde usa. O
   * casal continua livre para trocar qualquer uma depois; o modelo é ponto de
   * partida, não trava. Antes, escolher "Clássico" não mexia em nada embaixo
   * e a escolha parecia não ter valido.
   */
  const escolherModelo = useCallback((id: string) => {
    setModelo(id);
    const estiloEscolhido = TEMPLATE_STYLES.find((s) => s.id === id);
    if (!estiloEscolhido) return;
    const [papel, tinta, acento] = estiloEscolhido.swatches;
    setCor1(tinta ?? "");
    setCor2(acento ?? "");
    setCor3(papel ?? "");
  }, []);

  const primeiroNome = useMemo(
    () => nomes.trim().split(/[\s&]+/).filter(Boolean)[0] ?? null,
    [nomes]
  );

  const ir = (delta: number) => {
    setDirecao(delta > 0 ? "frente" : "tras");
    setPasso((p) => Math.max(0, Math.min(PASSOS.length - 1, p + delta)));
  };

  // A confirmação visual da resposta. Ver useConfirmacaoDeEscolha — e o
  // motivo de ela NÃO usar GSAP está documentado lá.
  const escolhaRef = useRef<HTMLDivElement>(null);
  useConfirmacaoDeEscolha(escolhaRef, `${pacote}|${modelo}`);

  // ---- as etapas -----------------------------------------------------------
  // A LISTA (ordem, titulos, quais bloqueiam o avanco) mora em
  // `lib/wizard/etapas.ts`. Aqui fica so o DESENHO de cada uma.
  const regras: Record<RegraEtapa, boolean> = {
    nomes: nomes.trim().length > 0,
  };

  const conteudos: Record<EtapaId, ReactNode> = {
    pacote: (
        <div className="motion-stagger grid gap-3 sm:grid-cols-3">
          {PACKAGES.map((pkg, i) => {
            const ativo = pacote === pkg.tier;
            return (
              <button
                key={pkg.tier}
                type="button"
                onClick={() => setPacote(pkg.tier)}
                data-escolha={ativo ? "sim" : "nao"}
                style={{ ["--i" as string]: i }}
                className={`flex flex-col gap-1.5 rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  ativo
                    ? "border-(--color-olive) bg-(--color-blush) shadow-sm"
                    : "border-(--color-gold)/40 bg-white"
                }`}
              >
                <span className="text-sm font-semibold">{pkg.name}</span>
                <span className="text-xl font-bold">{pkg.price}</span>
                <span className="text-xs leading-relaxed text-(--color-olive)/60">
                  {pkg.tagline}
                </span>
              </button>
            );
          })}
        </div>
    ),
    nomes: (
        <div className="motion-stagger mx-auto flex max-w-md flex-col gap-5">
          <label style={{ ["--i" as string]: 0 }} className="flex flex-col gap-2">
            <span className="text-sm font-medium">Nomes de vocês</span>
            <input
              value={nomes}
              onChange={(e) => setNomes(e.target.value)}
              placeholder="Ex: Ana &amp; Pedro"
              maxLength={120}
              className={campoBase}
            />
            <span className="text-xs text-(--color-muted)">
              Do jeito que vocês querem ver escrito na capa.
            </span>
          </label>

          <label style={{ ["--i" as string]: 1 }} className="flex flex-col gap-2">
            <span className="text-sm font-medium">Data do casamento</span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={campoBase}
            />
            <span className="text-xs text-(--color-muted)">
              Alimenta a contagem regressiva. Ainda não fecharam? Deixem em
              branco.
            </span>
          </label>
        </div>
    ),
    cerimonia: (
      <div className="motion-stagger mx-auto flex max-w-md flex-col gap-5">
        <label style={{ ["--i" as string]: 0 }} className="flex flex-col gap-2">
          <span className="text-sm font-medium">Local da cerimônia</span>
          <input
            value={cerimoniaLocal}
            onChange={(e) => setCerimoniaLocal(e.target.value)}
            placeholder="Ex: Igreja Nossa Senhora das Graças"
            maxLength={160}
            className={campoBase}
          />
        </label>
        <label style={{ ["--i" as string]: 1 }} className="flex flex-col gap-2">
          <span className="text-sm font-medium">Endereço</span>
          <input
            value={cerimoniaEndereco}
            onChange={(e) => setCerimoniaEndereco(e.target.value)}
            placeholder="Rua, número, bairro, cidade"
            maxLength={300}
            className={campoBase}
          />
          <span className="text-xs text-(--color-muted)">
            Vira o botão de mapa no convite.
          </span>
        </label>
        <label style={{ ["--i" as string]: 2 }} className="flex flex-col gap-2">
          <span className="text-sm font-medium">Horário</span>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={campoBase}
          />
        </label>
      </div>
    ),
    festa: (
      <div className="motion-stagger mx-auto flex max-w-md flex-col gap-5">
        <label style={{ ["--i" as string]: 0 }} className="flex flex-col gap-2">
          <span className="text-sm font-medium">Local da festa</span>
          <input
            value={festaLocal}
            onChange={(e) => setFestaLocal(e.target.value)}
            placeholder="Ex: Espaço Jardim das Oliveiras"
            maxLength={160}
            className={campoBase}
          />
        </label>
        <label style={{ ["--i" as string]: 1 }} className="flex flex-col gap-2">
          <span className="text-sm font-medium">Endereço</span>
          <input
            value={festaEndereco}
            onChange={(e) => setFestaEndereco(e.target.value)}
            placeholder="Rua, número, bairro, cidade"
            maxLength={300}
            className={campoBase}
          />
        </label>
        <button
          type="button"
          style={{ ["--i" as string]: 2 }}
          onClick={() => {
            setFestaLocal(cerimoniaLocal);
            setFestaEndereco(cerimoniaEndereco);
          }}
          className="self-start rounded-full border border-(--color-gold)/50 px-4 py-2 text-xs transition-colors hover:bg-(--color-blush)"
        >
          É no mesmo lugar da cerimônia
        </button>
      </div>
    ),
    traje: (
      <div className="motion-stagger mx-auto flex max-w-md flex-col gap-4">
        <label style={{ ["--i" as string]: 0 }} className="flex flex-col gap-2">
          <span className="text-sm font-medium">Traje</span>
          <input
            value={traje}
            onChange={(e) => setTraje(e.target.value)}
            placeholder="Ex: Esporte fino"
            maxLength={200}
            className={campoBase}
          />
        </label>
        <div className="motion-stagger flex flex-wrap gap-2">
          {["Traje social", "Esporte fino", "Casual elegante", "Pé na areia"].map(
            (sugestao, i) => (
              <button
                key={sugestao}
                type="button"
                style={{ ["--i" as string]: i }}
                onClick={() => setTraje(sugestao)}
                className="rounded-full border border-(--color-gold)/50 px-3.5 py-1.5 text-xs transition-colors hover:bg-(--color-blush)"
              >
                {sugestao}
              </button>
            )
          )}
        </div>
      </div>
    ),
    historia: (
      <div className="motion-stagger mx-auto flex max-w-xl flex-col gap-3">
        <label style={{ ["--i" as string]: 0 }} className="flex flex-col gap-2">
          <span className="text-sm font-medium">Nossa história</span>
          <textarea
            rows={7}
            value={historia}
            onChange={(e) => setHistoria(e.target.value)}
            placeholder="Onde se conheceram, como foi o pedido, o que vocês querem que os convidados saibam…"
            maxLength={5000}
            className={`${campoBase} resize-y`}
          />
        </label>
        <span style={{ ["--i" as string]: 1 }} className="text-xs text-(--color-muted)">
          {historia.length}/5000
        </span>
      </div>
    ),
    modelo: (
        <div className="flex flex-col gap-4">
          <div className="motion-stagger grid gap-3 sm:grid-cols-3">
            {TEMPLATE_STYLES.map((estiloItem, i) => {
              const ativo = modelo === estiloItem.id;
              return (
                <button
                  key={estiloItem.id}
                  type="button"
                  onClick={() => escolherModelo(estiloItem.id)}
                  data-escolha={ativo ? "sim" : "nao"}
                  style={{ ["--i" as string]: i }}
                  className={`flex flex-col gap-2.5 rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    ativo
                      ? "border-(--color-olive) bg-(--color-blush) shadow-sm"
                      : "border-(--color-gold)/40 bg-white"
                  }`}
                >
                  <span className="text-sm font-semibold">
                    {estiloItem.name}
                  </span>
                  <span className="flex gap-1.5">
                    {estiloItem.swatches.map((hex) => (
                      <span
                        key={hex}
                        style={{ backgroundColor: hex }}
                        className="size-5 rounded-full border border-black/10"
                      />
                    ))}
                  </span>
                  <span className="text-xs leading-relaxed text-(--color-olive)/60">
                    {estiloItem.description}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setModelo("")}
            className={`self-start rounded-full border px-4 py-2 text-xs transition-colors ${
              modelo === ""
                ? "border-(--color-olive) bg-(--color-blush) font-medium"
                : "border-(--color-gold)/50 hover:bg-(--color-blush)"
            }`}
          >
            Prefiro montar do zero
          </button>

          {modelo && (
            <div className="motion-fade-in">
              <LivePreview
                src={`/pacotes/estilos/${modelo}?pacote=${pacote}`}
                titulo="Como este modelo fica"
                descricao="Depois de enviar o pedido, esta prévia passa a mostrar o site com o conteúdo de vocês."
                fullBleed={false}
              />
            </div>
          )}
        </div>
    ),
    cores: (
        <div className="motion-stagger mx-auto flex max-w-2xl flex-col gap-7">
          <div style={{ ["--i" as string]: 0 }}>
            <ColorRow
              label="Cor principal"
              hint="a tinta — títulos e texto"
              valor={cor1}
              onChange={setCor1}
            />
          </div>
          <div style={{ ["--i" as string]: 1 }}>
            <ColorRow
              label="Cor secundária"
              hint="o acento — detalhes, botões, ornamentos"
              valor={cor2}
              onChange={setCor2}
            />
          </div>
          <div style={{ ["--i" as string]: 2 }}>
            <ColorRow
              label="Cor de fundo"
              hint="o papel do convite"
              valor={cor3}
              onChange={setCor3}
            />
          </div>
        </div>
    ),
    fonte: (
        <div className="flex max-h-[30rem] flex-col gap-6 overflow-y-auto rounded-2xl border border-(--color-gold)/30 bg-(--color-paper)/40 p-4">
          {FONT_CATEGORY_ORDER.map((categoria) => {
            const doGrupo = FONT_STYLES.filter((f) => f.category === categoria);
            if (doGrupo.length === 0) return null;
            return (
              <div key={categoria} className="flex flex-col gap-3">
                {/* Rótulo NÃO grudado.
                    Ele era `sticky top-0`, e cabeçalho grudado sempre cobre o
                    que passa por baixo: a primeira linha de cartões aparecia
                    cortada ao meio ("Tradicional, de livro" sem o topo). Dar
                    fundo opaco e z-index só trocou "texto vazando" por "texto
                    escondido" — o cartão continuava cortado.
                    Com 4 categorias curtas, seguir a rolagem não vale o preço. */}
                <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-(--color-gold)">
                  {FONT_CATEGORY_LABELS[categoria]}
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-(--color-gold)/30"
                  />
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {doGrupo.map((f) => {
                    const ativo = fonte === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFonte(ativo ? "" : f.id)}
                        className={`flex items-center justify-between gap-3 rounded-xl border-2 bg-white px-4 py-3 text-left transition-all duration-150 hover:-translate-y-0.5 ${
                          ativo
                            ? "border-(--color-olive) bg-(--color-blush)"
                            : "border-(--color-gold)/40"
                        }`}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold">
                            {f.name}
                          </span>
                          <span className="truncate text-xs text-(--color-muted)">
                            {f.description}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className={`${FONT_PREVIEW_CLASS[f.id as FontStyleId]} ${CATEGORY_PREVIEW_SIZE[f.category]} shrink-0 leading-none text-(--color-olive)`}
                        >
                          {primeiroNome ? `${primeiroNome}` : "Ana & Pedro"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
    ),
    observacoes: (
        <div className="motion-stagger mx-auto flex max-w-xl flex-col gap-5">
          <label style={{ ["--i" as string]: 0 }} className="flex flex-col gap-2">
            <span className="text-sm font-medium">Observações de estilo</span>
            <textarea
              rows={4}
              value={estilo}
              onChange={(e) => setEstilo(e.target.value)}
              placeholder="Tema praia, flores em aquarela, nada de rosa, uma fonte que viram por aí…"
              className={`${campoBase} resize-y`}
            />
          </label>
          <label style={{ ["--i" as string]: 1 }} className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              Mais alguma coisa que a gente precisa saber?
            </span>
            <textarea
              rows={3}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Qualquer coisa: prazo apertado, uma surpresa, uma dúvida…"
              className={`${campoBase} resize-y`}
            />
          </label>
          <p
            style={{ ["--i" as string]: 2 }}
            className="rounded-xl border border-(--color-gold)/40 bg-(--color-blush) px-4 py-3 text-xs leading-relaxed text-(--color-olive)"
          >
            <strong className="font-semibold">As fotos ficam para depois.</strong>{" "}
            Assim que o pedido for enviado, vocês sobem as fotos direto na tela
            de acompanhamento — com a prévia do site do lado, vendo onde cada
            uma cai.
          </p>
        </div>
    ),
    revisao: (
        <div className="motion-stagger mx-auto flex max-w-xl flex-col gap-2.5">
          {[
            ["Pacote", PACKAGES.find((p) => p.tier === pacote)?.name ?? "—"],
            ["Nomes", nomes.trim() || "—"],
            [
              "Data",
              data
                ? new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "a definir",
            ],
            [
              "Ponto de partida",
              TEMPLATE_STYLES.find((s) => s.id === modelo)?.name ??
                "do zero, com as cores de vocês",
            ],
            [
              "Tipografia",
              FONT_STYLES.find((f) => f.id === fonte)?.name ??
                "a gente sugere",
            ],
          ].map(([rotulo, valor], i) => (
            <div
              key={rotulo}
              style={{ ["--i" as string]: i }}
              className="flex items-baseline justify-between gap-4 rounded-xl border border-(--color-gold)/30 bg-white px-4 py-3"
            >
              <span className="text-xs uppercase tracking-[0.12em] text-(--color-muted)">
                {rotulo}
              </span>
              <span className="text-right text-sm font-medium">{valor}</span>
            </div>
          ))}

          <div
            style={{ ["--i" as string]: 5 }}
            className="mt-1 flex items-center gap-2.5 rounded-xl border border-(--color-gold)/30 bg-white px-4 py-3"
          >
            <span className="text-xs uppercase tracking-[0.12em] text-(--color-muted)">
              Cores
            </span>
            <span className="flex flex-1 justify-end gap-2">
              {[cor1, cor2, cor3].filter(Boolean).length === 0 ? (
                <span className="text-sm font-medium">a gente sugere</span>
              ) : (
                [cor1, cor2, cor3]
                  .filter(Boolean)
                  .map((hex) => (
                    <span
                      key={hex}
                      style={{ backgroundColor: hex }}
                      className="size-6 rounded-full border border-black/10"
                    />
                  ))
              )}
            </span>
          </div>
        </div>
    ),
  };

  // A lista vem do dado; o desenho vem do mapa acima. `podeAvancar` sai da
  // regra declarada na etapa — sem regra, a etapa e pulavel, que e o padrao.
  const PASSOS = ETAPAS.map((e) => ({
    titulo: e.titulo,
    subtitulo: e.subtitulo,
    podeAvancar: e.exige ? regras[e.exige] : true,
    conteudo: conteudos[e.id],
  }));

  const etapa = PASSOS[passo];
  const ultima = passo === PASSOS.length - 1;
  const jaEnviado = order !== null && order.status !== "draft";

  return (
    <>
      <CelebrationScreen
        ativo={enviando}
        accent={cor1 || null}
        nome={primeiroNome}
      />

      <form action={action} className="flex flex-col">
        {/* Campos ocultos: o estado é do React, o POST continua sendo um
            formulário normal. Assim uma etapa não perde a resposta da outra e
            o contrato com a action não muda. */}
        <input type="hidden" name="orderId" value={orderId ?? ""} />
        <input type="hidden" name="packageTier" value={pacote} />
        <input type="hidden" name="templateStyle" value={modelo} />
        <input type="hidden" name="primaryColor" value={cor1} />
        <input type="hidden" name="secondaryColor" value={cor2} />
        <input type="hidden" name="tertiaryColor" value={cor3} />
        <input type="hidden" name="fontStyle" value={fonte} />
        <input type="hidden" name="styleNotes" value={estilo} />
        <input type="hidden" name="coupleNames" value={nomes} />
        <input type="hidden" name="weddingDate" value={data} />
        <input type="hidden" name="notes" value={obs} />

        {/* O conteúdo do site. Os nomes batem com os de `parseContentForm`
            de propósito: é ele que grava, e reusá-lo não é opcional — ele
            trata o fuso da data, e um caminho paralelo faria a cerimônia das
            16h virar 19h e ganhar três horas a cada salvamento. */}
        <input type="hidden" name="weddingTime" value={hora} />
        <input type="hidden" name="ceremonyVenue" value={cerimoniaLocal} />
        <input type="hidden" name="ceremonyAddress" value={cerimoniaEndereco} />
        <input type="hidden" name="receptionVenue" value={festaLocal} />
        <input type="hidden" name="receptionAddress" value={festaEndereco} />
        <input type="hidden" name="dressCode" value={traje} />
        <input type="hidden" name="story" value={historia} />

        <WizardShell
          passo={passo}
          total={PASSOS.length}
          direcao={direcao}
          titulo={etapa.titulo}
          subtitulo={etapa.subtitulo}
          onVoltar={passo > 0 ? () => ir(-1) : undefined}
          rodape={
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* "Salvar rascunho" some na ÚLTIMA etapa.
                    Ali ele é redundante — enviar já grava tudo — e era uma
                    armadilha: ficava colado no "Criar nosso site", com a mesma
                    aparência de botão de formulário. Quem errava o alvo via
                    "Salvando…", nenhum site criado e nenhuma animação, e
                    concluía que a criação do pedido estava quebrada. Foi
                    exatamente o que aconteceu em teste real.
                    Nas outras etapas ele continua: ali salvar e sair é uma
                    intenção legítima. */}
                {!ultima && (
                  <button
                    type="submit"
                    name="intent"
                    value="save"
                    disabled={pending || jaEnviado}
                    className="btn btn-secondary btn-sm"
                  >
                    {pending && !enviando ? "Salvando…" : "Salvar rascunho"}
                  </button>
                )}

                {ultima ? (
                  <button
                    type="submit"
                    name="intent"
                    value="submit"
                    // Liga a celebração AQUI: `onClick` roda antes do envio do
                    // formulário e fora da transição do React, então a tela
                    // pinta na hora. Dentro da action ela nunca chegava a
                    // aparecer — ver o comentário em `enviando`.
                    onClick={() => {
                      setEnviando(true);
                      // Avisa a espera do painel que a próxima tela é a
                      // continuação disto, e não uma navegação qualquer.
                      sessionStorage.setItem(CHAVE_CRIANDO, "1");
                    }}
                    disabled={pending || jaEnviado}
                    className="btn btn-primary"
                  >
                    {jaEnviado ? "Pedido já enviado" : "Criar nosso site"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => ir(1)}
                    disabled={!etapa.podeAvancar}
                    className="btn btn-primary"
                  >
                    Próximo passo
                  </button>
                )}
              </div>

              <div aria-live="polite" className="min-h-5">
                {state && "error" in state && (
                  <p className="motion-rise-in text-sm text-red-700">
                    {state.error}
                  </p>
                )}
                {state && "saved" in state && (
                  <p className="motion-rise-in text-sm text-(--color-olive)">
                    Rascunho salvo
                  </p>
                )}
              </div>

              {/* O WhatsApp é ÚLTIMO recurso, não saída padrão.
                  Antes ele aparecia no rodapé de todas as sete etapas — a
                  pessoa era convidada a sair da tela antes de ter qualquer
                  problema, e o produto se descrevia como algo que precisa de
                  socorro humano para ser usado. Agora só na revisão, onde a
                  dúvida de fato pode existir, e sem pedir desculpa. */}
              {ultima && (
                <p className="text-xs text-(--color-muted)">
                  Prefere combinar por mensagem?{" "}
                  <Link
                    href={WHATSAPP_LINK}
                    target="_blank"
                    className="underline underline-offset-2"
                  >
                    Chame no WhatsApp
                  </Link>
                  .
                </p>
              )}
            </>
          }
        >
          <div ref={escolhaRef}>{etapa.conteudo}</div>
        </WizardShell>
      </form>
    </>
  );
}
