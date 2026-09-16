import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import EscolhaDoVisual from "./EscolhaDoVisual";
import { FONTES_POR_MOLDE } from "@/lib/fonts/porMolde";
import { FONT_STYLES } from "@/lib/customization";

/**
 * A etapa do visual — as antigas 7, 8 e 9 numa só.
 *
 * O que estes testes prendem é o que o casal perde se alguém desfizer a
 * junção sem perceber:
 *
 * 1. **As três decisões na mesma tela.** Separadas, o casal escolhia a cor sem
 *    ver o modelo e a fonte sem ver a cor.
 * 2. **A lista de fontes depende do modelo.** `clampThemeFonts` sempre
 *    derrubou a fonte que o molde não desenha — em silêncio. Ao lado de uma
 *    prévia ao vivo, uma fonte que não muda nada vira "está quebrado".
 */

/* O quadro não entra: ele monta um <iframe> que carregaria uma rota de
   verdade. O que este arquivo testa são as ESCOLHAS; que o quadro reage a
   elas é assunto do `TemaAoVivo` e da verificação no ar. */
vi.mock("@/components/account/wizard/PreviaDoVisual", () => ({
  default: ({ modelo, fonte }: { modelo: string; fonte: string }) => (
    <div data-previa data-modelo={modelo} data-fonte={fonte} />
  ),
}));

function montar(props: Partial<Parameters<typeof EscolhaDoVisual>[0]> = {}) {
  document.body.innerHTML = "";
  return render(
    <EscolhaDoVisual
      modelo="classico"
      escolherModelo={() => {}}
      limparModelo={() => {}}
      pacote="para-sempre"
      cor1="#b8985f"
      cor2="#3d4a36"
      cor3="#f2efe7"
      setCor1={() => {}}
      setCor2={() => {}}
      setCor3={() => {}}
      fonte=""
      setFonte={() => {}}
      nomes="Anderson e Isabelle"
      primeiroNome="Anderson"
      conteudo={{
        nomes: "Anderson e Isabelle",
        data: "2027-05-22",
        hora: "16:00",
        cerimoniaLocal: "Igreja do Carmo",
        festaLocal: "Casa Aurora",
        traje: "Traje social",
        historia: "",
      }}
      {...props}
    />
  );
}

function nomesDasFontes(): string[] {
  const ids = new Set(FONT_STYLES.map((f) => f.name));
  return screen
    .getAllByRole("button")
    .map((b) => within(b).queryByText((t) => ids.has(t))?.textContent ?? "")
    .filter(Boolean);
}

describe("EscolhaDoVisual", () => {
  it("traz modelo, cores e tipografia na mesma tela", () => {
    montar();

    expect(screen.getByText("O modelo")).toBeTruthy();
    expect(screen.getByText("As cores")).toBeTruthy();
    expect(screen.getByText("A tipografia")).toBeTruthy();
    // E a prévia junto delas — é ela que responde a cada mexida.
    expect(document.querySelector("[data-previa]")).toBeTruthy();
  });

  it("oferece só as fontes que o modelo escolhido desenha", () => {
    montar({ modelo: "moderno" });

    const mostradas = nomesDasFontes();
    const esperadas = FONTES_POR_MOLDE.moderno.map(
      (id) => FONT_STYLES.find((f) => f.id === id)!.name
    );

    expect([...mostradas].sort()).toEqual([...esperadas].sort());
  });

  it("trocar de modelo troca a lista de fontes", () => {
    /* O Moderno é todo sem serifa; o Romântico, todo caligráfico e serifado.
       Se a lista não acompanhasse o modelo, as duas montagens dariam igual —
       e o casal escolheria no Moderno uma fonte que o site não desenha. */
    montar({ modelo: "moderno" });
    const noModerno = new Set(nomesDasFontes());

    montar({ modelo: "romantico" });
    const noRomantico = new Set(nomesDasFontes());

    expect(noModerno).not.toEqual(noRomantico);
    for (const nome of noModerno) {
      expect(noRomantico.has(nome)).toBe(false);
    }
  });

  it("sem modelo escolhido, vale a lista do Clássico", () => {
    // `themePresetFor(null)` devolve o preset do Clássico, então é esse molde
    // que o site vai usar — oferecer outra coisa aqui seria mentir.
    montar({ modelo: "" });

    const esperadas = FONTES_POR_MOLDE.classico.map(
      (id) => FONT_STYLES.find((f) => f.id === id)!.name
    );
    expect([...nomesDasFontes()].sort()).toEqual([...esperadas].sort());
  });

  it("mostra o primeiro nome do casal na amostra de cada fonte", () => {
    // Mesmo achado da UX-018: o exemplo é o nome que o casal acabou de
    // digitar, não "Ana & Pedro".
    montar({ primeiroNome: "Anderson" });
    expect(screen.getAllByText("Anderson").length).toBeGreaterThan(0);
  });
});
