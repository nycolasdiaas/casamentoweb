import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { siteInvites } from "@/lib/db/schema";
import {
  MAX_CONVITES,
  parseInviteDoc,
  type InviteDoc,
} from "@/lib/site/inviteDoc";

export type Convite = {
  id: string;
  name: string;
  doc: InviteDoc;
  updatedAt: Date;
};

export async function listInvites(siteId: string): Promise<Convite[]> {
  const linhas = await db
    .select()
    .from(siteInvites)
    .where(eq(siteInvites.siteId, siteId))
    .orderBy(asc(siteInvites.createdAt));

  return linhas.map((l) => ({
    id: l.id,
    name: l.name,
    doc: parseInviteDoc(l.doc),
    updatedAt: l.updatedAt,
  }));
}

export async function getInvite(
  siteId: string,
  inviteId: string
): Promise<Convite | null> {
  const [l] = await db
    .select()
    .from(siteInvites)
    .where(and(eq(siteInvites.siteId, siteId), eq(siteInvites.id, inviteId)));

  if (!l) return null;
  return {
    id: l.id,
    name: l.name,
    doc: parseInviteDoc(l.doc),
    updatedAt: l.updatedAt,
  };
}

/**
 * Cria um convite, respeitando o teto de 5 por site.
 *
 * A contagem vai DENTRO do insert, como `where not exists (…)`, e não numa
 * leitura antes: entre ler "tem 4" e gravar o quinto, um segundo clique cria
 * o sexto. Com a checagem no próprio comando, o banco decide, e o insert
 * simplesmente não acontece.
 */
export async function createInvite(
  siteId: string,
  name: string,
  doc: InviteDoc
): Promise<{ ok: true; id: string } | { ok: false; motivo: "limite" }> {
  // `insert ... select ... where` num comando só: o SELECT não devolve linha
  // quando o site já tem 5, e aí o INSERT não insere nada.
  const linhas = await db.execute<{ id: string }>(sql`
    insert into ${siteInvites} (site_id, name, doc)
    select ${siteId}::uuid, ${name}, ${JSON.stringify(doc)}::jsonb
    where (
      select count(*) from ${siteInvites}
      where ${siteInvites.siteId} = ${siteId}::uuid
    ) < ${MAX_CONVITES}
    returning id
  `);

  const criado = (linhas as unknown as { id: string }[])[0];
  return criado ? { ok: true, id: criado.id } : { ok: false, motivo: "limite" };
}

export async function saveInvite(
  siteId: string,
  inviteId: string,
  campos: { name?: string; doc?: InviteDoc }
): Promise<boolean> {
  const linhas = await db
    .update(siteInvites)
    .set({
      ...(campos.name !== undefined ? { name: campos.name } : {}),
      ...(campos.doc !== undefined ? { doc: campos.doc } : {}),
      updatedAt: new Date(),
    })
    // O `siteId` no WHERE é o que impede um id de convite alheio ser gravado
    // com o site de quem pediu.
    .where(and(eq(siteInvites.siteId, siteId), eq(siteInvites.id, inviteId)))
    .returning({ id: siteInvites.id });

  return linhas.length > 0;
}

export async function deleteInvite(
  siteId: string,
  inviteId: string
): Promise<boolean> {
  const linhas = await db
    .delete(siteInvites)
    .where(and(eq(siteInvites.siteId, siteId), eq(siteInvites.id, inviteId)))
    .returning({ id: siteInvites.id });

  return linhas.length > 0;
}
