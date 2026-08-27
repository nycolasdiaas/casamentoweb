import { after } from "next/server";
import { isEmailConfigured, sendResumoSemanalEmail } from "@/lib/email";
import { baseUrlEstatica } from "@/lib/baseUrl";
import { linkDeDescadastro } from "@/lib/site/descadastro";
import {
  resumosDaSemana,
  temMovimento,
  type ResumoDaSemana,
} from "@/lib/site/resumoSemanal";

/**
 * J2 · o resumo da semana, disparado pelo Vercel Cron.
 *
 * ── Por que uma rota, e não `pg_cron` ──────────────────────────────────────
 *
 * O SDD §14 decisão 4 escolhia `pg_cron`, e ela foi **reaberta em 27/08/2026**
 * (ver a nota no próprio SDD). A razão: o trabalho aqui é de aplicação — ler
 * métricas, montar um e-mail e enviá-lo — e SQL puro não fala SMTP. Com
 * `pg_cron` a arquitetura seria uma tabela de fila mais um consumidor, ou
 * seja, o agendador que se queria evitar, mais uma tabela.
 *
 * ── O segredo não é zelo ───────────────────────────────────────────────────
 *
 * Uma rota pública que dispara e-mail para todos os casais ativos é um canhão
 * de spam com URL. Qualquer um que descobrisse o caminho poderia bombardear a
 * base — e a conta de envio é nossa. Sem `CRON_SECRET` configurado ela responde
 * **503 e não envia nada**: desligada é o padrão seguro, ligada por engano é o
 * que não pode acontecer.
 *
 * É a mesma postura de `ABACATEPAY_WEBHOOK_SECRET`, que responde 503 com o
 * segredo vazio em vez de aceitar qualquer corpo.
 */

/* Sem `export const dynamic`: com `cacheComponents: true` o Next recusa o
   segmento ("Route segment config `dynamic` is not compatible"). A rota já é
   dinâmica por natureza — ela lê o cabeçalho `Authorization` da requisição, e
   isso basta. */

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    console.error("[cron] CRON_SECRET vazio — resumo semanal DESLIGADO");
    return new Response("Agendamento não configurado.", { status: 503 });
  }

  /* O Vercel Cron manda `Authorization: Bearer <CRON_SECRET>`. Comparação
     simples porque o segredo é longo e aleatório; o que protege é ele não
     vazar, não o tempo da comparação. */
  const cabecalho = request.headers.get("authorization");
  if (cabecalho !== `Bearer ${segredo}`) {
    return new Response("Não autorizado.", { status: 401 });
  }

  if (!isEmailConfigured()) {
    // Sem transporte, o trabalho inteiro é para jogar fora — e dizer isso é
    // melhor que responder 200 fingindo que enviou.
    return Response.json({ enviados: 0, motivo: "sem-transporte" });
  }

  const todos = await resumosDaSemana();

  /* A regra J3: semana parada não gera e-mail. Um resumo que chega dizendo
     "nada aconteceu" ensina o casal a não abrir o próximo. */
  const comMovimento = todos.filter(temMovimento);

  /* `after()` para a resposta não esperar N envios de SMTP. O Vercel Cron tem
     teto de tempo por invocação, e um casal a mais na base não pode aproximar
     a rota do limite. */
  after(async () => {
    for (const r of comMovimento) {
      try {
        await enviar(r);
      } catch (erro) {
        // Um envio que falha não derruba os outros. O resumo é cortesia
        // semanal: perder o de um casal custa uma semana, não o produto.
        console.error(`[cron] resumo de ${r.siteId}:`, erro);
      }
    }
  });

  return Response.json({
    sites: todos.length,
    enviados: comMovimento.length,
    semMovimento: todos.length - comMovimento.length,
  });
}

/** "12 a 18 de setembro" — a janela como o casal a leria. */
function semanaPorExtenso(desde: Date, ate: Date): string {
  const dia = (d: Date) => d.getDate();
  const mes = (d: Date) =>
    d.toLocaleDateString("pt-BR", { month: "long", timeZone: "America/Fortaleza" });

  return mes(desde) === mes(ate)
    ? `${dia(desde)} a ${dia(ate)} de ${mes(ate)}`
    : `${dia(desde)} de ${mes(desde)} a ${dia(ate)} de ${mes(ate)}`;
}

async function enviar(r: ResumoDaSemana): Promise<void> {
  const base = baseUrlEstatica().replace(/\/+$/, "");

  await sendResumoSemanalEmail(r.email, {
    nomes: r.nomes,
    semana: semanaPorExtenso(r.desde, new Date()),
    confirmacoes: r.confirmacoes,
    presentes: r.presentes,
    presentesEmReais: r.presentesEmReais,
    recados: r.recados,
    semResposta: r.semResposta,
    diasParaOCasamento: r.diasParaOCasamento,
    /* Sem pedido (o casamento legado nasceu antes do fluxo), o painel geral é
       o destino honesto — melhor que um link com id vazio. */
    painelUrl: r.orderId
      ? `${base}/conta/pedidos/${r.orderId}`
      : `${base}/conta/pedidos`,
    descadastroUrl: linkDeDescadastro(base, r.userId),
  });
}
