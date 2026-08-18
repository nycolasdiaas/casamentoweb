/**
 * Reprova `await searchParams` no corpo de uma página com `generateStaticParams`.
 *
 * ── O erro que esta regra substitui ────────────────────────────────────────
 *
 * Com Cache Components, `searchParams` é dado NÃO CACHEADO. Lê-lo no corpo da
 * página trava a rota inteira, e o `next build` reprova com:
 *
 *     Uncached data was accessed outside of <Suspense>.
 *
 * O `next dev` deixa passar. Custou um build reprovado quatro vezes seguidas
 * em `/s/[slug]/meu-convite`, com uma mensagem que aponta para o `<body>` e
 * não para a linha culpada.
 *
 * ── Por que só quando há `generateStaticParams` ────────────────────────────
 *
 * É ele que faz o build PRERENDERIZAR a rota — e é o prerender que estoura.
 * Sem params declarados, a mesma leitura nunca é exercitada no build e o
 * aviso seria ruído: hoje três páginas do painel leem `searchParams` no corpo
 * e passam, porque nada as prerenderiza.
 *
 * O valor da regra é justamente esse caso: o dia em que alguém acrescentar
 * `generateStaticParams` a uma dessas páginas, o erro aparece no editor,
 * apontando a linha, em vez de num build de dez minutos apontando o `<body>`.
 *
 * ── A saída ────────────────────────────────────────────────────────────────
 *
 * Mover a parte que depende de `searchParams` para um componente próprio e
 * embrulhá-lo em `<Suspense>`, passando a promise adiante SEM dar `await`. A
 * casca fica estática e cacheável; só o pedaço que depende da busca espera.
 * Ver `app/s/[slug]/meu-convite/page.tsx`.
 */

const MENSAGEM =
  "`await searchParams` no corpo de uma página com generateStaticParams trava o prerender " +
  "(next build: 'Uncached data was accessed outside of <Suspense>'). " +
  "Mova o trecho que usa searchParams para um componente dentro de <Suspense> e passe a promise sem await. " +
  "Exemplo: app/s/[slug]/meu-convite/page.tsx";

/** A função é um componente/página de topo, e não um filho declarado no arquivo? */
function ehExportDefault(no) {
  let atual = no;
  while (atual) {
    const pai = atual.parent;
    if (!pai) return false;
    if (pai.type === "ExportDefaultDeclaration") return true;
    // `export default function X()` e `const X = ...; export default X`
    if (
      pai.type === "VariableDeclarator" &&
      pai.parent?.parent?.type === "ExportNamedDeclaration"
    ) {
      return false;
    }
    atual = pai;
  }
  return false;
}

const regra = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Impede leitura de searchParams fora de <Suspense> em rota prerenderizada",
    },
    schema: [],
    messages: { forangeSuspense: MENSAGEM },
  },

  create(context) {
    const texto = context.sourceCode ?? context.getSourceCode();
    let temGenerateStaticParams = false;
    const suspeitos = [];

    return {
      // `export function generateStaticParams` / `export const generateStaticParams`
      "ExportNamedDeclaration > FunctionDeclaration[id.name='generateStaticParams']"() {
        temGenerateStaticParams = true;
      },
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='generateStaticParams']"() {
        temGenerateStaticParams = true;
      },

      // `await searchParams` — em qualquer forma: destructuring, membro, direto.
      AwaitExpression(no) {
        const fonte = texto.getText(no.argument);
        if (!/\bsearchParams\b/.test(fonte)) return;
        if (!ehExportDefault(no)) return;
        suspeitos.push(no);
      },

      "Program:exit"() {
        if (!temGenerateStaticParams) return;
        for (const no of suspeitos) {
          context.report({ node: no, messageId: "forangeSuspense" });
        }
      },
    };
  },
};

export default regra;
