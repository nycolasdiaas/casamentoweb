// Pergunta ao navegador quais animações estão rodando ao trocar de tela.
//
// `document.getAnimations()` lista as animações ativas naquele instante — é a
// diferença entre "a classe está no HTML" e "a animação aconteceu".
//
//   node scripts/verificar-transicao.mjs

import { spawn } from "node:child_process";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://localhost:3000";
const PORTA = 9336;

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
async function ev(expr) {
  const r = await cmd("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.result?.exceptionDetails) {
    return `ERRO: ${r.result.exceptionDetails.text}`;
  }
  return r.result?.result?.value;
}

const LISTAR = `
JSON.stringify(document.getAnimations().map((a) => ({
  nome: a.animationName || (a.effect && a.effect.target && 'transition') || '?',
  alvo: a.effect && a.effect.target
    ? a.effect.target.tagName.toLowerCase() + '.' +
      String(a.effect.target.className || '').split(' ').slice(0,2).join('.')
    : '?',
  estado: a.playState,
})))
`;

await new Promise((r) => ws.addEventListener("open", r));
await cmd("Page.enable");
await cmd("Runtime.enable");
const erros=[];
ws.addEventListener("message",(ev)=>{const m=JSON.parse(ev.data);if(m.method==="Runtime.consoleAPICalled"&&m.params.type==="error"){erros.push(m.params.args.map(a=>String(a.value||a.description||"")).join(" ").slice(0,120));}});
await cmd("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
});

try {
  console.log("1) Carga inicial de /conta/entrar");
  await cmd("Page.navigate", { url: `${BASE}/conta/entrar` });
  await esperar(4000);
  console.log("   animações ativas:", await ev(LISTAR));

  console.log("\n2) Existe o wrapper do template na página?");
  console.log(
    "   ",
    await ev(
      `(() => { const d = document.querySelector('main')?.parentElement || document.querySelector('[style*="opacity"]'); return d ? 'sim — <'+d.tagName.toLowerCase()+' class=\"'+d.className+'\">' : 'NÃO ENCONTRADO'; })()`
    )
  );

  console.log("\n3) Navegando por link para /conta/criar (client-side)");
  await ev(`
    (() => {
      const link = Array.from(document.querySelectorAll('a'))
        .find((a) => a.getAttribute('href') === '/conta/criar');
      if (!link) return 'link não achado';
      link.click();
      return 'clicado';
    })()
  `);
  // Lê logo depois: animação de 320ms morre rápido.
  await esperar(160);
  console.log("   URL agora:", await ev("location.pathname"));
  console.log("   animações ativas:", await ev(LISTAR));

  console.log("\n4) Estado computado do wrapper logo após navegar");
  console.log(
    "   ",
    await ev(`
      (() => {
        const d = document.querySelector('.motion-rise-in');
        if (!d) return 'wrapper ausente';
        const s = getComputedStyle(d);
        return 'animation-name=' + s.animationName +
               ' duration=' + s.animationDuration +
               ' opacity=' + s.opacity;
      })()
    `)
  );
  console.log("\n5) Erros no console:", erros.length ? erros : "nenhum ✓");
} finally {
  ws.close();
  chrome.kill();
}
