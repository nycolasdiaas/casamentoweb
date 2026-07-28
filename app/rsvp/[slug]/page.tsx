import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getGroupBySlug } from "@/lib/repositories/groups";
import { submitRsvpAction } from "@/app/actions/rsvp-actions";
import SaveTheDate from "@/components/SaveTheDate";
import RsvpCard from "@/components/RsvpCard";
import TrackView from "@/components/TrackView";
import { LEGACY_SITE_SLUG } from "@/lib/repositories/sites";

/**
 * Confirmação de presença de um grupo.
 *
 * O RSVP é o oposto da lista de presentes: NÃO pode entrar em cache. O
 * convidado confirma e tem que ver a própria resposta na hora, e cada grupo
 * enxerga só os seus nomes. Por isso a busca fica dentro de <Suspense> e
 * chega por streaming, enquanto o Save the Date (igual para todo mundo) já
 * vai no shell estático.
 *
 * Ver docs/sdd-geracao-automatica.md §3.2.
 */
export default async function RsvpPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="flex-1 flex flex-col">
      <TrackView siteSlug={LEGACY_SITE_SLUG} kind="rsvp_open" />
      <SaveTheDate />
      <Suspense fallback={<RsvpSkeleton />}>
        <RsvpSection params={params} />
      </Suspense>
    </main>
  );
}

async function RsvpSection({
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
    <RsvpCard
      groupLabel={group.label ?? undefined}
      guests={group.guests}
      onRespond={submitRsvpAction.bind(null, slug)}
    />
  );
}

function RsvpSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12">
      <div className="h-5 w-48 rounded bg-(--color-olive)/10 animate-pulse" />
      <div className="h-12 w-full max-w-sm rounded bg-(--color-olive)/10 animate-pulse" />
      <div className="h-12 w-full max-w-sm rounded bg-(--color-olive)/10 animate-pulse" />
    </div>
  );
}
