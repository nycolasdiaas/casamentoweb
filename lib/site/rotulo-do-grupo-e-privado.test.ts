import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * O rótulo da família é do casal, e só dele.
 *
 * ── O que isto tranca ──────────────────────────────────────────────────────
 *
 * O painel pede o nome da família assim, com a frase embaixo do campo:
 *
 *     Nome da família
 *     Do jeito que vocês chamam eles. **Só vocês veem este nome.**
 *
 * E, até 11/09/2026, esse nome abria as duas telas que o convidado recebe:
 * "Família Souza — tios da noiva, vocês vêm?" na confirmação de presença, e
 * "Olá, Família Souza — tios da noiva" no convite pessoal (UX-008).
 *
 * Um casal que confie na frase escreve o que quiser — e manda o link no
 * WhatsApp da família. O constrangimento teria sido criado por uma promessa
 * do próprio produto.
 *
 * ── Por que um teste ESTRUTURAL ────────────────────────────────────────────
 *
 * Nada aqui é lógica: é um campo que não pode atravessar uma fronteira. Um
 * teste de render provaria o texto de hoje; este prova a REGRA, e falha no
 * instante em que alguém voltar a passar o rótulo para uma tela pública —
 * inclusive numa tela que ainda não existe.
 */

const RAIZ = join(__dirname, "..", "..");

/** As telas que o CONVIDADO abre. */
const TELAS_PUBLICAS = [
  "app/rsvp/[slug]/page.tsx",
  "app/s/[slug]/meu-convite/page.tsx",
  "components/site/ConfirmacaoDePresenca.tsx",
];

/** Linha de código, sem comentário: é onde o rótulo escaparia de verdade. */
function linhasDeCodigo(fonte: string): string[] {
  return fonte
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l !== "" &&
        !l.startsWith("//") &&
        !l.startsWith("*") &&
        !l.startsWith("/*")
    );
}

describe("o rótulo do grupo não chega ao convidado", () => {
  it.each(TELAS_PUBLICAS)("%s não lê o rótulo do grupo", (relativo) => {
    const caminho = join(RAIZ, relativo);
    expect(existsSync(caminho)).toBe(true);

    const codigo = linhasDeCodigo(readFileSync(caminho, "utf8"));
    const vazamentos = codigo.filter(
      (l) => /\.label\b/.test(l) || /\bgrupo=\{/.test(l)
    );

    expect(vazamentos).toEqual([]);
  });

  it("o painel continua prometendo o sigilo — a promessa e o código combinam", () => {
    const formulario = join(
      RAIZ,
      "components/account/manage/FormularioDeFamilia.tsx"
    );
    if (!existsSync(formulario)) return; // o arquivo mudou de lugar: nada a afirmar

    const fonte = readFileSync(formulario, "utf8");
    expect(fonte).toMatch(/Só vocês veem este nome/i);
  });
});
