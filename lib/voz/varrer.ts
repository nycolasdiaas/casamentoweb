/**
 * Varre o código atrás de texto que o produto não deveria escrever.
 *
 * Ligado à suíte em `varrer.test.ts`: o produto inteiro passa, e um texto novo
 * fora da voz reprova o build.
 *
 * ── Como ele saiu de 98 achados para zero ──────────────────────────────────
 *
 * A primeira medição, em 25/08/2026, devolveu **98 violações e ~80 eram
 * ruído**: `"use cache"` (diretiva do Next), `"next/cache"` (import),
 * `"preview_ready"` (valor de enum), `"slug"` (nome de coluna). A conclusão
 * registrada foi que *"um literal de string não é texto visível"* — certa
 * sobre o que faltava, errada sobre ser impossível.
 *
 * **O discriminador não é léxico, é posicional.** Não é a palavra que decide,
 * é onde ela está: import é import, diretiva é diretiva, chave de objeto é
 * chave, argumento de `cacheTag` é etiqueta de cache. Ver `ehTextoDeGente`.
 *
 * Com o filtro sobraram **18, e todos eram reais**. Corrigi-los revelou mais
 * quatro escondidos atrás do ruído — incluindo os três `RSVP` que o convidado
 * via nos moldes Editorial e Toscana, a pior violação de voz que o produto
 * tinha no ar.
 *
 * ── Por que o compilador do TypeScript, e não expressão regular ────────────
 *
 * Porque a pergunta não é "o arquivo contém a palavra", é "a palavra está num
 * lugar que alguém LÊ". Comentário não conta — e este repositório é escrito
 * em comentário: `lib/templates/` explica molde, cache e render em português
 * o tempo todo, e uma varredura por regex reprovaria a documentação junto com
 * a interface.
 *
 * O `ts.forEachChild` distingue os três casos que importam sem heurística:
 * `StringLiteral`, `JsxText` e template literal. Comentário simplesmente não
 * é nó.
 *
 * ── Por que texto de JSX é obrigatório ─────────────────────────────────────
 *
 * As três violações conhecidas — `RSVP` no Editorial (duas vezes) e
 * `Kindly RSVP` no Toscana — são **nós de texto**, não literais de string. Um
 * varredor que só olhasse `StringLiteral` passaria verde com a pior violação
 * de voz do produto no ar. Ver `specs/design-system/006-voz-verificavel`,
 * FR-004b.
 */

import ts from "typescript";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  achatar,
  regexDoTermo,
  TRADUCAO,
  PALAVRAS_PROIBIDAS,
  TERMOS_TECNICOS,
  PALAVRAS_DE_ESPERA,
  SO_PARA_O_CONVIDADO,
  ARQUIVOS_DE_ESPERA,
} from "./vocabulario";

export type Violacao = {
  arquivo: string;
  linha: number;
  termo: string;
  trecho: string;
  comoEscrever: string;
};

const RAIZES = ["app", "components", "lib"];

/**
 * O que a varredura não olha.
 *
 * `app/pacotes/estilos/**` são as prévias com casal fictício, onde inventar
 * contexto é justamente o trabalho (SDD §4.4.1). `lib/buildPrompt.ts` é o
 * prompt do fluxo antigo, que fala com um LLM e não com o casal. `lib/voz/`
 * é esta própria pasta: as listas contêm as palavras por definição.
 */
const IGNORADOS = [
  join("app", "pacotes", "estilos"),
  join("lib", "buildPrompt.ts"),
  join("lib", "voz"),
];

function ehIgnorado(caminho: string): boolean {
  return IGNORADOS.some((i) => caminho.startsWith(i));
}

function arquivosDe(dir: string, raiz: string, saida: string[]): void {
  for (const nome of readdirSync(dir)) {
    const cheio = join(dir, nome);
    const rel = relative(raiz, cheio);
    if (statSync(cheio).isDirectory()) {
      if (nome === "node_modules") continue;
      arquivosDe(cheio, raiz, saida);
      continue;
    }
    if (!/\.tsx?$/.test(nome)) continue;
    if (/\.test\.tsx?$/.test(nome)) continue;
    if (ehIgnorado(rel.split(sep).join(sep))) continue;
    saida.push(cheio);
  }
}

export function listarArquivos(raiz: string): string[] {
  const saida: string[] = [];
  for (const r of RAIZES) {
    const dir = join(raiz, r);
    try {
      if (statSync(dir).isDirectory()) arquivosDe(dir, raiz, saida);
    } catch {
      /* raiz que não existe neste checkout não é erro */
    }
  }
  return saida.sort();
}

/** Um pedaço de texto que alguém lê, com a linha em que ele está. */
type Pedaco = { texto: string; linha: number; pos: number };

/**
 * Atributos de JSX que carregam TEXTO. O resto carrega endereço, classe e id.
 *
 * `alt` e `aria-label` entram porque são lidos em voz alta — texto que só o
 * leitor de tela ouve continua sendo texto que alguém lê.
 */
