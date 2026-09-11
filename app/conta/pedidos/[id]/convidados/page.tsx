import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { getBaseUrl } from "@/lib/baseUrl";
import { listGroupsWithGuests } from "@/lib/repositories/groups";
import { tierAllowsSection } from "@/lib/templates/contract";
import { EstadoVazio } from "@/components/ui/prensa";
import CopiarLink from "@/components/ui/prensa/CopiarLink";
import FormularioDeFamilia from "@/components/account/manage/FormularioDeFamilia";

export const metadata: Metadata = { title: "Convidados" };

/**
 * A aba Convidados — quem foi convidado e quem respondeu.
 *
 * ── Por que ela nasceu ─────────────────────────────────────────────────────
 *
 * Porque a resposta do convidado não aparecia em lugar nenhum. O convidado
 * abria `/rsvp/<endereço>`, respondia, o banco gravava certo — e o casal não
 * tinha onde ver. A aba Convites mostra três números somados (quantos
 * convites, quantos convidados, quantos confirmaram) e nenhuma linha.
 *
 * Pior: o próprio sino já prometia esta tela. O aviso de confirmação diz
 * "Ver quem respondeu" e levava para Convites, onde não há quem. A promessa
 * existia antes da tela.
 *
 * ── De onde vem o número, e por que só de um lugar ─────────────────────────
 *
 * A resposta mora em DOIS lugares desde a migração 0016, e os dois são
 * verdade: `guests.rsvp_status` (um convidado por linha, o modelo original) e
 * `groups.seats_confirmed` (quantos lugares do grupo vão, que é o que
 * `/rsvp/<endereço>` grava hoje).
 *
 * Esta tela lê o SEGUNDO, como o resto do painel e as métricas. Ela mostra os
 * nomes de `guests` como **quem foi convidado** — que é o que aquela tabela
 * responde bem — e nunca cruza o `rsvp_status` de lá com o número daqui. Somar
 * os dois daria um total que não existe, e "consertar" a diferença apagaria
 * dado que ninguém reconstrói. A decisão de unificar é do dono e não foi
 * tomada (AGENTS.md §2).
 *
 * ── O pacote ───────────────────────────────────────────────────────────────
 *
 * Confirmação de presença entra a partir do Site do Casamento (§4.5). No
 * Convite esta aba não existe — e quem chegar por endereço direto volta para
 * o início, como faz a aba de Recados, em vez de ver uma tela vazia de um
 * recurso que não comprou.
 */
