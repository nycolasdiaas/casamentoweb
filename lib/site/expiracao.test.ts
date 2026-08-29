/**
 * A regra que tira o site de alguém do ar — spec `site-publico/008`.
 *
 * Tudo aqui é função pura sobre datas, e é de propósito: a decisão de derrubar
 * o site de um casal precisa ser conferível sem subir banco nenhum.
 *
 * Os casos que mais importam são os de NÃO expirar. Um falso positivo aqui
 * tira do ar o site de quem pagou.
 */

import { describe, it, expect } from "vitest";
import {
  AVISOS_EM_DIAS,
  MESES_APOS_O_CASAMENTO,
  PRAZO_ANUNCIADO_EM,
  avisoDeHoje,
  calcularExpiracao,
  dataPorExtenso,
  diasAteExpirar,
  estaExpirado,
  prazoValePara,
  tierExpira,
} from "./expiracao";

const emUTC = (iso: string) => new Date(iso);

/* Todo teste de cálculo passa um anúncio explícito, porque em produção a
   constante é `null` e nada expira. Ver o bloco "a trava" no fim do arquivo. */
const ANUNCIO = new Date(2026, 0, 1);
const COMPROU_DEPOIS = new Date(2026, 5, 1);

describe("SC-002 e SC-003: quem expira e quando", () => {
  it("o `para-sempre` NUNCA expira — é o que o nome vende", () => {
    expect(tierExpira("para-sempre")).toBe(false);
    expect(
      calcularExpiracao("para-sempre", emUTC("2026-10-16T12:00:00Z"), COMPROU_DEPOIS, ANUNCIO)
    ).toBeNull();
  });

  it("`convite` e `site` expiram 12 meses depois do casamento", () => {
    expect(tierExpira("convite")).toBe(true);
    expect(tierExpira("site")).toBe(true);

    const casamento = new Date(2026, 9, 16); // 16/10/2026, hora local
    expect(calcularExpiracao("convite", casamento, COMPROU_DEPOIS, ANUNCIO)).toEqual(
      new Date(2027, 9, 16)
    );
    expect(calcularExpiracao("site", casamento, COMPROU_DEPOIS, ANUNCIO)).toEqual(
      new Date(2027, 9, 16)
    );
  });

  it("o número de meses é uma constante, não um literal solto", () => {
    // Trocar o prazo é trocar um número num lugar só.
    expect(MESES_APOS_O_CASAMENTO).toBe(12);
  });

  it("SC-004: sem data de casamento, não expira", () => {
    /* A alternativa seria contar da publicação — e tirar do ar o site de um
       casal cuja festa ainda nem aconteceu. */
    expect(calcularExpiracao("convite", null, COMPROU_DEPOIS, ANUNCIO)).toBeNull();
    expect(calcularExpiracao("convite", undefined, COMPROU_DEPOIS, ANUNCIO)).toBeNull();
  });

  it("a virada de ano não confunde a conta", () => {
    const casamento = new Date(2026, 11, 31); // 31/12/2026
    expect(calcularExpiracao("site", casamento, COMPROU_DEPOIS, ANUNCIO)).toEqual(
      new Date(2027, 11, 31)
    );
  });
});

describe("SC-005: o que já venceu, e o que não venceu", () => {
  const agora = new Date(2027, 9, 16, 12, 0, 0);

  it("`null` nunca vence — é o estado dos 17 sites de hoje", () => {
    /* Depois da migração, TODO site existente fica com `expires_at` nulo,
       inclusive o casamento real de 16/10/2026. Se `null` vencesse, a
       migração tiraria do ar um casamento com convidados confirmados. */
    expect(estaExpirado(null, agora)).toBe(false);
    expect(estaExpirado(undefined, agora)).toBe(false);
  });

  it("data no futuro não venceu", () => {
    expect(estaExpirado(new Date(2028, 0, 1), agora)).toBe(false);
  });

  it("data no passado venceu", () => {
    expect(estaExpirado(new Date(2027, 0, 1), agora)).toBe(true);
  });
});

