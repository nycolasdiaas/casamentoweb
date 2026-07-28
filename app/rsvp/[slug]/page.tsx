import { notFound } from "next/navigation";
import { getGroupBySlug } from "@/lib/repositories/groups";
import { submitRsvpAction } from "@/app/actions/rsvp-actions";
import SaveTheDate from "@/components/SaveTheDate";
import RsvpCard from "@/components/RsvpCard";
import TrackView from "@/components/TrackView";
import { LEGACY_SITE_SLUG } from "@/lib/repositories/sites";

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
