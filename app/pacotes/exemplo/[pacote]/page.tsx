import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PACKAGES, DEMO_COUPLE, getPackage, tierIncludes } from "@/lib/packages";
import DemoBanner from "@/components/demo/DemoBanner";
import DemoCountdown from "@/components/demo/DemoCountdown";
import DemoRsvp from "@/components/demo/DemoRsvp";
import DemoGifts from "@/components/demo/DemoGifts";
import DemoAlbum from "@/components/demo/DemoAlbum";
import PhotoPlaceholder from "@/components/demo/PhotoPlaceholder";

export function generateStaticParams() {
  return PACKAGES.map((pkg) => ({ pacote: pkg.tier }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pacote: string }>;
}): Promise<Metadata> {
  const { pacote } = await params;
  const pkg = getPackage(pacote);
  if (!pkg) return {};
  return {
    title: `Exemplo do pacote ${pkg.name} | Site de Casamento`,
    description: `Veja como fica um site de casamento do pacote ${pkg.name}.`,
  };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ pacote: string }>;
}) {
  const { pacote } = await params;
  const pkg = getPackage(pacote);

  if (!pkg) {
    notFound();
  }

  const hasRsvp = tierIncludes(pkg.tier, "site");
  const hasGifts = tierIncludes(pkg.tier, "para-sempre");

  return (
    <main className="flex-1 flex flex-col">
      <DemoBanner pkg={pkg} />

      {/* Capa / convite — presente em todos os pacotes */}
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center">
        <p className="font-serif text-xs tracking-[0.3em] uppercase text-(--color-gold)">
          {hasRsvp ? "Save the Date" : "Vamos nos casar"}
        </p>
        <h1 className="font-script text-5xl sm:text-6xl text-(--color-olive)">
          {DEMO_COUPLE.names}
        </h1>
        <div className="w-16 border-t border-(--color-gold)" />
        <p className="font-serif text-sm tracking-[0.15em] uppercase text-(--color-olive)">
          {DEMO_COUPLE.dateLabel} · {DEMO_COUPLE.timeLabel}
        </p>
        <p className="font-serif text-sm text-(--color-muted)">
          {DEMO_COUPLE.venue} · {DEMO_COUPLE.city}
        </p>
        <PhotoPlaceholder
          label={DEMO_COUPLE.initials.join(" & ")}
          className="w-full max-w-sm aspect-[3/4] mt-4"
        />
      </section>

      {/* Contagem regressiva */}
      <section className="flex flex-col items-center gap-6 px-6 py-12 bg-(--color-blush)">
        <h2 className="font-script text-2xl text-(--color-olive)">
          Falta pouco
        </h2>
        <DemoCountdown targetDate={DEMO_COUPLE.date} />
      </section>

      {/* História do casal */}
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center">
        <h2 className="font-script text-2xl text-(--color-olive)">
          Nossa história
        </h2>
        <div className="w-16 border-t border-(--color-gold)" />
        <p className="font-serif text-sm text-(--color-olive) max-w-xl leading-relaxed">
          {DEMO_COUPLE.story}
        </p>
        <div className="grid grid-cols-3 gap-3 w-full max-w-xl">
          {["2019", "O pedido", "Hoje"].map((label) => (
            <PhotoPlaceholder
              key={label}
              label={label}
              className="aspect-square"
            />
          ))}
        </div>
      </section>

      {/* RSVP — pacotes Site do Casamento e Para Sempre */}
      {hasRsvp && (
        <section className="flex flex-col items-center gap-6 px-6 py-16 bg-(--color-blush)">
          <h2 className="font-script text-2xl text-(--color-olive)">
            Confirme sua presença
          </h2>
          <p className="font-serif text-sm text-(--color-olive) max-w-md text-center leading-relaxed">
            Cada família recebe um link exclusivo e confirma quem vai em
            segundos. O casal acompanha tudo pelo painel.
          </p>
          <div className="w-full max-w-lg">
            <DemoRsvp />
          </div>
        </section>
      )}

      {/* Lista de presentes — só Para Sempre */}
      {hasGifts && (
        <section className="flex flex-col gap-8 px-6 py-16 max-w-4xl mx-auto w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="font-script text-2xl text-(--color-olive)">
              Lista de Presentes
            </h2>
            <div className="w-16 border-t border-(--color-gold)" />
            <p className="font-serif text-sm text-(--color-olive) max-w-md leading-relaxed">
              Presentes com o valor que o casal escolher, pagos por QR Code
              Pix ou copia e cola — direto na conta, sem nenhuma taxa.
            </p>
          </div>
          <DemoGifts />
        </section>
      )}

      {/* Álbum pós-casamento — só Para Sempre */}
      {hasGifts && (
        <section className="flex flex-col gap-8 px-6 py-16 bg-(--color-blush)">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="font-serif text-xs tracking-[0.3em] uppercase text-(--color-gold)">
              Exclusivo do pacote Para Sempre
            </p>
            <h2 className="font-script text-2xl text-(--color-olive)">
              O álbum do grande dia
            </h2>
            <div className="w-16 border-t border-(--color-gold)" />
          </div>
          <div className="max-w-4xl mx-auto w-full">
            <DemoAlbum />
          </div>
          <p className="font-serif text-sm text-(--color-olive) text-center">
            Tudo isso no endereço do casal:{" "}
            <span className="font-mono text-xs border border-(--color-gold) bg-white px-2 py-1">
              {DEMO_COUPLE.customUrl}
            </span>
          </p>
        </section>
      )}

      {/* Rodapé da demo */}
      <footer className="flex flex-col items-center gap-4 px-6 py-14 text-center border-t border-(--color-gold)">
        <p className="font-script text-2xl text-(--color-olive)">
          Gostou? Este pode ser o site de vocês.
        </p>
        <p className="font-serif text-sm text-(--color-muted)">
          Pacote {pkg.name} · {pkg.price} · {pkg.deliveryTime.toLowerCase()}
        </p>
        <Link
          href="/pacotes"
          className="font-serif text-xs tracking-[0.15em] uppercase border border-(--color-gold) text-(--color-olive) px-8 py-3 transition-colors hover:bg-(--color-blush)"
        >
          Comparar os pacotes
        </Link>
      </footer>
    </main>
  );
}
