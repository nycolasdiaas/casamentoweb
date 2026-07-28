import { getTemplateStyle } from "@/lib/templates";
import type { TemplateModule } from "@/lib/templates/contract";
import type { ThemeSpec } from "@/lib/theme/spec";
import { EDITORIAL_FONTS } from "./fonts";
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

// Tema padrão do Editorial: preto tipográfico sobre off-white, com o cinza
// no lugar do dourado. Mesmos valores de THEME_PRESETS.editorial — aqui eles
// são o ponto de partida, e as escolhas do casal se sobrepõem via
// resolveTheme().
const defaultTheme: ThemeSpec = {
  version: 1,
  palette: {
    outer: "#dedcd7",
    paper: "#f5f3ef",
    ink: "#141414",
    accent: "#7c7c78",
  },
  fonts: {
    display: "playfair",
    body: "montserrat",
    // O Editorial não tem caligrafia por desenho — o papel `script` fica com
    // uma serifa fina. Ver o comentário em fonts.ts.
    script: "italiana",
  },
};

const editorial: TemplateModule = {
  id: "editorial",
  meta: getTemplateStyle("editorial")!,
  defaultTheme,
  fonts: EDITORIAL_FONTS,
  // A galeria vem depois dos presentes, ao contrário do Clássico: no
  // Editorial ela é o "pré-wedding", que fecha a revista antes do álbum.
  order: [
    "cover",
    "countdown",
    "story",
    "details",
    "rsvp",
    "gifts",
    "gallery",
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

export default editorial;