describe("SC-008: cada aviso sai UMA vez, sem coluna de estado", () => {
  /* A memória é a própria data: o aviso de 30 dias só existe no dia em que
     faltam exatamente 30. Sem isso, o cron diário mandaria o mesmo aviso 23
     vezes até o site vencer. */
  const hoje = new Date(2027, 0, 15, 9, 0, 0);
  const daquiADias = (n: number) =>
    new Date(2027, 0, 15 + n, 9, 0, 0);

  it("sai no dia 30, e NÃO no 31 nem no 29", () => {
    expect(avisoDeHoje(daquiADias(30), hoje)).toBe("30-dias");
    expect(avisoDeHoje(daquiADias(31), hoje)).toBeNull();
    expect(avisoDeHoje(daquiADias(29), hoje)).toBeNull();
  });

  it("sai no dia 7, e NÃO no 8 nem no 6", () => {
    expect(avisoDeHoje(daquiADias(7), hoje)).toBe("7-dias");
    expect(avisoDeHoje(daquiADias(8), hoje)).toBeNull();
    expect(avisoDeHoje(daquiADias(6), hoje)).toBeNull();
  });

  it("os dois avisos são os declarados", () => {
    expect([...AVISOS_EM_DIAS]).toEqual([30, 7]);
  });

  it("o aviso de saída vale para TUDO que já venceu", () => {
    /* Este é o único que não pode se perder: se o cron não rodar no dia certo,
       os outros dois somem, mas este continua valendo no dia seguinte. */
    expect(avisoDeHoje(daquiADias(0), hoje)).toBe("saiu-do-ar");
    expect(avisoDeHoje(daquiADias(-1), hoje)).toBe("saiu-do-ar");
    expect(avisoDeHoje(daquiADias(-40), hoje)).toBe("saiu-do-ar");
  });

  it("site que não expira não gera aviso nenhum", () => {
    expect(avisoDeHoje(null, hoje)).toBeNull();
  });

  it("a hora do dia não muda o aviso", () => {
    /* Se a conta fosse por blocos de 24h, um cron às 23h e outro às 01h dariam
       números diferentes para o MESMO dia — o aviso sairia duas vezes ou
       nenhuma. Por isso a comparação é de calendário. */
    const alvo = new Date(2027, 1, 14);
    expect(avisoDeHoje(alvo, new Date(2027, 0, 15, 1, 0))).toBe("30-dias");
    expect(avisoDeHoje(alvo, new Date(2027, 0, 15, 23, 59))).toBe("30-dias");
  });
});

describe("dias que faltam, para o painel", () => {
  it("conta dias de calendário, não de 24 horas", () => {
    const agora = new Date(2027, 0, 15, 23, 0);
    expect(diasAteExpirar(new Date(2027, 0, 16, 1, 0), agora)).toBe(1);
  });

  it("null quando não expira", () => {
    expect(diasAteExpirar(null)).toBeNull();
  });
});

describe("a data que o casal lê", () => {
  it("sai por extenso, em português", () => {
    const texto = dataPorExtenso(new Date(Date.UTC(2027, 9, 16, 15, 0)));
    expect(texto).toContain("outubro");
    expect(texto).toContain("2027");
    expect(texto).toContain("16");
  });
});

describe("a trava: ninguém expira enquanto a vitrine estiver calada", () => {
  /* O achado do agente `regras-de-negocio`, e o ajuste mais importante desta
     spec. A FR-001 protegia quem já tinha site publicado (sem backfill), mas
     sobrava a PUBLICAÇÃO TARDIA: um pedido pago hoje, lendo uma vitrine que
     não promete prazo nenhum, publicado depois desta spec subir, ganharia um
     prazo que ninguém mostrou a ele.

     `lib/packages.ts` não diz prazo. Enquanto não disser, `PRAZO_ANUNCIADO_EM`
     é `null` e a resposta é sempre `null` — a maquinaria inteira fica montada
     e inerte. */

  it("HOJE a constante é null, e isso é o estado correto", () => {
    expect(PRAZO_ANUNCIADO_EM).toBeNull();
  });

  it("com a vitrine calada, NINGUÉM recebe prazo", () => {
    const casamento = new Date(2026, 9, 16);
    // Sem o `anunciadoEm` injetado, vale a constante de produção.
    expect(calcularExpiracao("convite", casamento, new Date())).toBeNull();
    expect(calcularExpiracao("site", casamento, new Date(2030, 0, 1))).toBeNull();
  });

  it("quem comprou ANTES do anúncio nunca expira", () => {
    /* O contrato é a tela do dia da compra. Quem leu uma página sem prazo
       comprou um site sem prazo. */
    const comprouAntes = new Date(2025, 11, 31);
    expect(prazoValePara(comprouAntes, ANUNCIO)).toBe(false);
    expect(
      calcularExpiracao("convite", new Date(2026, 9, 16), comprouAntes, ANUNCIO)
    ).toBeNull();
  });

  it("quem comprou no dia do anúncio, ou depois, expira", () => {
    expect(prazoValePara(ANUNCIO, ANUNCIO)).toBe(true);
    expect(prazoValePara(COMPROU_DEPOIS, ANUNCIO)).toBe(true);
  });

  it("pedido sem data de compra não expira", () => {
    expect(prazoValePara(null, ANUNCIO)).toBe(false);
    expect(prazoValePara(undefined, ANUNCIO)).toBe(false);
  });
});
