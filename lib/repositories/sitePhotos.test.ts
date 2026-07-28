import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db/client";
import { sitePhotos, sites } from "@/lib/db/schema";
import { createTestSite } from "./testSite";
import {
  createSitePhoto,
  countSitePhotos,
  countSlotPhotos,
  deleteSitePhoto,
  getSitePhotoById,
  isPhotoSlot,
  listSitePhotos,
  photoAt,
  photoLimitForTier,
  SLOT_CAPACITY,
  type NewSitePhoto,
  type PhotoSlot,
} from "./sitePhotos";

let siteId: string;
let contador = 0;

function foto(overrides: Partial<NewSitePhoto> = {}): NewSitePhoto {
  contador += 1;
  return {
    slot: "gallery",
    storagePath: `algum-site/foto-${contador}.jpg`,
    contentType: "image/jpeg",
    sizeBytes: 120_000,
    width: 1600,
    height: 1200,
    blurDataUrl: null,
    alt: null,
    originalName: `IMG_${contador}.jpg`,
    ...overrides,
  };
}

beforeEach(async () => {
  await db.delete(sitePhotos);
  await db.delete(sites);
  siteId = (await createTestSite()).id;
});

afterAll(async () => {
  await db.delete(sitePhotos);
  await db.delete(sites);
});

describe("createSitePhoto", () => {
  it("numera as posições em sequência dentro do slot", async () => {
    const primeira = await createSitePhoto(siteId, foto());
    const segunda = await createSitePhoto(siteId, foto());

    expect(primeira.position).toBe(0);
    expect(segunda.position).toBe(1);
  });

  // Cada slot tem a própria contagem: a foto da capa é a 0 do slot dela,
  // mesmo com a galeria cheia.
  it("numera por slot, não por site", async () => {
    await createSitePhoto(siteId, foto({ slot: "gallery" }));
    await createSitePhoto(siteId, foto({ slot: "gallery" }));

    const capa = await createSitePhoto(siteId, foto({ slot: "cover" }));

    expect(capa.position).toBe(0);
  });

  it("numera por site, não globalmente", async () => {
    const outroSite = await createTestSite();
    await createSitePhoto(outroSite.id, foto());

    const nossa = await createSitePhoto(siteId, foto());

    expect(nossa.position).toBe(0);
  });

  it("recusa dois registros para o mesmo objeto no Storage", async () => {
    const caminho = `${siteId}/mesma.jpg`;
    await createSitePhoto(siteId, foto({ storagePath: caminho }));

    await expect(
      createSitePhoto(siteId, foto({ storagePath: caminho }))
    ).rejects.toThrow();
  });
});

describe("listSitePhotos", () => {
  // O teste que impede a regressão mais cara do projeto, agora para fotos:
  // uma consulta sem escopo mostraria a foto de um casal no site de outro.
  it("NUNCA devolve foto de outro site", async () => {
    const outroSite = await createTestSite();
    await createSitePhoto(siteId, foto({ originalName: "nossa.jpg" }));
    await createSitePhoto(outroSite.id, foto({ originalName: "alheia.jpg" }));

    const lista = await listSitePhotos(siteId);

    expect(lista).toHaveLength(1);
    expect(lista[0].originalName).toBe("nossa.jpg");
  });

  it("devolve as fotos de um slot na ordem em que subiram", async () => {
    await createSitePhoto(siteId, foto({ originalName: "primeira.jpg" }));
    await createSitePhoto(siteId, foto({ originalName: "segunda.jpg" }));
    await createSitePhoto(siteId, foto({ originalName: "terceira.jpg" }));

    const lista = await listSitePhotos(siteId);

    expect(lista.map((p) => p.originalName)).toEqual([
      "primeira.jpg",
      "segunda.jpg",
      "terceira.jpg",
    ]);
  });

  it("devolve lista vazia para site sem foto", async () => {
    expect(await listSitePhotos(siteId)).toEqual([]);
  });
});

