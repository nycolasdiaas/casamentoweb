import { describe, it, expect, afterEach } from "vitest";
import { getStorageConfig, isStorageEnabled, sniffImageType } from "./supabase";

const ambienteOriginal = { ...process.env };

afterEach(() => {
  process.env = { ...ambienteOriginal };
});

function bytes(...valores: number[]): Uint8Array {
  return new Uint8Array(valores);
}

describe("sniffImageType", () => {
  it("reconhece JPEG", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10))).toBe(
      "image/jpeg"
    );
  });

  it("reconhece PNG", () => {
    expect(
      sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00))
    ).toBe("image/png");
  });

  it("reconhece WebP", () => {
    // "RIFF" + tamanho + "WEBP"
    const webp = bytes(
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
    );
    expect(sniffImageType(webp)).toBe("image/webp");
  });

  // Um RIFF que não é WEBP (um .wav, por exemplo) não pode passar como imagem
  // só porque os quatro primeiros bytes batem.
  it("recusa RIFF que não é WebP", () => {
    const wav = bytes(
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45
    );
    expect(sniffImageType(wav)).toBeNull();
  });

  it("recusa o que não é imagem", () => {
    // "<?php" — o caso que o content-type do browser não pegaria
    expect(sniffImageType(bytes(0x3c, 0x3f, 0x70, 0x68, 0x70))).toBeNull();
    // SVG (texto): aceita script, por isso fica de fora
    expect(sniffImageType(bytes(0x3c, 0x73, 0x76, 0x67))).toBeNull();
    expect(sniffImageType(bytes())).toBeNull();
  });
});

describe("getStorageConfig", () => {
  it("fica desligado sem a chave de serviço", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(getStorageConfig()).toBeNull();
    expect(isStorageEnabled()).toBe(false);
  });

  // Uma variável a menos para errar: o projeto já está no DATABASE_URL.
  it("deriva a URL do projeto a partir do DATABASE_URL", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave";
    delete process.env.SUPABASE_URL;
    process.env.DATABASE_URL =
      "postgresql://postgres.abcdef123456:senha@aws-1-us-east-2.pooler.supabase.com:5432/postgres";

    expect(getStorageConfig()).toEqual({
      url: "https://abcdef123456.supabase.co",
      serviceKey: "chave",
    });
  });

  it("a URL explícita vence a derivada, sem barra no fim", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave";
    process.env.SUPABASE_URL = "https://outro.supabase.co/";
    process.env.DATABASE_URL =
      "postgresql://postgres.abcdef123456:senha@aws-1-us-east-2.pooler.supabase.com:5432/postgres";

    expect(getStorageConfig()?.url).toBe("https://outro.supabase.co");
  });

  it("fica desligado se não dá para descobrir o projeto", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave";
    delete process.env.SUPABASE_URL;
    process.env.DATABASE_URL = "postgresql://usuario:senha@localhost:5432/postgres";

    expect(getStorageConfig()).toBeNull();
  });
});
