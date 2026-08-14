import { FONT_STYLES } from "@/lib/customization";

/**
 * AS ETAPAS DO QUESTIONÁRIO, COMO DADO.
 *
 * Antes, as 7 etapas eram um array com JSX embutido no meio do
 * `OrderWizard.tsx`: para trocar a ordem de duas perguntas, mudar um título ou
 * tirar uma etapa era preciso mexer num componente de 615 linhas e torcer para
 * não derrubar o estado junto.
 *
 * Agora a LISTA é dado e o desenho é código. Este arquivo é o que você edita.
 *
 * ── O que dá para fazer só mexendo aqui ─────────────────────────────────────
 *
 * - Trocar a ordem: mova o item na lista. O contador ("passo 3 de 7") e a
 *   animação de avançar/voltar acompanham sozinhos.
 * - Mudar título ou subtítulo: edite a string.
 * - Tirar uma etapa: apague o item. O que ela preenchia continua indo para a
 *   action como campo oculto com o valor padrão — nada quebra, o casal só não
 *   é perguntado.
 * - Tornar uma etapa obrigatória: ponha `exige`.
 *
 * ── O que exige tocar no componente ─────────────────────────────────────────
 *
 * Uma etapa NOVA precisa de um desenho novo. Acrescente o `id` em `EtapaId` e
 * o TypeScript vai apontar o único lugar que falta preencher: o mapa
 * `conteudos` no `OrderWizard`. É de propósito que ele reprove — etapa sem
 * desenho renderizaria vazio, e o casal ficaria olhando uma tela em branco
 * sem entender o que fazer.
 *
 * ── O que NÃO muda, e não pode mudar ────────────────────────────────────────
 *
 * O que o formulário GRAVA. Os campos ocultos e o contrato com
 * `submitOrderAction` continuam idênticos, e a data segue passando por
 * `parseContentForm` — que é o que impede a cerimônia das 16h virar 19h e
 * ganhar mais três horas a cada salvamento.
 */

/** Cada id corresponde a um desenho no mapa `conteudos` do OrderWizard. */
export type EtapaId =
  | "pacote"
  | "nomes"
  | "cerimonia"
  | "festa"
  | "traje"
  | "historia"
  | "modelo"
  | "cores"
  | "fonte"
  | "observacoes"
  | "revisao";

/**
 * Chaves de validação. Só existe uma hoje porque só uma etapa bloqueia o
 * avanço — e isso é decisão de produto, não esquecimento: pular é um estado
 * válido em todo o resto, e cada seção do molde degrada sozinha quando falta
 * dado.
 */
export type RegraEtapa = "nomes";

export type Etapa = {
  id: EtapaId;
  titulo: string;
  subtitulo: string;
  /** Sem isto, a etapa é pulável — que é o padrão de propósito. */
  exige?: RegraEtapa;
};

export const ETAPAS: Etapa[] = [
  {
    id: "pacote",
    titulo: "Qual pacote combina com vocês?",
    subtitulo:
      "Dá para mudar depois — nada aqui é definitivo até o pedido ser enviado.",
  },
  {
    id: "nomes",
    titulo: "Como vocês se chamam?",
    subtitulo: "É o nome que abre o convite. Dá para ajustar depois.",
    exige: "nomes",
  },
  {
    id: "cerimonia",
    titulo: "Onde e quando é a cerimônia?",
    subtitulo:
      "Vai direto para o convite e para o mapa. Ainda não fecharam? Deixem em branco e preencham depois.",
  },
  {
    id: "festa",
    titulo: "E a festa, onde vai ser?",
    subtitulo:
      "Se for no mesmo lugar da cerimônia, podem repetir — ou pular e ajustar depois.",
  },
  {
    id: "traje",
    titulo: "Como vocês querem que as pessoas se vistam?",
    subtitulo:
      "Uma linha basta: \"traje social\", \"esporte fino\", \"pé na areia\". É a dúvida número um de todo convidado.",
  },
  {
    id: "historia",
    titulo: "A história de vocês",
    subtitulo:
      "Como se conheceram, o pedido, o que quiserem contar. Pode ser curtinho — e pode ficar para depois.",
  },
  {
    id: "modelo",
    titulo: "Por onde vocês querem começar?",
    subtitulo:
      "Escolher um modelo já preenche as cores dele na próxima tela — e vocês trocam o que quiserem.",
  },
  {
    id: "cores",
    titulo: "As cores de vocês",
    subtitulo:
      "Três decisões: a tinta do texto, o acento dos detalhes e o papel de fundo.",
  },
  {
    id: "fonte",
    titulo: "A tipografia",
    subtitulo: `${FONT_STYLES.length} opções. Escolham a que soa como vocês — ou pulem, e a gente sugere.`,
  },
  {
    id: "observacoes",
    titulo: "Querem pedir mais alguma coisa?",
    subtitulo:
      "Aqui não tem limite: uma flor, um tema, uma cor que odeiam, um detalhe que sonharam.",
  },
  {
    id: "revisao",
    titulo: "Conferindo antes de mandar",
    subtitulo: "Dá para voltar e mudar qualquer coisa.",
  },
];
