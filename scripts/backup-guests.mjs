import { config } from "dotenv";
import postgres from "postgres";
import { mkdir, writeFile, readdir, unlink } from "fs/promises";
import path from "path";

config({ path: ".env.local" });

const BACKUP_DIR = path.resolve(process.cwd(), "backups");
const MAX_BACKUPS = 30;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(databaseUrl, { prepare: false });

  const groups = await sql`select * from public.groups order by created_at`;
  const guests = await sql`select * from public.guests order by created_at`;

  await sql.end();

  await mkdir(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

  await writeFile(
    filePath,
    JSON.stringify({ exportedAt: new Date().toISOString(), groups, guests }, null, 2)
  );

  console.log(`Backup salvo em ${filePath} (${groups.length} grupos, ${guests.length} convidados)`);

  await pruneOldBackups();
}

async function pruneOldBackups() {
  const files = (await readdir(BACKUP_DIR))
    .filter((f) => f.startsWith("backup-") && f.endsWith(".json"))
    .sort();

  const excess = files.length - MAX_BACKUPS;
  if (excess <= 0) return;

  for (const file of files.slice(0, excess)) {
    await unlink(path.join(BACKUP_DIR, file));
  }
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
