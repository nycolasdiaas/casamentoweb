import AccountShell from "@/components/account/AccountShell";
import CascaDoPainel from "@/components/account/manage/CascaDoPainel";
import type { Aba } from "@/components/ui/prensa";
import type { OrderStatus } from "@/lib/orderStatus";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { listInvites } from "@/lib/repositories/siteInvites";
import { listGifts } from "@/lib/repositories/gifts";
import { listSiteSections } from "@/lib/repositories/siteSections";
import { countSitePhotos } from "@/lib/repositories/sitePhotos";
import { contarRecados } from "@/lib/repositories/guestbook";
import { tierAllowsSection } from "@/lib/templates/contract";
import { listGroupsWithGuests } from "@/lib/repositories/groups";
import { montarAvisos, type Aviso } from "@/lib/site/avisos";
import { iniciaisDe } from "@/lib/iniciais";

/**
 * Casca do painel de gerenciamento do casal.
 *
 * O que havia antes: UMA página de 341 linhas com acompanhamento, prévia,
 * seções, conteúdo, tema e fotos empilhados. Funcionava e ninguém achava nada
 * — o mesmo defeito do formulário de pedido, em outra tela.
 *
 * Agora cada assunto é uma rota, o menu fica de pé ao lado e o `template.tsx`
 * do /conta anima a troca. O layout é o lugar certo para o menu porque ele
 * NÃO remonta ao navegar entre as abas: a barra fica parada e só o conteúdo
 * troca, que é o que faz parecer um painel em vez de um site.
 */
