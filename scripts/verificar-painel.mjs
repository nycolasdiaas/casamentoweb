// Testa o painel LOGADO, como o casal usa: entra pelo formulário e navega
// entre as telas, perguntando ao navegador o que anima em cada momento.
//
// Existe porque "funciona no diagnóstico mas não na prática" — os componentes
// estavam certos e os gatilhos não. Testar componente isolado não pega isso;
// só percorrer o fluxo de verdade pega.
//
//   node scripts/verificar-painel.mjs [email] [senha]

import { spawn } from "node:child_process";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";
const EMAIL = process.argv[2] ?? "casal.teste@enlace.com";
const SENHA = process.argv[3] ?? "enlace-teste-2026";
const PORTA = 9337;

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
  `--remote-debugging-port=${PORTA}`, "--window-size=1280,900", "about:blank",
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
  const r = await cmd("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  return r.result?.result?.value;
}

const ANIMANDO = `
JSON.stringify(document.getAnimations()
  .filter((a) => a.playState === 'running')
  .map((a) => a.animationName || 'waapi'))
`;

// Preenche input NÃO controlado disparando os eventos que o React escuta.
const preencher = (seletor, valor) => `
(() => {
  const el = document.querySelector('${seletor}');
  if (!el) return 'campo não achado: ${seletor}';
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, ${JSON.stringify(valor)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return 'ok';
})()
`;

// Esperar o socket abrir antes de qualquer comando — sem isto o primeiro
// `send` estoura com "Sent before connected".
await new Promise((r) => ws.addEventListener("open", r));

try {
  await cmd("Page.enable");
  await cmd("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });

  console.log("1) Abrindo /conta/entrar");
  await cmd("Page.navigate", { url: `${BASE}/conta/entrar` });
  await esperar(3500);

  console.log("   email :", await ev(preencher('input[name="email"]', EMAIL)));
  console.log("   senha :", await ev(preencher('input[name="password"]', SENHA)));

  console.log("\n2) Clicando em Entrar e olhando o véu de carregamento");
  await ev(`document.querySelector('button[type="submit"]').click(); 'clicado'`);

  // Amostra rápida: o véu tem piso de ~700ms, então precisa aparecer aqui.
  for (const t of [120, 350, 650]) {
    await esperar(t === 120 ? 120 : 230);
    const veu = await ev(`
      (() => {
        const el = Array.from(document.querySelectorAll('[role="status"]'))
          .find((e) => /Entrando na conta/.test(e.textContent || ''));
        return el ? 'VISÍVEL' : 'ausente';
      })()
    `);
    console.log(`   +${t}ms  véu: ${veu}  animando: ${await ev(ANIMANDO)}`);
  }

  await esperar(3500);
  console.log("   URL após login:", await ev("location.pathname"));

  console.log("\n3) Navegando dentro do painel (troca de tela)");
  const links = await ev(`
    JSON.stringify(Array.from(document.querySelectorAll('a[href^="/conta"]'))
      .map((a) => a.getAttribute('href')).filter((h,i,s) => s.indexOf(h)===i).slice(0,6))
  `);
  console.log("   links disponíveis:", links);

  const atual = await ev("location.pathname");
  const destino =
    JSON.parse(links).find((h) => h !== atual) ?? "/conta/pedidos";
  await ev(`
    (() => {
      const a = document.querySelector('a[href="${destino}"]');
      if (!a) return 'link não achado';
      a.click(); return 'clicado';
    })()
  `);
  console.log(`   -> ${destino}`);
  for (const t of [80, 200, 400, 700, 1100, 1600]) {
    await esperar(t === 80 ? 80 : 200);
    const marca = await ev(`(() => { const e = Array.from(document.querySelectorAll('[role="status"]')).find((x) => /Abrindo/.test(x.textContent||'')); return e ? 'espera VISÍVEL' : '-'; })()`);
    console.log(`   +${t}ms  ${marca}  animando: ${await ev(ANIMANDO)}`);
  }
  console.log("   URL agora:", await ev("location.pathname"));
} finally {
  ws.close();
  chrome.kill();
}
