import Link from "next/link";
import { listGroupsWithGuests } from "@/lib/repositories/groups";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import RsvpDashboard from "@/components/admin/RsvpDashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const groups = await listGroupsWithGuests();

  return (
    <main className="flex-1 flex flex-col gap-8 px-6 py-12 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-xl text-(--color-olive)">
          Confirmações
        </h1>
        <nav className="flex gap-4">
          <Link
            href="/admin"
            className="font-serif text-xs text-(--color-olive) underline"
          >
            Gerenciar convidados
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

      <RsvpDashboard groups={groups} />
    </main>
  );
}
