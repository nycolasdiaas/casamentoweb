import {
  pgTable,
  uuid,
  text,
  timestamp,
  smallint,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "pending",
  "confirmed",
  "declined",
]);

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const guests = pgTable(
  "guests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rsvpStatus: rsvpStatusEnum("rsvp_status").notNull().default("pending"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    position: smallint("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_guests_group_id").on(table.groupId)]
);

export const gifts = pgTable("gifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  // null = convidado escolhe o valor ("presente livre")
  priceCents: integer("price_cents"),
  position: smallint("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const giftContributions = pgTable(
  "gift_contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    giftId: uuid("gift_id").references(() => gifts.id, {
      onDelete: "set null",
    }),
    // snapshot para o registro sobreviver à exclusão do presente
    giftName: text("gift_name").notNull(),
    guestName: text("guest_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_gift_contributions_gift_id").on(table.giftId)]
);

export const groupsRelations = relations(groups, ({ many }) => ({
  guests: many(guests),
}));

export const giftsRelations = relations(gifts, ({ many }) => ({
  contributions: many(giftContributions),
}));

export const giftContributionsRelations = relations(
  giftContributions,
  ({ one }) => ({
    gift: one(gifts, {
      fields: [giftContributions.giftId],
      references: [gifts.id],
    }),
  })
);

export const guestsRelations = relations(guests, ({ one }) => ({
  group: one(groups, { fields: [guests.groupId], references: [groups.id] }),
}));
