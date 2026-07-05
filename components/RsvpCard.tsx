"use client";

import RsvpGuestRow, { type RsvpStatus } from "./RsvpGuestRow";

export type RsvpCardGuest = {
  id: string;
  name: string;
  rsvpStatus: RsvpStatus;
};

type RsvpCardProps = {
  groupLabel?: string;
  guests: RsvpCardGuest[];
  onRespond: (
    guestId: string,
    status: "confirmed" | "declined"
  ) => Promise<unknown>;
};

export default function RsvpCard({ groupLabel, guests, onRespond }: RsvpCardProps) {
  return (
    <section className="bg-(--color-blush) px-6 py-12 flex justify-center">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-8">
        {groupLabel && (
          <p className="font-serif text-lg text-(--color-olive)">
            {groupLabel}
          </p>
        )}

        <p className="font-serif text-base text-(--color-olive)">
          {guests.length > 1
            ? "Vocês confirmam presença?"
            : "Você confirma sua presença?"}
        </p>

        {guests.map((guest) => (
          <RsvpGuestRow
            key={guest.id}
            guestId={guest.id}
            name={guest.name}
            status={guest.rsvpStatus}
            onRespond={onRespond}
          />
        ))}
      </div>
    </section>
  );
}
