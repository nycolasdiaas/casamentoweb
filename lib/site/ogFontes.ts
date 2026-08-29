/**
 * As fontes do cartão de link, em bytes.
 *
 * ── Por que buscar em vez de importar ──────────────────────────────────────
 *
 * `next/font` é transformação de build: ele devolve uma classe CSS, não o
 * arquivo. O Satori (que desenha o `ImageResponse`) precisa do arquivo em
 * memória — ele não tem navegador, não tem folha de estilo e não tem acesso às
 * fontes do sistema. **Sem nenhuma fonte ele nem desenha**: lança "No fonts
 * are loaded. At least one font is required to calculate the layout."
 *
 * ── Por que a API de CSS, e não o endereço do arquivo ──────────────────────
 *
 * A primeira versão apontava direto para um `.ttf` em `fonts.gstatic.com`. Os
 * dois endereços estavam errados — o caminho carrega a versão da fonte
 * (`/v4/`, `/v5/`) e ela muda quando o Google republica a família. As duas
 * buscas devolviam 404, `fontesDoCartao` filtrava as duas, e o cartão quebrava
 * com 500 no lugar de existir.
 *
 * A API de CSS resolve a versão atual e devolve o endereço vigente. O
 * `User-Agent` antigo é o que faz o Google servir **WOFF** em vez de WOFF2:
 * o Satori lê WOFF e TTF, mas não WOFF2.
 *
 * ── O que acontece se a busca falhar ───────────────────────────────────────
 *
 * `fontesDoCartao` devolve o que conseguiu, e quem chama decide. A rota de
 * imagem trata lista vazia devolvendo 404 — o WhatsApp mostra o link sem
 * cartão, que é o comportamento de antes desta funcionalidade existir. Um 500
 * ali faria o link parecer quebrado na conversa.
 */

/** UA de navegador antigo: é ele que faz o Google servir WOFF, não WOFF2. */
const UA_QUE_RECEBE_WOFF =
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36";

/** Os dois papéis que o cartão usa: Display (nomes) e Mono (data, sobrancelha). */
const FAMILIAS = {
  Display: "Instrument Serif",
  Mono: "IBM Plex Mono",
} as const;

export type FonteDoCartao = { name: string; data: ArrayBuffer };

async function buscar(familia: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familia)}`,
      { headers: { "User-Agent": UA_QUE_RECEBE_WOFF }, cache: "force-cache" }
    );
    if (!css.ok) return null;

    const endereco = (await css.text()).match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!endereco) return null;

    const arquivo = await fetch(endereco, { cache: "force-cache" });
    if (!arquivo.ok) return null;

    return await arquivo.arrayBuffer();
  } catch {
    // Rede fora não pode derrubar a rota que gera a imagem.
    return null;
  }
}

export async function fontesDoCartao(): Promise<FonteDoCartao[]> {
  const carregadas = await Promise.all(
    Object.entries(FAMILIAS).map(async ([papel, familia]) => {
      const data = await buscar(familia);
      return data ? { name: papel, data } : null;
    })
  );

  return carregadas.filter((f): f is FonteDoCartao => f !== null);
}
