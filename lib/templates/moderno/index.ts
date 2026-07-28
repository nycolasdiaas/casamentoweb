import { getTemplateStyle } from "@/lib/templates";
import type { TemplateModule } from "@/lib/templates/contract";
import type { ThemeSpec } from "@/lib/theme/spec";
import { MODERNO_FONTS } from "./fonts";
import {
  Cover,
  CountdownSection,
  Story,
  Details,
  Gallery,
  Rsvp,
  Gifts,
  Album,
  Footer,
} from "./sections";

// Tema padrão do Moderno: quase-preto sobre quase-branco, com terracota como
// única cor. Mesmos valores de THEME_PRESETS.moderno.
const defaultTheme: ThemeSpec = {
  version: 1,
  palette: {
    outer: "#e9e8e4",
    paper: "#fafafa",
    ink: "#1c1c1c",
    accent: "#bd5b32",
  },
  fonts: {
    // display e body na mesma fonte: o contraste do molde vem do PESO
    // (900 contra 300), não da mistura de famílias.
    display: "jost",
    body: "jost",
    // ocupa o lugar do monoespaçado da prévia — ver fonts.ts
    script: "poiret",
  },
};

const moderno: TemplateModule = {
  id: "moderno",
  meta: getTemplateStyle("moderno")!,
  defaultTheme,
  fonts: MODERNO_FONTS,
  order: [
    "cover",
    "countdown",
    "story",
    "details",
    "gallery",
    "rsvp",
    "gifts",
    "album",
    "footer",
  ],
  sections: {
    cover: Cover,
    countdown: CountdownSection,
    story: Story,
    details: Details,
    gallery: Gallery,
    rsvp: Rsvp,
    gifts: Gifts,
    album: Album,
    footer: Footer,
  },
};

export default moderno;
