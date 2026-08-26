import Link from "next/link";
import type { Metadata } from "next";

/* Título próprio: o fallback raiz virou o da PLATAFORMA (ver app/layout.tsx),
   e sem isto esta rota — que é o site de um casal — passaria a se anunciar
   como "Enlace · Sites de casamento". */
export const metadata: Metadata = {
  title: "Isabelle & Nycolas | Save the Date",
  description: "Você está convidado para o nosso casamento.",
  robots: { index: false, follow: false },
};
import SaveTheDate from "@/components/SaveTheDate";
import TrackView from "@/components/TrackView";
import { LEGACY_SITE_SLUG } from "@/lib/repositories/sites";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <TrackView siteSlug={LEGACY_SITE_SLUG} />
      <SaveTheDate />
      <nav className="flex justify-center bg-(--color-paper) pb-10">
        <Link
          href="/presentes"
          className="font-serif text-sm tracking-[0.1em] text-(--color-olive) border border-(--color-gold) px-6 py-3 transition-colors hover:bg-(--color-blush)"
        >
          Lista de Presentes
        </Link>
      </nav>
    </main>
  );
}
