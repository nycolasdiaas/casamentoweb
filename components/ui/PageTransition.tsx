"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Transição de entrada de cada tela do painel.
 *
 * ── O bug que esta versão conserta ──────────────────────────────────────────
 *
 * A versão anterior usava `<m.div initial={...}>` do Motion e escolhia o
 * estado inicial com `useReducedMotion()`. Isso quebrava a hidratação: o
 * SERVIDOR renderizava `opacity:0; filter:blur(4px); transform:...` e o
 * CLIENTE renderizava só `opacity:0`, porque `useReducedMotion` só existe no
 * navegador. Quando o React acusa divergência ele NÃO corrige o nó — o HTML do
 * servidor fica como veio, com o desfoque inline, e a animação nunca roda.
 * Resultado: a tela ficava embaçada e não saía mais.
 *
 * ── A regra que esta versão respeita ────────────────────────────────────────
 *
 * **O servidor nunca renderiza conteúdo escondido.** O HTML sai visível; o
 * estado inicial da animação é aplicado no cliente, num `useLayoutEffect`
 * (antes da pintura, então não pisca). Se o JS não carregar — rede ruim,
 * script bloqueado — o casal vê a tela inteira, só sem transição.
 *
 * É a mesma escolha do `gsap.from` na coreografia do site do convidado, e pelo
 * mesmo motivo: animação é enfeite, conteúdo é o produto. Nenhuma animação
 * pode ser capaz de deixar a tela em branco.
 */

/* Os números são do `HANDOFF-motion.md` §3, item 1 — não são gosto.

   O percurso é 22px no eixo X, a duração é `--t-lento` (620ms) e a entrada
   começa 120ms depois. O eixo mudou de Y para X porque o push de rota é
   deslocamento LATERAL: ele diz "você percorreu um caminho", que é a mesma
   coisa que `.motion-step-next`/`.motion-step-prev` já dizem na troca de
   etapa do questionário. Subir 22px é o vocabulário de card entrando numa
   lista, e uma tela inteira que sobe como card não lê como navegação. */
const PERCURSO = 22;
const DURACAO = 620;
const ATRASO = 120;

/* `--t-reduzido` do globals.css. O mesmo valor, para o movimento reduzido não
   ter duas verdades — 160ms era rápido demais para ser registrado como
   transição, e o CSS já tinha assentado em 320. */
const DURACAO_REDUZIDA = 320;

const CHAVE_NAVEGACAO = "enlace:nav";

type Navegacao = { profundidade: number; caminho: string; sentido: 1 | -1 };

/**
 * Para que lado a tela entra.
 *
 * `history.length` cresce ao avançar e fica igual (ou diminui) ao voltar — é o
 * único sinal de direção que o App Router entrega sem guardar uma pilha
 * própria. Vive em `sessionStorage` porque é da aba, não do usuário: duas abas
 * do painel têm históricos independentes.
 *
 * ── Por que guarda o CAMINHO junto, e não só a profundidade ────────────────
 *
 * Porque há **dois `PageTransition` na árvore ao mesmo tempo**. Medido: ao
 * navegar de /conta/entrar para /conta/criar, `document.querySelectorAll(
 * '[data-transicao="rota"]')` devolve 2 — o React mantém a casca que sai
 * montada enquanto a que entra monta. Os dois chamam esta função na mesma
 * navegação.
 *
 * A primeira versão gravava ao ler, e por isso a segunda instância comparava
 * `history.length` com o valor que a primeira acabara de escrever: dava
 * `3 > 3` = falso, e a mesma navegação animava um lado para cada metade da
 * tela. Guardando o caminho, quem chega depois **reaproveita** o sentido já
 * decidido em vez de recalculá-lo sobre estado que ele mesmo sujou.
 *
 * Na primeira montagem da sessão não há o que comparar, e "avançar" é o
 * palpite certo — quem acabou de abrir o painel está entrando, não voltando.
 *
 * `try/catch` porque `sessionStorage` lança em modo privado e com cookies
 * bloqueados. Direção errada é um detalhe; tela que não aparece é um defeito.
 */
