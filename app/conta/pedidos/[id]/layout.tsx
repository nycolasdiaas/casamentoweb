import AccountShell from "@/components/account/AccountShell";
import ManageSidebar, {
  type ItemMenu,
} from "@/components/account/manage/ManageSidebar";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { listGifts } from "@/lib/repositories/gifts";
import { listSiteSections } from "@/lib/repositories/siteSections";

/**
 * Casca do painel de gerenciamento do casal.
 *
 * O que havia antes: UMA página de 341 linhas com acompanhamento, prévia,
 * seções, conteúdo, tema e fotos empilhados. Funcionava e ninguém achava nada
 * — o mesmo defeito do formulário de pedido, em outra tela.
 *
 * Agora cada assunto é uma rota, o menu fica de pé ao lado e o `template.tsx`
 * do /conta anima a troca. O layout é o lugar certo para o menu porque ele
 * NÃO remonta ao navegar entre as abas: a barra fica parada e só o conteúdo
 * troca, que é o que faz parecer um painel em vez de um site.
 */
export default async function GerenciarLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  const base = `/conta/pedidos/${order.id}`;

  // O ponto vermelho no menu existe para um caso só: lista de presentes no ar
  // sem chave Pix. É o único estado em que o site está enganando o convidado
  // silenciosamente — ele vê os presentes e não consegue presentear.
  const conteudo = site ? await getSiteContent(site.id) : null;
  const presentesSemPix =
    site !== null &&
    site.status !== "archived" &&
    !conteudo?.pixKey &&
    (await listGifts(site.id)).length > 0 &&
    (await listSiteSections(site.id)).some(
      (s) => s.sectionKey === "gifts" && s.enabled
    );

  const itens: ItemMenu[] = [
    {
      href: base,
      rotulo: "Início",
      descricao: "Onde o pedido está",
      icone: "🏠",
    },
    {
      href: `${base}/paginas`,
      rotulo: "Páginas",
      descricao: "Ligue, desligue e ordene",
      icone: "📄",
    },
    {
      href: `${base}/conteudo`,
      rotulo: "Conteúdo",
      descricao: "Nomes, data, locais, história",
      icone: "✍️",
    },
    {
      href: `${base}/visual`,
      rotulo: "Visual",
      descricao: "Cores e tipografia",
      icone: "🎨",
    },
    {
      href: `${base}/fotos`,
      rotulo: "Fotos",
      descricao: "Suba e organize",
      icone: "📷",
    },
    {
      href: `${base}/presentes`,
      rotulo: "Presentes",
      descricao: "Pix e lista",
      icone: "🎁",
      alerta: presentesSemPix,
    },
  ];

  const linkDoSite = order.siteUrl ?? order.previewUrl ?? null;

  return (
    <AccountShell active="pedidos">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <ManageSidebar
          itens={itens}
          titulo={order.coupleNames?.trim() || "Nosso casamento"}
          weddingDate={order.weddingDate ?? null}
          linkDoSite={linkDoSite}
        />

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AccountShell>
  );
}
