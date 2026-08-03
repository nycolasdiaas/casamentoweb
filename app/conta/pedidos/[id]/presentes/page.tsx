import Link from "next/link";
import type { Metadata } from "next";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { listGifts } from "@/lib/repositories/gifts";
import { listSiteSections } from "@/lib/repositories/siteSections";
import { formatPriceCents } from "@/lib/format";
import { ROTULO_TIPO, type PixKeyType } from "@/lib/pix/key";
import { WHATSAPP_LINK } from "@/lib/site";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Presentes | ${SITE_NAME}` };

export default async function PresentesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  const conteudo = site ? await getSiteContent(site.id) : null;
  const presentes = site ? await listGifts(site.id) : [];
  const secaoLigada = site
    ? (await listSiteSections(site.id)).some(
        (s) => s.sectionKey === "gifts" && s.enabled
      )
    : false;

  const temPix = Boolean(conteudo?.pixKey);
  const noAr = site !== null && site.status !== "archived" && secaoLigada;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">
          Lista de presentes
        </h1>
        <p className="text-sm leading-relaxed text-(--color-olive)/70">
          O convidado escolhe uma cota e paga por Pix — direto na conta de
          vocês, sem passar por ninguém.
        </p>
      </div>

      {/* O estado que mais importa: lista visível sem chave. A trava impede o
          site de mostrar chave de outra pessoa; este aviso impede o casal de
          descobrir só depois do casamento que ninguém conseguiu presentear. */}
      {noAr && !temPix && presentes.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-400/60 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            A lista está no ar, mas sem chave Pix.
          </p>
          <p className="text-sm leading-relaxed text-amber-900/80">
            Os convidados veem os presentes e não conseguem presentear — a tela
            pede que falem com vocês. Cadastrem a chave em{" "}
            <Link
              href={`/conta/pedidos/${order.id}/conteudo`}
              className="font-semibold underline underline-offset-2"
            >
              Conteúdo → Pix dos presentes
            </Link>{" "}
            e o Pix passa a funcionar na hora.
          </p>
        </div>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-(--color-gold)/40 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">O Pix de vocês</h2>
          <Link
            href={`/conta/pedidos/${order.id}/conteudo`}
            className="btn btn-secondary btn-sm"
          >
            {temPix ? "Trocar" : "Cadastrar"}
          </Link>
        </div>

        {temPix ? (
          <div className="flex flex-col gap-2 text-sm">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-xs uppercase tracking-[0.12em] text-(--color-muted)">
                Chave
              </span>
              <span className="font-mono">{conteudo!.pixKey}</span>
              {conteudo!.pixKeyType && (
                <span className="text-xs text-(--color-muted)">
                  ({ROTULO_TIPO[conteudo!.pixKeyType as PixKeyType]})
                </span>
              )}
            </p>
            {conteudo!.pixRecipient && (
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xs uppercase tracking-[0.12em] text-(--color-muted)">
                  Recebe
                </span>
                <span>
                  {conteudo!.pixRecipient}
                  {conteudo!.pixInstitution
                    ? ` · ${conteudo!.pixInstitution}`
                    : ""}
                </span>
              </p>
            )}
            <p className="mt-1 text-xs leading-relaxed text-(--color-muted)">
              Esta chave fica visível para quem abrir o site — é assim que o
              convidado consegue presentear. O código do Pix é gerado na hora,
              já com o valor da cota preenchido.
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-(--color-olive)/70">
            Sem chave cadastrada, a lista aparece para o convidado mas sem forma
            de pagamento. Não existe chave padrão — só a de vocês serve.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-(--color-gold)/40 bg-white p-6">
        <h2 className="text-lg font-semibold">
          As cotas{" "}
          <span className="text-sm font-normal text-(--color-muted)">
            ({presentes.length})
          </span>
        </h2>

        {presentes.length === 0 ? (
          <p className="text-sm leading-relaxed text-(--color-olive)/70">
            A lista ainda está vazia.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-(--color-gold)/20">
            {presentes.map((g) => (
              <li
                key={g.id}
                className="flex items-baseline justify-between gap-4 py-2.5"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">{g.name}</span>
                  <span className="text-xs text-(--color-muted)">
                    {g.category}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium">
                  {formatPriceCents(g.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Honestidade sobre o que ainda não existe: o CRUD de presentes pelo
            casal é a Fase 4 e ainda não foi feito. Melhor dizer isso que
            deixar o casal procurando um botão que não tem. */}
        <p className="rounded-xl border border-(--color-gold)/40 bg-(--color-blush) px-4 py-3 text-xs leading-relaxed text-(--color-olive)">
          Montar e editar as cotas ainda é feito pela nossa equipe. Mandem a
          lista de vocês{" "}
          <Link
            href={WHATSAPP_LINK}
            target="_blank"
            className="font-semibold underline underline-offset-2"
          >
            pelo WhatsApp
          </Link>{" "}
          que a gente cadastra — e em breve isso vem para cá.
        </p>
      </section>
    </div>
  );
}
