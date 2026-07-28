import Link from "next/link";
import { listGroupsWithGuests } from "@/lib/repositories/groups";
import { getLegacySiteId } from "@/lib/repositories/sites";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import GroupForm from "@/components/admin/GroupForm";
import GroupList from "@/components/admin/GroupList";

export default async function AdminPage() {
  await requireAdmin();
  const groups = await listGroupsWithGuests(await getLegacySiteId());

  return (
    <main className="flex-1 flex flex-col gap-8 px-6 py-12 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-xl text-(--color-olive)">
          Gerenciar convidados
        </h1>
        <nav className="flex gap-4">
          <Link
            href="/admin/dashboard"
            className="font-serif text-xs text-(--color-olive) underline"
          >
            Ver confirmações
          </Link>
          <Link
            href="/admin/presentes"
            className="font-serif text-xs text-(--color-olive) underline"
          >
            Lista de presentes
          </Link>
          <Link
            href="/admin/pedidos"
            className="font-serif text-xs text-(--color-olive) underline"
          >
            Pedidos de sites
          </Link>
        </nav>
      </div>

      <GroupForm />
      <GroupList groups={groups} />
    </main>
  );
}
