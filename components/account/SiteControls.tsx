"use client";

import { useActionState } from "react";
import {
  toggleSectionAction,
  moveSectionAction,
  setSiteVisibilityAction,
} from "@/app/actions/site-actions";

export type SecaoView = {
  key: string;
  label: string;
  descricao: string;
  enabled: boolean;
  fixa: boolean;
  podeSubir: boolean;
  podeDescer: boolean;
};

/**
 * Setas de reordenar. Cada direção é um form próprio porque são duas ações
 * distintas — e assim cada botão tem o próprio estado de "enviando".
 */
function MoveButtons({
  siteId,
  sectionKey,
  podeSubir,
  podeDescer,
  bloqueado,
}: {
  siteId: string;
  sectionKey: string;
  podeSubir: boolean;
  podeDescer: boolean;
  bloqueado: boolean;
}) {
  const [, subir, subindo] = useActionState(moveSectionAction, undefined);
  const [, descer, descendo] = useActionState(moveSectionAction, undefined);

  const classe =
    "flex size-7 items-center justify-center rounded-full border border-(--color-gold)/50 bg-white text-xs text-(--color-olive) transition-colors hover:bg-(--color-blush) disabled:opacity-30 disabled:hover:bg-white";

  return (
    <div className="flex items-center gap-1">
      <form action={subir}>
        <input type="hidden" name="siteId" value={siteId} />
        <input type="hidden" name="sectionKey" value={sectionKey} />
        <input type="hidden" name="direcao" value="up" />
        <button
          type="submit"
          disabled={!podeSubir || bloqueado || subindo}
          aria-label="Mover para cima"
          title="Mover para cima"
          className={classe}
        >
          ↑
        </button>
      </form>
      <form action={descer}>
        <input type="hidden" name="siteId" value={siteId} />
        <input type="hidden" name="sectionKey" value={sectionKey} />
        <input type="hidden" name="direcao" value="down" />
        <button
          type="submit"
          disabled={!podeDescer || bloqueado || descendo}
          aria-label="Mover para baixo"
          title="Mover para baixo"
          className={classe}
        >
          ↓
        </button>
      </form>
    </div>
  );
}

function SectionToggle({
  siteId,
  secao,
  bloqueado,
}: {
  siteId: string;
  secao: SecaoView;
  bloqueado: boolean;
}) {
  const [state, action, pending] = useActionState(
    toggleSectionAction,
    undefined
  );

  return (
    <li className="flex items-start justify-between gap-4 border-b border-(--color-gold)/20 py-3 last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium">{secao.label}</span>
        <span className="text-xs text-(--color-muted) leading-relaxed">
          {secao.descricao}
        </span>
        {state && "error" in state && (
          <span className="text-xs text-red-700">{state.error}</span>
        )}
      </div>

      {secao.fixa ? (
        <span className="shrink-0 text-xs text-(--color-muted)">sempre</span>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          <MoveButtons
            siteId={siteId}
            sectionKey={secao.key}
            podeSubir={secao.podeSubir}
            podeDescer={secao.podeDescer}
            bloqueado={bloqueado}
          />
        <form action={action} className="shrink-0">
          <input type="hidden" name="siteId" value={siteId} />
          <input type="hidden" name="sectionKey" value={secao.key} />
          {/* Envia o estado DESEJADO: se está ligada, o botão desliga. */}
          {!secao.enabled && <input type="hidden" name="enabled" value="on" />}
          <button
            type="submit"
            disabled={pending || bloqueado}
            aria-pressed={secao.enabled}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              secao.enabled
                ? "border-[#2f3a29] bg-[#2f3a29] text-white"
                : "border-(--color-gold)/50 bg-white text-(--color-olive)"
            }`}
          >
            {pending ? "..." : secao.enabled ? "Aparece" : "Escondida"}
          </button>
        </form>
        </div>
      )}
    </li>
  );
}

/**
 * Controle do site pelo casal: quais seções aparecem e se o site está no ar.
 *
 * A primeira publicação NÃO está aqui — ela acontece com a confirmação do
 * pagamento (§7.2 do SDD). Aqui é o que vem depois: esconder uma seção que
 * não faz sentido para a festa deles, ou tirar o site do ar.
 */
export default function SiteControls({
  siteId,
  status,
  slug,
  secoes,
  jaFoiPublicado,
}: {
  siteId: string;
  status: string;
  slug: string;
  secoes: SecaoView[];
  jaFoiPublicado: boolean;
}) {
  const [state, action, pending] = useActionState(
    setSiteVisibilityAction,
    undefined
  );

  const noAr = status === "published";
  const arquivado = status === "archived";

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-(--color-gold)/40 bg-white p-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">O site de vocês</h2>
        <p className="text-sm text-(--color-olive)/70 leading-relaxed">
          {noAr
            ? "O site está no ar e qualquer pessoa com o link consegue abrir."
            : arquivado
              ? "O site está fora do ar. O endereço não responde, mas nada foi apagado."
              : "O site ainda está em prévia — só quem tem o link secreto vê."}
        </p>
      </div>

      {/* Seções */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--color-gold)">
          O que aparece no site
        </p>
        <ul className="flex flex-col">
          {secoes.map((secao) => (
            <SectionToggle
              key={secao.key}
              siteId={siteId}
              secao={secao}
              bloqueado={arquivado}
            />
          ))}
        </ul>
        <p className="pt-1 text-xs text-(--color-muted)">
          Esconder uma seção não apaga nada — é só deixar de mostrar. Dá para
          ligar de volta quando quiser.
        </p>
      </div>

      {/* No ar / fora do ar */}
      {(noAr || arquivado) && (
        <form
          action={action}
          className="flex flex-col gap-2 border-t border-(--color-gold)/30 pt-5"
        >
          <input type="hidden" name="siteId" value={siteId} />
          <input
            type="hidden"
            name="intent"
            value={noAr ? "despublicar" : "publicar"}
          />
          <button
            type="submit"
            disabled={pending || (arquivado && !jaFoiPublicado)}
            className={`btn btn-sm self-start ${noAr ? "btn-secondary" : "btn-primary"}`}
          >
            {pending
              ? "Um instante..."
              : noAr
                ? "Tirar o site do ar"
                : "Colocar o site no ar"}
          </button>
          <p className="text-xs text-(--color-muted) leading-relaxed">
            {noAr
              ? `Enquanto estiver fora do ar, /s/${slug} responde como página inexistente. Confirmações e presentes já recebidos continuam guardados.`
              : "Volta a responder na hora."}
          </p>
          {state && "saved" in state && (
            <p className="text-sm text-(--color-olive)">{state.message}</p>
          )}
          {state && "error" in state && (
            <p className="text-sm text-red-700">{state.error}</p>
          )}
        </form>
      )}
    </section>
  );
}
