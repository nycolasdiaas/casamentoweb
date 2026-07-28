import Link from "next/link";
import { listGroupsWithGuests } from "@/lib/repositories/groups";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import GroupForm from "@/components/admin/GroupForm";
import GroupList from "@/components/admin/GroupList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const groups = await listGroupsWithGuests();

  return (
    <main className="flex-1 flex flex-col gap-8 px-6 py-12 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-xl text-(--color-olive)">
          Gerenciar convidados
        </h1>
        <nav className="flex gap-4">
          <Link
            href="/admin/casamento/confirmacoes"
            className="font-serif text-xs text-(--color-olive) underline"
          >
            Confirmações
          </Link>
          <Link
            href="/admin/casamento/presentes"
            className="font-serif text-xs text-(--color-olive) underline"
          >
            Presentes
          </Link>
        </nav>
      </div>

      <GroupForm />
      <GroupList groups={groups} />
    </main>
  );
}
