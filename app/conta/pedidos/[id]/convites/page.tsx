import type { Metadata } from "next";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { listInvites } from "@/lib/repositories/siteInvites";
import { contagemDeConvidados } from "@/lib/repositories/siteMetrics";
import { MAX_CONVITES } from "@/lib/site/inviteDoc";
import { criarConviteAction } from "@/app/actions/invite-actions";
import MiniConvite from "@/components/account/convite/MiniConvite";
import ListaDeConvites from "@/components/account/convite/ListaDeConvites";
import { EstadoVazio } from "@/components/ui/prensa";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Convites | ${SITE_NAME}` };

/**
 * E7 · a aba Convites.
 *
 * Era uma grade de miniaturas. A troca não é de estilo, é de função: a grade
 * responde "como ficaram?", e a pergunta do mês do casamento é "o que já está
 * no ar e quantos confirmaram?". Publicar e despublicar só existiam DENTRO do
 * editor de cada convite — para saber o estado de cinco, o casal abria cinco.
 *
 * A miniatura sobreviveu como coluna: ela é a única coisa que a grade fazia
 * melhor, e reconhecer o convite pelo desenho é mais rápido que pelo nome.
 */
export default async function ConvitesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const { site } = await carregarGerenciamento(id);

  /* Duas consultas, em paralelo — e nenhuma delas é `listGroupsWithGuests`,
     que o layout já faz para montar os avisos. `contagemDeConvidados` traz as
     duas somas num SELECT só; `metricasDoSite` traria cinco idas ao banco
     para usar duas. */
  const [convites, contagem] = site
    ? await Promise.all([listInvites(site.id), contagemDeConvidados(site.id)])
    : [[], { convidados: 0, confirmados: 0 }];

  const noLimite = convites.length >= MAX_CONVITES;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <span className="meta text-(--c-mark)">Convites</span>
          <h1 className="t-d2 text-(--c-ink)">O convite de vocês</h1>
          {/* O texto antigo mandava "baixar em PNG, JPEG ou PDF para mandar no
              grupo da família", e o SDD §15.1 decidiu o contrário: o convite é
              uma PÁGINA, não um arquivo. Num PNG o botão "Lista de presentes"
              é desenho, não botão. O download continua existindo dentro do
              editor; deixou de ser o assunto da frase. */}
          <p className="t-corpo text-(--c-ink-2) medida">
            Cada convite vira uma página com endereço próprio, para mandar no
            grupo da família. Dá para ter até {MAX_CONVITES} — um para os
            padrinhos, outro para o pessoal do trabalho, o que quiserem.
          </p>
        </div>

        {site && (
          <form action={criarConviteAction}>
            <input type="hidden" name="siteId" value={site.id} />
            <input type="hidden" name="orderId" value={id} />
            {/* No limite o botão fica desabilitado E explicado, em vez de
                sumir. Sumir sem dizer por quê é o que fazia o casal procurar
                um botão que ele tinha visto na semana passada. */}
            <button
              type="submit"
              disabled={noLimite}
              className="btn btn-ink"
            >
              {noLimite ? `Limite de ${MAX_CONVITES} convites` : "+ Novo convite"}
            </button>
          </form>
        )}
      </header>

      {site === null ? (
        <p className="surface-raised rounded-[3px] p-6 text-sm text-(--c-ink-2)">
          O site de vocês ainda está sendo montado. Assim que a prévia ficar
          pronta, os convites aparecem aqui.
        </p>
      ) : (
        <>
          {erro === "limite" && (
            <p className="surface-raised rounded-[3px] p-4 text-sm text-(--c-mark)">
              Vocês já têm {MAX_CONVITES} convites. Apague um para criar outro.
            </p>
          )}

          {/* Os três números do artboard.

              CONVIDADOS e CONFIRMARAM são do SITE INTEIRO, não por convite, e
              isso é deliberado: não existe chave ligando um convite a um grupo
              de convidados (`site_invites` tem `doc` e `slug`; `groups` tem
              `seats`). O artboard trata os dois como a mesma coisa. Enquanto a
              ligação não existir, o número do site é verdade — um número por
              linha teria que ser inventado. */}
          <dl
            data-reguas
            className="grid grid-cols-1 gap-3 md:grid-cols-3"
          >
            <Regua rotulo="Convites" valor={convites.length} />
            <Regua rotulo="Convidados" valor={contagem.convidados} />
            <Regua rotulo="Confirmaram" valor={contagem.confirmados} ok />
          </dl>

          {convites.length === 0 ? (
            <EstadoVazio
              titulo="Nenhum convite criado"
              acao={
                <form action={criarConviteAction}>
                  <input type="hidden" name="siteId" value={site.id} />
                  <input type="hidden" name="orderId" value={id} />
                  <button type="submit" className="btn btn-ink">
                    Criar convite
                  </button>
                </form>
              }
            >
              Separe os convidados em grupos — família, amigos, trabalho. Cada
              grupo ganha um link próprio.
            </EstadoVazio>
          ) : (
            <ListaDeConvites
              siteId={site.id}
              orderId={id}
              convites={convites.map((c) => ({
                id: c.id,
                nome: c.name,
                slug: c.slug,
                miniatura: <MiniConvite doc={c.doc} />,
              }))}
            />
          )}
        </>
      )}
    </div>
  );
}

function Regua({
  rotulo,
  valor,
  ok,
}: {
  rotulo: string;
  valor: number;
  /** Confirmaram é o único número que é uma boa notícia. */
  ok?: boolean;
}) {
  return (
    <div className="surface-raised flex flex-col gap-1 rounded-[3px] p-4">
      <dt className="meta text-(--c-ink-2)">{rotulo}</dt>
      <dd
        className={`t-display text-[32px] leading-none ${
          ok ? "text-(--c-ok)" : "text-(--c-ink)"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}
