import { listGroupsWithGuests } from "@/lib/repositories/groups";
import { getLegacySiteId } from "@/lib/repositories/sites";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import RsvpDashboard from "@/components/admin/RsvpDashboard";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const groups = await listGroupsWithGuests(await getLegacySiteId());

  return (
    <main className="flex-1 flex flex-col gap-8 trilho py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="t-display text-[26px] leading-none text-(--c-ink)">
          Confirmações
        </h1>
      </div>

      <RsvpDashboard groups={groups} />
    </main>
  );
}