const ATRIBUTOS_DE_TEXTO = new Set([
  "alt",
  "title",
  "placeholder",
  "aria-label",
  "aria-description",
  "label",
  "rotulo",
  "titulo",
  "texto",
  "descricao",
  "confirmar",
  "manter",
  "mensagem",
  "aviso",
  "apoio",
  "legenda",
]);

/**
 * Funções cujos argumentos são NOME DE COISA, nunca frase.
 *
 * `cacheTag("site-view:x")`, `querySelector("nav")`,
 * `localStorage.getItem("invite:1")` — todas recebem identificador. Varrer o
 * argumento delas foi de onde saiu metade do ruído da primeira medição.
 */
const CHAMADAS_TECNICAS = new Set([
  "cacheTag",
  "cacheLife",
  "revalidateTag",
  "updateTag",
  "revalidatePath",
  "redirect",
  "permanentRedirect",
  "notFound",
  "getItem",
  "setItem",
  "removeItem",
  "getAttribute",
  "setAttribute",
  "querySelector",
  "querySelectorAll",
  "addEventListener",
  "removeEventListener",
  "createElement",
  "matchMedia",
  "getPropertyValue",
  "startsWith",
  "endsWith",
  "includes",
  "replace",
  "replaceAll",
  "split",
  "join",
  "test",
  "match",
  "encodeURIComponent",
  /* `falhou(res, "assinar upload")` monta o Error da camada de Storage — a
     mesma razão de `new Error`: é mensagem de log, não de tela. */
  "falhou",
  "error",
  "warn",
  "log",
  "info",
  "get",
  "set",
  "has",
  "delete",
]);

/**
 * Este literal é uma frase que alguém lê, ou o nome de uma coisa?
 *
 * ── Por que esta função existe ─────────────────────────────────────────────
 *
 * A primeira medição desta ferramenta devolveu 98 achados, e ~80 eram ruído:
 * `"use cache"` (diretiva), `"next/cache"` (import), `"preview_ready"` (valor
 * de enum), `"slug"` (nome de coluna), `"rota"` (português comum, num
 * comentário de código que virou string). A conclusão foi que **um literal de
 * string não é texto visível** — e ela estava certa sobre o que faltava, não
 * sobre ser impossível.
 *
 * O discriminador não é léxico, é **posicional**: o que decide não é a
 * palavra, é onde ela está. Import é import, diretiva é diretiva, chave de
 * objeto é chave, argumento de `cacheTag` é etiqueta de cache. Nada disso é
 * frase, e o compilador sabe distinguir cada um sem heurística.
 *
 * A única heurística que sobrou é a última, e ela é conservadora: uma palavra
 * só, minúscula, sem espaço, é nome de coisa. `"published"`, `"convite"`,
 * `"rsvp"` caem aqui. Uma frase que alguém lê tem espaço ou começa com
 * maiúscula — e as três violações reais do produto (`RSVP`, `Kindly RSVP`)
 * são nós de JSX, que nem passam por esta função.
 */
function ehTextoDeGente(
  no: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | ts.TemplateExpression
): boolean {
  const pai = no.parent;

  // Import, export, `require` — endereço de módulo.
  if (
    ts.isImportDeclaration(pai) ||
    ts.isExportDeclaration(pai) ||
    ts.isImportTypeNode(pai) ||
    ts.isExternalModuleReference(pai)
  ) {
    return false;
  }

  // `"use client"`, `"use cache"`, `"use server"` — diretiva de linguagem.
  if (ts.isExpressionStatement(pai)) return false;

  // Chave de objeto e nome de propriedade: `{ "aria-label": … }`, `obj["slug"]`.
  if (
    (ts.isPropertyAssignment(pai) && pai.name === no) ||
    ts.isComputedPropertyName(pai) ||
    ts.isElementAccessExpression(pai)
  ) {
    return false;
  }

  // Tipo literal: `type X = "convite" | "site"`.
  if (ts.isLiteralTypeNode(pai)) return false;

  // Comparação: `if (status === "preview_ready")` — valor, não frase.
  if (
    ts.isBinaryExpression(pai) &&
    (pai.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
      pai.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      pai.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken ||
      pai.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken)
  ) {
    return false;
  }

  // Case de switch: `case "published":`.
  if (ts.isCaseClause(pai)) return false;

  // Atributo de JSX: só os que carregam texto.
  if (ts.isJsxAttribute(pai)) {
    return ATRIBUTOS_DE_TEXTO.has(pai.name.getText());
  }

  /* `throw new Error("…")` é mensagem de DESENVOLVEDOR. O produto nunca a
     mostra ao casal: as actions devolvem `{ error }` com texto escrito para
     quem lê, e o `Error` fica no log. Varrer o argumento dele reprovaria a
     mensagem que existe justamente para quem está depurando. */
  if (ts.isNewExpression(pai) && pai.expression.getText().endsWith("Error")) {
    return false;
  }

  // Argumento de função técnica.
  if (ts.isCallExpression(pai)) {
    const alvo = pai.expression;
    const nome = ts.isPropertyAccessExpression(alvo)
      ? alvo.name.getText()
      : alvo.getText();
    if (CHAMADAS_TECNICAS.has(nome)) return false;
  }

  /* Uma palavra só, minúscula, sem espaço: nome de coisa. Frase que alguém lê
     tem espaço ou começa com maiúscula.

     Para template expression o teste é sobre a PARTE FIXA antes da primeira
     interpolação — `` `site-preview:${id}` `` tem cabeça `site-preview:`, que
     é nome de coisa pelo mesmo critério. */
  const t = (ts.isTemplateExpression(no) ? no.head.text : no.text).trim();
  if (!t.includes(" ") && t === t.toLowerCase()) return false;

  return true;
}

