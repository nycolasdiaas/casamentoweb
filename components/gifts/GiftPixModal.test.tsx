/**
 * H5 · a saída honesta do Pix — spec `site-publico/007`.
 *
 * O artboard original dizia "pagamento não confirmado", e isso é mentira: o
 * Pix vai direto para a conta do casal e a Enlace não observa nada. Não existe
 * falha detectável — existe um convidado que fechou a tela e ficou sem saber o
 * que aconteceu.
 *
 * O que estes testes prendem é a linha entre informar e acusar. A maioria fecha
 * porque desistiu, e desistir é legítimo: nada aqui pode soar como cobrança, e
 * nenhuma palavra pode afirmar algo que a Enlace não sabe.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FONTE = readFileSync(
  resolve(process.cwd(), "components/gifts/GiftPixModal.tsx"),
  "utf-8"
);
/* O comentário do arquivo CITA as palavras proibidas para explicar por que não
   as usa. O que se confere é o que a tela DIZ. */
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /^\s*\/\/.*$/gm,
  ""
);
/** Só o bloco da saída honesta. */
const SAIDA = CODIGO.slice(
  CODIGO.indexOf("data-saida-pix"),
  CODIGO.indexOf("): done ? (") > 0
    ? CODIGO.indexOf("): done ? (")
    : CODIGO.indexOf(") : done ? (")
);

/* O JSX quebra as frases em várias linhas com recuo. Para conferir TEXTO, o
   que importa são as palavras na ordem — não onde o Prettier cortou. */
const TEXTO = SAIDA.replace(/\s+/g, " ");

beforeEach(() => vi.clearAllMocks());

describe("o texto aprovado pelo `regras-de-negocio`", () => {
  it("diz para onde o dinheiro vai, e quem consegue ver", () => {
    expect(TEXTO).toContain("O Pix vai direto para os noivos");
    expect(TEXTO).toContain(
      "A Enlace não fica no meio, então não temos como ver se o seu Pix"
    );
    expect(TEXTO).toContain("quem vê é o casal, na conta deles");
  });

  it("não acusa quem desistiu", () => {
    // "Se mudou de ideia, tudo bem" é a frase que separa informar de cobrar.
    expect(TEXTO).toContain("Se mudou de ideia, tudo bem");
    expect(TEXTO).toContain("nada ficou reservado no seu nome");
  });

  it("os rótulos são os do modal, não rótulos novos", () => {
    /* `Já fiz o Pix` é exatamente o que o convidado acabou de ver. Rótulo
       diferente para a mesma ação faz ele achar que é um segundo passo — ou
       uma segunda cobrança. */
    expect(SAIDA).toContain("Já fiz o Pix");
    expect(SAIDA).toContain("Ver outros presentes");
    // "Escolher outro presente" seria obrigação; "ver" é saída.
    expect(SAIDA).not.toContain("Escolher outro presente");
  });

  it("a dúvida vai para o casal, não para a Enlace", () => {
    expect(TEXTO).toContain("Fale com os noivos — a conta é deles");
    expect(SAIDA).not.toMatch(/nossa equipe|suporte|fale conosco/i);
  });
});

describe("as palavras que a Enlace não pode dizer", () => {
  it("nada que afirme o que ela não observa", () => {
    /* Cada uma nomeia um evento que não existe: a contribuição é
       auto-declarada, o dinheiro nunca passa pela plataforma, e não há falha
       detectável. */
    for (const proibida of [
      "não confirmado",
      "não identificamos",
      "erro no pagamento",
      "falha no pagamento",
      "pendente",
      "processando",
      "cobrado",
      "estorno",
      "reembolso",
      "comprovante",
      "expirou",
      "gerar novo código",
    ]) {
      expect(SAIDA.toLowerCase(), proibida).not.toContain(proibida);
    }
  });

  it("nada que prometa prazo", () => {
    expect(SAIDA).not.toMatch(/aguarde|em breve|dia útil|assim que/i);
  });

  it("sem emoji — é tela de site, não e-mail para convidado", () => {
    // Voz V5: emoji só em e-mail para convidado e em texto que o casal
    // escreve. Numa tela sobre dinheiro ele ainda lê como alívio forçado.
    expect(SAIDA).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it("nem a palavra `cota` aparece", () => {
    /* A galeria do convidado nunca mostra disponibilidade nem usa "cota".
       Dizer "a cota continua livre" ensinaria que presentes se esgotam — uma
       promessa de disponibilidade que a tela não sustenta. */
    expect(SAIDA.toLowerCase()).not.toContain("cota");
    expect(TEXTO).toContain("o presente continua na lista");
  });
});

describe("as três saídas", () => {
  it("o × sai direto, sem gravar nada", () => {
    // Uma tela com duas saídas que exigem ato viraria a cobrança que ela
    // existe para evitar.
    expect(CODIGO).toContain("onClick={fecharDeVez}");
    expect(CODIGO).toContain("const fecharDeVez = onClose;");
  });

  it("Escape e o clique fora passam pela saída honesta", () => {
    expect(CODIGO).toContain('if (event.key === "Escape") tentarSair();');
    expect(CODIGO).toContain("onClick={tentarSair}");
  });

  it("a saída só aparece para quem chegou a ver o QR", () => {
    /* Sem chave Pix configurada não houve QR, e o convidado não tem o que
       avisar. Já tendo confirmado, a tela também não tem o que dizer. */
    expect(CODIGO).toContain("if (done || !pix || !brCode || saindo)");
  });

  it("`Já fiz o Pix` chama a mesma ação do modal", () => {
    // Nada de um segundo caminho de registro: é a mesma
    // `registerContributionAction`, com o mesmo nome opcional.
    expect(SAIDA).toContain("onClick={handleConfirm}");
    expect(CODIGO).toContain("registerContributionAction({ giftId: gift.id, guestName })");
  });
});
