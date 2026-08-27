"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import {
  apagarConviteAction,
  despublicarConviteAction,
  publicarConviteAction,
} from "@/app/actions/invite-actions";
import { DialogoDestrutivo } from "@/components/ui/prensa";

export type ConviteNaLista = {
  id: string;
  nome: string;
  /** `null` = rascunho, nunca publicado. */
  slug: string | null;
  /** O `MiniConvite`, renderizado no servidor e passado pronto. */
  miniatura: ReactNode;
};

/**
 * E7 · a aba Convites como lista de trabalho.
 *
 * A grade de miniaturas que existia aqui respondia "como ficaram?". Esta lista
 * responde "o que já está no ar, e o que ainda é rascunho?" — que é a pergunta
 * que o casal faz no mês do casamento, e a razão de a aba existir.
 *
 * ── Por que é client component ─────────────────────────────────────────────
 *
 * Publicar muda três células da MESMA linha: o endereço aparece na coluna
 * LINK, a etiqueta vira sólida, e "Publicar" vira "Abrir · Despublicar". Se
 * cada pedaço tivesse o próprio estado, publicar deixaria a linha contando
 * duas histórias. Recarregar a página resolveria também, e perderia a posição
 * da rolagem — numa lista de cinco, para trocar uma palavra.
 *
 * As miniaturas continuam vindo do servidor, passadas como `children`: elas
 * desenham o `InviteDoc` inteiro e não têm por que virar JavaScript no
 * navegador do casal.
 *
 * ── Duas formas, um estado ─────────────────────────────────────────────────
 *
 * Tabela no desktop, cartões empilhados no celular — os dois artboards. Não
 * são duas listas: é o mesmo `useState` alimentando as duas marcações, senão
 * publicar no celular deixaria a tabela (escondida, mas montada) desatualizada.
 */
