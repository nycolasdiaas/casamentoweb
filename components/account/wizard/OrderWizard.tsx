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
import AvisoDeContraste from "@/components/account/wizard/AvisoDeContraste";
import AmostraDeCores from "@/components/account/wizard/AmostraDeCores";
import { coresDoModelo } from "@/lib/theme/coresDoModelo";
import { useConfirmacaoDeEscolha } from "@/components/account/wizard/useConfirmacaoDeEscolha";
import CelebrationScreen from "@/components/account/wizard/CelebrationScreen";
import { FONT_PREVIEW_CLASS, CATEGORY_PREVIEW_SIZE } from "@/components/account/wizard/fontPreview";
import { dataPorExtenso } from "@/lib/site/dataLegivel";
import { Icone } from "@/components/ui/prensa";

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
  /** Conteúdo do site guardado no rascunho. Ver `orders.draftContent`. */
  draftContent: Record<string, string> | null;
  status: OrderStatus;
};

// Derivado das próprias actions em vez de redeclarado à mão: quando elas
// ganharem um estado novo, o wizard não fica com um tipo mentindo.
type ActionResult =
  | Awaited<ReturnType<typeof saveOrderAction>>
  | Awaited<ReturnType<typeof submitOrderAction>>;

/**
 * Encolhe um texto longo para caber numa linha da revisão.
 *
 * A história pode ter 5000 caracteres; a revisão precisa provar que ela
 * chegou, não reproduzi-la. O corte em 80 mostra o começo — o suficiente para
 * o casal reconhecer o próprio texto e perceber se colou a coisa errada.
 */
function resumir(texto: string): string {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (limpo.length <= 80) return limpo;
  return `${limpo.slice(0, 80)}…`;
}

const FONT_CATEGORY_ORDER: FontCategory[] = [
  "serifa",
  "manuscrita",
  "sans",
  "rustica",
];

const campoBase =
  "w-full rounded-[3px] border border-(--c-rule) bg-white px-4 py-3.5 text-sm text-(--c-ink) transition-colors focus:border-(--c-ink) focus:outline-none";

