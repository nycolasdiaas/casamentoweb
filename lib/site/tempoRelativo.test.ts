/**
 * As faixas de tempo relativo — spec `painel-casal/006`, FR-004.
 *
 * Saíram de dentro de `Avisos.tsx` quando o editor de convite passou a mostrar
 * "salvo há N min". Duas faixas escritas separadamente divergem na primeira vez
 * que alguém acha que "há 1 h" deveria ser "há 60 min" num dos dois lugares — e
 * o casal veria o mesmo instante descrito de dois jeitos na mesma tela.
 */

import { describe, it, expect } from "vitest";
import { quando } from "./tempoRelativo";

const AGORA = new Date("2026-09-19T18:00:00.000Z").getTime();
const atras = (ms: number) => new Date(AGORA - ms);

const SEG = 1000;
const MIN = 60 * SEG;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

describe("quando", () => {
  it("menos de um minuto é `agora`", () => {
    expect(quando(atras(0), AGORA)).toBe("agora");
    expect(quando(atras(20 * SEG), AGORA)).toBe("agora");
  });

  it("minutos", () => {
    expect(quando(atras(3 * MIN), AGORA)).toBe("há 3 min");
    expect(quando(atras(59 * MIN), AGORA)).toBe("há 59 min");
  });

  it("horas", () => {
    expect(quando(atras(2 * HORA), AGORA)).toBe("há 2 h");
    expect(quando(atras(20 * HORA), AGORA)).toBe("há 20 h");
  });

  it("ontem, e os dias da semana", () => {
    expect(quando(atras(DIA), AGORA)).toBe("ontem");
    expect(quando(atras(3 * DIA), AGORA)).toBe("há 3 dias");
  });

  it("mais de uma semana vira data", () => {
    // "há 34 dias" obriga a pessoa a fazer a conta. A data já é a resposta.
    expect(quando(atras(30 * DIA), AGORA)).toMatch(/\d{2} de \w+|\d{2} \w+/);
  });

  it("nunca lê o relógio sozinha", () => {
    /* `agora` entra como parâmetro de propósito: `Date.now()` dentro de uma
       função chamada no render torna o render impuro, e num render de servidor
       com Cache Components o valor congelaria — o casal veria "há 12 min" por
       horas. */
    const a = quando(atras(5 * MIN), AGORA);
    const b = quando(atras(5 * MIN), AGORA);
    expect(a).toBe(b);
  });
});
