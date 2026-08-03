// Rola a página de verdade e conta o que é revelado a cada passo.
//
// A pergunta que ele responde não é "o componente está lá", e sim: descendo
// devagar, os elementos aparecem UM DE CADA VEZ? E, no fim, sobrou algum
// preso em opacity 0?
//
//   node scripts/verificar-scroll.mjs <url>

import { spawn } from "node:child_process";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const url = process.argv[2];
if (!url) {
  console.error("uso: node scripts/verificar-scroll.mjs <url>");
  process.exit(1);
}
const PORTA = 9338;

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
      /* subindo */
    }
    await esperar(250);
  }
  throw new Error("Chrome não respondeu");
}

const ws = new WebSocket(await alvo());
let id = 0;
const pendentes = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
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
async function ev(expr) {
  const r = await cmd("Runtime.evaluate", { expression: expr, returnByValue: true });
  return r.result?.result?.value;
}

await new Promise((r) => ws.addEventListener("open", r));

try {
  await cmd("Page.enable");
  await cmd("Emulation.setDeviceMetricsOverride", {
    width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
  });
  await cmd("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });

  await cmd("Page.navigate", { url });
  await esperar(6000);

  const altura = await ev("document.body.scrollHeight");
  console.log(`página com ${altura}px de altura\n`);

  // Desce de meia tela em meia tela, como alguém lendo.
  let revelados = 0;
  for (let y = 0; y < altura; y += 400) {
    await ev(`window.scrollTo(0, ${y})`);
    await esperar(420);
    const agora = await ev(`
      document.querySelectorAll('[style*="opacity"], [style*="translate"]').length
    `);
    const animando = await ev(`
      document.getAnimations().filter((a) => a.playState === 'running').length
    `);
    if (agora !== revelados || animando > 0) {
      console.log(
        `  y=${String(y).padStart(5)}  elementos tocados pelo GSAP: ${agora}  animando: ${animando}`
      );
      revelados = agora;
    }
  }

  await ev("window.scrollTo(0, document.body.scrollHeight)");
  await esperar(2000);

  const presos = await ev(`
    (() => {
      const todos = Array.from(document.querySelectorAll('*'));
      return todos.filter((e) => {
        const s = getComputedStyle(e);
        return parseFloat(s.opacity) < 0.05 && e.getBoundingClientRect().height > 0;
      }).length;
    })()
  `);
  console.log(`\ninvisíveis no fim: ${presos} ${presos === 0 ? "✓" : "✗ conteúdo preso"}`);

  // Movimento reduzido: nada pode ficar escondido.
  await cmd("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await cmd("Page.navigate", { url });
  await esperar(5000);
  const presosReduzido = await ev(`
    (() => Array.from(document.querySelectorAll('*')).filter((e) => {
      const s = getComputedStyle(e);
      return parseFloat(s.opacity) < 0.05 && e.getBoundingClientRect().height > 0;
    }).length)()
  `);
  console.log(`movimento reduzido — invisíveis: ${presosReduzido} ${presosReduzido === 0 ? "✓" : "✗"}`);
} finally {
  ws.close();
  chrome.kill();
}