export default function OrderWizard({
  order,
  orderId,
  nomeDaConta,
  pacoteInicial,
}: {
  order: OrderData | null;
  orderId: string | null;
  /**
   * O nome que o casal deu na criação da conta, para a etapa 2 já vir
   * preenchida.
   *
   * A pergunta "Como vocês se chamam?" chegava com o campo vazio, embora a
   * conta já se chamasse "Mariana & Rafael" e o painel cumprimentasse por
   * esse nome duas telas antes. Perguntar de novo o que já foi respondido é
   * o tipo de retrabalho que faz o casal desconfiar que nada foi salvo.
   */
  nomeDaConta?: string | null;
  /**
   * O pacote que o casal clicou na vitrine (`?pacote=` na URL).
   *
   * Não é pré-seleção: é a escolha que ele já fez, um clique antes. A etapa 1
   * continua sem padrão para quem chega sem ter escolhido nada.
   */
  pacoteInicial?: PackageTier | null;
}) {
  /* Reabrir um rascunho volta para a etapa onde o casal parou.
     Antes voltava sempre para a 1: quem salvou na etapa 7 tinha que clicar
     "Continuar" seis vezes para chegar de novo onde estava — e, como as
     respostas de conteúdo não voltavam, ainda encontrava os campos vazios no
     caminho. */
  const [passo, setPasso] = useState(() => {
    const salva = order?.draftContent?._etapa;
    const i = salva ? ETAPAS.findIndex((e) => e.id === salva) : -1;
    return i > 0 ? i : 0;
  });
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
  /* Pedido NOVO nasce SEM pacote escolhido, e a etapa 1 bloqueia o avanço até
     haver escolha.

     Antes o padrão era o pacote com `highlight` — o Para Sempre, R$ 99,90.
     Quem clicasse "Continuar" sem olhar levava o mais caro sem ter escolhido
     nada, e o rascunho ficava gravado assim. Numa auditoria de uso real foi
     exatamente o que aconteceu: um pedido inteiro registrado como Para Sempre
     sem que o seletor tivesse sido tocado uma única vez.

     Escolher o pacote é a única decisão da tela que mexe no preço. Ela tem que
     ser um ato, não um padrão. */
  const [pacote, setPacote] = useState<PackageTier | "">(
    order?.packageTier ?? pacoteInicial ?? ""
  );
  /* Pedido existente manda; pedido novo herda o nome da conta. O casal edita
     à vontade — o campo continua sendo dele. */
  const [nomes, setNomes] = useState(
    order?.coupleNames ?? (order ? "" : nomeDaConta ?? "")
  );
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

  /* ---- o CONTEÚDO do site ------------------------------------------------
     Estes campos não moram em colunas de `orders`: no provisionamento vão
     para `site_content`, que é a fonte da verdade a partir dali.

     Enquanto o pedido é rascunho, porém, `site_content` ainda não existe — e
     era aí que sete respostas se perdiam. Elas nasciam "" e nada as
     reidratava, então quem clicava "Salvar e sair" reabria o questionário com
     cerimônia, festa, traje e história em branco, sem nenhum aviso.

     Agora o rascunho guarda tudo em `orders.draftContent` e a leitura volta
     por aqui. */
  const rascunho = order?.draftContent ?? {};
  const [hora, setHora] = useState(rascunho.weddingTime ?? "");
  const [cerimoniaLocal, setCerimoniaLocal] = useState(
    rascunho.ceremonyVenue ?? ""
  );
  const [cerimoniaEndereco, setCerimoniaEndereco] = useState(
    rascunho.ceremonyAddress ?? ""
  );
  const [festaLocal, setFestaLocal] = useState(rascunho.receptionVenue ?? "");
  const [festaEndereco, setFestaEndereco] = useState(
    rascunho.receptionAddress ?? ""
  );
  const [festaHora, setFestaHora] = useState(rascunho.receptionTime ?? "");
  const [traje, setTraje] = useState(rascunho.dressCode ?? "");
  const [historia, setHistoria] = useState(rascunho.story ?? "");

  /** O botão de envio, para a tela de falha conseguir reenviar. */
  const botaoDeEnvio = useRef<HTMLButtonElement>(null);

  const [state, action, pending] = useActionState(
    async (
      _prev: ActionResult | undefined,
      formData: FormData
    ): Promise<ActionResult> => {
      const ehEnvio = formData.get("intent")?.toString() === "submit";
      const r = ehEnvio
        ? await submitOrderAction(formData)
        : await saveOrderAction(formData);

      /* O envio bem-sucedido termina em `redirect`, então chegar aqui num
         envio significa que deu erro.

         A tela de criação NÃO é desmontada nesse caso: ela para de contar a
         história do site nascendo e passa a dizer o que houve, com o botão de
         tentar de novo. Desmontar devolveria o casal ao formulário para
         descobrir sozinho o que aconteceu — ou, pior, deixaria a descoberta
         para a tela seguinte. */
      if (!ehEnvio || !(r && "error" in r)) setEnviando(false);

      return r;
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
  /**
   * Reenvia o pedido a partir da tela de falha.
   *
   * `requestSubmit(botão)` e não `form.submit()`: o submitter é quem carrega
   * `intent=submit`, e sem ele a action gravaria rascunho em vez de enviar.
   * `form.submit()` também pularia o `action` do React inteiro.
   */
  const reenviar = useCallback(() => {
    const botao = botaoDeEnvio.current;
    if (!botao) {
      // Sem o botão em mãos, o honesto é devolver o formulário — a pessoa
      // ainda consegue enviar de lá.
      setEnviando(false);
      return;
    }
    botao.form?.requestSubmit(botao);
  }, []);

  const escolherModelo = useCallback((id: string) => {
    setModelo(id);
    const estiloEscolhido = TEMPLATE_STYLES.find((s) => s.id === id);
    if (!estiloEscolhido) return;
    /* A ORDEM importa, e ela estava trocada.
     *
     * `swatches` é [papel, tinta, acento]. A cor 1 é o ACENTO (é o que
     * `resolveTheme` faz com ela, e é o que o rótulo diz) e a cor 2 é a
     * TINTA. Aqui a cor 1 recebia a tinta e a cor 2 recebia o acento — o
     * inverso dos dois.
     *
     * O efeito não era cosmético: o casal escolhia Toscana, seguia sem tocar
     * em nada, e o site nascia com o dourado do acento (#9c8654) como cor do
     * TEXTO sobre o papel creme. A própria etapa acusava — "o texto vai ficar
     * difícil de ler sobre esse fundo" — e estava certa. Os seis modelos
     * faziam isso, todos na chegada (UX-006).
     *
     * Isto NÃO repinta site já provisionado: o tema é resolvido e gravado uma
     * vez, no provisionamento, e ninguém recalcula o que já está no banco. O
     * que muda aqui é só o ponto de partida de um pedido novo.
     *
     * A conversão mora em `lib/theme/coresDoModelo.ts`, fora do componente:
     * uma troca de duas variáveis não aparece em revisão e não quebra teste
     * nenhum. Lá ela é uma invariante trancada — escolher um modelo e não
     * mexer em nada tem que devolver a paleta daquele modelo. */
    const cores = coresDoModelo(estiloEscolhido.swatches);
    setCor1(cores.primaryColor);
    setCor2(cores.secondaryColor);
    setCor3(cores.tertiaryColor);
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
  /* Data que já passou é digitação, e aqui dá para afirmar isso: o
     questionário está montando um casamento que ainda vai acontecer.
     
     A trava do servidor (`parseOrderForm`) sozinha não resolvia: "Continuar"
     é navegação do lado do cliente e não fala com o servidor, então o casal
     digitava 01/01/2020, atravessava nove etapas e só ouvia falar da data no
     envio — nove telas depois do erro (UX-009).
     
     Comparação por texto, não por `Date`: `<input type="date">` devolve
     "AAAA-MM-DD", e nesse formato a ordem alfabética É a ordem cronológica.
     Passar por `new Date()` traria fuso para dentro de uma conta que não tem
     hora nenhuma — e é assim que "hoje" vira "ontem" para quem está a oeste
     de Greenwich. */
  const hojeISO = (() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  })();
  const dataNoPassado = data !== "" && data < hojeISO;

  const regras: Record<RegraEtapa, boolean> = {
    nomes: nomes.trim().length > 0 && !dataNoPassado,
    pacote: pacote !== "",
  };

  const conteudos: Record<EtapaId, ReactNode> = {
    /* `radiogroup` e não uma pilha de botões: são três opções mutuamente
       exclusivas de uma pergunta só. Sem isso o leitor de tela anunciava três
       botões soltos e nunca dizia qual estava escolhido. */
    pacote: (
        <div
          role="radiogroup"
          aria-label="Pacote"
          className="motion-stagger grid gap-3 sm:grid-cols-3"
        >
          {PACKAGES.map((pkg, i) => {
            const ativo = pacote === pkg.tier;
            return (
              <button
                key={pkg.tier}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setPacote(pkg.tier)}
                data-escolha={ativo ? "sim" : "nao"}
                style={{ ["--i" as string]: i }}
                className={`flex flex-col gap-1.5 rounded-[3px] border-2 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  ativo
                    ? "border-(--c-ink) bg-(--c-sunken) shadow-sm"
                    : "border-(--c-rule) bg-white"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  {pkg.name}
                  {/* A marca visual não pode ser só a borda: numa tela clara,
                      duas bordas parecidas não dizem qual foi escolhido. */}
                  {ativo && (
                    <span className="text-xs font-normal text-(--c-ink-2)">
                      ✓ escolhido
                    </span>
                  )}
                </span>
                <span className="text-xl font-bold">{pkg.price}</span>
                <span className="text-xs leading-relaxed text-(--c-ink-2)">
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
              id="q-nomes"
              value={nomes}
              onChange={(e) => setNomes(e.target.value)}
              placeholder="Ex: Ana &amp; Pedro"
              maxLength={120}
              className={campoBase}
            />
            <span className="text-xs text-(--c-ink-2)">
              Do jeito que vocês querem ver escrito na capa.
            </span>
          </label>

          <label style={{ ["--i" as string]: 1 }} className="flex flex-col gap-2">
            <span className="text-sm font-medium">Data do casamento</span>
            <input
              type="date"
              id="q-data"
              value={data}
              min={hojeISO}
              onChange={(e) => setData(e.target.value)}
              className={campoBase}
            />
            {dataNoPassado ? (
              <span role="alert" className="erro-do-campo">
                Essa data já passou. Confiram o dia do casamento — ou deixem em
                branco se ainda não fecharam.
              </span>
            ) : (
              <span className="text-xs text-(--c-ink-2)">
                Alimenta a contagem regressiva. Ainda não fecharam? Deixem em
                branco.
              </span>
            )}
          </label>
        </div>
    ),
    cerimonia: (
      <div className="motion-stagger mx-auto flex max-w-md flex-col gap-5">
        <label style={{ ["--i" as string]: 0 }} className="flex flex-col gap-2">
          <span className="text-sm font-medium">Local da cerimônia</span>
          <input
            id="q-cerimonia-local"
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
            id="q-cerimonia-endereco"
            autoComplete="street-address"
            value={cerimoniaEndereco}
            onChange={(e) => setCerimoniaEndereco(e.target.value)}
            placeholder="Rua, número, bairro, cidade"
            maxLength={300}
            className={campoBase}
          />
          <span className="text-xs text-(--c-ink-2)">
            Vira o botão de mapa no convite.
          </span>
        </label>
        <label style={{ ["--i" as string]: 2 }} className="flex flex-col gap-2">
          <span className="text-sm font-medium">Horário</span>
          <input
            type="time"
            id="q-cerimonia-hora"
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
            id="q-festa-local"
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
            id="q-festa-endereco"
            autoComplete="street-address"
            value={festaEndereco}
            onChange={(e) => setFestaEndereco(e.target.value)}
            placeholder="Rua, número, bairro, cidade"
            maxLength={300}
            className={campoBase}
          />
        </label>
        {/* "A que horas começa a festa?" não tinha onde ser respondida: só a
            cerimônia tinha horário. Fica aqui, e não numa etapa nova, porque
            é o mesmo assunto das duas linhas acima — e porque etapa nova é
            trabalho a mais para o casal. Opcional, como todo o resto. */}
        <label style={{ ["--i" as string]: 2 }} className="flex flex-col gap-2">
          <span className="text-sm font-medium">Horário da festa</span>
          <input
            id="q-festa-hora"
            type="time"
            value={festaHora}
            onChange={(e) => setFestaHora(e.target.value)}
            className={campoBase}
          />
          <span className="text-xs text-(--c-ink-2)">
            Em branco, o site mostra só o local.
          </span>
        </label>
        <button
          type="button"
          style={{ ["--i" as string]: 2 }}
          onClick={() => {
            setFestaLocal(cerimoniaLocal);
            setFestaEndereco(cerimoniaEndereco);
          }}
          className="self-start rounded-[2px] border border-(--c-rule) px-4 py-2 text-[13px] text-(--c-ink-2) transition-colors hover:border-(--c-ink) hover:text-(--c-ink)"
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
            id="q-traje"
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
                className="rounded-[2px] border border-(--c-rule) px-3.5 py-1.5 text-[13px] text-(--c-ink-2) transition-colors hover:border-(--c-ink) hover:text-(--c-ink)"
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
            id="q-historia"
            value={historia}
            onChange={(e) => setHistoria(e.target.value)}
            placeholder="Onde se conheceram, como foi o pedido, o que vocês querem que os convidados saibam…"
            maxLength={5000}
            className={`${campoBase} resize-y`}
          />
        </label>
        <span style={{ ["--i" as string]: 1 }} className="text-xs text-(--c-ink-2)">
          {historia.length}/5000
        </span>
        {/* O corte no limite acontecia calado.
            `maxLength` faz o navegador descartar o excedente sem avisar: quem
            escreveu a história no WhatsApp e colou aqui perdia o fim e não
            tinha como saber (UX-019). O contador sozinho não conta essa
            história — 5000/5000 parece um texto que coube. */}
        {historia.length >= 5000 && (
          <span
            role="status"
            style={{ ["--i" as string]: 2 }}
            className="text-xs text-(--c-mark)"
          >
            Chegou no limite de 5.000 caracteres — o que vier depois disso não
            entra. Se vocês colaram um texto maior, confiram o fim.
          </span>
        )}
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
                  className={`flex flex-col gap-2.5 rounded-[3px] border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    ativo
                      ? "border-(--c-ink) bg-(--c-sunken) shadow-sm"
                      : "border-(--c-rule) bg-white"
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
                  <span className="text-xs leading-relaxed text-(--c-ink-2)">
                    {estiloItem.description}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setModelo("")}
            className={`self-start rounded-[2px] border px-4 py-2 text-[13px] transition-colors ${
              modelo === ""
                ? "border-(--c-ink) bg-(--c-sunken) font-medium"
                : "border-(--c-rule) text-(--c-ink-2) hover:border-(--c-ink) hover:text-(--c-ink)"
            }`}
          >
            Prefiro montar do zero
          </button>

          {modelo && (
            <div className="motion-fade-in">
              <LivePreview
                src={`/pacotes/estilos/${modelo}?pacote=${pacote}&embutido=1`}
                titulo="Como este modelo fica"
                /* Diz de quem são os dados ANTES de o casal reparar sozinho.
                   O texto anterior — "depois de enviar o pedido, esta prévia
                   passa a mostrar o site com o conteúdo de vocês" — era
                   verdadeiro, mas falava do futuro: o casal acabou de digitar
                   o próprio nome, a data e o endereço, e vê na tela um casal
                   chamado Ana & Pedro casando em Fortaleza. Nomear o exemplo
                   evita a leitura de que os dados dele se perderam. */
                descricao="Exemplo com um casal fictício — o conteúdo de vocês entra no lugar assim que o pedido for enviado. Aqui o que importa é o desenho: as cores, as fontes e a ordem das seções."
                fullBleed={false}
              />
            </div>
          )}
        </div>
    ),
    /* Os RÓTULOS aqui seguem o que `resolveTheme` realmente faz, e não o
       contrário. A cor 1 vira o `accent` e a cor 2 vira o `ink` — está assim
       de propósito (ver o comentário de `lib/theme/spec.ts`: o acento é o
       detalhe que o casal percebe como "a cor do nosso casamento").

       Os rótulos antigos diziam o oposto: "Cor principal — a tinta, títulos e
       texto" e "Cor secundária — o acento". O casal escolhia a cor do texto e
       recebia a cor dos enfeites. Trocar o mapeamento em vez do texto teria
       repintado todo site já provisionado, inclusive os que estão no ar. */
    cores: (
        <div className="motion-stagger mx-auto flex max-w-2xl flex-col gap-7">
          <div style={{ ["--i" as string]: 0 }}>
            <ColorRow
              label="Cor principal"
              hint="o acento — detalhes, botões, ornamentos"
              valor={cor1}
              onChange={setCor1}
            />
          </div>
          <div style={{ ["--i" as string]: 1 }}>
            <ColorRow
              label="Cor do texto"
              hint="a tinta — títulos e parágrafos"
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
          {/* Os nomes do casal, não os da vitrine: ele acabou de digitá-los
              na etapa 2, e a etapa das fontes já os usa. Mesmo achado da
              UX-018, que a auditoria viu na tela Visual do painel. */}
          <AmostraDeCores
            acento={cor1}
            tinta={cor2}
            papel={cor3}
            nomes={nomes.trim() || null}
          />
          <AvisoDeContraste tinta={cor2} papel={cor3} />
        </div>
    ),
    // A rolagem PRÓPRIA da lista só existe a partir de sm. No celular, uma
    // caixa rolável dentro de uma página rolável rouba o gesto: a pessoa
    // arrasta querendo descer a página e desce a lista, ou fica presa no fim
    // dela. Com a lista inteira no fluxo, o polegar faz uma coisa só.
    fonte: (
        <div className="flex flex-col gap-6 rounded-[3px] border border-(--c-rule) bg-(--c-base)/40 p-4 sm:max-h-[30rem] sm:overflow-y-auto">
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
                <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-(--c-mark)">
                  {FONT_CATEGORY_LABELS[categoria]}
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-(--c-rule)"
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
                        className={`flex items-center justify-between gap-3 rounded-[3px] border-2 bg-white px-4 py-3 text-left transition-all duration-150 hover:-translate-y-0.5 ${
                          ativo
                            ? "border-(--c-ink) bg-(--c-sunken)"
                            : "border-(--c-rule)"
                        }`}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold">
                            {f.name}
                          </span>
                          <span className="truncate text-xs text-(--c-ink-2)">
                            {f.description}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className={`${FONT_PREVIEW_CLASS[f.id as FontStyleId]} ${CATEGORY_PREVIEW_SIZE[f.category]} shrink-0 leading-none text-(--c-ink)`}
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
            {/* Limite e contador iguais aos da história.
                Estes dois campos não tinham limite NENHUM (`maxLength` = -1)
                nem contador, embora a tela dissesse "aqui não tem limite" —
                enquanto a história, três etapas antes, mostrava 0/5000. Duas
                regras diferentes para a mesma coisa na mesma sequência. */}
            <textarea
              rows={4}
              id="q-estilo"
              value={estilo}
              onChange={(e) => setEstilo(e.target.value)}
              placeholder="Tema praia, flores em aquarela, nada de rosa, uma fonte que viram por aí…"
              maxLength={2000}
              className={`${campoBase} resize-y`}
            />
            <span className="text-xs text-(--c-ink-2)">
              {estilo.length}/2000
            </span>
          </label>
          <label style={{ ["--i" as string]: 1 }} className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              Mais alguma coisa que a gente precisa saber?
            </span>
            <textarea
              rows={3}
              id="q-observacoes"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Qualquer coisa: prazo apertado, uma surpresa, uma dúvida…"
              maxLength={2000}
              className={`${campoBase} resize-y`}
            />
            <span className="text-xs text-(--c-ink-2)">{obs.length}/2000</span>
          </label>
          <p
            style={{ ["--i" as string]: 2 }}
            className="rounded-[3px] border border-(--c-rule) bg-(--c-sunken) px-4 py-3 text-xs leading-relaxed text-(--c-ink)"
          >
            <strong className="font-semibold">As fotos ficam para depois.</strong>{" "}
            Assim que o pedido for enviado, vocês sobem as fotos direto na tela
            de acompanhamento — com a prévia do site do lado, vendo onde cada
            uma cai.
          </p>
        </div>
    ),
    /* A revisão mostra TUDO que foi respondido.
       Ela listava pacote, nomes, data, modelo, tipografia e cores — e omitia
       cerimônia, festa, traje, história e observações. Justamente os campos
       onde erro de digitação é mais provável e mais caro: um endereço errado
       vira convidado perdido. "Conferindo antes de mandar" que não deixa
       conferir metade é uma etapa a menos, não uma a mais.

       Linha vazia continua fora: uma pilha de "—" faria a tela parecer um
       formulário mal preenchido em vez de um resumo. */
    revisao: (
        <div className="motion-stagger mx-auto flex max-w-xl flex-col gap-2.5">
          {(
            [
              ["Pacote", PACKAGES.find((p) => p.tier === pacote)?.name ?? "—"],
              ["Nomes", nomes.trim() || "—"],
              [
                "Data",
                dataPorExtenso(data, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }) ?? "a definir",
              ],
              ["Cerimônia", cerimoniaLocal.trim()],
              ["Endereço da cerimônia", cerimoniaEndereco.trim()],
              ["Horário", hora.trim()],
              ["Festa", festaLocal.trim()],
              ["Endereço da festa", festaEndereco.trim()],
              ["Horário da festa", festaHora.trim()],
              ["Traje", traje.trim()],
              ["A história de vocês", resumir(historia)],
              ["Observações de estilo", resumir(estilo)],
              ["Mais alguma coisa", resumir(obs)],
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
            ] as [string, string][]
          )
            .filter(([, valor]) => valor !== "")
            .map(([rotulo, valor], i) => (
            <div
              key={rotulo}
              style={{ ["--i" as string]: i }}
              className="flex items-baseline justify-between gap-4 rounded-[3px] border border-(--c-rule) bg-white px-4 py-3"
            >
              <span className="text-xs uppercase tracking-[0.12em] text-(--c-ink-2)">
                {rotulo}
              </span>
              <span className="text-right text-sm font-medium">{valor}</span>
            </div>
          ))}

          <div
            style={{ ["--i" as string]: 5 }}
            className="mt-1 flex items-center gap-2.5 rounded-[3px] border border-(--c-rule) bg-white px-4 py-3"
          >
            <span className="text-xs uppercase tracking-[0.12em] text-(--c-ink-2)">
              Cores
            </span>
            <span className="flex flex-1 justify-end gap-2">
              {[cor1, cor2, cor3].filter(Boolean).length === 0 ? (
                <span className="text-sm font-medium">a gente sugere</span>
              ) : (
                /* A chave é a POSIÇÃO, não o hex.
                   Escolher a mesma cor para dois papéis é legítimo — e com
                   `key={hex}` o React reclamava de chave duplicada e podia
                   omitir uma das bolinhas, mostrando duas onde havia três. */
                [cor1, cor2, cor3]
                  .filter(Boolean)
                  .map((hex, i) => (
                    <span
                      key={i}
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
    // O `id` viaja junto para o rascunho conseguir gravar ONDE o casal parou.
    id: e.id,
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
        erro={state && "error" in state ? state.error : null}
        aoTentarDeNovo={reenviar}
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
        <input type="hidden" name="receptionTime" value={festaHora} />
        <input type="hidden" name="dressCode" value={traje} />
        <input type="hidden" name="story" value={historia} />

        {/* Onde o casal está agora, para o rascunho reabrir aqui. */}
        <input type="hidden" name="etapaAtual" value={etapa.id} />

        <WizardShell
          passo={passo}
          total={PASSOS.length}
          direcao={direcao}
          titulo={etapa.titulo}
          subtitulo={etapa.subtitulo}
          onVoltar={passo > 0 ? () => ir(-1) : undefined}
          acaoDaTrilha={
            <>
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
                  className="text-[13px] whitespace-nowrap text-(--c-ink-2) underline underline-offset-4 transition-colors hover:text-(--c-ink) disabled:opacity-50"
                >
                  {pending && !enviando ? "Salvando…" : "Salvar rascunho"}
                </button>
              )}
            </>
          }
          rodape={
            <>
              {ultima ? (
                  <button
                    ref={botaoDeEnvio}
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
                  className="btn btn-ink btn-g"
                >
                  {jaEnviado ? "Pedido já enviado" : "Criar nosso site"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => ir(1)}
                  disabled={!etapa.podeAvancar}
                  className="btn btn-ink inline-flex items-center gap-1.5"
                >
                  Continuar
                  <Icone nome="setaDireita" tamanho={16} />
                </button>
              )}
            </>
          }
          nota={
            <>
              <div aria-live="polite" className="min-h-5">
                {state && "error" in state && (
                  <p className="motion-rise-in erro-do-campo">{state.error}</p>
                )}
                {state && "saved" in state && (
                  <p className="motion-rise-in text-[12.5px] text-(--c-ok)">
                    Rascunho salvo.
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
                <p className="text-xs text-(--c-ink-2)">
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