export default async function GerenciarLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  const base = `/conta/pedidos/${order.id}`;

  // O ponto vermelho no menu existe para um caso só: lista de presentes no ar
  // sem chave Pix. É o único estado em que o site está enganando o convidado
  // silenciosamente — ele vê os presentes e não consegue presentear.
  const conteudo = site ? await getSiteContent(site.id) : null;

  // O ESTADO DE CADA TELA, para o menu dizer onde o casal parou.
  //
  // Sem isto ele precisa abrir as seis telas para descobrir o que falta —
  // que é exatamente a diferença de autonomia que o Anderson apontou no
  // painel do iCasei. O selo é UMA palavra: mais que isso vira legenda e
  // compete com o rótulo do item.
  const [fotos, presentes, convitesDoSite, recados, grupos] = site
    ? await Promise.all([
        countSitePhotos(site.id),
        listGifts(site.id),
        listInvites(site.id),
        contarRecados(site.id),
        /* Os grupos entram AQUI, e não mais lá embaixo com os avisos.

           A consulta é a mesma, e antes ela acontecia duas vezes por
           carregamento assim que a aba Convidados passou a precisar do número:
           uma para a contagem do menu, outra para o aviso de prazo. Uma ida ao
           banco alimenta as duas — e o `Promise.all` já estava aqui. */
        listGroupsWithGuests(site.id),
      ])
    : [0, [], [], 0, []];
  const convites = convitesDoSite.length;

  /* Quantos grupos JÁ responderam — o número que a aba Convidados mostra.
     `seatsConfirmed === null` é "não respondeu"; `0` é "respondeu que não
     vai". Quem respondeu que não vai respondeu, e conta. */
  const respostas = grupos.filter((g) => g.seatsConfirmed !== null).length;

  const conteudoPronto = Boolean(
    conteudo?.coupleNames?.trim() && conteudo?.weddingDate
  );
  const visualPronto = Boolean(order.primaryColor || order.templateStyle);
  const presentesSemPix =
    site !== null &&
    site.status !== "archived" &&
    !conteudo?.pixKey &&
    (await listGifts(site.id)).length > 0 &&
    (await listSiteSections(site.id)).some(
      (s) => s.sectionKey === "gifts" && s.enabled
    );

  /* As sete abas.
     A `pendencia` ("falta") é o único acento que a barra aceita, e ela sai
     assim que a tela é resolvida — é o que permite ao casal ver onde parou
     sem abrir as sete. O número, quando existe, entra como `contagem`: dizer
     "12" ao lado de Fotos vale mais que dizer "OK". */
  const abas: Aba[] = [
    { href: base, rotulo: "Início" },
    { href: `${base}/paginas`, rotulo: "Páginas" },
    {
      href: `${base}/conteudo`,
      rotulo: "Conteúdo",
      pendencia: conteudoPronto ? undefined : "falta",
    },
    {
      href: `${base}/visual`,
      rotulo: "Visual",
      pendencia: visualPronto ? undefined : "falta",
    },
    {
      href: `${base}/fotos`,
      rotulo: "Fotos",
      contagem: fotos > 0 ? fotos : undefined,
      pendencia: fotos > 0 ? undefined : "falta",
    },
    {
      href: `${base}/convites`,
      rotulo: "Convites",
      contagem: convites > 0 ? convites : undefined,
    },
    {
      href: `${base}/presentes`,
      rotulo: "Presentes",
      contagem: presentes.length > 0 ? presentes.length : undefined,
      // O único estado em que o site engana o convidado em silêncio: ele vê a
      // lista de presentes e não consegue presentear.
      pendencia: presentesSemPix ? "falta o Pix" : undefined,
    },
    /* COMPARTILHAR — a última aba, e é onde ela pertence.
       A ordem das abas é a ordem do trabalho: montar o site, depois espalhar o
       link. Pôr Compartilhar antes de Presentes sugeriria mandar o link de um
       site que ainda não está pronto. */
    { href: `${base}/compartilhar`, rotulo: "Compartilhar" },
  ];

  /* CONVIDADOS — logo depois de Convites, porque é a resposta dele.

     Convites é onde o casal manda; Convidados é onde ele vê quem respondeu.
     Separar as duas em pontas opostas da barra faria o casal procurar a
     resposta na tela de enviar — que é exatamente o que acontecia quando esta
     aba não existia: o sino dizia "ver quem respondeu" e levava para Convites,
     onde há três números somados e nenhuma linha.

     Só a partir do Site do Casamento: confirmação de presença não entra no
     pacote Convite (§4.5), e oferecer a aba ali seria cobrar atenção por um
     recurso que o casal não comprou. */
  if (tierAllowsSection(order.packageTier, "rsvp")) {
    abas.splice(6, 0, {
      href: `${base}/convidados`,
      rotulo: "Convidados",
      contagem: respostas > 0 ? respostas : undefined,
    });
  }

  /* A aba do mural só existe no pacote que tem mural.
     Mostrá-la no Convite ou no Site seria oferecer uma tela que só diz "isto
     não é seu" — e a regra é que a lista de tarefas respeita o pacote
     (regras §2.3): cobrar atenção por recurso que o casal não comprou trava
     o progresso dele para sempre. */
  if (tierAllowsSection(order.packageTier, "guestbook")) {
    abas.push({
      href: `${base}/recados`,
      rotulo: "Recados",
      contagem: recados > 0 ? recados : undefined,
    });
  }

  /* OS AVISOS (faixa J).
     Derivados, nunca gravados — ver `lib/site/avisos.ts`. Ficam no layout e
     não numa aba porque o sino tem de estar visível de qualquer tela: um
     presente que chega enquanto o casal mexe nas fotos não pode depender de
     ele voltar ao Início para ser visto. */
  let avisos: Aviso[] = [];
  let recentes = 0;
  if (site) {
    /* Grupos que ainda não responderam, e os LUGARES que eles seguram.
       Desde a 0016 a resposta é do grupo: `seatsConfirmed === null` é "não
       respondeu" (diferente de `0`, que é "respondemos que não vamos"). O
       aviso de prazo fala em pessoas, então soma os lugares reservados. */
    const semResposta = grupos
      .filter((g) => g.seatsConfirmed === null)
      .reduce((total, g) => total + g.seats, 0);

    ({ avisos, recentes } = await montarAvisos({
      siteId: site.id,
      orderId: order.id,
      base,
      rsvpDeadline: conteudo?.rsvpDeadline ?? null,
      semResposta,
      // `null` para todo site de hoje — spec `site-publico/008`.
      expiresAt: site.expiresAt,
    }));
  }

  const linkDoSite = order.siteUrl ?? order.previewUrl ?? null;

  return (
    <AccountShell active="pedidos">
      <div className="flex flex-col gap-8">
        <CascaDoPainel
          titulo={order.coupleNames?.trim() || "Nosso casamento"}
          status={order.status as OrderStatus}
          linkDoSite={linkDoSite}
          abas={abas}
          avisos={avisos}
          recentes={recentes}
          orderId={order.id}
          iniciais={iniciaisDe(order.coupleNames, "NS")}
        />

        <div className="min-w-0">{children}</div>
      </div>
    </AccountShell>
  );
}
