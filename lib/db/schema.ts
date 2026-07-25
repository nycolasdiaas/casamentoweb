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

export const packageTierEnum = pgEnum("package_tier", [
  "convite",
  "site",
  "para-sempre",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "draft", // rascunho, ainda editando
  "submitted", // enviado pela plataforma, aguardando a gente começar
  "in_production", // em produção
  "preview_ready", // prévia pronta pro casal ver
  "paid", // pagamento confirmado
  "published", // site no ar, pedido finalizado
]);

// Contas de administrador da plataforma (uma por pessoa — substitui a
// senha única compartilhada). Mesmo hash scrypt usado pelos casais.
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Rastro de auditoria: cada campo alterado por um admin num pedido vira uma
// linha aqui. adminName é um snapshot (sobrevive se a conta for removida).
export const orderAuditLog = pgTable(
  "order_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    adminId: uuid("admin_id").references(() => admins.id, {
      onDelete: "set null",
    }),
    adminName: text("admin_name").notNull(),
    field: text("field").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_order_audit_log_order_id").on(table.orderId)]
);

// Rate limiting simples baseado no banco (funções serverless não
// compartilham memória entre instâncias). Uma linha por tentativa de
// login/cadastro; a janela é filtrada por tempo na consulta, não aqui.
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(), // ex: "admin:203.0.113.5"
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_login_attempts_key_created").on(table.key, table.createdAt),
  ]
);

// Contas dos casais clientes da plataforma (não confundir com o admin da
// plataforma, tabela `admins` acima).
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // formato "salt:hash" (scrypt), ver lib/auth/password.ts
  passwordHash: text("password_hash").notNull(),
  whatsapp: text("whatsapp"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Um pedido por casal: pacote + template escolhidos e o material do
// briefing. "draft" enquanto edita; "submitted" quando envia pra produção.
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    packageTier: packageTierEnum("package_tier").notNull(),
    // null = casal preferiu montar do zero com as cores/fontes próprias
    templateStyle: text("template_style"),
    // personalização visual escolhida pelo casal (hex/estilo livres)
    primaryColor: text("primary_color"),
    secondaryColor: text("secondary_color"),
    fontStyle: text("font_style"),
    styleNotes: text("style_notes"),
    coupleNames: text("couple_names"),
    weddingDate: text("wedding_date"),
    photosLink: text("photos_link"),
    notes: text("notes"),
    status: orderStatusEnum("status").notNull().default("draft"),
    // Campos preenchidos pelo admin durante a produção do site.
    previewUrl: text("preview_url"), // link da prévia pro casal ver
    siteUrl: text("site_url"), // link do site final no ar
    priceCents: integer("price_cents"), // valor a cobrar (null = usa o do pacote)
    adminMessage: text("admin_message"), // recado do admin exibido pro casal
    // Cobrança AbacatePay.
    paymentId: text("payment_id"),
    paymentUrl: text("payment_url"),
    paymentStatus: text("payment_status"), // PENDING/PAID/... (espelho do AbacatePay)
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_orders_user_id").on(table.userId)]
);

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

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  auditLog: many(orderAuditLog),
}));

export const adminsRelations = relations(admins, ({ many }) => ({
  auditEntries: many(orderAuditLog),
}));

export const orderAuditLogRelations = relations(orderAuditLog, ({ one }) => ({
  order: one(orders, {
    fields: [orderAuditLog.orderId],
    references: [orders.id],
  }),
  admin: one(admins, {
    fields: [orderAuditLog.adminId],
    references: [admins.id],
  }),
}));
