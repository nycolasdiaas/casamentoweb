import { describe, it, expect } from "vitest";
import { parseContentForm } from "./contentInput";
import { toEditorValues } from "./contentFields";

function form(campos: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

const FORTALEZA = "America/Fortaleza"; // UTC-3, sem horário de verão
const SAO_PAULO = "America/Sao_Paulo";

describe("parseContentForm", () => {
  it("trata campo vazio como null em vez de string vazia", () => {
    const r = parseContentForm(form({ coupleNames: "  " }), FORTALEZA);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.coupleNames).toBeNull();
    expect(r.value.story).toBeNull();
  });

  it("guarda o texto sem espaço em volta", () => {
    const r = parseContentForm(
      form({ coupleNames: "  Ana & Pedro  ", story: " a gente se conheceu " }),
      FORTALEZA
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.coupleNames).toBe("Ana & Pedro");
    expect(r.value.story).toBe("a gente se conheceu");
  });

  // O campo vira href de um link que o convidado clica. javascript: aqui é
  // XSS armazenado no site de um cliente.
  it("recusa link de mapa que não seja http/https", () => {
    for (const ruim of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "nao-e-url",
    ]) {
      const r = parseContentForm(form({ ceremonyMapUrl: ruim }), FORTALEZA);
      expect(r.ok, ruim).toBe(false);
    }
  });

  it("aceita link de mapa https", () => {
    const r = parseContentForm(
      form({ ceremonyMapUrl: "https://maps.google.com/?q=igreja" }),
      FORTALEZA
    );
    expect(r.ok).toBe(true);
  });

  it("recusa texto acima do limite da coluna", () => {
    const r = parseContentForm(form({ story: "x".repeat(5001) }), FORTALEZA);
    expect(r.ok).toBe(false);
  });

  it("mede o limite sem contar \\r\\n dobrado", () => {
    // 2500 linhas de "x\r\n" = 7500 chars crus, 5000 depois de normalizar.
    const r = parseContentForm(
      form({ story: "x\r\n".repeat(1666) }),
      FORTALEZA
    );
    expect(r.ok).toBe(true);
  });

  it("interpreta o horário no fuso do site, não em UTC", () => {
    const r = parseContentForm(
      form({ weddingDate: "2026-10-16", weddingTime: "16:00" }),
      FORTALEZA
    );
    expect(r.ok).toBe(true);
    if (!r.ok || !r.value.weddingDate) throw new Error("sem data");
    // 16h em Fortaleza (UTC-3) = 19h UTC
    expect(r.value.weddingDate.toISOString()).toBe("2026-10-16T19:00:00.000Z");
  });

  it("hora vazia grava meia-noite local (= hora não informada)", () => {
    const r = parseContentForm(form({ weddingDate: "2026-10-16" }), FORTALEZA);
    expect(r.ok).toBe(true);
    if (!r.ok || !r.value.weddingDate) throw new Error("sem data");
    expect(r.value.weddingDate.toISOString()).toBe("2026-10-16T03:00:00.000Z");
  });

  it("data vazia grava null, não Invalid Date", () => {
    const r = parseContentForm(form({ weddingTime: "16:00" }), FORTALEZA);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.weddingDate).toBeNull();
  });

  it("recusa data malformada", () => {
    const r = parseContentForm(form({ weddingDate: "16/10/2026" }), FORTALEZA);
    expect(r.ok).toBe(false);
  });
});

describe("ida e volta entre formulário e banco", () => {
  // O bug clássico: formatar com toISOString() devolveria 19:00 para uma
  // cerimônia às 16:00, e cada salvamento empurraria mais 3 horas.
  it("devolve ao formulário a MESMA hora que o casal digitou", () => {
    const salvo = parseContentForm(
      form({ weddingDate: "2026-10-16", weddingTime: "16:00" }),
      FORTALEZA
    );
    if (!salvo.ok) throw new Error("não salvou");

    const volta = toEditorValues({
      ...salvo.value,
      timezone: FORTALEZA,
    });

    expect(volta.weddingDate).toBe("2026-10-16");
    expect(volta.weddingTime).toBe("16:00");
  });

  it("é estável: salvar o que voltou não desloca a hora", () => {
    let atual = parseContentForm(
      form({ weddingDate: "2026-10-16", weddingTime: "16:00" }),
      FORTALEZA
    );
    if (!atual.ok) throw new Error("não salvou");

    for (let i = 0; i < 3; i++) {
      const campos = toEditorValues({ ...atual.value, timezone: FORTALEZA });
      atual = parseContentForm(
        form({
          weddingDate: campos.weddingDate,
          weddingTime: campos.weddingTime,
        }),
        FORTALEZA
      );
      if (!atual.ok) throw new Error("não salvou");
    }

    expect(atual.value.weddingDate?.toISOString()).toBe(
      "2026-10-16T19:00:00.000Z"
    );
  });

  it("hora não informada volta vazia, não 00:00", () => {
    const salvo = parseContentForm(form({ weddingDate: "2026-10-16" }), FORTALEZA);
    if (!salvo.ok) throw new Error("não salvou");

    const volta = toEditorValues({ ...salvo.value, timezone: FORTALEZA });
    expect(volta.weddingDate).toBe("2026-10-16");
    expect(volta.weddingTime).toBe("");
  });

  it("respeita um fuso diferente do padrão", () => {
    const salvo = parseContentForm(
      form({ weddingDate: "2026-01-10", weddingTime: "18:30" }),
      SAO_PAULO
    );
    if (!salvo.ok) throw new Error("não salvou");

    const volta = toEditorValues({ ...salvo.value, timezone: SAO_PAULO });
    expect(volta.weddingTime).toBe("18:30");
  });

  it("linha ausente vira formulário todo vazio, sem quebrar", () => {
    const volta = toEditorValues(null);
    expect(volta.coupleNames).toBe("");
    expect(volta.weddingDate).toBe("");
    expect(volta.weddingTime).toBe("");
  });
});
