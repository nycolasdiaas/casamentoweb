import { getPackage, type PackageTier } from "@/lib/packages";
import { getTemplateStyle } from "@/lib/templates";
import { FONT_STYLES } from "@/lib/customization";
import type { OrderStatus } from "@/lib/orderStatus";

// Representação de um pedido para produção. É este objeto que vira o JSON
// mostrado no admin e que se soma ao prompt-base para gerar o site.
export type OrderForPrompt = {
  id: string;
  status: OrderStatus;
  packageTier: PackageTier;
  templateStyle: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontStyle: string | null;
  styleNotes: string | null;
  coupleNames: string | null;
  weddingDate: string | null;
  photosLink: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: { name: string; email: string; whatsapp: string | null };
  // Quantas fotos o casal subiu na plataforma. Os arquivos vão junto com o
  // briefing; aqui o gerador só precisa saber quantas esperar.
  photoCount?: number;
};

function fontLabel(id: string | null): string | null {
  if (!id) return null;
  return FONT_STYLES.find((f) => f.id === id)?.name ?? id;
}

/** JSON estruturado e legível do pedido, pronto para colar num gerador. */
export function orderToJson(order: OrderForPrompt) {
  const pkg = getPackage(order.packageTier);
  const template = order.templateStyle
    ? getTemplateStyle(order.templateStyle)
    : null;

  return {
    pedidoId: order.id,
    status: order.status,
    casal: {
      nomeConta: order.user.name,
      nomeExibicao: order.coupleNames ?? order.user.name,
      email: order.user.email,
      whatsapp: order.user.whatsapp,
    },
    pacote: {
      id: order.packageTier,
      nome: pkg?.name ?? order.packageTier,
      recursos: pkg?.features ?? [],
    },
    estilo: {
      templateBase: template ? template.name : "nenhum (montar do zero)",
      corPrincipal: order.primaryColor,
      corSecundaria: order.secondaryColor,
      tipografia: fontLabel(order.fontStyle),
      observacoes: order.styleNotes,
    },
    conteudo: {
      dataCasamento: order.weddingDate,
      fotosEnviadasNaPlataforma: order.photoCount ?? 0,
      pastaExternaDeApoio: order.photosLink,
      historiaEDetalhes: order.notes,
    },
    datas: {
      criadoEm:
        order.createdAt instanceof Date
          ? order.createdAt.toISOString()
          : order.createdAt,
      atualizadoEm:
        order.updatedAt instanceof Date
          ? order.updatedAt.toISOString()
          : order.updatedAt,
    },
  };
}

// Prompt-base de geração do site. EDITE À VONTADE — este texto é somado ao
// JSON do pedido para produzir o site de cada casal. Também vive em
// docs/prompt-gerar-site.md para referência fora do app.
//
// A versão anterior era uma lista solta de regras e produzia site com dado
// inventado, seção fora do pacote e caminho de arquivo aleatório. Esta versão
// fixa: (1) precedência explícita entre as fontes de decisão, (2) o que é
// proibido inventar, (3) a estrutura de arquivos exata, (4) o formato da
// resposta. É o que reduz a "falha de lógica" que aparecia no resultado.
export const SITE_BUILD_PROMPT = `Você é o motor de produção da Enlace, plataforma que entrega sites de casamento prontos. Gere o site DESTE casal a partir do JSON no fim deste prompt.

## Ordem de precedência (quando duas fontes se contradizem, a de cima vence)
1. "estilo.observacoes" e "conteudo.historiaEDetalhes" — texto escrito pelo próprio casal.
2. "estilo.corPrincipal", "estilo.corSecundaria", "estilo.tipografia" — escolhas explícitas na plataforma.
3. "estilo.templateBase" — ponto de partida visual apenas.
4. Seu bom gosto, para o que sobrar.
Exemplo: se templateBase é "Clássico" mas as observações pedem "tema praia, nada de dourado", o tema praia vence e o dourado sai.

## Escopo por pacote (NÃO entregue seção fora do pacote contratado)
- "convite": capa/save-the-date, contagem regressiva, nossa história, informações (data, horário, local, mapa), rodapé.
- "site": tudo do convite + confirmação de presença (RSVP) por convidado, com link por família/grupo.
- "para-sempre": tudo do site + lista de presentes com Pix (sem taxa) + álbum pós-festa + endereço personalizado.
Confira "pacote.id" e "pacote.recursos" antes de escrever qualquer seção. Seção a mais é retrabalho, não bônus.

## Proibido inventar
Estes dados só existem se vierem no JSON. Se faltarem, use um placeholder VISÍVEL no formato [FALTA: descrição] e registre no checklist final:
- nome do local, endereço, cidade, mapa
- horário da cerimônia e da festa
- dress code, lista de padrinhos, cardápio
- qualquer fato da história do casal que não esteja em "historiaEDetalhes"
- depoimento, avaliação ou número (ex: "500 casais atendidos")
Nunca preencha com o casal de exemplo "Ana & Pedro" nem com texto genérico de template.

## Conteúdo
- Nome de exibição: "casal.nomeExibicao". Data: "conteudo.dataCasamento" (formato ISO; exiba por extenso em pt-BR).
- "Nossa história": reescreva "historiaEDetalhes" com as palavras do casal, em 2 a 4 parágrafos curtos. Ajuste ritmo e pontuação, não invente fato novo.
- Fotos: o casal sobe as fotos dentro da plataforma; a equipe entrega os arquivos junto com este briefing. Use <Image> com placeholder de proporção correta e um comentário // TODO: foto X onde cada uma entra. "conteudo.linkFotos" (quando existir) é só uma pasta externa de apoio.
- Textos em português do Brasil, tom caloroso e direto, sem clichê de agência ("momentos inesquecíveis", "o dia mais especial das suas vidas").

## Técnico
- Next.js 16 (App Router, Server Components por padrão) + Tailwind v4. Espelhe os templates em app/pacotes/estilos/ — leia um antes de começar.
- Mobile-first de verdade: o convidado abre o link pelo WhatsApp num celular. Nada pode gerar rolagem horizontal; trilhos que rolam de propósito usam a classe .no-scrollbar.
- Paleta em CSS custom properties no topo do arquivo. Em botão de ação use cor sólida em hex literal — variável que não resolve já deixou CTA invisível em produção aqui.
- Contraste mínimo 4.5:1 em texto e botão. Toda imagem com alt. Todo campo de formulário com <label>.
- Fontes via next/font/google, com o peso que existe de verdade na família.
- Sem dependência nova sem necessidade real.

## Formato da resposta
1. **Plano** — 5 linhas: paleta, tipografia, seções (na ordem) e o que veio das observações do casal.
2. **Código** — arquivos completos, cada um com o caminho como cabeçalho. Sem "..." nem trecho omitido.
3. **Checklist do casal** — lista do que ficou como [FALTA: ...], pronta para copiar e mandar pro casal.

PEDIDO:
`;

/** Prompt-base + JSON do pedido, pronto para colar num gerador. */
export function buildFullPrompt(order: OrderForPrompt): string {
  return SITE_BUILD_PROMPT + "\n" + JSON.stringify(orderToJson(order), null, 2);
}
