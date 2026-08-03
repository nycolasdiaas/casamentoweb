// Prova, em navegador de verdade, que a coreografia de rolagem ESTÁ rodando.
//
// "O componente está importado" não é a mesma coisa que "a animação acontece".
// Este script abre a página, espera o GSAP chegar (ele é carregado por import
// dinâmico, depois da primeira pintura) e confere três coisas:
//
//   1. o GSAP marcou os elementos — `gsap.from` escreve estilo inline com
//      opacity/transform no estado INICIAL das seções abaixo da dobra;
//   2. rolar até uma seção a leva ao estado final (opacity 1);
//   3. com `prefers-reduced-motion: reduce`, nada disso acontece e o conteúdo
//      já nasce visível.
//
//   node scripts/verificar-animacao.mjs <url>

import { spawn } from "node:child_process";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const url = process.argv[2];
if (!url) {
  console.error("uso: node scripts/verificar-animacao.mjs <url>");
  process.exit(1);
}

const PORTA = 9335;
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
  `--remote-debugging-port=${PORTA}`, "about:blank",
]);

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function alvo() {
  for (let i = 0; i < 40; i++) {
    try {
      const abas = await (await fetch(`http://127.0.0.1:${PORTA}/json/list`)).json();
      const p = abas.find((a) => a.type === "page");
      if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl;
    } catch {
      /* ainda subindo */
    }
    await esperar(250);
  }
  throw new Error("Chrome não respondeu");
}

const ws = new WebSocket(await alvo());
let id = 0;
const pendentes = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pendentes.has(m.id)) {
    pendentes.get(m.id)(m);
    pendentes.delete(m.id);
  }
});
function cmd(method, params = {}, prazo = 30_000) {
  const meu = ++id;
  ws.send(JSON.stringify({ id: meu, method, params }));
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(`${method} sem resposta`)), prazo);
    pendentes.set(meu, (m) => { clearTimeout(t); res(m); });
  });
}
async function evaluate(expr) {
  const r = await cmd("Runtime.evaluate", { expression: expr, returnByValue: true });
  return r.result?.result?.value;
}

await new Promise((r) => ws.addEventListener("open", r));
await cmd("Page.enable");

const SONDA_ESTADO = `
(() => {
  const canvas = document.querySelector('.site-canvas');
  if (!canvas) return JSON.stringify({ erro: 'site-canvas não encontrado' });
  const secoes = Array.from(canvas.children);
  // Índice 0 é a capa e nunca é animada, de propósito.
  const abaixoDaDobra = secoes.slice(1);
  const comEstiloInline = abaixoDaDobra.filter((s) =>
    Array.from(s.children).some((f) => /opacity|transform/.test(f.getAttribute('style') || ''))
    || /opacity|transform/.test(s.getAttribute('style') || '')
  );
  return JSON.stringify({
    secoes: secoes.length,
    marcadas: comEstiloInline.length,
    capaIntocada: !/opacity:\\s*0/.test(secoes[0]?.getAttribute('style') || ''),
  });
})()
`;

try {
  // ---- 1 e 2: com movimento permitido ------------------------------------
  await cmd("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });
  await cmd("Page.navigate", { url });
  await esperar(6000);

  const antes = JSON.parse(await evaluate(SONDA_ESTADO));
  if (antes.erro) throw new Error(antes.erro);

  console.log("COM movimento:");
  console.log(`  seções no site        : ${antes.secoes}`);
  console.log(`  marcadas pelo GSAP    : ${antes.marcadas}`);
  console.log(`  capa intocada         : ${antes.capaIntocada ? "sim ✓" : "NÃO ✗"}`);

  // Rola até o fim e confere que o conteúdo chegou ao estado final.
  await evaluate("window.scrollTo(0, document.body.scrollHeight)");
  await esperar(2500);
  const visiveis = await evaluate(`
    (() => {
      const canvas = document.querySelector('.site-canvas');
      const todos = Array.from(canvas.querySelectorAll('*'));
      const invisiveis = todos.filter((e) => {
        const s = getComputedStyle(e);
        return parseFloat(s.opacity) < 0.05 && e.getBoundingClientRect().height > 0;
      });
      return invisiveis.length;
    })()
  `);
  console.log(`  invisíveis após rolar : ${visiveis} ${visiveis === 0 ? "✓" : "✗ (conteúdo preso)"}`);

  // ---- 3: com movimento reduzido -----------------------------------------
  await cmd("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await cmd("Page.navigate", { url });
  await esperar(6000);

  const reduzido = JSON.parse(await evaluate(SONDA_ESTADO));
  console.log("\nCOM movimento REDUZIDO:");
  console.log(`  marcadas pelo GSAP    : ${reduzido.marcadas} ${reduzido.marcadas === 0 ? "✓ (não roda)" : "✗ (deveria ser 0)"}`);

  const presos = await evaluate(`
    (() => {
      const canvas = document.querySelector('.site-canvas');
      return Array.from(canvas.querySelectorAll('*')).filter((e) => {
        const s = getComputedStyle(e);
        return parseFloat(s.opacity) < 0.05 && e.getBoundingClientRect().height > 0;
      }).length;
    })()
  `);
  console.log(`  conteúdo invisível    : ${presos} ${presos === 0 ? "✓" : "✗"}`);
} finally {
  ws.close();
  chrome.kill();
}
