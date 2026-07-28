import { getTemplateStyle } from "@/lib/templates";
import type { TemplateModule } from "@/lib/templates/contract";
import type { ThemeSpec } from "@/lib/theme/spec";
import { ROMANTICO_FONTS } from "./fonts";
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

// Tema padrão do Romântico: vinho suave sobre rosa muito claro, com o rosa
// antigo no accent. Mesmos valores de THEME_PRESETS.romantico.
const defaultTheme: ThemeSpec = {
  version: 1,
  palette: {
    outer: "#6d3f49",
    paper: "#fdf2f4",
    ink: "#7c4a55",
    accent: "#d9a3ae",
  },
  fonts: {
    display: "cormorant",
    body: "lora",
    script: "parisienne",
  },
};

const romantico: TemplateModule = {
  id: "romantico",
  meta: getTemplateStyle("romantico")!,
  defaultTheme,
  fonts: ROMANTICO_FONTS,
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

export default romantico;
