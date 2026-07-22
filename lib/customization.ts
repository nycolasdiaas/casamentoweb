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

export type FontStyleId =
  | "classica"
  | "moderna"
  | "romantica"
  | "editorial"
  | "manuscrita"
  | "artdeco"
  | "minimalista"
  | "boho";

export const FONT_STYLES: {
  id: FontStyleId;
  name: string;
  description: string;
}[] = [
  {
    id: "classica",
    name: "Clássica",
    description: "Serifada elegante, atemporal",
  },
  {
    id: "moderna",
    name: "Moderna",
    description: "Sem serifa, limpa e atual",
  },
  {
    id: "romantica",
    name: "Romântica",
    description: "Caligráfica, delicada",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Alto contraste, capa de revista",
  },
  {
    id: "manuscrita",
    name: "Manuscrita",
    description: "Escrita à mão, intimista",
  },
  {
    id: "artdeco",
    name: "Art Déco",
    description: "Geométrica, glamour dos anos 20",
  },
  {
    id: "minimalista",
    name: "Minimalista",
    description: "Fina e espaçada, discreta",
  },
  {
    id: "boho",
    name: "Boho",
    description: "Serifada com personalidade, rústica",
  },
];

export function isFontStyle(value: string): value is FontStyleId {
  return FONT_STYLES.some((font) => font.id === value);
}

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value);
}
