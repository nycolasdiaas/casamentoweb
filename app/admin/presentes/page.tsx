import Link from "next/link";
import { listGifts, listContributions } from "@/lib/repositories/gifts";
import GiftAdmin from "@/components/admin/GiftAdmin";

export const dynamic = "force-dynamic";

export default async function AdminGiftsPage() {
  const [gifts, contributions] = await Promise.all([
    listGifts(),
    listContributions(),
  ]);

  return (
    <main className="flex-1 flex flex-col gap-8 px-6 py-12 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-serif text-xl text-(--color-olive)">
          Lista de presentes
        </h1>
        <nav className="flex gap-4">
          <Link
            href="/presentes"
            className="font-serif text-xs text-(--color-olive) underline"
          >
            Ver página pública
          </Link>
          <Link
            href="/admin"
            className="font-serif text-xs text-(--color-olive) underline"
          >
            Gerenciar convidados
          </Link>
        </nav>
      </div>

      <GiftAdmin gifts={gifts} contributions={contributions} />
    </main>
  );
}
