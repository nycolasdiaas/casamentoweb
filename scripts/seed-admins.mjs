import { config } from "dotenv";
import crypto from "crypto";
import postgres from "postgres";

config({ path: ".env.local" });

// Cria as contas de admin da plataforma (uma por pessoa). Idempotente: se o
// e-mail já existir, pula (nunca sobrescreve senha de conta existente).
// Rode com: node scripts/seed-admins.mjs
const ADMINS = [
  { name: "Francisco Anderson", email: "francisco@enlace.com" },
  { name: "Nycolas", email: "nycolas@enlace.com" },
];

const KEY_LENGTH = 64;

// Mesmo formato de lib/auth/password.ts ("saltHex:hashHex"), reimplementado
// aqui porque o script roda fora do TypeScript/Next.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

function generatePassword() {
  return crypto.randomBytes(15).toString("base64url"); // ~20 chars, ~90 bits
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(databaseUrl, { prepare: false });
  const created = [];

  for (const { name, email } of ADMINS) {
    const [existing] = await sql`
      select id from public.admins where email = ${email}
    `;
    if (existing) {
      console.log(`${email} já existe — pulado (senha não foi alterada).`);
      continue;
    }

    const password = generatePassword();
    const passwordHash = hashPassword(password);

    await sql`
      insert into public.admins (name, email, password_hash)
      values (${name}, ${email}, ${passwordHash})
    `;
    created.push({ name, email, password });
  }

  await sql.end();

  if (created.length === 0) {
    console.log("Nenhuma conta nova criada.");
    return;
  }

  console.log("\n=== Credenciais (anote agora — a senha não fica salva em nenhum lugar) ===");
  for (const { name, email, password } of created) {
    console.log(`\n${name}\n  login: /admin/login\n  e-mail: ${email}\n  senha: ${password}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
