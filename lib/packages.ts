// Definição dos pacotes vendidos na plataforma. Preços e benefícios são a
// fonte única usada pela página /pacotes e pelas demos de exemplo.
export type PackageTier = "convite" | "site" | "para-sempre";

export type WeddingPackage = {
  tier: PackageTier;
  name: string;
  tagline: string;
  price: string;
  priceNote?: string;
  description: string;
  features: string[];
  highlight: boolean;
  deliveryTime: string;
};

export const PACKAGES: WeddingPackage[] = [
  {
    tier: "convite",
    name: "Convite",
    tagline: "O convite digital que substitui o impresso",
    price: "R$ 350",
    description:
      "Uma página elegante com as fotos e a história do casal, pronta para enviar no grupo da família e dos amigos.",
    features: [
      "Página única com fotos do casal",
      "História do casal e texto de convite",
      "Data, horário e local com mapa",
      "Contagem regressiva para o grande dia",
      "Link pronto para compartilhar no WhatsApp",
    ],
    highlight: false,
    deliveryTime: "Entrega em até 3 dias",
  },
  {
    tier: "site",
    name: "Site do Casamento",
    tagline: "Convite + confirmação de presença",
    price: "R$ 800",
    description:
      "Tudo do pacote Convite, mais Save the Date e confirmação de presença online — vocês sabem exatamente quem vai.",
    features: [
      "Tudo do pacote Convite",
      "Save the Date personalizado",
      "Confirmação de presença (RSVP) por convidado",
      "Link individual por família ou grupo",
      "Painel do casal para acompanhar confirmações",
    ],
    highlight: false,
    deliveryTime: "Entrega em até 5 dias",
  },
  {
    tier: "para-sempre",
    name: "Para Sempre",
    tagline: "O site completo que vira memória permanente",
    price: "R$ 1.500",
    priceNote: "o mais escolhido",
    description:
      "A experiência completa: lista de presentes com Pix sem nenhuma taxa, endereço personalizado e um álbum que se abre depois da festa — o registro do casamento para sempre.",
    features: [
      "Tudo do pacote Site do Casamento",
      "Lista de presentes com preços personalizados",
      "Pagamento por QR Code Pix ou copia e cola",
      "Sem taxa sobre os presentes — 100% para o casal",
      "Endereço personalizado (ex: anaepedro.com.br)",
      "Álbum pós-casamento: fotos reais da festa, online para sempre",
    ],
    highlight: true,
    deliveryTime: "Entrega em até 7 dias",
  },
];

export function getPackage(tier: string): WeddingPackage | undefined {
  return PACKAGES.find((pkg) => pkg.tier === tier);
}

// Ordem dos tiers para saber o que cada pacote inclui nas demos.
const TIER_ORDER: PackageTier[] = ["convite", "site", "para-sempre"];

export function tierIncludes(tier: PackageTier, feature: PackageTier): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(feature);
}

// Casal fictício usado nas telas de exemplo.
export const DEMO_COUPLE = {
  names: "Ana & Pedro",
  initials: ["A", "P"],
  date: "2026-09-19T16:00:00-03:00",
  dateLabel: "19 de setembro de 2026",
  timeLabel: "16h",
  venue: "Espaço Jardim das Oliveiras",
  city: "Fortaleza — CE",
  story:
    "Se conheceram num churrasco de amigos em 2019, entre um pagode e uma discussão boba sobre quem fazia o melhor brigadeiro. Sete anos, duas mudanças e um gato adotado depois, decidiram que era hora de oficializar o que todo mundo já sabia.",
  customUrl: "anaepedro.com.br",
};
