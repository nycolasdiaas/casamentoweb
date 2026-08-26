import type { SectionKey } from "@/lib/templates/contract";

/**
 * As linhas de benefício da vitrine (`/pacotes`), com o rótulo que quem
 * AINDA NÃO É CLIENTE consegue ler.
 *
 * ── Por que não `SECTION_LABELS` ───────────────────────────────────────────
 *
 * Aquele mapa é do painel: ele fala com o casal que já comprou e está
 * decidindo o que ligar no próprio site. Por isso diz "Nossa história" — na
 * boca do casal, "nossa" são eles. Na vitrine, quem lê é um visitante, e
 * "nossa" vira a Enlace falando da própria história.
 *
 * Mesmo problema em outros dois rótulos, e nos dois o custo é maior que a
 * gramática:
 *
 * - "Lista de presentes" perde o Pix, que é o único diferencial que sustenta
 *   a diferença de preço até o Para Sempre.
 * - "Álbum da festa" soa como algo que vem junto na compra. As fotos só
 *   existem depois do casamento — quem compra e não acha abre chamado.
 *   "depois da festa" é a palavra que impede a decepção.
 *
 * É o mesmo motivo que fez nascer o `ROTULO_CURTO` de `lib/site/ancoras.ts`:
 * um rótulo serve a um leitor, e o Enlace tem três (o casal no painel, o
 * convidado no site, o visitante na vitrine).
 *
 * ── O que decide o ✓ e o ✕ ─────────────────────────────────────────────────
 *
 * Só a `chave`. O rótulo é texto; quem diz se o pacote inclui é
 * `tierAllowsSection`, o mesmo gating que o `SiteRenderer` obedece. Trocar um
 * pacote em `TIER_SECTIONS` muda a vitrine sozinho, sem ninguém lembrar de vir
 * aqui — que é exatamente o defeito que uma lista escrita à mão criaria.
 *
 * ── O que está fora, e por quê ─────────────────────────────────────────────
 *
 * - `cover` e `footer`: estruturais, presentes nos três pacotes. "Rodapé" como
 *   argumento de venda não é argumento. A capa tem um agravante — as regras de
 *   negócio §4 marcam "Capa / Save the Date" nos três, e `lib/packages.ts`
 *   vende "Save the Date personalizado" como exclusivo do Site do Casamento.
 *   São duas verdades escritas em lugares diferentes; incluir a linha seria
 *   escolher um lado de uma contradição que ninguém resolveu.
 * - "Endereço personalizado" (`anaepedro.com.br`): não é seção, então
 *   `tierAllowsSection` nunca produziria a linha. Fica fora até o dono
 *   responder quem paga a renovação anual do domínio — a resposta muda o que o
 *   Para Sempre promete.
 */
export const LINHAS_DA_VITRINE: { chave: SectionKey; rotulo: string }[] = [
  { chave: "countdown", rotulo: "Contagem regressiva" },
  { chave: "story", rotulo: "História do casal" },
  { chave: "details", rotulo: "Cerimônia e festa" },
  { chave: "gallery", rotulo: "Galeria de fotos" },
  { chave: "rsvp", rotulo: "Confirmação de presença" },
  { chave: "gifts", rotulo: "Lista de presentes com Pix" },
  { chave: "guestbook", rotulo: "Mural de recados" },
  { chave: "album", rotulo: "Álbum depois da festa" },
];
