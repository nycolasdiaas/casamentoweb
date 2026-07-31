import { describe, it, expect, vi, beforeEach } from "vitest";

// Só a REGRA de reordenar é testada aqui: quem move, quem não move, e em que
// ordem as posições são reescritas. O banco é mockado para o teste não
// depender do Postgres remoto.
let linhas: { sectionKey: string; position: number; enabled: boolean }[] = [];
const escritas: { sectionKey: string; position: number }[] = [];

const CHAVES = [
  "cover", "countdown", "story", "details", "gallery",
  "rsvp", "gifts", "guestbook", "album", "footer",
];

/**
 * Descobre a qual seção uma condição do drizzle se refere.
 *
 * Vasculha o objeto em vez de serializar: a condição do drizzle carrega
 * referências circulares (a coluna aponta para a tabela, que aponta para as
 * colunas), então JSON.stringify estoura.
 */
function chaveDaCondicao(cond: unknown): string | null {
  const vistos = new Set<unknown>();
  const fila: unknown[] = [cond];
  while (fila.length) {
    const atual = fila.shift();
    if (atual === null || atual === undefined) continue;
    if (typeof atual === "string") {
      if (CHAVES.includes(atual)) return atual;
      continue;
    }
    if (typeof atual !== "object") continue;
    if (vistos.has(atual)) continue;
    vistos.add(atual);
    fila.push(...Object.values(atual as Record<string, unknown>));
  }
  return null;
}

vi.mock("@/lib/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ orderBy: async () => linhas }),
      }),
    }),
    update: () => ({
      set: (valores: { position?: number; enabled?: boolean }) => ({
        where: (cond: unknown) => {
          // A condição carrega a chave da seção em algum nível do objeto.
          const alvo = chaveDaCondicao(cond);
          if (valores.position !== undefined && alvo) {
            escritas.push({ sectionKey: alvo, position: valores.position });
          }
          return {
            returning: async () => (alvo ? [{ sectionKey: alvo }] : []),
            then: (r: (v: undefined) => void) => r(undefined),
          };
        },
      }),
    }),
    transaction: async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        update: () => ({
          set: (valores: { position: number }) => ({
            where: async (cond: unknown) => {
              const alvo = chaveDaCondicao(cond);
              if (alvo) {
                escritas.push({
                  sectionKey: alvo,
                  position: valores.position,
                });
              }
            },
          }),
        }),
      };
      await fn(tx);
    },
  },
}));

import { moveSection, podeDesligar, SECOES_FIXAS } from "./siteSections";

function semear(chaves: string[]) {
  linhas = chaves.map((sectionKey, position) => ({
    sectionKey,
    position,
    enabled: true,
  }));
}

beforeEach(() => {
  escritas.length = 0;
  semear(["cover", "countdown", "story", "details", "gallery", "footer"]);
});

describe("podeDesligar", () => {
  it("protege as âncoras do site", () => {
    expect(SECOES_FIXAS).toEqual(["cover", "footer"]);
    expect(podeDesligar("cover")).toBe(false);
    expect(podeDesligar("footer")).toBe(false);
    expect(podeDesligar("story")).toBe(true);
  });
});

describe("moveSection", () => {
  it("desce uma seção uma posição", async () => {
    const ok = await moveSection("s1", "countdown", "down");
    expect(ok).toBe(true);

    const ordem = escritas
      .sort((a, b) => a.position - b.position)
      .map((e) => e.sectionKey);
    expect(ordem).toEqual([
      "cover",
      "story",
      "countdown",
      "details",
      "gallery",
      "footer",
    ]);
  });

  it("sobe uma seção uma posição", async () => {
    const ok = await moveSection("s1", "details", "up");
    expect(ok).toBe(true);

    const ordem = escritas
      .sort((a, b) => a.position - b.position)
      .map((e) => e.sectionKey);
    expect(ordem).toEqual([
      "cover",
      "countdown",
      "details",
      "story",
      "gallery",
      "footer",
    ]);
  });

  // A capa abre e o rodapé fecha; mover qualquer um dos dois quebraria o site.
  it("recusa mover as âncoras", async () => {
    expect(await moveSection("s1", "cover", "down")).toBe(false);
    expect(await moveSection("s1", "footer", "up")).toBe(false);
    expect(escritas).toHaveLength(0);
  });

  // Sem isto, "subir" no primeiro móvel jogaria a seção para cima da capa.
  it("recusa subir além do primeiro móvel", async () => {
    expect(await moveSection("s1", "countdown", "up")).toBe(false);
    expect(escritas).toHaveLength(0);
  });

  it("recusa descer além do último móvel", async () => {
    expect(await moveSection("s1", "gallery", "down")).toBe(false);
    expect(escritas).toHaveLength(0);
  });

  it("recusa chave que não é seção", async () => {
    expect(await moveSection("s1", "nao-existe", "up")).toBe(false);
    expect(await moveSection("s1", "", "down")).toBe(false);
  });

  it("recusa seção que este site não tem", async () => {
    // Pacote "convite" não tem RSVP semeado.
    expect(await moveSection("s1", "rsvp", "up")).toBe(false);
    expect(escritas).toHaveLength(0);
  });

  // Posições semeadas com buraco ou empate: uma troca simples de valores não
  // moveria nada. Renumerar de 0..n-1 é o que garante a ordem.
  it("renumera de 0 mesmo com posições repetidas na origem", async () => {
    linhas = [
      { sectionKey: "cover", position: 0, enabled: true },
      { sectionKey: "countdown", position: 5, enabled: true },
      { sectionKey: "story", position: 5, enabled: true },
      { sectionKey: "footer", position: 9, enabled: true },
    ];

    const ok = await moveSection("s1", "story", "up");
    expect(ok).toBe(true);
    expect(escritas.map((e) => e.position).sort()).toEqual([0, 1, 2, 3]);
    const ordem = escritas
      .sort((a, b) => a.position - b.position)
      .map((e) => e.sectionKey);
    expect(ordem).toEqual(["cover", "story", "countdown", "footer"]);
  });
});
