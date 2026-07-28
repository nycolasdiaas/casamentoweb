import { getTemplateStyle } from "@/lib/templates";
import type { TemplateModule } from "@/lib/templates/contract";
import type { ThemeSpec } from "@/lib/theme/spec";
import { TOSCANA_FONTS } from "./fonts";
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

// Tema padrão do Toscana: oliva escuro, papel cru e dourado envelhecido.
// Mesmos valores de THEME_PRESETS.toscana.
const defaultTheme: ThemeSpec = {
  version: 1,
  palette: {
    outer: "#232514",
    paper: "#f3eddd",
    ink: "#33351f",
    accent: "#9c8654",
  },
  fonts: {
    display: "marcellus",
    body: "crimson",
    script: "allura",
  },
};

const toscana: TemplateModule = {
  id: "toscana",
  meta: getTemplateStyle("toscana")!,
  defaultTheme,
  fonts: TOSCANA_FONTS,
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

export default toscana;
