/**
 * Varre o código atrás de texto que o produto não deveria escrever.
 *
 * ⚠ **NÃO ESTÁ LIGADO À SUÍTE DE TESTES, DE PROPÓSITO.**
 *
 * Rodado contra a `main` em 25/08/2026, este varredor devolveu **98
 * violações, e ~80 delas são ruído**: `"use cache"` (a diretiva do Next),
 * `"next/cache"` (import), `"Cache-Control"` (cabeçalho), `"preview_ready"`
 * (valor de enum), `"slug"` (nome de coluna) e `"rota"` em "o convidado abre a
 * rota num toque" — que é português, não jargão.
 *
 * O que a medição mostrou: **um literal de string não é texto visível**. O
 * discriminador que a spec pedia ("varra os literais") não existe no nível
 * léxico, e a fuga `// voz-ok:` não salva — com 80 exceções a escrever, ela
 * vira o defeito que documenta evitar.
 *
 * Este arquivo fica como a ferramenta que produziu essa medição, para a
 * próxima sessão não refazê-la. Ligar à suíte depende da decisão registrada
 * em `specs/design-system/006-voz-verificavel/spec.md`, "Perguntas em
 * aberto", item 0b.
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
      anotar(no.text, no.getStart(fonte));
    } else if (ts.isJsxText(no)) {
      anotar(no.text, no.getStart(fonte));
    } else if (ts.isTemplateExpression(no)) {
      anotar(no.head.text, no.head.getStart(fonte));
      for (const p of no.templateSpans) {
        anotar(p.literal.text, p.literal.getStart(fonte));
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
  const acima = linhas[linha - 2];
  return typeof acima === "string" && /\/\/\s*voz-ok:/.test(acima);
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
