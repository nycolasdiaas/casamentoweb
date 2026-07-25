// Metadados dos 3 estilos visuais de template, usados na landing (/pacotes)
// e nas páginas de prévia completa (/pacotes/estilos/[estilo]).
export type TemplateStyleId =
  | "classico"
  | "moderno"
  | "romantico"
  | "toscana";

export type TemplateStyle = {
  id: TemplateStyleId;
  name: string;
  description: string;
  swatches: string[];
};

export const TEMPLATE_STYLES: TemplateStyle[] = [
  {
    id: "classico",
    name: "Clássico",
    description:
      "Papelaria de casamento de luxo: serifas elegantes, molduras douradas, verde-oliva profundo.",
    swatches: ["#f2efe7", "#3d4a36", "#b8985f"],
  },
  {
    id: "moderno",
    name: "Moderno",
    description:
      "Minimalismo editorial: tipografia enorme, grid preciso, um único acento de cor.",
    swatches: ["#fafafa", "#1c1c1c", "#bd5b32"],
  },
  {
    id: "romantico",
    name: "Romântico",
    description:
      "Aquarela e flores: molduras ovais, tons pastel, caligrafia generosa.",
    swatches: ["#fdf2f4", "#7c4a55", "#d9a3ae"],
  },
  {
    id: "toscana",
    name: "Toscana",
    description:
      "Rústico chique italiano: oliva e dourado, capa full-bleed, caligrafia Italianno.",
    swatches: ["#f3eddd", "#33351f", "#9c8654"],
  },
];

export function getTemplateStyle(id: string): TemplateStyle | undefined {
  return TEMPLATE_STYLES.find((style) => style.id === id);
}
