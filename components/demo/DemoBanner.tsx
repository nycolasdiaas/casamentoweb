import Link from "next/link";
import type { WeddingPackage } from "@/lib/packages";

export default function DemoBanner({ pkg }: { pkg: WeddingPackage }) {
  return (
    <div className="sticky top-0 z-40 bg-(--color-olive) text-white px-4 py-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
      <p className="font-serif text-xs tracking-[0.1em]">
        Exemplo do pacote <span className="font-script text-base">{pkg.name}</span>{" "}
        · {pkg.price}
      </p>
      <Link
        href="/"
        className="font-serif text-xs underline underline-offset-2 hover:text-(--color-gold)"
      >
        Ver todos os pacotes
      </Link>
    </div>
  );
}
