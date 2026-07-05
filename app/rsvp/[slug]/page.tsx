import { notFound } from "next/navigation";
import { getGroupBySlug } from "@/lib/repositories/groups";
import { submitRsvpAction } from "@/app/actions/rsvp-actions";
import SaveTheDate from "@/components/SaveTheDate";
import RsvpCard from "@/components/RsvpCard";

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
      <SaveTheDate />
      <RsvpCard
        groupLabel={group.label ?? undefined}
        guests={group.guests}
        onRespond={submitRsvpAction}
      />
    </main>
  );
}