function pedacosVisiveis(fonte: ts.SourceFile): Pedaco[] {
  const pedacos: Pedaco[] = [];

  const anotar = (texto: string, pos: number) => {
    const limpo = texto.trim();
    if (!limpo) return;
    pedacos.push({
      texto: limpo,
      linha: fonte.getLineAndCharacterOfPosition(pos).line + 1,
      pos,
    });
  };

  const andar = (no: ts.Node) => {
    if (ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) {
      if (ehTextoDeGente(no)) anotar(no.text, no.getStart(fonte));
    } else if (ts.isJsxText(no)) {
      anotar(no.text, no.getStart(fonte));
    } else if (ts.isTemplateExpression(no)) {
      /* O mesmo teste de contexto do literal simples: `` cacheTag(`site-preview:${id}`) ``
         é etiqueta de cache, não frase. Sem isto, toda tag interpolada do
         projeto entrava na varredura pelo pedaço fixo dela. */
      if (ehTextoDeGente(no)) {
        anotar(no.head.text, no.head.getStart(fonte));
        for (const p of no.templateSpans) {
          anotar(p.literal.text, p.literal.getStart(fonte));
        }
      }
    }
    ts.forEachChild(no, andar);
  };

  andar(fonte);
  return pedacos;
}

/**
 * A fuga explícita: `// voz-ok: <motivo>` na linha imediatamente acima.
 *
 * Sem ela, a primeira ocorrência legítima transformaria o teste em algo que se
 * desliga inteiro. Com ela, cada exceção fica escrita, com motivo, ao lado do
 * caso — que é onde a próxima pessoa vai procurar.
 */
function temFuga(linhas: string[], linha: number): boolean {
  /* Cinco linhas de janela, e não uma.
     
     O motivo de uma exceção não cabe em setenta caracteres, então ela quase
     sempre é um comentário de três ou quatro linhas — e num JSX ele vem como
     bloco `{/* … *​/}`, não como `//`. Exigir a linha imediatamente acima
     obrigaria a escrever o motivo numa linha só, o que é o mesmo que não
     escrever. */
  const inicio = Math.max(linha - 6, 0);
  return linhas
    .slice(inicio, linha - 1)
    .some((l) => /voz-ok:/.test(l));
}

export function varrerArquivo(caminho: string, raiz: string): Violacao[] {
  const bruto = readFileSync(caminho, "utf8");
  const rel = relative(raiz, caminho).split(sep).join("/");
  const linhas = bruto.split("\n");
  const fonte = ts.createSourceFile(
    caminho,
    bruto,
    ts.ScriptTarget.Latest,
    true,
    /\.tsx$/.test(caminho) ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const naEspera = (ARQUIVOS_DE_ESPERA as readonly string[]).includes(rel);
  const achados: Violacao[] = [];

  for (const pedaco of pedacosVisiveis(fonte)) {
    if (temFuga(linhas, pedaco.linha)) continue;

    const achatado = achatar(pedaco.texto);

    const conferir = (termos: readonly string[], sensivel: boolean) => {
      for (const termo of termos) {
        const alvo = sensivel ? pedaco.texto : achatado;
        const agulha = sensivel ? termo : achatar(termo);
        if (!regexDoTermo(agulha, sensivel).test(alvo)) continue;
        achados.push({
          arquivo: rel,
          linha: pedaco.linha,
          termo,
          trecho: pedaco.texto.slice(0, 70),
          comoEscrever: TRADUCAO[termo] ?? "ver a prancha V5",
        });
      }
    };

    conferir(PALAVRAS_PROIBIDAS, false);
    conferir(TERMOS_TECNICOS, false);
    conferir(SO_PARA_O_CONVIDADO, true);
    if (naEspera) conferir(PALAVRAS_DE_ESPERA, false);
  }

  return achados;
}

export function varrer(raiz: string): Violacao[] {
  return listarArquivos(raiz).flatMap((f) => varrerArquivo(f, raiz));
}

/** A mensagem que FR-008 pede: arquivo, linha, palavra e o que escrever. */
export function descrever(v: Violacao): string {
  return `${v.arquivo}:${v.linha} — "${v.termo}" → ${v.comoEscrever}\n    ${v.trecho}`;
}
