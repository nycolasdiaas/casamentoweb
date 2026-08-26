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
    <main className="flex-1 flex flex-col gap-8 trilho py-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="t-display text-[26px] leading-none text-(--c-ink)">
          Lista de presentes
        </h1>
      </div>

      <GiftAdmin gifts={gifts} contributions={contributions} />
    </main>
  );
}
