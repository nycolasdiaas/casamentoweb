// Metadados dos 3 estilos visuais de template, usados na landing (/pacotes)
// e nas páginas de prévia completa (/pacotes/estilos/[estilo]).
export type TemplateStyleId =
  | "classico"
  | "moderno"
  | "romantico"
  | "toscana"
  | "film"
  | "editorial";

export type TemplateStyle = {
  id: TemplateStyleId;
  name: string;
  description: string;
  swatches: string[];
  /**
   * Três palavras de caráter, para a galeria (`/pacotes/estilos`).
   *
   * Não é a `description` encurtada: a descrição argumenta ("Papelaria de
   * casamento de luxo: serifas elegantes…") e serve a quem já parou num
   * estilo. O caráter serve a quem está varrendo seis cartões de uma vez e
   * precisa eliminar quatro em dois segundos — por isso são substantivos
   * soltos, não frase.
   */
  carater: string;
};

export const TEMPLATE_STYLES: TemplateStyle[] = [
  {
    id: "classico",
    name: "Clássico",
    description:
      "Papelaria de casamento de luxo: serifas elegantes, molduras douradas, verde-oliva profundo.",
    swatches: ["#f2efe7", "#3d4a36", "#b8985f"],
    carater: "serifa · dourado · simétrico",
  },
  {
    id: "moderno",
    name: "Moderno",
    description:
      "Minimalismo editorial: tipografia enorme, grid preciso, um único acento de cor.",
    swatches: ["#fafafa", "#1c1c1c", "#bd5b32"],
    carater: "sans · preto e branco · limpo",
  },
  {
    id: "romantico",
    name: "Romântico",
    description:
      "Aquarela e flores: molduras ovais, tons pastel, caligrafia generosa.",
    swatches: ["#fdf2f4", "#7c4a55", "#d9a3ae"],
    carater: "blush · script · suave",
  },
  {
    id: "toscana",
    name: "Toscana",
    description:
      "Rústico chique italiano: oliva e dourado, capa full-bleed, caligrafia Italianno.",
    swatches: ["#f3eddd", "#33351f", "#9c8654"],
    carater: "terracota · sol · rústico",
  },
  {
    id: "film",
    name: "Film",
    description:
      "Clima de filme: terracota e âmbar, fotos em colagem, caligrafia Great Vibes.",
    swatches: ["#f3ebda", "#3c3227", "#a5603a"],
    carater: "grão · mudo · cinematográfico",
  },
  {
    id: "editorial",
    name: "Editorial",
    description:
      "Preto e branco de revista: data gigante, grid preciso, Archivo + Cormorant.",
    swatches: ["#f5f3ef", "#141414", "#7c7c78"],
    carater: "grotesk · alto contraste",
  },
];

export function getTemplateStyle(id: string): TemplateStyle | undefined {
  return TEMPLATE_STYLES.find((style) => style.id === id);
}
