import { describe, it, expect } from "vitest";
import { FONTES_POR_MOLDE, fontesDoMolde } from "./porMolde";
import { getTemplate, portedTemplateIds } from "@/lib/templates/registry";
import { FONT_STYLES } from "@/lib/customization";

/**
 * A lista de fontes por molde é uma CÓPIA, e cópia apodrece.
 *
 * Ela existe para o questionário poder montar a tela sem importar
 * `lib/templates/<molde>/fonts.ts` — aquele módulo chama `next/font`, e quem o
 * importa leva o CSS das fontes junto.
 *
 * O preço de não importar é este arquivo: se alguém acrescentar uma fonte a um
 * molde e esquecer do mapa, o casal deixa de poder escolhê-la; se tirar uma e
 * esquecer, o casal escolhe uma fonte que o site não desenha e cai calado no
 * padrão. Os dois erros são silenciosos na tela e barulhentos aqui.
 */
describe("FONTES_POR_MOLDE espelha o que cada molde carrega", () => {
  it("cobre todos os moldes portados, sem sobra", () => {
    expect(Object.keys(FONTES_POR_MOLDE).sort()).toEqual(
      [...portedTemplateIds()].sort()
    );
  });

  for (const id of portedTemplateIds()) {
    it(`${id}: mesmas fontes que o molde declara`, () => {
      const molde = getTemplate(id);
      expect(molde).not.toBeNull();
      // Ordem não importa: a tela agrupa por categoria, não pela ordem daqui.
      expect([...FONTES_POR_MOLDE[id]].sort()).toEqual(
        Object.keys(molde!.fonts).sort()
      );
    });
  }

  it("toda fonte listada existe no catálogo que o questionário mostra", () => {
    const conhecidas = new Set(FONT_STYLES.map((f) => f.id));
    for (const [molde, fontes] of Object.entries(FONTES_POR_MOLDE)) {
      for (const f of fontes) {
        expect(conhecidas.has(f), `${molde} → ${f}`).toBe(true);
      }
    }
  });

  it("sem molde escolhido, vale a lista do Clássico", () => {
    /* Não é escolha estética: `themePresetFor(null)` devolve o preset do
       Clássico, então é esse molde que o site vai usar. Oferecer as 34 aqui
       seria oferecer o que o resultado ignora. */
    expect(fontesDoMolde(null)).toEqual(FONTES_POR_MOLDE.classico);
    expect(fontesDoMolde("")).toEqual(FONTES_POR_MOLDE.classico);
    expect(fontesDoMolde("molde-que-nao-existe")).toEqual(
      FONTES_POR_MOLDE.classico
    );
  });
});