export default async function ConvidadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  if (!tierAllowsSection(order.packageTier, "rsvp")) {
    redirect(`/conta/pedidos/${order.id}`);
  }

  const grupos = site ? await listGroupsWithGuests(site.id) : [];

  /* O endereço que o casal copia tem que ser o COMPLETO — é ele que vai para o
     WhatsApp da família. `CopiarLink` não adivinha rota de propósito: quem
     chama monta.

     `getBaseUrl` recusa Host forjado e pode falhar quando falta a variável em
     produção. Falhar aqui derrubaria a tela inteira por causa do botão de
     copiar, então a lista continua e o botão é que some. */
  let base: string | null = null;
  try {
    base = await getBaseUrl();
  } catch {
    base = null;
  }

  /* Três somas, uma passada. `seatsConfirmed === null` é "não respondeu";
     `0` é "respondeu que não vai" — e a diferença entre as duas é justamente
     o que diz a quem o casal ainda precisa cobrar. */
  const lugares = grupos.reduce((t, g) => t + g.seats, 0);
  const vao = grupos.reduce((t, g) => t + (g.seatsConfirmed ?? 0), 0);
  const semResposta = grupos.filter((g) => g.seatsConfirmed === null).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <span className="meta text-(--c-mark)">Convidados</span>
        <h1 className="t-d2 text-(--c-ink)">Quem respondeu</h1>
        <p className="t-corpo text-(--c-ink-2) medida">
          Cada família tem um endereço próprio para responder. Aqui vocês veem
          quem já respondeu, quantos vêm e o que escreveram.
        </p>
      </header>

      {site === null ? (
        <p className="surface-raised rounded-[3px] p-6 text-sm text-(--c-ink-2)">
          O site de vocês ainda está sendo montado. Assim que a prévia ficar
          pronta, os convidados aparecem aqui.
        </p>
      ) : grupos.length === 0 ? (
        /* O estado vazio agora termina num verbo — o formulário está logo
           abaixo dele. Antes esta tela dizia "quando vocês cadastrarem as
           famílias" e não oferecia nenhum caminho para cadastrar: o cadastro
           só existia no /admin. O casal lia uma instrução para uma ação que
           não conseguia executar. */
        <>
          <EstadoVazio titulo="Nenhuma família cadastrada">
            Comecem pela primeira: cada família cadastrada ganha um endereço
            próprio para responder, e as respostas aparecem aqui.
          </EstadoVazio>
          <FormularioDeFamilia siteId={site.id} />
        </>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Regua rotulo="Lugares reservados" valor={lugares} />
            <Regua rotulo="Vão" valor={vao} ok />
            <Regua rotulo="Sem resposta" valor={semResposta} />
          </dl>

          {/* Tabela de verdade no computador, cartões no celular.

              Uma tabela de seis colunas em 390px vira rolagem horizontal, e
              rolagem horizontal dentro de uma tela que já rola na vertical é
              onde a informação se perde. Os mesmos dados, duas formas. */}
          <div className="surface-raised hidden overflow-hidden rounded-[3px] md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-(--c-rule)">
                  <Th>Família</Th>
                  <Th>Lugares</Th>
                  <Th>Resposta</Th>
                  <Th>Quem vem</Th>
                  <Th>Recado</Th>
                  <Th>Endereço</Th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-(--c-rule) last:border-b-0 align-top"
                  >
                    <Td>
                      <span className="text-(--c-ink)">
                        {g.label ?? "Sem nome"}
                      </span>
                      {g.guests.length > 0 && (
                        <span className="mt-1 block text-[12.5px] text-(--c-ink-2)">
                          {g.guests.map((c) => c.name).join(", ")}
                        </span>
                      )}
                    </Td>
                    <Td>{g.seats}</Td>
                    <Td>
                      <Resposta
                        confirmados={g.seatsConfirmed}
                        lugares={g.seats}
                      />
                    </Td>
                    <Td>{g.attendingNames ?? "—"}</Td>
                    <Td>{g.message ?? "—"}</Td>
                    <Td>
                      {/* O endereço aparece ESCRITO, não só copiável.
                          Um botão "Copiar link" sozinho não deixa o casal
                          conferir para onde o link vai, nem ditar o endereço
                          para alguém — e, quando o endereço base sumia, a
                          célula ficava num traço e a família não tinha como
                          ser convidada (UX-016). */}
                      <span className="flex flex-col items-start gap-1">
                        <span className="text-[12.5px] break-all text-(--c-ink-2)">
                          {base
                            ? `${base.replace(/^https?:\/\//, "")}/rsvp/${g.slug}`
                            : `/rsvp/${g.slug}`}
                        </span>
                        {base && <CopiarLink url={`${base}/rsvp/${g.slug}`} />}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {grupos.map((g) => (
              <li
                key={g.id}
                className="surface-raised flex flex-col gap-2 rounded-[3px] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[15px] text-(--c-ink)">
                    {g.label ?? "Sem nome"}
                  </span>
                  <Resposta confirmados={g.seatsConfirmed} lugares={g.seats} />
                </div>
                {g.guests.length > 0 && (
                  <p className="text-[12.5px] text-(--c-ink-2)">
                    {g.guests.map((c) => c.name).join(", ")}
                  </p>
                )}
                {g.attendingNames && (
                  <p className="text-[13.5px] text-(--c-ink)">
                    Vêm: {g.attendingNames}
                  </p>
                )}
                {g.message && (
                  <p className="text-[13.5px] italic text-(--c-ink-2)">
                    “{g.message}”
                  </p>
                )}
                <span className="text-[12.5px] break-all text-(--c-ink-2)">
                  {base
                    ? `${base.replace(/^https?:\/\//, "")}/rsvp/${g.slug}`
                    : `/rsvp/${g.slug}`}
                </span>
                {base && <CopiarLink url={`${base}/rsvp/${g.slug}`} />}
              </li>
            ))}
          </ul>

          {/* Depois da lista, não antes: com famílias já cadastradas, o que o
              casal vem ver aqui é quem respondeu. Cadastrar a próxima é a
              segunda intenção da tela. */}
          <FormularioDeFamilia siteId={site.id} />
        </>
      )}
    </div>
  );
}

/**
 * Os três estados, e eles são TRÊS.
 *
 * `null` é "ainda não respondeu"; `0` é "respondeu que não vai ninguém". Um
 * "0 de 2" para quem não respondeu diria ao casal que a família recusou — e o
 * casal deixaria de cobrar justamente quem ainda não foi cobrado.
 */
function Resposta({
  confirmados,
  lugares,
}: {
  confirmados: number | null;
  lugares: number;
}) {
  if (confirmados === null) {
    return (
      <span className="whitespace-nowrap text-[13px] text-(--c-ink-2)">
        Sem resposta
      </span>
    );
  }
  if (confirmados === 0) {
    return (
      <span className="whitespace-nowrap text-[13px] text-(--c-mark)">
        Não vão
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap text-[13px] text-(--c-ok)">
      {confirmados} de {lugares} {confirmados === 1 ? "vem" : "vêm"}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="meta px-4 py-3 font-normal text-(--c-ink-2)">{children}</th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-[13.5px] text-(--c-ink-2)">{children}</td>;
}

function Regua({
  rotulo,
  valor,
  ok,
}: {
  rotulo: string;
  valor: number;
  /** "Vão" é o único número que é uma boa notícia. */
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
