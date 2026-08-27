import Link from "next/link";
import { Suspense } from "react";
import {
  listGifts,
  listContributions,
  listContributionsParaAdmin,
} from "@/lib/repositories/gifts";
import { getLegacySiteId } from "@/lib/repositories/sites";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { formatPriceCents } from "@/lib/format";
import GiftAdmin from "@/components/admin/GiftAdmin";

/**
 * G5 · os presentes, de todos os casais.
 *
 * A tela mostrava só o casamento legado — o único que existia quando ela foi
 * escrita. Com a multi-tenancy, o operador que precisa socorrer um casal não
 * tinha por onde nem olhar.
 *
 * ── O que esta tela NÃO tem, e não é esquecimento ──────────────────────────
 *
 * O artboard desenha um cartão "A REPASSAR" (`Pendente R$ 3.200` /
 * `Repassado R$ 44.800`) e uma coluna de estado (`confirmado` / `processando`).
 * Os dois descrevem um produto que não é este.
 *
 * O Pix vai direto para a conta de cada casal e **nunca passa pela Enlace**
 * (regras §2.4; §7 lista "taxa sobre presente" entre as decisões descartadas).
 * Não há o que repassar, porque nada foi recebido. E a contribuição é
 * **auto-declarada** pelo convidado num único gesto: não existe processamento,
 * não existe confirmação de terceiro, não existe falha observável. Escrever
 * "confirmado" ao lado de uma auto-declaração daria ao operador uma certeza
 * que ninguém tem.
 *
 * Por isso a frase do rodapé do cartão não é decoração: é ela que impede
 * alguém de ler o número como caixa.
 */
export default async function AdminGiftsPage() {
  await requireAdmin();

  return (
    <main className="flex-1 flex flex-col gap-8 trilho py-12">
      <h1 className="t-display text-[26px] leading-none text-(--c-ink)">
        Lista de presentes
      </h1>

      <Suspense
        fallback={<p className="t-corpo text-(--c-ink-2)">Carregando…</p>}
      >
        <Contribuicoes />
      </Suspense>

      <Suspense fallback={null}>
        <CotasDoLegado />
      </Suspense>
    </main>
  );
}

/** "19 Set · 14h" — o formato de dado da Voz V5. */
function dataCurta(em: Date): string {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(em);
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? "";
  const mes = p("month").replace(".", "");
  return `${p("day")} ${mes.charAt(0).toUpperCase()}${mes.slice(1)} · ${p("hour")}h`;
}

async function Contribuicoes() {
  const linhas = await listContributionsParaAdmin();

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const doMes = linhas.filter((l) => l.createdAt >= inicioDoMes);
  /* O total em reais só sai quando TODA contribuição do mês veio de cota com
     preço fixo. Com uma de valor livre no meio, qualquer soma seria um número
     inventado — e um número inventado numa tela de operação vira relatório. */
  const todasComPreco =
    doMes.length > 0 && doMes.every((l) => l.priceCents !== null);
  const soma = doMes.reduce((t, l) => t + (l.priceCents ?? 0), 0);

  return (
    <section className="flex flex-col gap-5">
      <div className="surface-raised flex flex-col gap-1 rounded-[3px] p-5">
        <span className="meta text-(--c-ink-2)">Este mês</span>
        <span className="t-display text-[32px] leading-none text-(--c-ink)">
          {doMes.length}{" "}
          <span className="text-[16px] text-(--c-ink-2)">
            {doMes.length === 1 ? "contribuição" : "contribuições"}
          </span>
        </span>
        <span className="t-data text-[13px] text-(--c-ink-2)">
          {todasComPreco
            ? formatPriceCents(soma)
            : "algumas cotas são de valor livre"}
        </span>
        <p className="mt-2 text-[12px] leading-snug text-(--c-ink-2)">
          O Pix vai direto para a conta de cada casal — a Enlace nunca fica no
          meio.
        </p>
      </div>

      {linhas.length === 0 ? (
        <p className="t-corpo text-(--c-ink-2)">
          Nenhuma contribuição registrada ainda.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-(--c-surface)">
                {["Data", "Casal", "Cota", "Valor"].map((c) => (
                  <th
                    key={c}
                    className="meta border-b border-(--c-rule) px-3 py-2.5 text-(--c-ink-2)"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className="border-b border-(--c-rule)">
                  <td className="t-data px-3 py-2.5 text-[12.5px] whitespace-nowrap">
                    {dataCurta(l.createdAt)}
                  </td>
                  <td className="px-3 py-2.5 text-[13.5px]">
                    {/* Leva ao pedido pela busca da tabela de pedidos: é de lá
                        que o operador socorre o casal. */}
                    <Link
                      href={`/admin/pedidos?q=${encodeURIComponent(l.siteSlug)}`}
                      className="text-(--c-ink) underline underline-offset-4"
                    >
                      {l.coupleNames?.trim() || l.siteSlug}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-[13px]">{l.giftName}</td>
                  <td className="t-data px-3 py-2.5 text-[12.5px]">
                    {/* Traço, nunca um valor estimado: numa cota de valor livre
                        quem escolheu quanto dar foi o convidado, e a Enlace não
                        vê o Pix. */}
                    {l.priceCents === null ? "—" : formatPriceCents(l.priceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * As cotas do casamento legado, que continuam editáveis por aqui.
 *
 * É o único site cujas cotas o admin edita à mão — os outros casais mexem no
 * próprio painel. Tirar esta seção deixaria o casamento de 16/10/2026 sem
 * ninguém que consiga ajustar a lista dele.
 */
async function CotasDoLegado() {
  const siteId = await getLegacySiteId();
  const [gifts, contributions] = await Promise.all([
    listGifts(siteId),
    listContributions(siteId),
  ]);

  return (
    <section className="flex flex-col gap-3 border-t border-(--c-rule) pt-8">
      <h2 className="meta text-(--c-ink-2)">Cotas do casamento no ar</h2>
      <GiftAdmin gifts={gifts} contributions={contributions} />
    </section>
  );
}
