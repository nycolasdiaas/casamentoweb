// Fotografa cada molde em desktop e celular, com site descartável de verdade.
//
// Mesmo caminho do verify:template (site + conteúdo + seções com tema
// coerente), mas em vez de só conferir o HTML, tira screenshot. É o que
// permite julgar a ESCALA e a COMPOSIÇÃO no widescreen — coisa que nenhum
// teste automatizado vê.
//
// POR QUE PROTOCOLO E NÃO `--screenshot`: no Windows o Chrome tem largura
// mínima de janela (~480px) e IGNORA `--window-size=390`. A imagem sai
// recortada para 390, mas a página foi DESENHADA a 482 — e a captura parece
// cheia de texto cortado que não existe. Custou uma caçada a um bug de layout
// imaginário. `Emulation.setDeviceMetricsOverride` impõe o viewport de verdade.
//
//   npm run shot:template <pasta> <ids...>

import postgres from "postgres";
import crypto from "node:crypto";
import { writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local" });

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";
const PORTA = 9334;
const SAIDA = process.argv[2] ?? ".";
const moldes = process.argv.slice(3);

const TELAS = [
  { nome: "desktop", largura: 1440, altura: 2600 },
  { nome: "mobile", largura: 390, altura: 1500 },
];

const SECOES = [
  "cover", "countdown", "story", "details",
  "gallery", "rsvp", "gifts", "album", "footer",
];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- Chrome via protocolo -------------------------------------------------

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
  `--remote-debugging-port=${PORTA}`, "about:blank",
]);

async function alvo() {
  for (let i = 0; i < 40; i++) {
    try {
      const abas = await (
        await fetch(`http://127.0.0.1:${PORTA}/json/list`)
      ).json();
      const p = abas.find((a) => a.type === "page");
      if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl;
    } catch {
      /* ainda subindo */
    }
    await esperar(250);
  }
  throw new Error("Chrome não respondeu na porta de depuração");
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
// Todo comando tem prazo. Sem isso, um CDP que não responde (acontece com
// captura grande) deixa a promessa pendente para sempre e o script trava sem
// nunca chegar ao `finally` — ou seja, sem apagar os sites descartáveis.
function cmd(method, params = {}, prazoMs = 30_000) {
  const meu = ++id;
  ws.send(JSON.stringify({ id: meu, method, params }));
  return new Promise((res, rej) => {
    const alarme = setTimeout(() => {
      pendentes.delete(meu);
      rej(new Error(`CDP ${method} não respondeu em ${prazoMs}ms`));
    }, prazoMs);
    pendentes.set(meu, (m) => {
      clearTimeout(alarme);
      res(m);
    });
  });
}
await new Promise((r) => ws.addEventListener("open", r));
await cmd("Page.enable");

// ---- sites descartáveis ---------------------------------------------------

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const criados = [];

try {
  for (const molde of moldes) {
    const marca = crypto.randomBytes(4).toString("hex");
    const slug = `shot-${molde}-${marca}`;
    const token = crypto.randomBytes(16).toString("base64url");

    // Tema PADRÃO do molde (theme null): aqui o objetivo é ver o desenho como
    // o casal veria. Caçar hex escrito na seção é papel do verify:template,
    // que usa paleta fora do padrão de propósito.
    const [site] = await sql`
      insert into sites (slug, template_id, theme, tier, status, preview_token)
      values (${slug}, ${molde}, null, 'para-sempre', 'preview', ${token})
      returning id
    `;
    criados.push(site.id);

    await sql`
      insert into site_content (site_id, couple_names, partner_a, partner_b,
        wedding_date, ceremony_venue, ceremony_address, ceremony_map_url,
        reception_venue, reception_address, story, dress_code, gift_message)
      values (${site.id}, 'Marina & Rafael', 'Marina', 'Rafael',
        '2027-05-22T16:00:00-03:00',
        'Capela Santa Rita', 'Rua das Oliveiras, 120 — Fortaleza',
        'https://maps.google.com/?q=Capela+Santa+Rita',
        'Casa de Festas Alvorada', 'Av. Beira-Mar, 900 — Fortaleza',
        'Marina fotografava casamentos. Rafael tocava nas festas. Levaram quatro anos para perceber que já estavam juntos em todas as fotos.',
        'Traje social completo', 'Cada cota vira uma lembrança da nossa lua de mel.')
    `;

    await sql`
      insert into site_sections (site_id, section_key, position, enabled)
      select ${site.id}, s.key, s.pos, true
      from unnest(${SECOES}::text[]) with ordinality as s(key, pos)
    `;

    const url = `${BASE}/preview/${token}`;
    const r = await fetch(url);
    const html = await r.text();
    const fallback = html.includes("está sendo preparado");
    const avisos = [];

    for (const tela of TELAS) {
      await cmd("Emulation.setDeviceMetricsOverride", {
        width: tela.largura,
        height: tela.altura,
        deviceScaleFactor: 1,
        mobile: tela.largura < 700,
      });
      await cmd("Page.navigate", { url });
      await esperar(4500);

      // Estouro horizontal MEDIDO, não olhado: a captura sozinha não distingue
      // "cortado pelo layout" de "recortado pela ferramenta".
      const medida = await cmd("Runtime.evaluate", {
        expression:
          "JSON.stringify({d:document.documentElement.clientWidth,s:document.documentElement.scrollWidth})",
        returnByValue: true,
      });
      const { d, s } = JSON.parse(medida.result.result.value);
      if (s > d + 1) avisos.push(`${tela.nome} estoura ${s - d}px`);

      // Sem `captureBeyondViewport`: a altura emulada acima já é a altura que
      // se quer fotografar, e pedir as duas coisas fazia o Chrome renderizar
      // uma superfície gigante e parar de responder.
      const shot = await cmd("Page.captureScreenshot", { format: "png" }, 60_000);
      writeFileSync(
        `${SAIDA}/${molde}-${tela.nome}.png`,
        Buffer.from(shot.result.data, "base64")
      );
    }

    const estado = fallback
      ? "⚠ FALLBACK"
      : avisos.length
        ? `⚠ ${avisos.join(", ")}`
        : "ok";
    console.log(`${molde.padEnd(11)} ${r.status} ${estado}`);
  }
} finally {
  for (const idSite of criados) {
    await sql`delete from site_sections where site_id = ${idSite}`;
    await sql`delete from site_content where site_id = ${idSite}`;
    await sql`delete from sites where id = ${idSite}`;
  }
  console.log(`\nlimpeza: ${criados.length} sites descartáveis removidos`);
  await sql.end();
  ws.close();
  chrome.kill();
}
