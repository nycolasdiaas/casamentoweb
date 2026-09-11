import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getInviteDoDono } from "@/lib/repositories/siteInvites";
import { listSitePhotosFresh } from "@/lib/repositories/sitePhotos";
import EditorDeConvite from "@/components/account/convite/EditorDeConvite";
import ApagarConvite from "@/components/account/convite/ApagarConvite";
import { baseUrlOuNulo } from "@/lib/baseUrl";
import { themePresetFor } from "@/lib/theme/presets";
import type { ThemeSpec } from "@/lib/theme/spec";
import type { TemplateStyleId } from "@/lib/templates";
import { modelosDeConvite } from "@/lib/templates/modelos";
import { uiPrensa } from "@/lib/fonts/ui";
import { Icone } from "@/components/ui/prensa";

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

export const metadata: Metadata = { title: "Editar convite" };

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

  /* A paleta de onde as cores deste convite vieram — a mesma que
     `conviteInicial` usou ao semear. É contra ela que o painel Modelos compara
     para saber qual cor ainda é "do tema" e qual o casal escolheu à mão. */
  const tema =
    (achado.temaDoSite as ThemeSpec | null) ??
    themePresetFor(achado.templateId);
  /* O endereço é rodapé do convite: sem ele a tela abre igual, com o rodapé
     vazio. Ver UX-002 — antes, a falta do endereço derrubava o editor. */
  const [fotos, baseUrl] = await Promise.all([
    listSitePhotosFresh(siteId),
    baseUrlOuNulo(),
  ]);

  const voltar = orderId ? `/conta/pedidos/${orderId}/convites` : "/conta/pedidos";

  return (
    // `h-screen` + `overflow-hidden`: o editor é uma tela só, não uma página
    // que rola. É o que permite a moldura do convite e o painel ocuparem toda
    // a altura sem que nada fique abaixo da dobra.
    <div
      className={`${uiPrensa} tema-escuro flex h-screen flex-col overflow-hidden bg-(--c-base) text-(--c-ink)`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-baseline gap-4">
          <Link
            href={voltar}
            className="inline-flex items-center gap-1.5 text-[13px] text-(--c-ink-2) transition-colors hover:text-(--c-ink)"
          >
            <Icone nome="setaEsquerda" tamanho={16} />
            <span className="underline underline-offset-4">
              Todos os convites
            </span>
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
          baseUrl={baseUrl ?? ""}
          slug={slug}
          urlDoConvite={
            convite.slug && baseUrl
              ? `${baseUrl.replace(/\/+$/, "")}/c/${convite.slug}`
              : null
          }
          noAr={convite.publishedAt !== null}
          atualizadoEm={convite.updatedAt.getTime()}
          paletaDoSite={tema.palette}
          estiloDoSite={achado.templateId as TemplateStyleId | null}
          modelos={modelosDeConvite()}
          siteNoAr={statusDoSite === "published"}
        />
      </main>
    </div>
  );
}