export default function ListaDeConvites({
  siteId,
  orderId,
  convites,
}: {
  siteId: string;
  orderId: string;
  convites: ConviteNaLista[];
}) {
  /* Só os slugs mudam sem recarregar; nome e desenho só mudam no editor, que
     é outra tela e traz a página nova de volta. */
  const [slugs, setSlugs] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(convites.map((c) => [c.id, c.slug]))
  );
  const [erros, setErros] = useState<Record<string, string>>({});
  const [ocupado, iniciar] = useTransition();

  function publicar(id: string) {
    setErros((e) => ({ ...e, [id]: "" }));
    iniciar(async () => {
      const r = await publicarConviteAction(siteId, id);
      if ("error" in r) {
        setErros((e) => ({ ...e, [id]: r.error }));
        return;
      }
      /* A ação devolve o endereço absoluto; a lista mostra só o caminho, que
         é o que cabe na coluna e o que o casal reconhece como "o link". */
      setSlugs((s) => ({ ...s, [id]: new URL(r.url).pathname.slice(3) }));
    });
  }

  function tirarDoAr(id: string) {
    setErros((e) => ({ ...e, [id]: "" }));
    iniciar(async () => {
      const r = await despublicarConviteAction(siteId, id);
      if ("error" in r) {
        setErros((e) => ({ ...e, [id]: r.error }));
        return;
      }
      setSlugs((s) => ({ ...s, [id]: null }));
    });
  }

  const enderecoDe = (id: string) => slugs[id] ?? null;

  const Etiqueta = ({ id }: { id: string }) =>
    enderecoDe(id) ? (
      <span className="etiqueta etiqueta-noar">Publicado</span>
    ) : (
      <span className="etiqueta">
        <span className="etiqueta-ponto" aria-hidden="true" />
        Rascunho
      </span>
    );

  const Endereco = ({ id }: { id: string }) => {
    const slug = enderecoDe(id);
    return slug ? (
      <span className="t-data text-[12.5px] text-(--c-ink)">/c/{slug}</span>
    ) : (
      /* "rascunho" em terciário e não um traço: o traço diria "não tem
         endereço", e a verdade é que ele existe e ainda não está no ar. */
      <span className="text-[12.5px] text-(--c-ink-3)">rascunho</span>
    );
  };

  const Acoes = ({ c }: { c: ConviteNaLista }) => {
    const slug = enderecoDe(c.id);
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center justify-end gap-3">
          {slug ? (
            <>
              <Link
                href={`/c/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-(--c-ink) underline underline-offset-4"
              >
                Abrir
              </Link>
              <button
                type="button"
                onClick={() => tirarDoAr(c.id)}
                disabled={ocupado}
                className="text-[13px] text-(--c-ink-2) underline underline-offset-4 disabled:opacity-50"
              >
                Despublicar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => publicar(c.id)}
              disabled={ocupado}
              className="text-[13px] text-(--c-ink) underline underline-offset-4 disabled:opacity-50"
            >
              Publicar
            </button>
          )}

          {/* Apagar convite publicado tira do ar um endereço que pode já
              estar no WhatsApp de gente de verdade. Não é desfazer um
              desenho — é derrubar um link que alguém vai abrir. */}
          <DialogoDestrutivo
            gatilho={
              <span
                aria-label={`Apagar ${c.nome}`}
                className="px-1 text-[15px] leading-none text-(--c-ink-3) hover:text-(--c-danger)"
              >
                ✕
              </span>
            }
            titulo={`Apagar ${c.nome}?`}
            confirmar="Apagar convite"
            form={{
              action: apagarConviteAction,
              campos: (
                <>
                  <input type="hidden" name="siteId" value={siteId} />
                  <input type="hidden" name="orderId" value={orderId} />
                  <input type="hidden" name="inviteId" value={c.id} />
                </>
              ),
            }}
          >
            {slug
              ? `Este convite está no ar em /c/${slug}. Quem já recebeu o link vai encontrar uma página que não existe mais. O desenho não volta.`
              : "O desenho deste convite não volta. Os outros convites e o site de vocês não mudam."}
          </DialogoDestrutivo>
        </div>

        {erros[c.id] && (
          <p role="alert" className="text-[12px] text-(--c-danger)">
            {erros[c.id]}
          </p>
        )}
      </div>
    );
  };

  const Nome = ({ c }: { c: ConviteNaLista }) => (
    <Link
      href={`/conta/convites/${c.id}`}
      className="text-[14px] text-(--c-ink) hover:underline underline-offset-4"
    >
      {c.nome}
    </Link>
  );

  const Miniatura = ({ c }: { c: ConviteNaLista }) => (
    <span className="block h-[60px] w-[48px] shrink-0 overflow-hidden rounded-[2px] border border-(--c-rule)">
      {c.miniatura}
    </span>
  );

  return (
    <>
      {/* Desktop: a tabela do artboard E7. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-(--c-rule)">
              <th className="w-[64px] pb-2" />
              <th className="meta pb-2 text-(--c-ink-2)">Convite</th>
              <th className="meta pb-2 text-(--c-ink-2)">Link</th>
              <th className="meta w-[130px] pb-2 text-(--c-ink-2)">Status</th>
              <th className="w-[190px] pb-2" />
            </tr>
          </thead>
          <tbody>
            {convites.map((c) => (
              <tr key={c.id} className="border-b border-(--c-rule)">
                <td className="py-3 pr-3 align-middle">
                  <Miniatura c={c} />
                </td>
                <td className="py-3 pr-3 align-middle">
                  <Nome c={c} />
                </td>
                <td className="py-3 pr-3 align-middle">
                  <Endereco id={c.id} />
                </td>
                <td className="py-3 pr-3 align-middle">
                  <Etiqueta id={c.id} />
                </td>
                <td className="py-3 align-middle">
                  <Acoes c={c} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular: cada convite vira um cartão. Miniatura, nome e etiqueta na
          primeira linha; o endereço na segunda; as ações embaixo. Cinco
          colunas num aparelho de 390px viraria rolagem lateral, e rolagem
          lateral esconde justamente a coluna de ações. */}
      <ul className="flex flex-col gap-3 md:hidden">
        {convites.map((c) => (
          <li
            key={c.id}
            className="surface-raised flex flex-col gap-2.5 rounded-[3px] p-3"
          >
            <div className="flex items-center gap-3">
              <Miniatura c={c} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Nome c={c} />
                <Endereco id={c.id} />
              </div>
              <Etiqueta id={c.id} />
            </div>
            <div className="border-t border-(--c-rule) pt-2.5">
              <Acoes c={c} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
