// Slug do SITE do casal (ex: "ana-e-pedro"), diferente do slug aleatório de
// grupo de RSVP em lib/slug.ts. Este é legível, vem dos nomes do casal e
// vira o endereço público — hoje /ana-e-pedro, na Fase 2 também
// ana-e-pedro.enlace.com.br.
//
// Ver docs/sdd-geracao-automatica.md §6.

/**
 * Nomes que não podem virar slug de casal.
 *
 * Duas famílias:
 *  - Rotas que já existem na raiz do app — um site com esse slug ficaria
 *    inacessível, escondido pela rota real.
 *  - Nomes de subdomínio de infraestrutura, reservados desde já porque a
 *    Fase 2 serve os sites em <slug>.enlace.com.br e um casal chamado "mail"
 *    ou "www" quebraria e-mail ou o site institucional.
 */
export const RESERVED_SLUGS = new Set([
  // rotas atuais do app
  "admin", "api", "conta", "pacotes", "presentes", "rsvp", "preview",
  "login", "logout", "cadastro", "entrar", "sair", "checkout", "pagamento",
  // infraestrutura / subdomínios
  "www", "app", "mail", "smtp", "imap", "pop", "ftp", "cdn", "static",
  "assets", "img", "images", "media", "files", "download", "downloads",
  "blog", "status", "help", "suporte", "support", "docs", "dev", "staging",
  "test", "teste", "demo", "beta", "internal", "ns1", "ns2", "mx",
  "webmail", "autodiscover", "autoconfig", "_domainkey", "dmarc",
  // marca
  "enlace", "enlacesites", "sobre", "contato", "termos", "privacidade",
]);

const MAX_LENGTH = 40;
const MIN_LENGTH = 3;

/**
 * Tira de um nome de casal o que claramente não é nome de casal.
 *
 * O campo é texto livre e vira o ENDEREÇO PÚBLICO do site. Um caso real em
 * produção: alguém colou uma URL do GitHub no campo dos nomes e o site nasceu
 * em `https-github-com-accordavaliacao-api-res`. Não quebrou nada — e é
 * justamente por isso que passou.
 *
 * Aqui a limpeza é conservadora de propósito: só remove esquema de URL,
 * domínio e `@`, que nunca fazem parte do nome de ninguém. Nomes com número,
 * hífen ou uma palavra só continuam passando — inventar regra de "nome de
 * verdade" recusaria gente real, e recusar um casal legítimo é pior que um
 * slug feio.
 */
function limparNaoNome(input: string): string {
  const limpo = input
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/www\.\S+/gi, " ")
    .replace(/\S+@\S+\.\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Sobrou nada porque o campo era SÓ uma URL. Aí não há nome a preservar:
  // devolve vazio e deixa o chamador cair no "casamento" genérico, que é um
  // endereço honesto — melhor que publicar o link que a pessoa colou.
  return limpo;
}

/**
 * Converte "Ana & Pedro" em "ana-e-pedro": minúsculas, sem acento, "&" vira
 * "e", e só sobram letras, números e hífen.
 */
export function slugifyCoupleNames(input: string): string {
  return limparNaoNome(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira acentos (marcas combinantes)
    .replace(/&/g, " e ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, ""); // o corte pode deixar hífen sobrando
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

/**
 * Um slug válido tem entre 3 e 40 caracteres, só minúsculas/números/hífen,
 * não começa nem termina com hífen e não é reservado.
 */
export function isValidSiteSlug(slug: string): boolean {
  if (slug.length < MIN_LENGTH || slug.length > MAX_LENGTH) return false;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return false;
  if (isReservedSlug(slug)) return false;
  return true;
}

/**
 * Gera um slug de site livre a partir dos nomes do casal. Em caso de colisão
 * (ou de nome reservado), sufixa -2, -3, ... até achar um livre.
 *
 * `slugTaken` consulta o banco; fica de fora daqui para esta função
 * continuar testável sem I/O.
 */
export async function generateSiteSlug(
  coupleNames: string,
  slugTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugifyCoupleNames(coupleNames) || "casamento";
  const safeBase = base.length < MIN_LENGTH ? `${base}-casamento` : base;

  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? safeBase : `${safeBase}-${n}`;
    if (isValidSiteSlug(candidate) && !(await slugTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error(`Não foi possível gerar um slug livre para "${coupleNames}"`);
}