function direcao(caminho: string): 1 | -1 {
  try {
    const bruto = sessionStorage.getItem(CHAVE_NAVEGACAO);
    const antes: Navegacao | null = bruto ? JSON.parse(bruto) : null;
    const agora = window.history.length;

    // Segunda instância da MESMA navegação: o sentido já foi decidido.
    if (antes && antes.caminho === caminho) return antes.sentido;

    const sentido: 1 | -1 = !antes || agora > antes.profundidade ? 1 : -1;
    sessionStorage.setItem(
      CHAVE_NAVEGACAO,
      JSON.stringify({ profundidade: agora, caminho, sentido } satisfies Navegacao)
    );
    return sentido;
  } catch {
    return 1;
  }
}

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Perguntado aqui, e não no render: é informação do navegador, e lê-la
    // durante o render é o que quebrava a hidratação.
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ligado = document.documentElement.dataset.movimento === "ligado";
    const reduzir = menos && !ligado;

    /* Sem `blur` e sem `scale`, os dois nominalmente proibidos pelo §1 do
       handoff ("Nada de blur, gradientes animados, parallax, bounce
       exagerado"). O desfoque tinha entrado como textura e é justamente o que
       o pacote de design chama de decoração: ele não confirma ação nenhuma e
       custa uma camada de composição a cada troca de aba. */
    const quadros = reduzir
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [
          {
            opacity: 0,
            transform: `translateX(${direcao(pathname) * PERCURSO}px)`,
          },
          { opacity: 1, transform: "none" },
        ];

    // A Web Animations API é nativa — sem dependência, sem risco de o
    // conteúdo ficar presente num estado intermediário. `fill` não é usado de
    // propósito: quando a animação acaba, o elemento volta ao estilo do CSS,
    // que é o estado visível.
    const anim = el.animate(quadros, {
      duration: reduzir ? DURACAO_REDUZIDA : DURACAO,
      /* Os 120ms de atraso não são folga: eles deixam o servidor entregar o
         conteúdo antes de a entrada começar. Sem eles a animação roda sobre
         uma tela ainda montando, e o que se vê é o conteúdo pulando no meio
         do percurso. Sob movimento reduzido o atraso sai — ali a transição é
         confirmação, e confirmação atrasada é confirmação pior. */
      delay: reduzir ? 0 : ATRASO,
      easing: reduzir
        ? "cubic-bezier(0.65, 0, 0.35, 1)" // --e-suave
        : "cubic-bezier(0.16, 1, 0.3, 1)", // --e-saida
    });

    return () => anim.cancel();
  }, [pathname]);

  /* `flex flex-1 flex-col` não é enfeite: este div entra ENTRE o <body> (que é
     `min-h-full flex flex-col`) e o <main> de cada tela (que pede `flex-1`).
     Sem classe nenhuma ele era um bloco de altura automática, e o `flex-1` do
     <main> ficava sem contra quem crescer — a tela parava na altura do
     conteúdo e o resto do viewport virava fundo pelado do body. Aparecia em
     toda tela do painel e nas quatro telas de porta (entrar, criar, esqueci,
     redefinir), que é onde a falta mais se via.

     Repassar o crescimento exige as duas metades: `flex-1` para ele mesmo
     esticar dentro do body, e `flex flex-col` para que o filho possa esticar
     dentro dele. Sem `min-h-0` de propósito — o padrão `min-height: auto`
     é o que impede uma tela de conteúdo longo de ser espremida. */
  /* `data-transicao` e não `id`: o componente aparece uma vez por árvore, mas
     /conta e /conta/pedidos/<id> montam cascas aninhadas, e um `id` repetido
     seria HTML inválido. É por ele que dá para medir a animação de fora. */
  return (
    <div ref={ref} data-transicao="rota" className="flex flex-1 flex-col">
      {children}
    </div>
  );
}
