/**
 * A tela de geração — spec `painel-casal/012`.
 *
 * O conflito desta spec é sobre TEMPO: o handoff pede um piso de 2,5s para a
 * animação ser vista por inteiro. O produto já tomou a decisão contrária, e por
 * experiência própria — o piso existiu (2,6s), virou a crítica "ter que
 * aguardar o site" contra um concorrente que entrega em minutos, e foi
 * removido. As regras §2.2 elevaram isso a norma.
 *
 * Estes testes prendem as duas metades: que o piso não volta, e que a falha
 * tem para onde ir.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, act } from "@testing-library/react";
import CelebrationScreen from "./CelebrationScreen";

const FONTE = readFileSync(
  resolve(process.cwd(), "components/account/wizard/CelebrationScreen.tsx"),
  "utf-8"
);
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /^\s*\/\/.*$/gm,
  ""
);

vi.mock("@/components/ui/SiteSkeleton", () => ({
  default: ({ parado }: { parado?: boolean }) => (
    <div data-esqueleto data-parado={parado ? "sim" : "nao"} />
  ),
}));
vi.mock("@/components/ui/MotionProvider", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function montar(props: Partial<Parameters<typeof CelebrationScreen>[0]> = {}) {
  document.body.innerHTML = "";
  return render(
    <CelebrationScreen ativo accent="#2f3a29" nome="Ana" {...props} />
  ).container;
}

const barra = (c: HTMLElement) =>
  c.querySelector("[data-barra]") as HTMLElement;

beforeEach(() => vi.clearAllMocks());

describe("SC-002: o piso de espera não voltou", () => {
  it("nenhum número de duração mínima no arquivo", () => {
    /* 2500/2600 eram o piso. `RITMO_MS` continua existindo, mas ele DISTRIBUI
       as etapas dentro do tempo real — não o alonga. */
    expect(CODIGO).not.toMatch(/\b2500\b|\b2600\b/);
    expect(CODIGO).not.toMatch(/PISO|duracaoMinima|tempoMinimo/i);
  });

  it("a tela vive de `ativo`, que é do clique até a resposta", () => {
    expect(CODIGO).toContain("if (!ativo) return null;");
  });

  it("a barra para em 92% e só fecha quando o servidor responde", () => {
    // Uma barra que chega a 100% e continua girando é a mentira clássica de
    // tela de carregamento.
    expect(CODIGO).toContain("p >= 92 ? 92 : p + 2");
  });
});

describe("SC-003: nenhum texto promete prazo", () => {
  it("as quatro etapas descrevem o que está sendo feito", () => {
    const c = montar();
    expect(c.textContent).toContain("Registrando o pedido de vocês");
    expect(c.textContent).not.toMatch(/em breve|aguarde|assim que poss|falta \d/i);
  });
});

describe("SC-005: a falha para a tela onde a pessoa está olhando", () => {
  it("a barra vira `--c-danger`, onde parou", () => {
    /* Levá-la a 100% diria que terminou; zerá-la apagaria o que já andou. */
    const c = montar({ erro: "Não consegui criar o site." });
    expect(barra(c).style.background).toBe("var(--c-danger)");
  });

  it("o esqueleto para de construir", () => {
    // Continuar montando um site que não vai nascer é a tela contando uma
    // história que já acabou.
    const c = montar({ erro: "falhou" });
    expect(
      c.querySelector("[data-esqueleto]")!.getAttribute("data-parado")
    ).toBe("sim");
  });

  it("as pétalas somem — não se comemora por cima de um erro", () => {
    const comErro = montar({ erro: "falhou" });
    expect(comErro.querySelectorAll(".motion-petal")).toHaveLength(0);

    const semErro = montar();
    expect(semErro.querySelectorAll(".motion-petal").length).toBeGreaterThan(0);
  });

  it("o erro é anunciado, e o botão reenvia", () => {
    const tentar = vi.fn();
    montar({ erro: "Não consegui criar o site.", aoTentarDeNovo: tentar });

    const alerta = document.querySelector('[role="alert"]')!;
    expect(alerta.textContent).toBe("Não consegui criar o site.");

    act(() => {
      screen.getByRole("button", { name: "Tentar de novo" }).click();
    });
    expect(tentar).toHaveBeenCalledTimes(1);
  });

  it("o texto do erro não promete prazo, e diz o que sobreviveu", () => {
    const c = montar({ erro: "falhou" });
    expect(c.textContent).toContain("O site não ficou pronto.");
    expect(c.textContent).toContain("Nada do que vocês responderam se perdeu.");
    expect(c.textContent).not.toMatch(/tente mais tarde|em breve|aguarde/i);
  });

  it("sem erro, nada disso aparece", () => {
    const c = montar();
    expect(c.querySelector('[role="alert"]')).toBeNull();
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).toBeNull();
    expect(barra(c).style.background).toBe("rgb(47, 58, 41)");
  });

  it("a cascata de etapas para quando há erro", () => {
    // O efeito sai cedo: o texto não pode continuar avançando etapas de um
    // trabalho que não está acontecendo.
    expect(CODIGO).toContain("if (!ativo || erro) return;");
  });
});

describe("SC-004: a barra reflete o servidor, não um relógio", () => {
  it("o progresso final não é agendado por temporizador", () => {
    // Os 8% que faltam só fecham quando a resposta chega — e quem sabe disso é
    // quem chama, não esta tela.
    expect(CODIGO).not.toContain("setProgresso(100)");
  });
});

describe("o retorno ao formulário não perde o envio", () => {
  it("`Tentar de novo` reenvia o formulário, não só fecha a tela", () => {
    const wizard = readFileSync(
      resolve(process.cwd(), "components/account/wizard/OrderWizard.tsx"),
      "utf-8"
    );
    /* `requestSubmit(botão)` e não `form.submit()`: o submitter é quem carrega
       `intent=submit`, e sem ele a action gravaria rascunho em vez de enviar. */
    expect(wizard).toContain("botao.form?.requestSubmit(botao)");
    expect(wizard).toContain("aoTentarDeNovo={reenviar}");
  });

  it("a tela continua montada quando o envio falha", () => {
    const wizard = readFileSync(
      resolve(process.cwd(), "components/account/wizard/OrderWizard.tsx"),
      "utf-8"
    );
    expect(wizard).toContain('if (!ehEnvio || !(r && "error" in r)) setEnviando(false);');
  });
});
