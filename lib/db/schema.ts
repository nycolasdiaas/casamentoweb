import {
  pgTable,
  uuid,
  text,
  timestamp,
  smallint,
  integer,
  bigserial,
  boolean,
  date,
  jsonb,
  pgEnum,
  index,
  primaryKey,
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

// Tokens de redefinição de senha (casal). Guardamos só o HASH do token —
// o valor em claro vai no link do e-mail e nunca é persistido. Uso único
// (usedAt) e com expiração (expiresAt).
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_password_reset_user_id").on(table.userId)]
);

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

// ─────────────────────────────────────────────────────────────────────────
// Plataforma multi-site. Um `site` é o tenant: tudo que pertence ao
// casamento de um casal pendura aqui. Ver docs/sdd-geracao-automatica.md.
// ─────────────────────────────────────────────────────────────────────────

export const siteStatusEnum = pgEnum("site_status", [
  "provisioning", // criado, ainda montando
  "preview", // prévia liberada pro casal
  "published", // no ar
  "archived", // fora do ar por decisão manual
]);

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  // orderId/userId são nullable de propósito: o casamento que já estava no
  // ar nasceu antes do fluxo de pedidos e não tem pedido associado. Também
  // permite site criado direto pelo admin.
  orderId: uuid("order_id")
    .unique()
    .references(() => orders.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  slug: text("slug").notNull().unique(),
  // null = site com código próprio (o legado), não gerado por template
  templateId: text("template_id"),
  // ThemeSpec validado; null enquanto o site não usa o renderer por tokens
  theme: jsonb("theme"),
  tier: packageTierEnum("tier").notNull(),
  status: siteStatusEnum("status").notNull().default("provisioning"),
  previewToken: text("preview_token").notNull().unique(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  // última visita registrada pelo beacon (§6.1 do SDD)
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Conteúdo editável do site, 1:1 com `sites`. Separado da tabela do tenant
// para o casal poder editar texto sem tocar em nada estrutural.
export const siteContent = pgTable("site_content", {
  siteId: uuid("site_id")
    .primaryKey()
    .references(() => sites.id, { onDelete: "cascade" }),
  coupleNames: text("couple_names"),
  partnerA: text("partner_a"),
  partnerB: text("partner_b"),
  weddingDate: timestamp("wedding_date", { withTimezone: true }),
  timezone: text("timezone").notNull().default("America/Fortaleza"),
  ceremonyVenue: text("ceremony_venue"),
  ceremonyAddress: text("ceremony_address"),
  ceremonyMapUrl: text("ceremony_map_url"),
  receptionVenue: text("reception_venue"),
  receptionAddress: text("reception_address"),
  story: text("story"),
  dressCode: text("dress_code"),
  giftMessage: text("gift_message"),
  rsvpDeadline: date("rsvp_deadline"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Quais seções o site mostra, em que ordem. O pacote define o padrão; o
// casal pode desligar o que não quiser.
export const siteSections = pgTable(
  "site_sections",
  {
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    sectionKey: text("section_key").notNull(),
    position: smallint("position").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    config: jsonb("config"),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.sectionKey] })]
);

// Fotos do casal, escopadas por SITE — não por pedido.
//
// Escolha deliberada de não reaproveitar `order_photos` (que existe, vazia, de
// um push antigo): quem consome a foto é o renderer, que só conhece `siteId`;
// o casamento legado tem site sem pedido; e o casal troca foto depois de
// publicado, quando o pedido já não é o objeto relevante.
//
// `slot` diz onde a foto entra no molde ("cover", "story", "gallery") — é o
// mesmo vocabulário das seções, mas frouxo de propósito (text, não enum):
// molde novo pode inventar slot sem migração.
//
// NOT NULL aqui é seguro porque a tabela nasce vazia — a regra de migração
// aditiva do AGENTS.md protege tabelas que já têm linhas de cliente.
export const sitePhotos = pgTable(
  "site_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    slot: text("slot").notNull(),
    // caminho no bucket privado; unique impede duas linhas para o mesmo objeto
    storagePath: text("storage_path").notNull().unique(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    // dimensões finais (pós-compressão no cliente): sem elas o next/image não
    // reserva espaço e a página pula quando a foto carrega
    width: integer("width"),
    height: integer("height"),
    // miniatura embutida em base64 para o placeholder de blur
    blurDataUrl: text("blur_data_url"),
    alt: text("alt"),
    originalName: text("original_name"),
    position: smallint("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_site_photos_site_slot").on(
      table.siteId,
      table.slot,
      table.position
    ),
  ]
);

// ─── Métricas de acesso ──────────────────────────────────────────────────
// Evento bruto, append-only. NUNCA guarda IP: visitorHash é HMAC de
// IP+user-agent com sal que gira todo dia — dá visitante único por dia sem
// reter dado pessoal do convidado, que é terceiro (LGPD).
export const siteEvents = pgTable(
  "site_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    // view | rsvp_open | rsvp_submit | gift_open | pix_copy | gift_confirm
    kind: text("kind").notNull(),
    path: text("path"),
    section: text("section"),
    referrerHost: text("referrer_host"), // só o host, nunca a URL inteira
    device: text("device"), // mobile | tablet | desktop
    country: text("country"),
    region: text("region"),
    visitorHash: text("visitor_hash"),
    isReturning: boolean("is_returning"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_site_events_site_created").on(table.siteId, table.createdAt),
    index("idx_site_events_kind").on(table.siteId, table.kind, table.createdAt),
  ]
);

// Agregado diário (roll-up por pg_cron). Fica para sempre — é o que responde
// às perguntas de produto sem varrer a tabela bruta.
export const siteDailyStats = pgTable(
  "site_daily_stats",
  {
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    views: integer("views").notNull().default(0),
    uniqueVisitors: integer("unique_visitors").notNull().default(0),
    rsvpOpens: integer("rsvp_opens").notNull().default(0),
    rsvpSubmits: integer("rsvp_submits").notNull().default(0),
    giftOpens: integer("gift_opens").notNull().default(0),
    pixCopies: integer("pix_copies").notNull().default(0),
    giftConfirms: integer("gift_confirms").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.day] })]
);

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // O slug segue ÚNICO GLOBALMENTE de propósito (não por site): é o que faz
    // a rota legada /rsvp/<slug> continuar funcionando sem ambiguidade para
    // os links já distribuídos aos convidados. Ver §5.2 e §6.2 do SDD.
    slug: text("slug").notNull().unique(),
    label: text("label"),
    // nullable nesta fase: preenchido pelo backfill, vira NOT NULL só numa
    // migração posterior, depois de verificado em produção.
    siteId: uuid("site_id").references(() => sites.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_groups_site_id").on(table.siteId)]
);

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

