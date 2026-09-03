import Link from "next/link";
import type { Metadata } from "next";
import { fotosPorPresente, contribuicoesPorCota } from "@/lib/repositories/gifts";
import { getLegacySiteId, LEGACY_SITE_SLUG } from "@/lib/repositories/sites";
import { loadGiftSection } from "@/lib/site/giftSection";
import GiftGallery from "@/components/gifts/GiftGallery";
import TrackView from "@/components/TrackView";

export const metadata: Metadata = {
  title: "Isabelle & Nycolas | Lista de Presentes",
  description: "Presenteie os noivos com um Pix disfarçado de carinho",
};

export default async function GiftsPage() {
  const siteId = await getLegacySiteId();
  const [{ gifts, pix }, fotos, contribuicoes] = await Promise.all([
    loadGiftSection(siteId),
    fotosPorPresente(siteId),
    contribuicoesPorCota(siteId),
  ]);

  return (
    <main className="flex-1 flex flex-col gap-10 px-6 py-12 max-w-[1180px] mx-auto w-full">
      <TrackView siteSlug={LEGACY_SITE_SLUG} kind="gift_open" />
      <header className="flex flex-col items-center gap-5 text-center px-2">
        <h1
          className="font-script text-(--color-olive) leading-[1.1]"
          style={{ fontSize: "clamp(40px, 6vw, 64px)" }}
        >
          Lista de Presentes
        </h1>
        <div className="w-24 border-t border-(--color-gold) opacity-80" />
        <div className="max-w-[660px] flex flex-col gap-3.5 text-left">
          <p className="font-script text-2xl text-(--color-olive) text-center">
            Como funciona nossa lista?
          </p>
          <p className="font-serif text-lg text-(--color-olive) leading-relaxed text-pretty">
            Nossa lista de presentes é um pouquinho diferente: aqui, os
            presentes são simbólicos e escolhidos com muito carinho para
            representar um pouquinho de quem somos e da nossa vida juntos.
          </p>
          <p className="font-serif text-lg text-(--color-olive) leading-relaxed text-pretty">
            Você escolhe o presente que quiser, clica em &ldquo;Presentear&rdquo; e
            faz a contribuição pelo Pix. O presente não chega em uma caixa na
            nossa casa, mas vai nos ajudar a transformar esse carinho em
            momentos, experiências e sonhos para nós dois.
          </p>
          <p className="font-serif text-lg text-(--color-olive) leading-relaxed text-pretty">
            Pode ser uma camisa do Ceará para o Nycolas, um livro para a Isa,
            um brinquedo para os gatos ou até mesmo aquela tão necessária
            terapia para evitar o burnout.
          </p>
          <p className="font-serif text-lg text-(--color-olive) leading-relaxed text-pretty">
            No fim, o que realmente importa é saber que você fez parte desse
            momento tão especial para nós.
          </p>
          <p className="font-serif text-lg text-(--color-olive) leading-relaxed text-pretty">
            Obrigada por celebrar o nosso amor e por nos ajudar a começar
            essa nova fase!
          </p>
          <p className="font-script text-[26px] text-(--color-gold) text-center mt-1.5">
            Com amor, Isa &amp; Nycolas
          </p>
        </div>
      </header>

      {gifts.length === 0 ? (
        <p className="font-serif text-sm text-(--color-muted) text-center">
          A lista está sendo preparada com carinho. Volte em breve!
        </p>
      ) : (
        <GiftGallery
          gifts={gifts}
          pix={pix}
          siteId={siteId}
          fotos={Object.fromEntries(fotos)}
          presenteados={[...contribuicoes.keys()]}
        />
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
