// Move o Pix do casal legado da CONSTANTE para o BANCO.
//
// Até a migração 0010, `lib/pix.ts` guardava uma chave Pix chumbada no código
// e todo molde a lia direto — então qualquer casal com lista de presentes
// ligada mostrava ao convidado a chave desta pessoa aqui. O defeito foi
// corrigido tirando a constante; este script garante que o casal a quem a
// chave REALMENTE pertence não fique sem Pix no processo.
//
// A chave abaixo não é segredo: ela já estava num arquivo versionado e já era
// exibida publicamente no site. Está aqui só para ser transplantada uma vez.
//
// Idempotente: não sobrescreve Pix que já exista na linha. Rodar duas vezes
// não faz nada na segunda.
//
//   node scripts/backfill-legacy-pix.mjs           (mostra o que faria)
//   node scripts/backfill-legacy-pix.mjs --aplicar (grava)

import "dotenv/config";
import postgres from "postgres";

const LEGACY_SLUG = "isabelle-e-nycolas";

const PIX_LEGADO = {
  chave: "56b27f87-db13-4c38-9b1e-e419b1247287",
  tipo: "aleatoria",
  // O campo 59 do BR Code aceita 25 caracteres; o nome completo tem 28. O
  // valor gravado aqui é o nome COMPLETO — quem corta é o buildBrCode, na
  // hora de montar o payload, e ele corta na última palavra inteira.
  recebedor: "Francisco Nycolas Sales Dias",
  cidade: "Sao Paulo",
  instituicao: "Mercado Pago",
};

const aplicar = process.argv.includes("--aplicar");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL ausente. Rode com o .env.local carregado.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

try {
  const [site] = await sql`
    select id, slug from public.sites where slug = ${LEGACY_SLUG}
  `;

  if (!site) {
    console.error(`Site "${LEGACY_SLUG}" não encontrado. Nada a fazer.`);
    process.exit(1);
  }

  const [conteudo] = await sql`
    select site_id, pix_key, couple_names
      from public.site_content
     where site_id = ${site.id}
  `;

  if (!conteudo) {
    console.error(
      `site_content do site ${site.id} não existe. Rode o backfill:legacy antes.`
    );
    process.exit(1);
  }

  if (conteudo.pix_key) {
    console.log(
      `Já tem Pix cadastrado (${conteudo.pix_key}). Nada a fazer — este script não sobrescreve.`
    );
    process.exit(0);
  }

  console.log(`Site legado : ${site.slug} (${site.id})`);
  console.log(`Casal       : ${conteudo.couple_names}`);
  console.log(`Chave       : ${PIX_LEGADO.chave} (${PIX_LEGADO.tipo})`);
  console.log(`Recebedor   : ${PIX_LEGADO.recebedor}`);
  console.log(`Cidade      : ${PIX_LEGADO.cidade}`);
  console.log(`Instituição : ${PIX_LEGADO.instituicao}`);

  if (!aplicar) {
    console.log("\n(simulação — rode com --aplicar para gravar)");
    process.exit(0);
  }

  // UPDATE apenas em colunas criadas pela 0010, e só quando estão vazias.
  // Nenhuma coluna preexistente é tocada — regra do §13.1 do SDD.
  const alterados = await sql`
    update public.site_content
       set pix_key         = ${PIX_LEGADO.chave},
           pix_key_type    = ${PIX_LEGADO.tipo},
           pix_recipient   = ${PIX_LEGADO.recebedor},
           pix_city        = ${PIX_LEGADO.cidade},
           pix_institution = ${PIX_LEGADO.instituicao},
           updated_at      = now()
     where site_id = ${site.id}
       and pix_key is null
    returning site_id
  `;

  console.log(`\n${alterados.length} linha(s) atualizada(s).`);
} finally {
  await sql.end();
}
