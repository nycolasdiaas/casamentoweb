import Link from "next/link";
import { listGifts, listContributions } from "@/lib/repositories/gifts";
import { getLegacySiteId } from "@/lib/repositories/sites";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import GiftAdmin from "@/components/admin/GiftAdmin";

export default async function AdminGiftsPage() {
  await requireAdmin();
  const siteId = await getLegacySiteId();
  const [gifts, contributions] = await Promise.all([
    listGifts(siteId),
    listContributions(siteId),
  ]);

  return (
    <main className="flex-1 flex flex-col gap-8 px-6 py-12 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-serif text-xl text-(--c-ink)">
          Lista de presentes
        </h1>
        <nav className="flex gap-4">
          <Link
            href="/presentes"
            className="font-serif text-xs text-(--c-ink) underline"
          >
            Ver página pública
          </Link>
          <Link
            href="/admin"
            className="font-serif text-xs text-(--c-ink) underline"
          >
            Gerenciar convidados
          </Link>
        </nav>
      </div>

      <GiftAdmin gifts={gifts} contributions={contributions} />
    </main>
  );
}
