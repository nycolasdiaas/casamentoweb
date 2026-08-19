import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getConvitePublicado,
  listPublishedInviteSlugs,
} from "@/lib/repositories/siteInvites";
import ConviteVisual from "@/components/site/ConviteVisual";

/**
 * O convite como PÁGINA — `/c/<slug>`.
 *
 * ── Por que uma página, e não só um arquivo ────────────────────────────────
 *
 * O convite nasceu como imagem para baixar, e o casal descobriu o limite na
 * prática: num PNG o botão "Lista de presentes" é desenho, não botão. No PDF
 * dá para anotar um link, mas o convidado precisa baixar o arquivo, abrir num
 * leitor e clicar — três passos numa conversa de WhatsApp.
 *
 * Aqui é HTML: o casal manda o LINK, o convidado abre e os botões levam
 * mesmo à confirmação e à lista de presentes. O download continua existindo
 * para quem quer imprimir.
 *
 * ── `generateStaticParams` ─────────────────────────────────────────────────
 *
 * Como em `/s/[slug]`: com Cache Components, sem ele o `notFound()` cairia
 * dentro do shell já enviado e devolveria HTTP 200 em vez de 404.
 */

export async function generateStaticParams() {
  const slugs = await listPublishedInviteSlugs();
  if (slugs.length === 0) return [{ slug: "__sem-convites__" }];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const achado = await getConvitePublicado(slug);
  if (!achado) return { title: "Convite" };

  // O primeiro texto do convite costuma ser o nome do casal — é o que faz
  // sentido aparecer na prévia do WhatsApp.
  const primeiroTexto = achado.convite.doc.blocos.find(
    (b) => b.tipo === "texto" && b.texto.trim()
  );
  const nomes =
    primeiroTexto && primeiroTexto.tipo === "texto"
      ? primeiroTexto.texto.trim()
      : "Nosso casamento";

  return {
    title: `${nomes} | Convite`,
    description: "Você está convidado.",
    // Convite não é conteúdo de busca: quem tem o link, tem o convite.
    robots: { index: false, follow: false },
  };
}

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const achado = await getConvitePublicado(slug);
  if (!achado) notFound();

  const { doc } = achado.convite;

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: doc.fundo }}
    >
      {/* A largura acompanha a proporção do convite: um story 9:16 não pode
          nascer com a largura de um retrato e sair do rodapé. */}
      <div
        className="w-full"
        style={{ maxWidth: `min(100%, calc(92svh * ${doc.largura / doc.altura}))` }}
      >
        <ConviteVisual doc={doc} />
      </div>
    </main>
  );
}
