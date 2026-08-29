import type { ThemePalette } from "@/lib/theme/spec";
import type { Bloco, InviteDoc } from "./inviteDoc";

/**
 * Troca o tema do convite sem refazer o convite.
 *
 * ── O que "trocar de modelo" significa aqui ────────────────────────────────
 *
 * Cor e fonte. Nada mais. Posição, tamanho, texto e ordem das camadas ficam
 * exatamente onde estão.
 *
 * A outra leitura possível — clicar num modelo e receber o desenho daquele
 * modelo, como num Canva — apagaria o trabalho do casal num clique. E ela
 * pressupõe seis layouts de convite desenhados, um por estilo, que **não
 * existem**: `conviteInicial` tem um layout só, que recebe cores diferentes.
 * As seis miniaturas do artboard são o mesmo cartão com cores trocadas —
 * exatamente o que esta função produz.
 *
 * ── A regra que protege a escolha do casal ─────────────────────────────────
 *
 * Só troca a cor que **ainda é a do tema anterior**. Um vermelho que o casal
 * escolheu à mão não corresponde a nenhum papel do tema antigo, então nenhuma
 * troca o alcança — ele atravessa a mudança intacto.
 *
 * É o que separa "re-tematizar" de "sobrescrever". Sem isso, a ferramenta
 * discutiria com quem já tinha decidido.
 */

/** Os quatro papéis, na ordem em que se comparam. */
const PAPEIS = ["ink", "paper", "accent", "outer"] as const;

/** A cor equivalente no tema novo, ou a mesma cor se ela não era do tema. */
function trocar(
  valor: string,
  antes: ThemePalette,
  depois: ThemePalette
): string {
  /* Comparação sem diferenciar maiúscula: o casal escolhe cor num
     `<input type="color">`, que devolve minúsculas, mas os presets dos moldes
     e um `doc` gravado por versão antiga podem trazer `#B8985F`. Sem isto, a
     mesma cor em caixa diferente sobreviveria à troca por engano. */
  const alvo = valor.toLowerCase();
  for (const papel of PAPEIS) {
    if (antes[papel].toLowerCase() === alvo) return depois[papel];
  }
  return valor;
}

function retematizarBloco(
  b: Bloco,
  antes: ThemePalette,
  depois: ThemePalette
): Bloco {
  const t = (v: string) => trocar(v, antes, depois);

  switch (b.tipo) {
    case "texto":
      return { ...b, cor: t(b.cor) };
    case "linha":
      return { ...b, cor: t(b.cor) };
    case "botao":
      return { ...b, fundo: t(b.fundo), cor: t(b.cor) };
    case "forma":
      return {
        ...b,
        /* Preenchimento vazio é a forma só de contorno, e continua vazio:
           passar `""` por `trocar` daria a cor de nenhum papel e o resultado
           seria o mesmo, mas o `if` deixa a intenção escrita. */
        preenchimento: b.preenchimento ? t(b.preenchimento) : b.preenchimento,
        contorno: b.contorno ? t(b.contorno) : b.contorno,
      };
    case "foto":
      // Foto não tem cor. Tocar em `raio` ou `proporcao` aqui seria mexer no
      // desenho, que é justamente o que esta função não faz.
      return b;
  }
}

export function retematizarConvite(
  doc: InviteDoc,
  antes: ThemePalette,
  depois: ThemePalette
): InviteDoc {
  return {
    ...doc,
    /* `largura` e `altura` NÃO entram. Re-tematizar é cor; mexer no formato
       seria refazer o convite do casal — e ele pode ter escolhido story 9:16
       de propósito. */
    fundo: trocar(doc.fundo, antes, depois),
    blocos: doc.blocos.map((b) => retematizarBloco(b, antes, depois)),
  };
}
