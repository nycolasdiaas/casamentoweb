import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getInviteDoDono } from "@/lib/repositories/siteInvites";
import { listSitePhotosFresh } from "@/lib/repositories/sitePhotos";
import EditorDeConvite from "@/components/account/convite/EditorDeConvite";
import ApagarConvite from "@/components/account/convite/ApagarConvite";
import { getBaseUrl } from "@/lib/baseUrl";
import { SITE_NAME } from "@/lib/site";
import { uiPrensa } from "@/lib/fonts/ui";

/**
 * O editor de convites, em tela cheia.
 *
 * ── Por que fora de `/conta/pedidos/<id>/…` ────────────────────────────────
 *
 * Lá dentro, o layout do gerenciamento desenha o menu lateral em toda rota
 * filha — e num editor de desenho aquela coluna é área de tela perdida, ao
 * lado de um segundo painel de ferramentas. O casal ficava com o convite num
 * quadrado no meio de três colunas.
 *
 * Rota irmã resolve sem truque de CSS e sem esconder o menu por exceção
 * (que é como um layout vira uma árvore de `if`). O `orderId` sai do próprio
 * convite — ver `getInviteDoDono` —, então o caminho de volta continua certo.
 *
 * ── Posse ─────────────────────────────────────────────────────────────────
 *
 * Sem `carregarGerenciamento` aqui, porque não há pedido na URL. A trava é a
 * mesma e está no WHERE da consulta: convite de outro casal não é encontrado.
 */

export const metadata: Metadata = { title: `Editar convite | ${SITE_NAME}` };

export default async function EditarConvitePage({
  params,
}: {
  params: Promise<{ conviteId: string }>;
}) {
  const { conviteId } = await params;

  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const achado = await getInviteDoDono(conviteId, userId);
  if (!achado) notFound();

  const { convite, siteId, slug, statusDoSite, orderId } = achado;
  const [fotos, baseUrl] = await Promise.all([
    listSitePhotosFresh(siteId),
    getBaseUrl(),
  ]);

  const voltar = orderId ? `/conta/pedidos/${orderId}/convites` : "/conta/pedidos";

  return (
    // `h-screen` + `overflow-hidden`: o editor é uma tela só, não uma página
    // que rola. É o que permite a moldura do convite e o painel ocuparem toda
    // a altura sem que nada fique abaixo da dobra.
    <div
      className={`${uiPrensa} flex h-screen flex-col overflow-hidden bg-(--c-base) text-(--c-ink)`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-baseline gap-4">
          <Link
            href={voltar}
            className="text-[13px] text-(--c-ink-2) underline underline-offset-4 transition-colors hover:text-(--c-ink)"
          >
            ← Todos os convites
          </Link>
          <span className="t-display text-[20px] leading-none">
            {convite.name}
          </span>
        </div>

        <ApagarConvite
          siteId={siteId}
          inviteId={convite.id}
          orderId={orderId ?? ""}
          nome={convite.name}
        />
      </header>

      <main className="min-h-0 flex-1 px-4 pb-3">
        <EditorDeConvite
          siteId={siteId}
          orderId={orderId ?? ""}
          inviteId={convite.id}
          nomeInicial={convite.name}
          docInicial={convite.doc}
          fotos={fotos.map((f) => ({ id: f.id, alt: f.alt }))}
          baseUrl={baseUrl}
          slug={slug}
          urlDoConvite={
            convite.slug
              ? `${baseUrl.replace(/\/+$/, "")}/c/${convite.slug}`
              : null
          }
          noAr={convite.publishedAt !== null}
          siteNoAr={statusDoSite === "published"}
        />
      </main>
    </div>
  );
}
