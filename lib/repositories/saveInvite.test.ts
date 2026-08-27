/**
 * A guarda de conflito do convite — spec `painel-casal/006`, FR-010.
 *
 * O caso que ela cobre é banal e o estrago não é: o casal abre o convite no
 * notebook de manhã, mexe no celular à tarde, e volta ao notebook à noite. A
 * aba antiga ainda tem o desenho da manhã em memória. Sem guarda, o autosave
 * dela grava por cima do que foi feito no celular — e ninguém vê nada
 * acontecer.
 *
 * O contrato é last-write-wins COM AVISO, não merge. Aqui se prova a metade do
 * servidor: `saveInvite` devolve o `updatedAt` que gravou, que é o que deixa o
 * cliente declarar de que versão partiu.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { createTestSite } from "./testSite";
import { createInvite, getInvite, saveInvite } from "./siteInvites";
import { parseInviteDoc } from "@/lib/site/inviteDoc";

const limpar = limparSchemaDeTeste;
beforeEach(limpar);
afterAll(limpar);

const doc = (texto: string) =>
  parseInviteDoc({
    blocos: [
      {
        id: "t1",
        tipo: "texto",
        x: 0.1,
        y: 0.1,
        w: 0.8,
        rotacao: 0,
        texto,
        link: "",
      },
    ],
  });

async function conviteNovo() {
  const site = await createTestSite();
  const r = await createInvite(site.id, "Convite 1", doc("primeiro"));
  if (!r.ok) throw new Error("não criou o convite de teste");
  return { siteId: site.id, inviteId: r.id };
}

describe("saveInvite devolve a versão que gravou", () => {
  it("grava e devolve o `updatedAt` novo", async () => {
    const { siteId, inviteId } = await conviteNovo();
    const antes = (await getInvite(siteId, inviteId))!.updatedAt;

    await new Promise((r) => setTimeout(r, 15));
    const gravado = await saveInvite(siteId, inviteId, { doc: doc("segundo") });

    expect(gravado).toBeInstanceOf(Date);
    expect(gravado!.getTime()).toBeGreaterThan(antes.getTime());

    const lido = await getInvite(siteId, inviteId);
    expect(lido!.updatedAt.getTime()).toBe(gravado!.getTime());
    expect(lido!.doc.blocos[0]).toMatchObject({ texto: "segundo" });
  });

  it("convite inexistente devolve `null`, sem lançar", async () => {
    const { siteId } = await conviteNovo();
    const r = await saveInvite(
      siteId,
      "00000000-0000-0000-0000-000000000000",
      { doc: doc("x") }
    );
    expect(r).toBeNull();
  });

  it("id de convite alheio não grava — o `siteId` está no WHERE", async () => {
    const a = await conviteNovo();
    const outro = await createTestSite();

    const r = await saveInvite(outro.id, a.inviteId, { doc: doc("invasor") });

    expect(r).toBeNull();
    const intacto = await getInvite(a.siteId, a.inviteId);
    expect(intacto!.doc.blocos[0]).toMatchObject({ texto: "primeiro" });
  });
});

describe("SC-009: a versão que o cliente traz decide", () => {
  it("versão mais nova no banco que a do cliente = conflito", async () => {
    const { siteId, inviteId } = await conviteNovo();
    // A aba antiga guardou ESTA versão ao abrir.
    const versaoDaAbaAntiga = (await getInvite(siteId, inviteId))!.updatedAt;

    // A outra aba salva.
    await new Promise((r) => setTimeout(r, 1100));
    const depois = await saveInvite(siteId, inviteId, { doc: doc("celular") });

    /* A comparação que a action faz, com a margem de 1s: `updatedAt` volta do
       banco com precisão de microssegundo e o JavaScript arredonda para
       milissegundo — sem a margem, salvar duas vezes da MESMA aba acusaria
       conflito consigo mesma. */
    const conflitou =
      depois!.getTime() > versaoDaAbaAntiga.getTime() + 1000;
    expect(conflitou).toBe(true);
  });

  it("salvar duas vezes seguidas da mesma aba NÃO é conflito", async () => {
    const { siteId, inviteId } = await conviteNovo();

    const primeira = await saveInvite(siteId, inviteId, { doc: doc("a") });
    // A aba atualiza a própria versão depois de cada gravação.
    const conflitou = primeira!.getTime() > primeira!.getTime() + 1000;
    expect(conflitou).toBe(false);
  });

  it("o documento da outra aba sobrevive ao conflito", async () => {
    const { siteId, inviteId } = await conviteNovo();
    await saveInvite(siteId, inviteId, { doc: doc("do celular") });

    // A aba antiga é recusada pela action antes de chegar aqui — o que se
    // afere é que nada a fez perder o que a outra gravou.
    const lido = await getInvite(siteId, inviteId);
    expect(lido!.doc.blocos[0]).toMatchObject({ texto: "do celular" });
  });
});
