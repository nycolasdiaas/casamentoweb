import { headers } from "next/headers";

// Hosts confiáveis para o último recurso — quando NENHUMA variável de ambiente
// diz onde o produto está publicado e só sobra o cabeçalho da requisição.
//
// A allowlist continua existindo por um motivo só: `Host` é cabeçalho, e
// cabeçalho o cliente escreve. Sem ela, uma requisição forjada faria o produto
// gerar o link de retorno do pagamento apontando para o domínio de um
// atacante.
//
// O que ela NÃO serve para fazer é ser a fonte principal do endereço. Em
// 11/09/2026 ela era, e custou caro: o domínio de produção é
// `casamentoweb-ten.vercel.app`, a lista tinha `casamentoweb.vercel.app` — sem
// o `-ten` — e `getBaseUrl` lançava. O questionário parava de criar o site,
// "Criar convite" devolvia 500 e o QR do casamento que já estava no ar também.
// Ver UX-001, UX-002 e UX-005 em docs/auditoria/AUDITORIA-E2E.md.
//
// Por isso a lista virou o passo 4 de 4, e não o passo 1.
const ALLOWED_HOSTS = new Set([
  "localhost:3000",
  "casamentoweb.vercel.app",
  "casamentoweb-ten.vercel.app",
  "enlace.com.br",
  "www.enlace.com.br",
]);

const LOCAL = "http://localhost:3000";

function semBarraFinal(url: string): string {
  return url.replace(/\/+$/, "");
}

/** A plataforma informa o domínio sem esquema ("exemplo.vercel.app"). */
function comEsquema(endereco: string): string {
  return /^https?:\/\//.test(endereco) ? endereco : `https://${endereco}`;
}

/**
 * O endereço que NÃO depende da requisição.
 *
 * Ordem: o que o dono configurou → o domínio de produção que a hospedagem
 * informa → o endereço desta publicação (é o que cobre deploy de
 * pré-visualização, cujo domínio muda a cada envio e que nenhuma lista
 * conseguiria acompanhar).
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` e `VERCEL_URL` são definidas pela própria
 * Vercel em tempo de execução. Não dependem de ninguém lembrar de configurar —
 * que é exatamente a falha que este módulo passou a existir para não repetir.
 */
function enderecoDeAmbiente(): string | null {
  const configurado = process.env.NEXT_PUBLIC_SITE_URL;
  if (configurado) return semBarraFinal(configurado);

  const producao = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (producao) return semBarraFinal(comEsquema(producao));

  const publicacaoAtual = process.env.VERCEL_URL;
  if (publicacaoAtual) return semBarraFinal(comEsquema(publicacaoAtual));

  return null;
}

/**
 * URL base absoluta do produto, ou `null` quando não dá para saber.
 *
 * Quem só precisa MOSTRAR um link deve usar esta, não `getBaseUrl`: uma tela
 * não pode deixar de abrir porque um botão de copiar não soube montar o
 * endereço. Foi o que aconteceu com a aba Convites (UX-002).
 */
export async function baseUrlOuNulo(): Promise<string | null> {
  const doAmbiente = enderecoDeAmbiente();
  if (doAmbiente) return doAmbiente;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  // Host não confiável: não devolve URL derivada de cabeçalho forjado.
  if (!host || !ALLOWED_HOSTS.has(host)) return null;

  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return semBarraFinal(`${proto}://${host}`);
}

/**
 * URL base absoluta, para montar links de retorno do pagamento e de convite.
 *
 * Lança quando não consegue determinar — e continua lançando de propósito:
 * quem CRIA um link que vai para fora (pagamento, e-mail) não pode seguir com
 * um endereço inventado. Quem só exibe usa `baseUrlOuNulo`.
 */
export async function getBaseUrl(): Promise<string> {
  const base = await baseUrlOuNulo();
  if (!base) {
    throw new Error(
      "Não foi possível determinar o endereço público: defina NEXT_PUBLIC_SITE_URL ou publique num host confiável."
    );
  }
  return base;
}

/**
 * A URL base SEM ler a requisição — para metadata e para gerar imagem.
 *
 * ── Por que existe uma segunda função ──────────────────────────────────────
 *
 * `getBaseUrl` lê `headers()`, e isso é dado de requisição. Dentro de
 * `generateMetadata` isso torna a rota inteira dinâmica e o `next build`
 * reprova: *"has a `generateMetadata` that depends on Request data … when the
 * rest of the route does not"*. O cartão de link precisa ser prerenderável —
 * ele é o mesmo para todo mundo.
 *
 * ── Por que ela devolve "" e não localhost em produção ─────────────────────
 *
 * Até 11/09/2026 esta função caía silenciosamente em `http://localhost:3000`
 * quando a variável faltava. Silenciosamente é a palavra: o site publicado do
 * casamento real anunciava
 *
 *     og:url   = http://localhost:3000/s/isabelle-e-nycolas
 *     og:image = http://localhost:3000/s/isabelle-e-nycolas/opengraph-image
 *
 * e o convite, mandado no grupo da família, chegava como um endereço seco, sem
 * foto e sem nome — porque o WhatsApp tentava buscar a imagem em `localhost` e
 * não achava (UX-021). Um fallback mudo que produz link errado é pior que a
 * ausência: ninguém vê, e quem paga o preço é o convidado.
 *
 * Em produção, sem endereço descoberto, ela devolve string vazia e quem chama
 * decide o que fazer. Fora de produção, `localhost` continua sendo o certo.
 */
export function baseUrlEstatica(): string {
  const doAmbiente = enderecoDeAmbiente();
  if (doAmbiente) return doAmbiente;
  return process.env.NODE_ENV === "production" ? "" : LOCAL;
}
