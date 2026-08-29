import { after } from "next/server";
import { isEmailConfigured, sendSaidaDoArEmail } from "@/lib/email";
import { baseUrlEstatica } from "@/lib/baseUrl";
import { CONTACT } from "@/lib/site";
import { getPackage } from "@/lib/packages";
import {
  arquivarPorExpiracao,
  podeAvisar,
  sitesComPrazo,
  tarefasDeHoje,
  type TarefaDeExpiracao,
} from "@/lib/site/expirarSites";

/**
 * O site sai do ar — spec `site-publico/008`, FR-003.
 *
 * ── Ela é inofensiva hoje, e isso é de propósito ───────────────────────────
 *
 * `PRAZO_ANUNCIADO_EM` é `null` enquanto a vitrine não disser o prazo, então
 * nenhum site tem `expires_at` preenchido, então esta rota não tem o que
 * arquivar. Ela pode rodar todo dia sem consequência — e vai, para que o dia
 * em que o prazo for anunciado não seja também o dia em que este código roda
 * pela primeira vez.
 *
 * ── O segredo, de novo ────────────────────────────────────────────────────
 *
 * Sem `CRON_SECRET` responde **503 e não faz nada**, igual à
 * `/api/cron/resumo-semanal`. Aqui a razão é mais dura que lá: uma rota
 * pública que tira sites do ar é um botão de desligar casamentos com URL.
 */

/* Sem `export const dynamic`: com `cacheComponents: true` o Next recusa o
   segmento. A rota já é dinâmica por ler o cabeçalho `Authorization`. */

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    console.error("[cron] CRON_SECRET vazio — expiração DESLIGADA");
    return new Response("Agendamento não configurado.", { status: 503 });
  }

  const cabecalho = request.headers.get("authorization");
  if (cabecalho !== `Bearer ${segredo}`) {
    return new Response("Não autorizado.", { status: 401 });
  }

  const tarefas = tarefasDeHoje(await sitesComPrazo());

  /* Arquivar acontece AGORA, no corpo da resposta; avisar acontece depois, no
     `after()`.

     A ordem importa: tirar do ar é a única parte que não pode se perder se a
     invocação for cortada pelo teto de tempo da Vercel. Um e-mail perdido é um
     e-mail perdido; um site que deveria ter saído do ar e não saiu é a
     promessa do Para Sempre furada em silêncio. */
  const arquivados: string[] = [];
  for (const t of tarefas.filter((t) => t.arquivar)) {
    try {
      if (await arquivarPorExpiracao(t.site.siteId)) {
        arquivados.push(t.site.siteId);
      }
    } catch (erro) {
      console.error(`[cron] arquivar ${t.site.siteId}:`, erro);
    }
  }

  const aAvisar = isEmailConfigured() ? tarefas.filter(podeAvisarTarefa) : [];

  after(async () => {
    for (const t of aAvisar) {
      try {
        await avisar(t);
      } catch (erro) {
        // Um envio que falha não derruba os outros nem desfaz o arquivamento.
        console.error(`[cron] aviso de ${t.site.siteId}:`, erro);
      }
    }
  });

  return Response.json({
    comPrazo: tarefas.length,
    arquivados: arquivados.length,
    avisos: aAvisar.length,
    semTransporte: !isEmailConfigured(),
  });
}

/**
 * Quem recebe aviso.
 *
 * **Não há filtro de descadastro aqui**, e é decisão registrada: estes três
 * e-mails são transacionais, da mesma família do recibo e do "está no ar". Um
 * casal que se descadastrou do resumo semanal descobriria que o site saiu do
 * ar por um convidado dizendo que o link quebrou.
 */
function podeAvisarTarefa(t: TarefaDeExpiracao): boolean {
  return podeAvisar(t.site);
}

async function avisar(t: TarefaDeExpiracao): Promise<void> {
  const base = baseUrlEstatica();
  const paraSempre = getPackage("para-sempre");

  /* Sem emoji no texto pré-preenchido: alguns clientes do WhatsApp corrompem
     emoji vindo de URL e vira "?". Mesma razão de `WHATSAPP_LINK`. */
  const mensagem =
    t.aviso === "30-dias"
      ? "Oi! Queremos manter o site do nosso casamento no ar."
      : "Oi! O site do nosso casamento saiu do ar e queremos o Para Sempre.";

  await sendSaidaDoArEmail(t.site.email!, {
    nomes: t.site.nomes,
    pacote: getPackage(t.site.tier)?.name ?? "do site",
    // Sem protocolo: é endereço para ler, não link para clicar.
    endereco: `${base.replace(/^https?:\/\//, "")}/s/${t.site.slug}`,
    saiEm: t.dataPorExtenso,
    precoParaSempre: paraSempre?.price ?? "R$ 99,90",
    whatsappUrl: `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(mensagem)}`,
    quando: t.aviso,
  });
}
