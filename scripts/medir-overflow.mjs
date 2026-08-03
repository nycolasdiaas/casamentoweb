// Encontra QUEM está estourando a largura de uma página.
//
// Overflow horizontal é o defeito mais chato de diagnosticar por screenshot:
// a página inteira aparece cortada e qualquer elemento parece culpado. Este
// script pergunta ao navegador em vez de adivinhar — lista os elementos cuja
// borda direita passa da largura do documento, do pior para o menos pior.
//
//   node scripts/medir-overflow.mjs <url> [largura]

import { spawn } from "node:child_process";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const url = process.argv[2];
const largura = Number(process.argv[3] ?? 390);
if (!url) {
  console.error("uso: node scripts/medir-overflow.mjs <url> [largura]");
  process.exit(1);
}

const PORTA = 9333;
const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORTA}`,
  `--window-size=${largura},900`,
  "about:blank",
]);

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function alvo() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORTA}/json/list`);
      const abas = await r.json();
      const p = abas.find((a) => a.type === "page");
      if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl;
    } catch {
      /* ainda subindo */
    }
    await esperar(250);
  }
  throw new Error("Chrome não respondeu na porta de depuração");
}

const SONDA = `
(() => {
  const doc = document.documentElement;
  const limite = doc.clientWidth;
  const fora = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > limite + 1 || r.left < -1) {
      // Só quem estoura por conta própria: se o pai já estoura, o filho é
      // consequência, não causa.
      const pai = el.parentElement?.getBoundingClientRect();
      const paiEstoura = pai && (pai.right > limite + 1 || pai.left < -1);
      fora.push({
        proprio: !paiEstoura,
        tag: el.tagName.toLowerCase(),
        classe: (el.getAttribute('class') || '').slice(0, 90),
        left: Math.round(r.left),
        right: Math.round(r.right),
        largura: Math.round(r.width),
        texto: (el.textContent || '').trim().slice(0, 40),
      });
    }
  }
  return JSON.stringify({
    janela: window.innerWidth,
    documento: doc.clientWidth,
    rolagem: doc.scrollWidth,
    culpados: fora.filter((f) => f.proprio).slice(0, 12),
  });
})()
`;

const ws = new WebSocket(await alvo());
let id = 0;
const pendentes = new Map();

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pendentes.has(msg.id)) {
    pendentes.get(msg.id)(msg);
    pendentes.delete(msg.id);
  }
});

function cmd(method, params = {}) {
  const meu = ++id;
  ws.send(JSON.stringify({ id: meu, method, params }));
  return new Promise((res) => pendentes.set(meu, res));
}

await new Promise((r) => ws.addEventListener("open", r));

await cmd("Page.enable");

// Emulação, e NÃO `--window-size`.
//
// No Windows o Chrome tem largura mínima de janela (~480px) e simplesmente
// ignora `--window-size=390`. O `--screenshot` recorta a imagem para 390, e o
// resultado é uma captura que PARECE ter texto cortado quando na verdade a
// página foi desenhada a 482px. Isso já custou uma caçada a um bug de layout
// que não existia. `Emulation.setDeviceMetricsOverride` impõe o viewport de
// verdade, abaixo do mínimo da janela.
await cmd("Emulation.setDeviceMetricsOverride", {
  width: largura,
  height: 900,
  deviceScaleFactor: 1,
  mobile: largura < 700,
});

await cmd("Page.navigate", { url });
await esperar(5000);

const r = await cmd("Runtime.evaluate", {
  expression: SONDA,
  returnByValue: true,
});

const dados = JSON.parse(r.result.result.value);
console.log(`janela ${dados.janela}px · documento ${dados.documento}px · rolagem ${dados.rolagem}px`);
if (dados.rolagem <= dados.documento + 1) {
  console.log("sem estouro horizontal ✓");
} else {
  console.log(`\nestouro de ${dados.rolagem - dados.documento}px. Culpados:\n`);
  for (const c of dados.culpados) {
    console.log(`  <${c.tag}> ${c.left}→${c.right} (${c.largura}px)`);
    console.log(`     class: ${c.classe}`);
    if (c.texto) console.log(`     texto: ${c.texto}`);
  }
}

ws.close();
chrome.kill();
