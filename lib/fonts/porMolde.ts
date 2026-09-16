import type { TemplateStyleId } from "@/lib/templates";
import type { FontStyleId } from "@/lib/customization";

/**
 * Quais fontes cada molde oferece — como DADO, sem carregar fonte nenhuma.
 *
 * ── Por que este arquivo existe ────────────────────────────────────────────
 *
 * A verdade continua sendo `lib/templates/<molde>/fonts.ts`, e `porMolde.test.ts`
 * reprova se esta lista se afastar dela. O problema é que aquele módulo CHAMA
 * `next/font`: quem o importa embarca o CSS das fontes. Medido na Fase 1, um
 * catálogo único de 34 punha 51,1 KB de CSS de fonte em páginas que não usavam
 * nenhuma delas.
 *
 * O questionário precisa saber os nomes para montar a lista de escolhas, e não
 * precisa das fontes em si — quem as renderiza é a prévia, dentro do iframe,
 * que carrega só o molde escolhido. Daí a lista sem os arquivos.
 *
 * ── Por que a lista de fontes depende do molde ─────────────────────────────
 *
 * Porque `clampThemeFonts` já dependia, e em silêncio. O casal escolhia uma das
 * 34 no questionário; se ela não estivesse no molde, o site caía na fonte
 * padrão e nada na tela dizia por quê. Com a prévia ao vivo isso ficaria
 * visível como defeito ("escolhi e não mudou"), quando na verdade é curadoria:
 * uma Amatic SC destruiria o Clássico, e não oferecê-la é a decisão certa —
 * ela só precisava estar na tela, e não escondida no motor.
 */
export const FONTES_POR_MOLDE: Record<TemplateStyleId, FontStyleId[]> = {
  classico: [
    "cormorant",
    "eb-garamond",
    "playfair",
    "marcellus",
    "lora",
    "crimson",
    "pinyon",
    "allura",
  ],
  editorial: [
    "playfair",
    "bodoni",
    "italiana",
    "cormorant",
    "montserrat",
    "jost",
    "raleway",
    "spectral",
  ],
  film: [
    "prata",
    "cormorant",
    "marcellus",
    "cardo",
    "spectral",
    "crimson",
    "lora",
    "great-vibes",
    "allura",
    "tangerine",
  ],
  moderno: ["jost", "montserrat", "raleway", "josefin", "poiret"],
  romantico: [
    "cormorant",
    "eb-garamond",
    "lora",
    "crimson",
    "parisienne",
    "great-vibes",
    "dancing",
    "sacramento",
    "allura",
  ],
  toscana: [
    "marcellus",
    "cormorant",
    "eb-garamond",
    "cardo",
    "crimson",
    "lora",
    "allura",
    "tangerine",
    "great-vibes",
  ],
};

/**
 * As fontes que este molde desenha.
 *
 * Sem molde escolhido ("prefiro montar do zero"), vale a lista do Clássico —
 * é o preset que `themePresetFor(null)` devolve, então é o que o site vai
 * mesmo usar. Oferecer as 34 aqui seria oferecer o que o resultado ignora.
 */
export function fontesDoMolde(id: string | null | undefined): FontStyleId[] {
  if (id && id in FONTES_POR_MOLDE) {
    return FONTES_POR_MOLDE[id as TemplateStyleId];
  }
  return FONTES_POR_MOLDE.classico;
}
