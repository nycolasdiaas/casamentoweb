import { getTemplateStyle } from "@/lib/templates";
import type { TemplateModule } from "@/lib/templates/contract";
import type { ThemeSpec } from "@/lib/theme/spec";
import { FILM_FONTS } from "./fonts";
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

// Tema padrão do Film: marrom de revelação, papel envelhecido e terracota
// queimada. Mesmos valores de THEME_PRESETS.film.
const defaultTheme: ThemeSpec = {
  version: 1,
  palette: {
    outer: "#2a231b",
    paper: "#f3ebda",
    ink: "#3c3227",
    accent: "#a5603a",
  },
  fonts: {
    display: "prata",
    body: "spectral",
    script: "great-vibes",
  },
};

const film: TemplateModule = {
  id: "film",
  meta: getTemplateStyle("film")!,
  defaultTheme,
  fonts: FILM_FONTS,
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

export default film;
