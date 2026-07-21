import Link from "next/link";
import type { Metadata } from "next";
import { listGifts, groupGiftsByCategory } from "@/lib/repositories/gifts";
import GiftGallery from "@/components/gifts/GiftGallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Isabelle & Nycolas | Lista de Presentes",
  description: "Presenteie os noivos com um Pix disfarçado de carinho",
};

export default async function GiftsPage() {
  const gifts = await listGifts();
  const categories = groupGiftsByCategory(
    gifts.map(({ id, category, name, priceCents }) => ({
      id,
      category,
      name,
      priceCents,
    }))
  );

  return (
    <main className="flex-1 flex flex-col gap-10 px-6 py-12 max-w-4xl mx-auto w-full">
      <header className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-script text-3xl sm:text-4xl text-(--color-olive)">
          Lista de Presentes
        </h1>
        <div className="w-16 border-t border-(--color-gold)" />
        <p className="font-serif text-sm text-(--color-olive) max-w-md leading-relaxed">
          Nenhuma panela vai precisar viajar até nossa casa: aqui cada
          presente é um Pix disfarçado de carinho. Escolha o seu favorito —
          ou o que render mais risada.
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="font-serif text-sm text-(--color-muted) text-center">
          A lista está sendo preparada com carinho. Volte em breve!
        </p>
      ) : (
        <GiftGallery categories={categories} />
      )}

      <footer className="flex justify-center pt-4">
        <Link
          href="/isabelle-e-nycolas"
          className="font-serif text-xs text-(--color-olive) underline"
        >
          Voltar ao convite
        </Link>
      </footer>
    </main>
  );
}