export const gifts = pgTable(
  "gifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: text("category").notNull(),
    name: text("name").notNull(),
    // null = convidado escolhe o valor ("presente livre")
    priceCents: integer("price_cents"),
    position: smallint("position").notNull().default(0),
    // nullable nesta fase — mesma razão de groups.siteId acima.
    siteId: uuid("site_id").references(() => sites.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_gifts_site_id").on(table.siteId)]
);

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

// ─────────────────────────────────────────────────────────────────────────
// Tabelas que JÁ EXISTEM em produção mas estavam fora do schema.ts (drift de
// um `drizzle-kit push` antigo). Declaradas aqui só para o Drizzle passar a
// conhecê-las — a migração que as introduz usa CREATE TABLE IF NOT EXISTS e
// é no-op no banco atual. Não apagar: ver docs/sdd-geracao-automatica.md §13.1.
// ─────────────────────────────────────────────────────────────────────────

// Snapshot de convidados a cada 6h, escrito pela função Postgres
// public.snapshot_guests_backup() agendada no pg_cron. Retém 30 dias.
export const groupsBackup = pgTable(
  "groups_backup",
  {
    backupAt: timestamp("backup_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    id: uuid("id").notNull(),
    slug: text("slug").notNull(),
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("idx_groups_backup_at").on(table.backupAt)]
);

export const guestsBackup = pgTable(
  "guests_backup",
  {
    backupAt: timestamp("backup_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    id: uuid("id").notNull(),
    groupId: uuid("group_id").notNull(),
    name: text("name").notNull(),
    // text, não o enum — o snapshot faz cast para sobreviver a mudança de enum
    rsvpStatus: text("rsvp_status").notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    position: smallint("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("idx_guests_backup_at").on(table.backupAt)]
);

// Criadas por um push antigo e nunca usadas por código. Mantidas vazias.
export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_email_verification_user_id").on(table.userId)]
);

export const orderPhotos = pgTable(
  "order_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull().unique(),
    originalName: text("original_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    position: smallint("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_order_photos_order_id").on(table.orderId)]
);

export const groupsRelations = relations(groups, ({ one, many }) => ({
  guests: many(guests),
  site: one(sites, { fields: [groups.siteId], references: [sites.id] }),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  order: one(orders, { fields: [sites.orderId], references: [orders.id] }),
  user: one(users, { fields: [sites.userId], references: [users.id] }),
  content: one(siteContent, {
    fields: [sites.id],
    references: [siteContent.siteId],
  }),
  sections: many(siteSections),
  groups: many(groups),
  gifts: many(gifts),
  photos: many(sitePhotos),
}));

export const sitePhotosRelations = relations(sitePhotos, ({ one }) => ({
  site: one(sites, { fields: [sitePhotos.siteId], references: [sites.id] }),
}));

export const siteContentRelations = relations(siteContent, ({ one }) => ({
  site: one(sites, { fields: [siteContent.siteId], references: [sites.id] }),
}));

export const siteSectionsRelations = relations(siteSections, ({ one }) => ({
  site: one(sites, { fields: [siteSections.siteId], references: [sites.id] }),
}));

export const giftsRelations = relations(gifts, ({ one, many }) => ({
  contributions: many(giftContributions),
  site: one(sites, { fields: [gifts.siteId], references: [sites.id] }),
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
