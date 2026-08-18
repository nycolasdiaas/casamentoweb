import type { Metadata } from "next";
import Link from "next/link";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { listInvites } from "@/lib/repositories/siteInvites";
import { MAX_CONVITES } from "@/lib/site/inviteDoc";
import { criarConviteAction } from "@/app/actions/invite-actions";
import MiniConvite from "@/components/account/convite/MiniConvite";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Convites | ${SITE_NAME}` };

export default async function ConvitesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const { site } = await carregarGerenciamento(id);

  const convites = site ? await listInvites(site.id) : [];
  const noLimite = convites.length >= MAX_CONVITES;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Convites</h1>
        <p className="max-w-[62ch] text-sm leading-relaxed text-(--c-ink-2)">
          Desenhem o convite de vocês e baixem em PNG, JPEG ou PDF para mandar
          no grupo da família. Dá para ter até {MAX_CONVITES} — um para os
          padrinhos, outro para o pessoal do trabalho, o que quiserem.
        </p>
      </div>

      {site === null ? (
        <p className="surface-raised rounded-[3px] p-6 text-sm text-(--c-ink-2)">
          O site de vocês ainda está sendo montado. Assim que a prévia ficar
          pronta, os convites aparecem aqui.
        </p>
      ) : (
        <>
          {erro === "limite" && (
            <p className="surface-raised rounded-[3px] p-4 text-sm text-(--c-mark)">
              Vocês já têm {MAX_CONVITES} convites. Apague um para criar outro.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {convites.map((c) => (
              <Link
                key={c.id}
                href={`/conta/pedidos/${id}/convites/${c.id}`}
                className="group flex flex-col gap-2"
              >
                <div className="overflow-hidden rounded-[3px] border border-(--c-rule) transition-colors group-hover:border-(--c-ink)">
                  <MiniConvite doc={c.doc} />
                </div>
                <span className="text-[13px] text-(--c-ink)">{c.name}</span>
              </Link>
            ))}

            {/* O botão de criar mora NA GRADE, no lugar do próximo convite —
                é onde o olho já está depois de ver os que existem. */}
            {!noLimite && (
              <form action={criarConviteAction} className="contents">
                <input type="hidden" name="siteId" value={site.id} />
                <input type="hidden" name="orderId" value={id} />
                <button
                  type="submit"
                  className="flex aspect-4/5 flex-col items-center justify-center gap-2 rounded-[3px] border border-dashed border-(--c-rule) text-(--c-ink-2) transition-colors hover:border-(--c-ink) hover:text-(--c-ink)"
                >
                  <svg
                    aria-hidden
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M10 4v12M4 10h12" />
                  </svg>
                  <span className="text-[13px]">Novo convite</span>
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
