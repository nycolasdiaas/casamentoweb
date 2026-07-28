import { config } from "dotenv";
import crypto from "node:crypto";

config({ path: ".env.local" });

// Cria (ou confere) o bucket privado onde ficam as fotos dos casais.
//
// Idempotente: rodar de novo só reafirma os limites. Rode uma vez por
// ambiente, depois de preencher SUPABASE_SERVICE_ROLE_KEY no .env.local:
//   npm run setup:storage
//
// O bucket é privado de propósito — a foto do casamento tem convidado
// dentro. O acesso sai sempre por URL assinada, emitida pela rota /f/<id>.

const BUCKET = "site-photos";
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const FILE_SIZE_LIMIT = 900 * 1024;

function resolveConfig() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não definida.\n" +
        "  Pegue em: Supabase → Project Settings → API → service_role\n" +
        "  e cole no .env.local. É uma chave de SERVIDOR: nunca vá para o cliente."
    );
  }

  const explicita = process.env.SUPABASE_URL;
  if (explicita) return { url: explicita.replace(/\/$/, ""), serviceKey };

  const ref = process.env.DATABASE_URL?.match(/\/\/postgres\.([a-z0-9]+):/)?.[1];
  if (!ref) {
    throw new Error(
      "Não consegui derivar a URL do projeto do DATABASE_URL. Defina SUPABASE_URL."
    );
  }
  return { url: `https://${ref}.supabase.co`, serviceKey };
}

async function main() {
  const { url, serviceKey } = resolveConfig();
  const headers = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "content-type": "application/json",
  };

  console.log(`Projeto: ${url}`);

  const existente = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, { headers });

  const corpo = JSON.stringify({
    id: BUCKET,
    name: BUCKET,
    public: false,
    file_size_limit: FILE_SIZE_LIMIT,
    allowed_mime_types: ALLOWED,
  });

  if (existente.ok) {
    const atual = await existente.json();
    console.log(`Bucket "${BUCKET}" já existe (público: ${atual.public}).`);

    const res = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, {
      method: "PUT",
      headers,
      body: corpo,
    });
    if (!res.ok) {
      throw new Error(`Não consegui atualizar o bucket: ${await res.text()}`);
    }
    console.log("Limites reafirmados.");
  } else {
    // O Storage responde "bucket inexistente" com HTTP 400 e o 404 só no
    // CORPO. Confiar no status daria "chave errada" para um bucket que
    // simplesmente ainda não existe.
    const texto = await existente.text();
    const soNaoExiste =
      existente.status === 404 || /bucket not found/i.test(texto);

    if (!soNaoExiste) {
      throw new Error(
        `Storage respondeu ${existente.status}: ${texto}\n` +
          "  Chave errada ou sem permissão? Confira a service_role."
      );
    }

    const res = await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers,
      body: corpo,
    });
    if (!res.ok) {
      throw new Error(`Não consegui criar o bucket: ${await res.text()}`);
    }
    console.log(`Bucket "${BUCKET}" criado.`);
  }

  const conferencia = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, { headers });
  const bucket = await conferencia.json();

  console.log("");
  console.log(`  privado:      ${bucket.public === false ? "sim" : "NÃO — corrija!"}`);
  console.log(`  limite:       ${(bucket.file_size_limit / 1024).toFixed(0)} KB`);
  console.log(`  tipos:        ${(bucket.allowed_mime_types ?? []).join(", ")}`);

  if (bucket.public !== false) process.exit(1);

  await verificarIdaEVolta(url, headers);

  console.log("\nStorage pronto.");
}

/** JPEG de 1x1 pixel — o menor arquivo válido para exercitar o caminho. */
const JPEG_1X1 = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof" +
    "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAAB" +
    "AAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64"
);

/**
 * Faz o caminho completo que o app faz — assinar upload, enviar, conferir os
 * bytes, assinar leitura, baixar e apagar — e limpa o que criou.
 *
 * Existe porque o resto do script só prova que o bucket foi criado. Este
 * pedaço prova que o formato das chamadas está certo, que é o que quebra
 * silenciosamente quando a API não é a que se imaginava.
 */
async function verificarIdaEVolta(url, headers) {
  const caminho = `__verificacao__/${crypto.randomUUID()}.jpg`;
  const auth = { Authorization: headers.Authorization, apikey: headers.apikey };

  console.log("\nConferindo o caminho completo:");

  const assinatura = await fetch(
    `${url}/storage/v1/object/upload/sign/${BUCKET}/${caminho}`,
    { method: "POST", headers: auth }
  );
  if (!assinatura.ok) {
    throw new Error(`assinar upload: ${assinatura.status} ${await assinatura.text()}`);
  }
  const { url: caminhoAssinado, token } = await assinatura.json();
  const destino = new URL(`${url}/storage/v1${caminhoAssinado}`);
  if (!destino.searchParams.has("token") && token) {
    destino.searchParams.set("token", token);
  }
  console.log("  assinar upload      ok");

  const envio = await fetch(destino, {
    method: "PUT",
    headers: { "content-type": "image/jpeg" },
    body: JPEG_1X1,
  });
  if (!envio.ok) {
    throw new Error(`enviar: ${envio.status} ${await envio.text()}`);
  }
  console.log("  enviar o arquivo    ok");

  // O mesmo Range que a confirmação usa para checar a assinatura do arquivo.
  const bytes = await fetch(`${url}/storage/v1/object/${BUCKET}/${caminho}`, {
    headers: { ...auth, Range: "bytes=0-15" },
  });
  const cabeca = new Uint8Array(await bytes.arrayBuffer());
  const ehJpeg = cabeca[0] === 0xff && cabeca[1] === 0xd8 && cabeca[2] === 0xff;
  const tamanho = bytes.headers.get("content-range")?.split("/")[1];
  console.log(
    `  ler os bytes        ${ehJpeg ? "ok" : "FALHOU"} (assinatura JPEG, ${tamanho} bytes)`
  );
  if (!ehJpeg) throw new Error("os bytes lidos não batem com o que foi enviado");

  // A leitura autenticada é exatamente o que a rota /f/<id> faz para
  // repassar os bytes ao otimizador do next/image.
  const leitura = await fetch(`${url}/storage/v1/object/${BUCKET}/${caminho}`, {
    headers: auth,
  });
  const inteiro = Buffer.from(await leitura.arrayBuffer());
  console.log(
    `  ler autenticado     ${leitura.ok ? "ok" : "FALHOU"} (${inteiro.length} bytes)`
  );
  if (!leitura.ok || inteiro.length !== JPEG_1X1.length) {
    throw new Error("a leitura autenticada não devolveu o arquivo enviado");
  }

  // E o bucket é mesmo privado? Sem assinatura, não pode abrir.
  const semAssinatura = await fetch(
    `${url}/storage/v1/object/public/${BUCKET}/${caminho}`
  );
  console.log(
    `  bucket privado      ${semAssinatura.ok ? "NÃO — abriu sem assinatura!" : "ok (recusou)"}`
  );
  if (semAssinatura.ok) throw new Error("o bucket está servindo sem assinatura");

  const apagado = await fetch(`${url}/storage/v1/object/${BUCKET}/${caminho}`, {
    method: "DELETE",
    headers: auth,
  });
  console.log(`  apagar              ${apagado.ok ? "ok" : "FALHOU"}`);
  if (!apagado.ok) {
    console.log(`    sobrou o objeto de teste em ${caminho} — apague pelo painel`);
  }
}

main().catch((err) => {
  console.error("Falhou:", err.message);
  process.exit(1);
});
