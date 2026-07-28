import { getTemplateStyle } from "@/lib/templates";
import type { TemplateModule } from "@/lib/templates/contract";
import type { ThemeSpec } from "@/lib/theme/spec";
import { CLASSICO_FONTS } from "./fonts";
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

// Tema padrão do Clássico. Mesmos valores que a prévia em
// app/pacotes/estilos/classico/page.tsx usa hoje como hex fixo — aqui eles
// viram dado, e as escolhas do casal se sobrepõem via resolveTheme().
const defaultTheme: ThemeSpec = {
  version: 1,
  palette: {
    outer: "#2f3a2a",
    paper: "#f2efe7",
    ink: "#3d4a36",
    accent: "#b8985f",
  },
  fonts: {
    display: "cormorant",
    body: "lora",
    script: "pinyon",
  },
};

const classico: TemplateModule = {
  id: "classico",
  meta: getTemplateStyle("classico")!,
  defaultTheme,
  fonts: CLASSICO_FONTS,
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

export default classico;
