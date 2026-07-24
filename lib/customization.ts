// Opções de personalização visual oferecidas no pedido. As cores vêm das
// paletas de tendência de casamento 2026; a cor livre do input type=color
// também é aceita — isto aqui é só o atalho curado.
export const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Verde-oliva", hex: "#3d4a36" },
  { name: "Verde-sálvia", hex: "#75855f" },
  { name: "Dourado", hex: "#b8985f" },
  { name: "Terracota", hex: "#c65a2e" },
  { name: "Azul-marinho", hex: "#1f2a44" },
  { name: "Azul-petróleo", hex: "#2d5f6b" },
  { name: "Rosa antigo", hex: "#d9a3ae" },
  { name: "Vinho", hex: "#7c4a55" },
  { name: "Lavanda", hex: "#9a8fc2" },
  { name: "Champanhe", hex: "#e8d9b5" },
];

// Categorias só para agrupar visualmente as fontes no pedido.
export type FontCategory = "serifa" | "manuscrita" | "sans" | "rustica";

export type FontStyleId =
  | "cormorant"
  | "playfair"
  | "eb-garamond"
  | "lora"
  | "libre-baskerville"
  | "bodoni"
  | "dm-serif"
  | "prata"
  | "marcellus"
  | "cardo"
  | "cinzel"
  | "italiana"
  | "spectral"
  | "gilda"
  | "crimson"
  | "great-vibes"
  | "dancing"
  | "parisienne"
  | "sacramento"
  | "allura"
  | "pinyon"
  | "alex-brush"
  | "tangerine"
  | "petit-formal"
  | "yellowtail"
  | "style-script"
  | "kaushan"
  | "josefin"
  | "poiret"
  | "montserrat"
  | "jost"
  | "raleway"
  | "amatic"
  | "caveat";

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  serifa: "Serifadas elegantes",
  manuscrita: "Caligráficas e manuscritas",
  sans: "Sem serifa (modernas)",
  rustica: "Rústicas e descontraídas",
};

export const FONT_STYLES: {
  id: FontStyleId;
  name: string;
  description: string;
  category: FontCategory;
}[] = [
  // Serifadas elegantes
  { id: "cormorant", name: "Cormorant Garamond", description: "Serifada fina e sofisticada", category: "serifa" },
  { id: "playfair", name: "Playfair Display", description: "Alto contraste, editorial", category: "serifa" },
  { id: "eb-garamond", name: "EB Garamond", description: "Clássica e atemporal", category: "serifa" },
  { id: "lora", name: "Lora", description: "Legível e acolhedora", category: "serifa" },
  { id: "libre-baskerville", name: "Libre Baskerville", description: "Tradicional, de livro", category: "serifa" },
  { id: "bodoni", name: "Bodoni Moda", description: "Dramática, ar de moda", category: "serifa" },
  { id: "dm-serif", name: "DM Serif Display", description: "Marcante e elegante", category: "serifa" },
  { id: "prata", name: "Prata", description: "Refinada, art nouveau", category: "serifa" },
  { id: "marcellus", name: "Marcellus", description: "Romana clássica", category: "serifa" },
  { id: "cardo", name: "Cardo", description: "Humanista e suave", category: "serifa" },
  { id: "cinzel", name: "Cinzel", description: "Maiúsculas monumentais", category: "serifa" },
  { id: "italiana", name: "Italiana", description: "Fina e alongada", category: "serifa" },
  { id: "spectral", name: "Spectral", description: "Serifada contemporânea", category: "serifa" },
  { id: "gilda", name: "Gilda Display", description: "Delicada, didone", category: "serifa" },
  { id: "crimson", name: "Crimson Text", description: "Serifada de leitura", category: "serifa" },
  // Caligráficas e manuscritas
  { id: "great-vibes", name: "Great Vibes", description: "Caligráfica clássica", category: "manuscrita" },
  { id: "dancing", name: "Dancing Script", description: "Caligráfica descontraída", category: "manuscrita" },
  { id: "parisienne", name: "Parisienne", description: "Manuscrita romântica", category: "manuscrita" },
  { id: "sacramento", name: "Sacramento", description: "Monolinha delicada", category: "manuscrita" },
  { id: "allura", name: "Allura", description: "Caligráfica fluida", category: "manuscrita" },
  { id: "pinyon", name: "Pinyon Script", description: "Formal e ornamentada", category: "manuscrita" },
  { id: "alex-brush", name: "Alex Brush", description: "Pincel elegante", category: "manuscrita" },
  { id: "tangerine", name: "Tangerine", description: "Fina e clássica", category: "manuscrita" },
  { id: "petit-formal", name: "Petit Formal Script", description: "Formal e delicada", category: "manuscrita" },
  { id: "yellowtail", name: "Yellowtail", description: "Pincel retrô", category: "manuscrita" },
  { id: "style-script", name: "Style Script", description: "Manuscrita moderna", category: "manuscrita" },
  { id: "kaushan", name: "Kaushan Script", description: "Pincel inclinado", category: "manuscrita" },
  // Sem serifa (modernas)
  { id: "josefin", name: "Josefin Sans", description: "Geométrica e leve", category: "sans" },
  { id: "poiret", name: "Poiret One", description: "Art déco geométrica", category: "sans" },
  { id: "montserrat", name: "Montserrat", description: "Limpa e atual", category: "sans" },
  { id: "jost", name: "Jost", description: "Minimalista geométrica", category: "sans" },
  { id: "raleway", name: "Raleway", description: "Fina e elegante", category: "sans" },
  // Rústicas e descontraídas
  { id: "amatic", name: "Amatic SC", description: "Alta e fina, rústica", category: "rustica" },
  { id: "caveat", name: "Caveat", description: "Escrita à mão", category: "rustica" },
];

export function isFontStyle(value: string): value is FontStyleId {
  return FONT_STYLES.some((font) => font.id === value);
}

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value);
}
