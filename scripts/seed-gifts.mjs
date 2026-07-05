import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

// Valores em centavos. Rode com: node scripts/seed-gifts.mjs
// Só insere se a tabela estiver vazia, para não duplicar.
const GIFTS = [
  // 🏝️ Lua de Mel
  ["Lua de Mel", "Caipirinha à beira-mar (o casal agradece de óculos escuros)", 5000],
  ["Lua de Mel", "Jantar romântico sem olhar o preço do cardápio", 20000],
  ["Lua de Mel", "Upgrade pro quarto com vista (em vez da vista pro estacionamento)", 35000],
  ["Lua de Mel", "Uma diária no paraíso", 50000],

  // 🏠 Montando o Ninho
  ["Montando o Ninho", "Cota da air fryer (o verdadeiro amor da casa)", 8000],
  ["Montando o Ninho", "Sofá bom pra maratonar série abraçadinhos", 15000],
  ["Montando o Ninho", "Panela que não gruda (igual o casal)", 10000],
  ["Montando o Ninho", "Cota da geladeira que faz gelo sozinha", 30000],

  // 😂 Kit Sobrevivência do Casamento
  ["Kit Sobrevivência do Casamento", "Taxa \"noivo não fugir no altar\"", 7000],
  ["Kit Sobrevivência do Casamento", "Suborno pro celebrante não contar as fofocas", 9000],
  ["Kit Sobrevivência do Casamento", "Primeira DR paga (terapia de casal preventiva)", 12000],
  ["Kit Sobrevivência do Casamento", "Cota \"esqueci a data do aniversário de casamento\"", 6000],
  ["Kit Sobrevivência do Casamento", "Seguro contra sogra (brincadeira... ou não)", 11000],

  // 🍕 Vida Gastronômica a Dois
  ["Vida Gastronômica a Dois", "Rodízio de pizza pós-lua de mel", 13000],
  ["Vida Gastronômica a Dois", "Churrasco de inauguração da casa nova (você tá convidado*)", 25000],
  ["Vida Gastronômica a Dois", "Vinho pra comemorar o primeiro mês de casados", 9000],
  ["Vida Gastronômica a Dois", "iFood da preguiça de domingo", 5000],

  // 👑 Presentes de Padrinho
  ["Presentes de Padrinho", "Cota \"melhor padrinho/madrinha do mundo\"", 50000],
  ["Presentes de Padrinho", "Patrocínio master da felicidade do casal", 80000],
  ["Presentes de Padrinho", "Presente lendário: nome citado no primeiro filho (negociável)", 150000],

  // 🎁 Do Seu Jeito
  ["Do Seu Jeito", "Presente livre — você decide o valor", null],
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(databaseUrl, { prepare: false });

  const [{ count }] = await sql`select count(*)::int as count from public.gifts`;
  if (count > 0) {
    console.log(`gifts já tem ${count} registros; nada a fazer.`);
    await sql.end();
    return;
  }

  for (const [index, [category, name, priceCents]] of GIFTS.entries()) {
    await sql`
      insert into public.gifts (category, name, price_cents, position)
      values (${category}, ${name}, ${priceCents}, ${index})
    `;
  }

  console.log(`${GIFTS.length} presentes criados.`);
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
