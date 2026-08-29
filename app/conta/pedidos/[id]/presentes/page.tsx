import Link from "next/link";
import type { Metadata } from "next";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { listGifts, contribuicoesPorCota } from "@/lib/repositories/gifts";
import { listSiteSections } from "@/lib/repositories/siteSections";
import { formatPriceCents } from "@/lib/format";
import { ROTULO_TIPO, type PixKeyType } from "@/lib/pix/key";
import { SITE_NAME } from "@/lib/site";
import { Aviso } from "@/components/ui/prensa";
import Cotas from "@/components/account/manage/Cotas";

export const metadata: Metadata = { title: `Presentes | ${SITE_NAME}` };

/**
 * E6 · a lista de presentes do casal.
 *
 * ── Duas colunas, como a prancha ───────────────────────────────────────────
 *
 * À esquerda o que o casal EDITA (as cotas). À direita o que ele CONSULTA:
 * quanto já foi escolhido e a chave que faz o Pix funcionar. Empilhado, a
 * chave Pix — que é o que trava a lista inteira quando falta — ficava embaixo
 * de uma lista de vinte cotas.
 *
 * ── Por que o valor arrecadado não aparece em reais ────────────────────────
 *
 * Porque ele não existe. O Pix vai direto do convidado para o casal e **nunca
 * passa pela Enlace** (regras §2.4): `gift_contributions` guarda o nome do
 * presente e de quem deu, nunca um centavo. O card oliva mostra quantas cotas
 * foram escolhidas, que é o que sabemos de verdade — e o valor estimado só
 * quando todas as cotas escolhidas tinham preço fixo.
 */
export default async function PresentesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  if (site === null) {
    return (
      <div className="flex flex-col gap-6">
        <Cabecalho />
        <p className="surface-raised p-6 text-sm text-(--c-ink-2)">
          O site de vocês ainda está sendo montado. Assim que a prévia ficar
          pronta, a lista de presentes aparece aqui.
        </p>
      </div>
    );
  }

  const [conteudo, presentes, escolhas, secoes] = await Promise.all([
    getSiteContent(site.id),
    listGifts(site.id),
    contribuicoesPorCota(site.id),
    listSiteSections(site.id),
  ]);

  const secaoLigada = secoes.some((s) => s.sectionKey === "gifts" && s.enabled);
  const temPix = Boolean(conteudo?.pixKey);
  const noAr = site.status !== "archived" && secaoLigada;

  const cotas = presentes.map((g) => ({
    id: g.id,
    name: g.name,
    category: g.category,
    priceCents: g.priceCents,
    quantity: g.quantity,
    escolhidas: escolhas.get(g.id) ?? 0,
  }));

  const totalEscolhidas = cotas.reduce((n, c) => n + c.escolhidas, 0);

  /* O valor só é somado quando TODA cota escolhida tinha preço fixo.
     Uma cota de "valor livre" não tem quanto o convidado deu — e somar só as
     de preço fixo daria um número menor que o real, apresentado como se fosse
     o total. Melhor não mostrar valor nenhum que mostrar um errado. */
  const escolhidasSemPreco = cotas.some(
    (c) => c.escolhidas > 0 && c.priceCents === null
  );
  const valorEstimado = escolhidasSemPreco
    ? null
    : cotas.reduce((s, c) => s + c.escolhidas * (c.priceCents ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho />

      {/* O estado que mais importa: lista visível sem chave. A trava impede o
          site de mostrar chave de outra pessoa; este aviso impede o casal de
          descobrir só depois do casamento que ninguém conseguiu presentear. */}
      {noAr && !temPix && cotas.length > 0 && (
        <Aviso
          tom="warn"
          acao={{
            rotulo: "Cadastrar a chave",
            href: `/conta/pedidos/${order.id}/conteudo`,
          }}
        >
          <strong className="font-semibold">
            A lista está no ar, mas sem chave Pix.
          </strong>{" "}
          Os convidados veem os presentes e não conseguem presentear — a tela
          pede que falem com vocês. Com a chave cadastrada, o Pix passa a
          funcionar na hora.
        </Aviso>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <Cotas siteId={site.id} cotas={cotas} />

        <div className="flex flex-col gap-5">
          {/* ARRECADADO — o card oliva do desenho. */}
          <section className="rounded-[3px] bg-(--c-olive) p-6 text-(--c-paper-warm)">
            <p className="meta text-white/60">Escolhidas</p>
            <p className="t-display mt-2 text-[40px] leading-none">
              {totalEscolhidas}
            </p>
            <p className="mt-1 text-[12.5px] text-white/75">
              {totalEscolhidas === 1 ? "cota escolhida" : "cotas escolhidas"}
              {valorEstimado !== null && valorEstimado > 0
                ? ` · ${formatPriceCents(valorEstimado)}`
                : ""}
            </p>
            <p className="mt-4 border-t border-white/15 pt-3 text-[12px] leading-relaxed text-white/60">
              O Pix vai direto para a conta de vocês — a gente nunca fica no
              meio, então o valor que aparece aqui é o das cotas com preço
              fixo.
            </p>
          </section>

          {/* CHAVE PIX — na própria aba, como no desenho.
              Ela vivia só em Conteúdo, e esta tela apenas apontava para lá: o
              casal descobria que faltava a chave aqui e tinha que ir para
              outra aba resolver. */}
          <section className="surface-raised flex flex-col gap-3 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="meta text-(--c-ink-2)">Chave Pix</h2>
              <Link
                href={`/conta/pedidos/${order.id}/conteudo`}
                className="btn btn-quiet btn-sm"
              >
                {temPix ? "Trocar" : "Cadastrar"}
              </Link>
            </div>

            {temPix ? (
              <>
                <p className="t-data break-all text-[14px] text-(--c-ink)">
                  {conteudo!.pixKey}
                </p>
                <p className="t-corpo-p text-(--c-ink-2)">
                  {conteudo!.pixKeyType
                    ? `${ROTULO_TIPO[conteudo!.pixKeyType as PixKeyType]}`
                    : ""}
                  {conteudo!.pixRecipient ? ` · ${conteudo!.pixRecipient}` : ""}
                </p>
                <p className="t-corpo-p text-(--c-ink-2)">
                  O código do Pix é gerado na hora, já com o valor da cota
                  preenchido.
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full bg-(--c-warn)"
                  aria-hidden="true"
                />
                <p className="t-corpo-p text-(--c-ink-2)">
                  Ainda não cadastrada. Sem ela a lista aparece, mas sem forma
                  de pagamento.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Cabecalho() {
  return (
    <header className="flex flex-col gap-3">
      <span className="meta text-(--c-mark)">Presentes</span>
      <h1 className="t-d2 text-(--c-ink)">Lista de presentes</h1>
      <p className="t-corpo text-(--c-ink-2) medida">
        O convidado escolhe uma cota e paga por Pix — direto na conta de vocês,
        sem passar por ninguém.
      </p>
    </header>
  );
}