describe("photoAt", () => {
  it("acha a foto do slot pelo índice", async () => {
    await createSitePhoto(siteId, foto({ slot: "cover", originalName: "capa.jpg" }));
    await createSitePhoto(siteId, foto({ slot: "gallery", originalName: "g1.jpg" }));
    await createSitePhoto(siteId, foto({ slot: "gallery", originalName: "g2.jpg" }));

    const fotos = await listSitePhotos(siteId);

    expect(photoAt(fotos, "cover")?.originalName).toBe("capa.jpg");
    expect(photoAt(fotos, "gallery", 1)?.originalName).toBe("g2.jpg");
  });

  // É o que faz o molde cair no placeholder em vez de quebrar: slot vazio
  // devolve undefined, e o SitePhoto mostra a imagem de exemplo.
  it("devolve undefined para slot vazio ou índice fora da lista", async () => {
    const fotos = await listSitePhotos(siteId);

    expect(photoAt(fotos, "cover")).toBeUndefined();
    expect(photoAt(fotos, "gallery", 99)).toBeUndefined();
  });
});

describe("contagens", () => {
  it("conta o total do site e o de cada slot separadamente", async () => {
    await createSitePhoto(siteId, foto({ slot: "cover" }));
    await createSitePhoto(siteId, foto({ slot: "gallery" }));
    await createSitePhoto(siteId, foto({ slot: "gallery" }));

    expect(await countSitePhotos(siteId)).toBe(3);
    expect(await countSlotPhotos(siteId, "cover")).toBe(1);
    expect(await countSlotPhotos(siteId, "gallery")).toBe(2);
    expect(await countSlotPhotos(siteId, "story")).toBe(0);
  });

  it("não conta foto de outro site", async () => {
    const outroSite = await createTestSite();
    await createSitePhoto(outroSite.id, foto());
    await createSitePhoto(outroSite.id, foto());

    expect(await countSitePhotos(siteId)).toBe(0);
  });
});

describe("deleteSitePhoto", () => {
  it("apaga e devolve o caminho no Storage, para o objeto sair junto", async () => {
    const criada = await createSitePhoto(
      siteId,
      foto({ storagePath: `${siteId}/apagar.jpg` })
    );

    const caminho = await deleteSitePhoto(siteId, criada.id);

    expect(caminho).toBe(`${siteId}/apagar.jpg`);
    expect(await getSitePhotoById(criada.id)).toBeNull();
  });

  it("recusa apagar foto de outro site", async () => {
    const outroSite = await createTestSite();
    const alheia = await createSitePhoto(outroSite.id, foto());

    const caminho = await deleteSitePhoto(siteId, alheia.id);

    expect(caminho).toBeNull();
    expect(await getSitePhotoById(alheia.id)).not.toBeNull();
  });

  it("devolve null para id inexistente", async () => {
    const caminho = await deleteSitePhoto(
      siteId,
      "00000000-0000-0000-0000-000000000000"
    );
    expect(caminho).toBeNull();
  });
});

describe("apagar o site", () => {
  // As fotos são do site: sem o cascade, sobrariam linhas apontando para um
  // tenant que não existe mais.
  it("leva as fotos junto (cascade)", async () => {
    await createSitePhoto(siteId, foto());
    await createSitePhoto(siteId, foto());

    await db.delete(sites);

    expect(await db.select().from(sitePhotos)).toHaveLength(0);
  });
});

describe("limites", () => {
  it("cada pacote tem o seu teto de fotos", () => {
    expect(photoLimitForTier("convite")).toBe(5);
    expect(photoLimitForTier("site")).toBe(15);
    expect(photoLimitForTier("para-sempre")).toBe(40);
  });

  // O teto do pacote precisa comportar os slots que a interface oferece,
  // senão o casal encontra um lugar vazio que ele não consegue preencher.
  it("o menor pacote comporta capa e história", () => {
    expect(photoLimitForTier("convite")).toBeGreaterThanOrEqual(
      SLOT_CAPACITY.cover + SLOT_CAPACITY.story
    );
  });

  it("reconhece só os slots que o molde usa", () => {
    expect(isPhotoSlot("cover")).toBe(true);
    expect(isPhotoSlot("gallery")).toBe(true);
    // "album" são as fotos da festa — ainda não têm upload.
    expect(isPhotoSlot("album")).toBe(false);
    expect(isPhotoSlot("../../etc/passwd")).toBe(false);
  });

  it("todo slot conhecido tem capacidade declarada", () => {
    for (const slot of ["cover", "story", "gallery"] as PhotoSlot[]) {
      expect(SLOT_CAPACITY[slot]).toBeGreaterThan(0);
    }
  });
});
