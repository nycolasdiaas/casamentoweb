/**
 * Corrige o slug de um site que nasceu de um nome que não era nome.
 *
 * ── Por que isto existe ────────────────────────────────────────────────────
 *
 * Um site em produção nasceu como `https-github-com-accordavaliacao-api-res`,
 * porque alguém colou uma URL no campo dos nomes do casal. O `slugifyCoupleNames`
 * já não deixa isso acontecer de novo, mas o site criado antes da correção
 * continua com o endereço torto.
 *
 * ── As travas, e por que elas estão no WHERE ───────────────────────────────
 *
 * Slug de site publicado é IMUTÁVEL: o endereço já foi para o WhatsApp dos
 * convidados, e trocá-lo quebra o link de gente real. Este script só mexe em
 * site que:
 *
 *   1. está em `preview` (nunca foi ao ar), e
 *   2. não tem NENHUM grupo de RSVP.
 *
 * As duas condições vão dentro do `UPDATE ... WHERE`, não numa leitura antes:
 * entre ler "está em prévia" e escrever, o site pode ter sido publicado. Com a
 * checagem no próprio comando, quem decide é o banco — e o update devolve zero
 * linhas em vez de estragar um endereço distribuído.
 *
 * Uso:
 *   node scripts/corrigir-slug.mjs <slug-atual> <slug-novo>
 *   node scripts/corrigir-slug.mjs --listar
 */

import postgres from "postgres";
import "dotenv/config";
import { isValidSiteSlug } from "../lib/siteSlug.ts";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function listar() {
  const linhas = await sql`
    select s.slug, s.status,
      (select count(*)::int from groups g where g.site_id = s.id) grupos
    from sites s
    where s.slug ~ '^(https?|www)-' or length(s.slug) >= 38
    order by s.created_at`;

  if (!linhas.length) {
    console.log("Nenhum slug suspeito.");
    return;
  }
  console.log("Slugs suspeitos:\n");
  for (const l of linhas) {
    const podeTrocar = l.status === "preview" && l.grupos === 0;
    console.log(
      `  ${l.slug}\n    status=${l.status} grupos=${l.grupos} → ${podeTrocar ? "pode trocar" : "NÃO TOCAR"}`
    );
  }
}

async function trocar(atual, novo) {
  if (!isValidSiteSlug(novo)) {
    console.error(
      `"${novo}" não é um slug válido (3 a 40 caracteres, minúsculas, números e hífen, e não pode ser reservado).`
    );
    process.exitCode = 1;
    return;
  }

  const [ocupado] = await sql`select id from sites where slug = ${novo}`;
  if (ocupado) {
    console.error(`"${novo}" já está em uso por outro site.`);
    process.exitCode = 1;
    return;
  }

  const linhas = await sql`
    update sites set slug = ${novo}, updated_at = now()
    where slug = ${atual}
      and status = 'preview'
      and not exists (select 1 from groups g where g.site_id = sites.id)
    returning id, slug`;

  if (!linhas.length) {
    console.error(
      `Nada foi alterado. O site "${atual}" ou não existe, ou já está publicado, ou já tem convidados — e nesses casos o endereço é imutável.`
    );
    process.exitCode = 1;
    return;
  }
  console.log(`OK: ${atual} → ${linhas[0].slug}`);
}

const [a, b] = process.argv.slice(2);
try {
  if (a === "--listar" || !a) await listar();
  else if (!b) {
    console.error("Uso: node scripts/corrigir-slug.mjs <slug-atual> <slug-novo>");
    process.exitCode = 1;
  } else await trocar(a, b);
} finally {
  await sql.end();
}
