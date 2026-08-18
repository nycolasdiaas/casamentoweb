import { getSiteContent } from "@/lib/repositories/siteContent";
import { countSitePhotos } from "@/lib/repositories/sitePhotos";
import { getSitePix } from "@/lib/pix/resolve";
import { listGifts } from "@/lib/repositories/gifts";
import { tierIncludes, type PackageTier } from "@/lib/packages";

/**
 * O que ainda falta para o site ficar pronto.
 *
 * Substitui o "Comece por aqui — 2 de 5 passos" do iCasei, que é um onboarding
 * genérico igual para todo mundo. Aqui cada linha é sobre ESTE site: ou está
 * feita, ou tem um botão que leva exatamente onde se resolve.
 *
 * ── Duas regras que evitam a lista mentir ───────────────────────────────────
 *
 * 1. **A lista depende do PACOTE.** Cobrar chave Pix de quem comprou o Convite
 *    é cobrar por um recurso que ele não tem — a lista de presentes só existe
 *    no Para Sempre. Uma tarefa impossível de concluir é pior que tarefa
 *    nenhuma: ela deixa o progresso travado para sempre.
 * 2. **Nada aqui é obrigatório.** É um guia, não uma trava. Cada seção do
 *    molde degrada sozinha quando falta dado, e um casal que não quer contar a
 *    história tem um site legítimo — por isso o texto diz "falta", nunca
 *    "pendência" ou "erro".
 */
export type Tarefa = {
  id: string;
  texto: string;
  feita: boolean;
  /** para onde vai quem clica; ausente quando já está feita */
  href?: string;
  acao?: string;
};

export async function oQueFalta(
  siteId: string,
  orderId: string,
  tier: PackageTier
): Promise<{ tarefas: Tarefa[]; feitas: number; total: number }> {
  const base = `/conta/pedidos/${orderId}`;

  const [conteudo, fotos, pix, presentes] = await Promise.all([
    getSiteContent(siteId),
    countSitePhotos(siteId),
    // Sem Pix o casal não recebe nada, mas a checagem só faz sentido em quem
    // tem lista de presentes.
    tierIncludes(tier, "para-sempre") ? getSitePix(siteId) : Promise.resolve(null),
    tierIncludes(tier, "para-sempre") ? listGifts(siteId) : Promise.resolve([]),
  ]);

  const tarefas: Tarefa[] = [
    {
      id: "nomes",
      texto: "Nomes e data do casamento",
      feita: Boolean(conteudo?.coupleNames?.trim() && conteudo?.weddingDate),
      href: `${base}/conteudo`,
      acao: "Preencher",
    },
    {
      id: "locais",
      texto: "Onde é a cerimônia",
      feita: Boolean(conteudo?.ceremonyVenue?.trim()),
      href: `${base}/conteudo`,
      acao: "Preencher",
    },
    {
      id: "historia",
      texto: "A história de vocês",
      feita: Boolean(conteudo?.story?.trim()),
      href: `${base}/conteudo`,
      acao: "Escrever",
    },
    {
      id: "foto",
      texto: "Foto de capa",
      feita: fotos > 0,
      href: `${base}/fotos`,
      acao: "Enviar",
    },
  ];

  // Só quem tem lista de presentes precisa de Pix — ver a regra 1 acima.
  if (tierIncludes(tier, "para-sempre")) {
    tarefas.push({
      id: "presentes",
      texto: "Montar a lista de presentes",
      feita: presentes.length > 0,
      href: `${base}/presentes`,
      acao: "Montar",
    });
    tarefas.push({
      id: "pix",
      texto: "Cadastrar a chave Pix",
      feita: pix !== null,
      href: `${base}/presentes`,
      acao: "Cadastrar",
    });
  }

  const feitas = tarefas.filter((t) => t.feita).length;
  return { tarefas, feitas, total: tarefas.length };
}
