import { config } from "dotenv";
import crypto from "crypto";
import postgres from "postgres";

config({ path: ".env.local" });

// Cria (ou atualiza) um site de demonstração renderizado pelo motor de
// templates — o "Ana & Pedro" que hoje só existe hard-coded dentro do JSX das
// prévias, agora como DADO no banco.
//
// Serve para provar o pipeline da Fase 1 ponta a ponta: pedido -> tokens ->
// molde -> site. Idempotente e isolado: mexe só neste site, nunca no
// casamento real.
//
// Rode com: npm run seed:demo

const SLUG = "ana-e-pedro";

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

  const tema = {
    version: 1,
    palette: {
      outer: "#2f3a2a",
      paper: "#f2efe7",
      ink: "#3d4a36",
      accent: "#b8985f",
    },
    fonts: { display: "cormorant", body: "lora", script: "pinyon" },
  };

  await sql.begin(async (tx) => {
    let [site] = await tx`select * from public.sites where slug = ${SLUG}`;

    if (site) {
      await tx`
        update public.sites
        set template_id = 'classico', theme = ${sql.json(tema)},
            tier = 'para-sempre', status = 'published',
            published_at = coalesce(published_at, now()), updated_at = now()
        where id = ${site.id}
      `;
      console.log(`site ${SLUG} atualizado (${site.id})`);
    } else {
      [site] = await tx`
        insert into public.sites
          (slug, template_id, theme, tier, status, preview_token, published_at)
        values
          (${SLUG}, 'classico', ${sql.json(tema)}, 'para-sempre', 'published',
           ${crypto.randomBytes(24).toString("base64url")}, now())
        returning *
      `;
      console.log(`site ${SLUG} criado (${site.id})`);
    }

    await tx`
      insert into public.site_content
        (site_id, couple_names, partner_a, partner_b, wedding_date, timezone,
         ceremony_venue, ceremony_address, ceremony_map_url,
         reception_venue, reception_address, story, dress_code)
      values
        (${site.id}, 'Ana & Pedro', 'Ana', 'Pedro',
         '2026-09-19T16:00:00-03:00', 'America/Fortaleza',
         'Espaço Jardim das Oliveiras', 'Fortaleza — CE',
         'https://maps.google.com/?q=Fortaleza',
         'Salão Oliveiras', 'Mesmo endereço da cerimônia',
         'Se conheceram num churrasco de amigos em 2019, entre um pagode e uma discussão boba sobre quem fazia o melhor brigadeiro. Sete anos, duas mudanças e um gato adotado depois, decidiram que era hora de oficializar o que todo mundo já sabia.',
         'Traje social completo')
      on conflict (site_id) do update set
        couple_names = excluded.couple_names,
        wedding_date = excluded.wedding_date,
        ceremony_venue = excluded.ceremony_venue,
        story = excluded.story,
        updated_at = now()
    `;

    const secoes = ["cover","countdown","story","details","gallery","rsvp","gifts","guestbook","album","footer"];
    for (const [i, key] of secoes.entries()) {
      await tx`
        insert into public.site_sections (site_id, section_key, position, enabled)
        values (${site.id}, ${key}, ${i}, true)
        on conflict (site_id, section_key) do nothing
      `;
    }
  });

  const [{ n }] = await sql`select count(*)::int as n from public.sites`;
  console.log(`total de sites no banco: ${n}`);
  console.log(`abra: http://localhost:3000/s/${SLUG}`);

  await sql.end();
}

main().catch((err) => {
  console.error("Falhou:", err.message);
  process.exit(1);
});
