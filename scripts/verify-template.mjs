// Verifica que um molde portado renderiza de verdade, contra o app rodando.
//
// Cria um site descartável por molde, confere e apaga — inclusive se algo
// falhar no meio (a limpeza está no finally). Precisa do servidor de pé:
//   npm run build && npm run start
//   npm run verify:template editorial toscana
//
// O que ele pega e o teste automatizado não: que o molde renderiza com dado
// de verdade vindo do banco, e que o desenho vem de TOKEN — o site é montado
// com um tema fora da paleta padrão do molde, e a cor do casal precisa
// aparecer só no wrapper. Hex na marcação de uma seção aparece aqui.
import { config } from "dotenv";
import postgres from "postgres";
import crypto from "node:crypto";

config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

const moldes = process.argv.slice(2);
if (moldes.length === 0) throw new Error("passe ao menos um id de molde");

const SECOES = [
  "cover",
  "countdown",
  "story",
  "details",
  "gallery",
  "rsvp",
  "gifts",
  "album",
  "footer",
];

const criados = [];

try {
  for (const molde of moldes) {
    const marca = crypto.randomBytes(4).toString("hex");
    const slug = `molde-${molde}-${marca}`;
    const token = crypto.randomBytes(16).toString("base64url");

    // Tema propositalmente FORA da paleta padrão do molde: é o que prova que
    // o desenho vem de token e não de hex escrito na seção.
    const temaDoCasal = {
      version: 1,
      palette: {
        outer: "#123456",
        paper: "#fdfaf3",
        ink: "#2b1a4d",
        accent: "#c65a2e",
      },
      fonts: { display: "cormorant", body: "spectral", script: "italiana" },
    };

    const [site] = await sql`
      insert into sites (slug, template_id, theme, tier, status, preview_token)
      values (${slug}, ${molde}, ${sql.json(temaDoCasal)}, 'para-sempre', 'preview', ${token})
      returning id
    `;
    criados.push(site.id);

    await sql`
      insert into site_content (site_id, couple_names, partner_a, partner_b,
        wedding_date, ceremony_venue, ceremony_address, ceremony_map_url,
        reception_venue, reception_address, story, dress_code, gift_message)
      values (${site.id}, 'Marina & Rafael', 'Marina', 'Rafael',
        '2027-05-22T16:00:00-03:00',
        'Capela Santa Rita', 'Rua das Oliveiras, 120 — Fortaleza',
        'https://maps.google.com/?q=Capela+Santa+Rita',
        'Casa de Festas Alvorada', 'Av. Beira-Mar, 900 — Fortaleza',
        'Marina fotografava casamentos. Rafael tocava nas festas. Levaram quatro anos para perceber que já estavam juntos em todas as fotos.',
        'Traje social completo', 'Cada cota vira uma lembrança da nossa lua de mel.')
    `;

    await sql`
      insert into site_sections (site_id, section_key, position, enabled)
      select ${site.id}, s.key, s.pos, true
      from unnest(${SECOES}::text[]) with ordinality as s(key, pos)
    `;

    const r = await fetch(`${BASE}/preview/${token}`);
    const html = await r.text();

    const confere = (rotulo, condicao) =>
      `${condicao ? "ok " : "FALHOU"} ${rotulo}`;

    console.log(`\n${molde}  (${r.status})`);
    console.log(`  ${confere("nomes do casal", html.includes("Marina"))}`);
    console.log(`  ${confere("história do banco", html.includes("fotografava casamentos"))}`);
    console.log(`  ${confere("local da cerimônia", html.includes("Capela Santa Rita"))}`);
    console.log(`  ${confere("local da festa", html.includes("Alvorada"))}`);
    console.log(`  ${confere("traje", html.includes("Traje social"))}`);
    console.log(`  ${confere("data formatada", html.includes("22 de maio de 2027"))}`);
    console.log(`  ${confere("sem 'em preparação'", !html.includes("está sendo preparado"))}`);
    // Só o wrapper escreve a paleta; as seções falam var(--ink), var(--accent).
    // São 2 ocorrências esperadas por cor — uma no atributo style do HTML e
    // outra no payload RSC, que repete a mesma prop. Mais que isso é hex
    // escrito na marcação de alguma seção.
    const ocorrencias = (hex) => (html.match(new RegExp(hex, "gi")) ?? []).length;
    console.log(`  ${confere("cor do casal aplicada", html.includes("#c65a2e"))}`);
    console.log(
      `  ${confere(
        "paleta só no wrapper",
        ocorrencias("#2b1a4d") === 2 && ocorrencias("#c65a2e") === 2
      )}  ink=${ocorrencias("#2b1a4d")}x accent=${ocorrencias("#c65a2e")}x`
    );
    const fontesNoHtml = (html.match(/--f-[a-z-]+/g) ?? []).filter(
      (v, i, a) => a.indexOf(v) === i
    );
    console.log(`  fontes carregadas: ${fontesNoHtml.join(", ") || "(nenhuma)"}`);
    console.log(`  tamanho do HTML: ${(html.length / 1024).toFixed(1)} KB`);
  }
} finally {
  for (const id of criados) {
    await sql`delete from sites where id = ${id}`;
  }
  const [{ n }] = await sql`select count(*)::int as n from sites`;
  const [{ c }] = await sql`select count(*)::int as c from site_content`;
  console.log(`\nlimpeza: ${n} sites, ${c} conteúdos (esperado: 2 e 2)`);
  await sql.end();
}
