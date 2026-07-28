// Adaptador do Supabase Storage, falando HTTP direto com a API.
//
// Sem `@supabase/supabase-js` de propósito: usamos três endpoints e um
// header de autorização. A biblioteca inteira (com auth, realtime e
// postgrest) entraria no bundle do servidor para nada.
//
// O bucket é PRIVADO. Foto de casamento tem convidado dentro — dado pessoal
// de terceiro (LGPD), como já vale para as métricas. Ninguém acessa um
// objeto sem uma URL assinada, e quem assina é o servidor, na rota /f/<id>.

const BUCKET = "site-photos";

/** Formatos aceitos. Validado no cliente, no bucket e nos bytes recebidos. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * Teto do arquivo já comprimido. O cliente mira em 500 KB; a folga cobre
 * foto que não comprime bem (muito detalhe, pouca área lisa) sem virar
 * porta aberta para upload de 10 MB.
 */
export const MAX_PHOTO_BYTES = 900 * 1024;

export type StorageConfig = { url: string; serviceKey: string };

/**
 * Onde fica o Storage.
 *
 * `SUPABASE_URL` é opcional: o projeto já está no `DATABASE_URL`, no usuário
 * `postgres.<ref>` do pooler. Derivar dali evita uma variável a mais para
 * errar — mas a explícita vence, para apontar para outro projeto se preciso.
 */
export function getStorageConfig(): StorageConfig | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;

  const explicita = process.env.SUPABASE_URL;
  if (explicita) return { url: explicita.replace(/\/$/, ""), serviceKey };

  const ref = process.env.DATABASE_URL?.match(/\/\/postgres\.([a-z0-9]+):/)?.[1];
  if (!ref) return null;

  return { url: `https://${ref}.supabase.co`, serviceKey };
}

/** Storage configurado? Usado para degradar a interface em vez de quebrar. */
export function isStorageEnabled(): boolean {
  return getStorageConfig() !== null;
}

function requireConfig(): StorageConfig {
  const cfg = getStorageConfig();
  if (!cfg) {
    throw new Error(
      "Supabase Storage não configurado: falta SUPABASE_SERVICE_ROLE_KEY no .env.local"
    );
  }
  return cfg;
}

function authHeaders(cfg: StorageConfig): HeadersInit {
  return {
    Authorization: `Bearer ${cfg.serviceKey}`,
    apikey: cfg.serviceKey,
  };
}

async function falhou(res: Response, acao: string): Promise<Error> {
  const corpo = await res.text().catch(() => "");
  return new Error(`Storage: ${acao} falhou (${res.status}) ${corpo.slice(0, 300)}`);
}

/**
 * URL assinada de UPLOAD, para o browser enviar o arquivo direto ao Storage.
 *
 * O arquivo não passa pelo servidor Next: economiza banda e não esbarra no
 * limite de corpo das server actions. O preço é que só validamos os bytes
 * depois que chegam — daí a checagem de assinatura em `verifyStoredImage`.
 */
export async function createSignedUploadUrl(path: string): Promise<string> {
  const cfg = requireConfig();
  const res = await fetch(
    `${cfg.url}/storage/v1/object/upload/sign/${BUCKET}/${path}`,
    { method: "POST", headers: authHeaders(cfg) }
  );
  if (!res.ok) throw await falhou(res, "assinar upload");

  const { url, token } = (await res.json()) as { url: string; token?: string };

  // O Storage devolve o caminho já com `?token=`. A garantia extra existe
  // porque o cliente só recebe esta URL — se o token não vier nela, o PUT
  // falharia com 401 e a causa ficaria longe do lugar do erro.
  const completa = new URL(`${cfg.url}/storage/v1${url}`);
  if (!completa.searchParams.has("token") && token) {
    completa.searchParams.set("token", token);
  }
  return completa.toString();
}

/**
 * Busca o objeto no bucket privado, autenticado pela chave de serviço.
 *
 * Quem chama é a rota /f/<id>, que repassa os bytes. Não usamos URL assinada
 * aqui: assinar exigiria uma ida a mais ao Storage, e o único cliente desta
 * função é o nosso próprio servidor, que já tem a chave.
 */
export async function fetchObject(path: string): Promise<Response> {
  const cfg = requireConfig();
  return fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
    headers: authHeaders(cfg),
  });
}

export async function deleteObject(path: string): Promise<void> {
  const cfg = requireConfig();
  const res = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "DELETE",
    headers: authHeaders(cfg),
  });
  if (res.ok) return;

  // "Não existe" é sucesso aqui: o objetivo é que o objeto não exista.
  //
  // Cuidado com o status: o Storage responde ausência com HTTP 400 e o 404
  // só no CORPO. Conferir só `res.status` faria toda exclusão de objeto já
  // sumido virar erro — e o log diria "objeto órfão" sem haver órfão nenhum.
  const corpo = await res.text().catch(() => "");
  if (res.status === 404 || /not found/i.test(corpo)) return;

  throw new Error(
    `Storage: apagar objeto falhou (${res.status}) ${corpo.slice(0, 300)}`
  );
}

/** Assinaturas de arquivo dos formatos que aceitamos. */
const MAGIC: { type: string; bytes: number[]; offset: number }[] = [
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  // WebP: "RIFF" .... "WEBP"
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
];

/**
 * Descobre o formato pelos primeiros bytes do arquivo.
 *
 * Exportada para o teste: é o controle que separa "imagem" de "qualquer
 * coisa que alguém subiu com uma URL assinada na mão".
 */
export function sniffImageType(head: Uint8Array): string | null {
  for (const { type, bytes, offset } of MAGIC) {
    if (bytes.every((b, i) => head[offset + i] === b)) {
      if (type === "image/webp") {
        const webp = [0x57, 0x45, 0x42, 0x50]; // "WEBP" no offset 8
        if (!webp.every((b, i) => head[8 + i] === b)) continue;
      }
      return type;
    }
  }
  return null;
}

/**
 * Confere que o objeto recém-enviado é MESMO uma imagem, lendo os primeiros
 * bytes dele.
 *
 * O `content-type` que o browser declara é palavra de quem envia — e quem
 * envia tem uma URL assinada na mão. Aqui olhamos a assinatura do arquivo,
 * que é o que o navegador do convidado vai interpretar depois.
 */
export async function verifyStoredImage(path: string): Promise<{
  ok: boolean;
  detectedType: string | null;
  sizeBytes: number | null;
}> {
  const cfg = requireConfig();
  const res = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
    headers: { ...authHeaders(cfg), Range: "bytes=0-15" },
  });
  if (!res.ok) return { ok: false, detectedType: null, sizeBytes: null };

  const head = new Uint8Array(await res.arrayBuffer());
  const detectedType = sniffImageType(head);

  // Com Range, `content-range: bytes 0-15/12345` traz o tamanho total.
  const total = res.headers.get("content-range")?.split("/")[1];
  const sizeBytes = total && /^\d+$/.test(total) ? Number(total) : null;

  const dentroDoLimite = sizeBytes === null || sizeBytes <= MAX_PHOTO_BYTES;

  return {
    ok: detectedType !== null && dentroDoLimite,
    detectedType,
    sizeBytes,
  };
}

export { BUCKET };
