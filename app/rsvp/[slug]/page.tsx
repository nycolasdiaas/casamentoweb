import { notFound } from "next/navigation";
import { getGroupBySlug, listGroupSlugs } from "@/lib/repositories/groups";
import { submitRsvpAction } from "@/app/actions/rsvp-actions";
import SaveTheDate from "@/components/SaveTheDate";
import RsvpCard from "@/components/RsvpCard";
import TrackView from "@/components/TrackView";
import { LEGACY_SITE_SLUG } from "@/lib/repositories/sites";

/**
 * Declara os slugs conhecidos para o Cache Components validar a rota.
 *
 * Sem isto, ler `params` fora de <Suspense> é erro de rota; e com o lookup
 * DENTRO de <Suspense> o shell já teria sido enviado quando o notFound()
 * dispara — um link errado devolveria HTTP 200. Slugs criados depois do build
 * continuam funcionando (dynamicParams é true por padrão).
 */
export async function generateStaticParams() {
  const slugs = await listGroupSlugs();
  // O Cache Components exige ao menos um param; um placeholder mantém a rota
  // válida num banco ainda sem grupos (ele mesmo cai no notFound()).
  if (slugs.length === 0) return [{ slug: "__sem-grupos__" }];
  return slugs.map((slug) => ({ slug }));
}

export default async function RsvpPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  return (
    <main className="flex-1 flex flex-col">
      <TrackView siteSlug={LEGACY_SITE_SLUG} kind="rsvp_open" />
      <SaveTheDate />
      <RsvpCard
        groupLabel={group.label ?? undefined}
        guests={group.guests}
        onRespond={submitRsvpAction.bind(null, slug)}
      />
    </main>
  );
}
