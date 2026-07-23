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
      linkFotos: order.photosLink,
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
export const SITE_BUILD_PROMPT = `Você é o motor de produção da Enlace, uma plataforma que entrega sites de casamento prontos. Gere o site do casal a partir do JSON do pedido abaixo.

REGRAS:
- Stack: Next.js (App Router) + Tailwind v4, igual aos templates em app/pacotes/estilos/. Mobile-first (o convidado abre pelo WhatsApp).
- O pacote define quais seções existem: "Convite" = capa/save-the-date, contagem regressiva, história, informações, rodapé. "Site do Casamento" = tudo isso + confirmação de presença (RSVP). "Para Sempre" = tudo + lista de presentes com Pix (sem taxa) + álbum pós-festa + endereço personalizado.
- Se "templateBase" tiver um nome, use-o como ponto de partida visual; se for "nenhum", monte do zero a partir das cores e tipografia.
- "corPrincipal" e "corSecundaria" (hex) mandam na paleta. Se vierem nulas, escolha uma paleta elegante que combine com as observações.
- "tipografia" indica a direção das fontes dos títulos. Se nula, escolha algo coerente com o estilo.
- LEIA "observacoes" e "historiaEDetalhes" com atenção — são os pedidos textuais do casal e têm prioridade sobre qualquer padrão.
- Use as fotos do "linkFotos" (o casal compartilhou uma pasta); onde não houver foto, use placeholders elegantes.
- Nomes do casal: use "nomeExibicao". Data: "dataCasamento".
- Não invente informações que não estão no pedido; se algo essencial faltar, deixe um placeholder claro e liste no final o que falta pedir ao casal pelo WhatsApp.

Entregue o código do site e, ao final, um checklist do que ainda falta do casal.

PEDIDO:
`;

/** Prompt-base + JSON do pedido, pronto para colar num gerador. */
export function buildFullPrompt(order: OrderForPrompt): string {
  return SITE_BUILD_PROMPT + "\n" + JSON.stringify(orderToJson(order), null, 2);
}
