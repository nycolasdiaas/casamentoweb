import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SitePhoto from "./SitePhoto";
import type { SitePhotoRow } from "@/lib/repositories/sitePhotos";

// O que este arquivo protege: a regra de quando o site mostra a foto do
// casal e quando cai no exemplo. Errar para o lado errado significa entregar
// um site com foto de estranhos — o motivo de a fase existir.

function fotoDe(overrides: Partial<SitePhotoRow> = {}): SitePhotoRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    siteId: "22222222-2222-2222-2222-222222222222",
    slot: "cover",
    storagePath: "site/foto.jpg",
    contentType: "image/jpeg",
    sizeBytes: 120_000,
    width: 1600,
    height: 1200,
    blurDataUrl: null,
    alt: null,
    originalName: "IMG_0001.jpg",
    position: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("SitePhoto", () => {
  it("aponta para a rota assinada, nunca para o Storage direto", () => {
    render(<SitePhoto photo={fotoDe()} label="Foto principal" />);

    const img = screen.getByRole("img");
    // O src passa pelo otimizador do Next, mas a origem é /f/<id>.
    expect(decodeURIComponent(img.getAttribute("src")!)).toContain(
      "/f/11111111-1111-1111-1111-111111111111"
    );
    expect(img.getAttribute("src")).not.toContain("supabase");
  });

  it("cai no exemplo quando o slot ainda está vazio", () => {
    render(<SitePhoto photo={undefined} label="Foto principal do casal" />);

    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toMatch(/^\/demo\//);
  });

  it("usa o alt do casal quando existe, e o rótulo do slot quando não", () => {
    const { unmount } = render(
      <SitePhoto photo={fotoDe({ alt: "Nós dois na praia" })} label="Capa" />
    );
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Nós dois na praia");
    unmount();

    render(<SitePhoto photo={fotoDe()} label="Capa" />);
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Capa");
  });

  // Sem o borrão, a página pula quando a foto carrega. Com blurDataUrl nulo
  // (foto antiga, subida antes do campo existir) não pode quebrar.
  it("só pede o placeholder de blur quando tem a miniatura", () => {
    const { unmount } = render(
      <SitePhoto photo={fotoDe({ blurDataUrl: "data:image/jpeg;base64,/9j/xx" })} label="Capa" />
    );
    expect(screen.getByRole("img").style.backgroundImage).toContain("data:image");
    unmount();

    render(<SitePhoto photo={fotoDe({ blurDataUrl: null })} label="Capa" />);
    expect(screen.getByRole("img").style.backgroundImage).toBe("");
  });
});
