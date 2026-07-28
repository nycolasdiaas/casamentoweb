// Upload de arquivos no Supabase Storage via API REST (sem SDK novo, mesmo
// padrão do lib/email.ts com o Resend).
//
// Env necessárias:
//   SUPABASE_URL                — ex: https://xxxxxxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   — chave service_role (SÓ no servidor)
//   SUPABASE_PHOTOS_BUCKET      — opcional, padrão "order-photos"
//
// O bucket deve ser PRIVADO: as fotos do casal não podem ficar acessíveis a
// quem adivinhar a URL. A leitura acontece por URL assinada e temporária.

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_PHOTOS_BUCKET ?? "order-photos";

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB por foto
export const MAX_PHOTOS_PER_ORDER = 30;

export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export function isStorageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

export function isAllowedPhotoType(type: string): boolean {
  return (ALLOWED_PHOTO_TYPES as readonly string[]).includes(type);
}

function requireConfig(): { url: string; key: string } {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      "Supabase Storage não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  return { url: SUPABASE_URL, key: SERVICE_KEY };
}

/**
 * Nome de arquivo seguro: só o que a gente controla vai pro caminho no
 * bucket. Nome original do usuário nunca entra na URL (fica no banco).
 */
export function buildStoragePath(
  orderId: string,
  index: number,
  contentType: string
): string {
  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : contentType === "image/heic" || contentType === "image/heif"
          ? "heic"
          : "jpg";
  const unique = `${Date.now().toString(36)}-${index}`;
  return `${orderId}/${unique}.${ext}`;
}

/** Sobe o arquivo. Lança se o Storage responder erro. */
export async function uploadPhoto(
  path: string,
  body: ArrayBuffer,
  contentType: string
): Promise<void> {
  const { url, key } = requireConfig();

  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${encodeURI(path)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body,
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Storage respondeu ${res.status}: ${detail}`);
  }
}

export async function deletePhoto(path: string): Promise<void> {
  const { url, key } = requireConfig();

  await fetch(`${url}/storage/v1/object/${BUCKET}/${encodeURI(path)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  }).catch(() => {
    // Arquivo órfão no bucket é bem menos ruim que erro na tela do casal.
  });
}

/**
 * URL temporária de leitura. Retorna null (em vez de lançar) para a tela
 * conseguir degradar sem quebrar quando o Storage não responde.
 */
export async function signedPhotoUrl(
  path: string,
  expiresInSeconds = 60 * 60
): Promise<string | null> {
  if (!isStorageConfigured()) return null;
  const { url, key } = requireConfig();

  try {
    const res = await fetch(
      `${url}/storage/v1/object/sign/${BUCKET}/${encodeURI(path)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: expiresInSeconds }),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { signedURL?: string };
    if (!data.signedURL) return null;
    return `${url}/storage/v1${data.signedURL}`;
  } catch {
    return null;
  }
}
