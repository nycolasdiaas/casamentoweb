import { listGroupsWithGuests } from "@/lib/repositories/groups";
import { getLegacySiteId } from "@/lib/repositories/sites";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import GroupForm from "@/components/admin/GroupForm";
import GroupList from "@/components/admin/GroupList";

/**
 * O casamento de 16/10/2026 — o legado.
 *
 * Estava em `/admin`, e saiu de lá quando o dashboard da operação ocupou o
 * endereço. O conteúdo é o MESMO: os mesmos componentes, a mesma consulta, o
 * mesmo site. Só o caminho mudou.
 *
 * Ele fica porque é o único site cujos grupos o admin edita à mão — 23 grupos,
 * 31 convidados, 23 confirmações, com os links `/rsvp/<slug>` já no WhatsApp
 * de gente de verdade. O `AGENTS.md` §2 e o SDD §6.2 são literais sobre o que
 * não se toca ali, e nada aqui toca.
 */
export default async function AdminCasamentoPage() {
  await requireAdmin();
  const groups = await listGroupsWithGuests(await getLegacySiteId());

  return (
    <main className="flex-1 flex flex-col gap-8 trilho py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="t-display text-[26px] leading-none text-(--c-ink)">
          Gerenciar convidados
        </h1>
      </div>

      <GroupForm />
      <GroupList groups={groups} />
    </main>
  );
}
