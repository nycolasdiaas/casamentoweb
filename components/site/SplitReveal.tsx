import { Fragment } from "react";

/**
 * Texto que se revela palavra por palavra, saindo de desfocado para nítido.
 *
 * É o efeito "BlurText" do reactbits.dev — que o Anderson escolheu como
 * referência — escrito em CSS puro. Lá ele vem com framer-motion (~30 KB
 * gzip); aqui o resultado é o mesmo com zero JavaScript, o que importa porque
 * isto roda na CAPA do site do convidado: a primeira dobra, no celular, na
 * rede dele, com meta de LCP de 2,5 s no p75 (§13 do SDD).
 *
 * Server component. Não hidrata, não custa bundle, não adia o texto — o
 * conteúdo já está no HTML e a animação só decide como ele entra.
 *
 * Acessibilidade: os spans são `aria-hidden` e a frase inteira vai no
 * `aria-label` do elemento pai. Sem isso, alguns leitores de tela anunciam
 * palavra por palavra com pausa, como se fossem itens de lista.
 */
export default function SplitReveal({
  text,
  /** ms entre uma palavra e a seguinte */
  passo = 90,
  /** ms antes da primeira palavra — para entrar depois de outro elemento */
  atraso = 0,
  className = "",
}: {
  text: string;
  passo?: number;
  atraso?: number;
  className?: string;
}) {
  // `split` simples: nomes de casal são "Ana & Pedro", "Isabelle e Nycolas".
  // Não há caso de pontuação complexa aqui, e um parser esperto só criaria
  // jeitos novos de quebrar.
  const palavras = text.split(/\s+/).filter(Boolean);

  return (
    <span aria-label={text} className={className}>
      {palavras.map((palavra, i) => (
        <Fragment key={`${palavra}-${i}`}>
          <span
            aria-hidden
            className="motion-word inline-block"
            style={
              {
                "--motion-delay": `${atraso + i * passo}ms`,
              } as React.CSSProperties
            }
          >
            {palavra}
          </span>
          {/* O espaço vive FORA do span, como nó de texto entre dois
              inline-block.
              A primeira versão punha o espaço dentro, com `whitespace-pre`,
              para ele não colapsar. Só que dois inline-block colados, sem nó
              de texto entre eles, não dão ao navegador NENHUM ponto de quebra:
              "Marina & Rafael" não conseguia passar para a linha de baixo e
              vazava para fora do cartão de 390px — cortando o nome do casal no
              celular, que é de onde o convidado abre o convite.
              Como nó de texto separado ele não colapsa (há conteúdo dos dois
              lados) e volta a ser uma oportunidade de quebra. */}
          {i < palavras.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
