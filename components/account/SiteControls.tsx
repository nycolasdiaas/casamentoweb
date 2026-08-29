"use client";

import { useActionState } from "react";
import {
  toggleSectionAction,
  moveSectionAction,
  setSiteVisibilityAction,
} from "@/app/actions/site-actions";
import { Icone } from "@/components/ui/prensa";

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
    "flex size-7 items-center justify-center rounded-full border border-(--c-rule) bg-white text-xs text-(--c-ink) transition-colors hover:bg-(--c-sunken) disabled:opacity-30 disabled:hover:bg-white";

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
          <Icone nome="setaCima" tamanho={16} />
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
          <Icone nome="setaBaixo" tamanho={16} />
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
    <li className="flex items-start justify-between gap-4 border-b border-(--c-rule) py-3 last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium">{secao.label}</span>
        <span className="text-xs text-(--c-ink-2) leading-relaxed">
          {secao.descricao}
        </span>
        {state && "error" in state && (
          <span className="text-xs text-(--c-danger)">{state.error}</span>
        )}
      </div>

      {secao.fixa ? (
        <span className="shrink-0 text-xs text-(--c-ink-2)">sempre</span>
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
          {/* O interruptor da prancha A4, não uma pílula verde: trilho de
              44×24 e botão de 20. Verde sólido escrito "Aparece" era um
              segundo acento por linha — com sete seções, sete acentos, e a
              regra é que a marca aparece uma vez por tela. O estado aqui é
              posição, não cor. */}
          <button
            type="submit"
            disabled={pending || bloqueado}
            aria-pressed={secao.enabled}
            aria-label={`${secao.label}: ${secao.enabled ? "aparece no site" : "escondida"}`}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
            style={{
              background: secao.enabled ? "var(--c-ink)" : "var(--c-sunken)",
              border: secao.enabled
                ? "1px solid var(--c-ink)"
                : "1px solid var(--c-rule)",
            }}
          >
            <span
              aria-hidden="true"
              className="absolute top-1/2 block size-5 -translate-y-1/2 rounded-full bg-white transition-[left]"
              style={{
                left: secao.enabled ? "calc(100% - 22px)" : "1px",
                boxShadow: secao.enabled
                  ? "none"
                  : "0 1px 2px rgb(0 0 0 / 0.2)",
              }}
            />
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
/**
 * Uma das três posições do controle de visibilidade.
 *
 * Cada opção é um `<button type="submit">` com o próprio `intent`, dentro do
 * mesmo `<form>`. Não é um grupo de rádio: rádio guarda escolha e espera um
 * "Salvar", e aqui cada posição é uma AÇÃO com consequência imediata e
 * diferente ("tirar do ar" não é o mesmo tipo de gesto que "liberar"). O
 * desenho mostra rádios; o comportamento que ele descreve é de botão.
 */
function Opcao({
  ativo,
  titulo,
  descricao,
  intent,
  rotuloDoBotao,
  campo,
  perigo = false,
  desabilitado,
}: {
  ativo: boolean;
  titulo: string;
  descricao: string;
  intent: string;
  rotuloDoBotao?: string;
  campo?: React.ReactNode;
  perigo?: boolean;
  desabilitado: boolean;
}) {
  return (
    <div
      className={`rounded-[2px] p-4 transition-colors duration-(--t-rapido) ${
        ativo
          ? "border-[1.5px] border-(--c-ink) bg-(--c-surface)"
          : "border border-(--c-rule)"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
            ativo ? "bg-(--c-ink)" : "border-[1.5px] border-(--c-rule)"
          }`}
        >
          {ativo && <span className="size-1.5 rounded-full bg-white" />}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[14.5px] ${ativo ? "font-medium text-(--c-ink)" : "text-(--c-ink)"}`}
          >
            {titulo}
          </p>
          <p className="t-corpo-p text-(--c-ink-2)">{descricao}</p>

          {/* O campo de senha só aparece na opção que precisa dele. */}
          {ativo || !campo ? campo : null}

          {!ativo || campo ? (
            <button
              type="submit"
              name="intent"
              value={intent}
              disabled={desabilitado}
              className={`btn btn-sm mt-3 ${perigo ? "btn-perigo" : "btn-quiet"}`}
            >
              {rotuloDoBotao ?? (ativo ? "Salvar" : "Usar esta")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Controle do site pelo casal: quais seções aparecem e quem consegue abrir.
 *
 * A primeira publicação NÃO está aqui — ela acontece com a confirmação do
 * pagamento (§7.2 do SDD). Aqui é o que vem depois.
 */
export default function SiteControls({
  siteId,
  status,
  slug,
  secoes,
  comSenha,
  jaFoiPublicado,
}: {
  siteId: string;
  status: string;
  slug: string;
  secoes: SecaoView[];
  /** `access_mode === "password"` — o site pede senha hoje. */
  comSenha: boolean;
  jaFoiPublicado: boolean;
}) {
  const [state, action, pending] = useActionState(
    setSiteVisibilityAction,
    undefined
  );

  const noAr = status === "published";
  const arquivado = status === "archived";
  // Prévia é antes de existir escolha: o site ainda não está no ar para
  // ninguém, e oferecer "público / com senha / oculto" ali seria oferecer três
  // posições que não mudam nada.
  const emPrevia = !noAr && !arquivado;

  return (
    /* E2 é DUAS COLUNAS: a lista de seções ocupa a maior, e o estado do site
       fica ao lado — não empilhado embaixo de sete linhas, onde some. */
    <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
      {/* Seções */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="t-d3 text-(--c-ink)">Seções do site</h2>
          <span className="meta text-(--c-ink-2)">use as setas para ordenar</span>
        </div>
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
        <p className="t-corpo-p text-(--c-ink-2)">
          Esconder uma seção não apaga nada — é só deixar de mostrar. Dá para
          ligar de volta quando quiser.
        </p>
      </div>

      {/* Visibilidade — o card da direita no artboard E2, agora com as TRÊS
          opções do desenho.

          "Oculto" não é um terceiro modo de acesso: é o site ARQUIVADO. As três
          posições do controle são a combinação de dois eixos que já existem —
          `status` (no ar / fora do ar) e `access_mode` (público / com senha).
          Modelar "oculto" como modo de acesso criaria dois lugares dizendo a
          mesma coisa, e um deles ficaria errado na primeira vez que alguém
          arquivasse um site por outro caminho. Ver o enum em `schema.ts`. */}
      <div className="surface-raised rounded-[3px] p-6 flex flex-col gap-4">
        <span className="meta text-(--c-ink-2)">Visibilidade do site</span>

        {emPrevia ? (
          <p className="t-corpo-p text-(--c-ink-2)">
            O site ainda está em prévia — só quem tem o link secreto vê. As
            opções de visibilidade aparecem quando ele entrar no ar.
          </p>
        ) : (
          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="siteId" value={siteId} />

            <Opcao
              ativo={noAr && !comSenha}
              titulo="Público"
              descricao="Qualquer pessoa com o link vê o site."
              intent="liberar"
              desabilitado={pending || (noAr && !comSenha)}
            />

            <Opcao
              ativo={noAr && comSenha}
              titulo="Só com senha"
              descricao="Convidados digitam uma senha para entrar."
              intent="proteger"
              desabilitado={pending}
              campo={
                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="rotulo text-(--c-ink-2)">
                    {comSenha ? "Trocar a senha" : "Senha"}
                  </span>
                  <input
                    type="text"
                    name="senha"
                    minLength={4}
                    autoComplete="off"
                    placeholder={comSenha ? "deixe em branco para manter" : "ex.: 1610"}
                    className="campo"
                  />
                  {/* Texto, não `password`: quem digita é o casal, sozinho, e
                      precisa CONFERIR o que vai escrever no convite impresso.
                      Esconder a senha aqui protege de ninguém e faz o casal
                      mandar para 80 convidados uma senha que ele não viu. */}
                  <span className="t-corpo-p text-(--c-ink-2)">
                    Escrevam ela no convite. Mínimo de 4 caracteres.
                  </span>
                </label>
              }
            />

            <Opcao
              ativo={arquivado}
              titulo="Oculto"
              descricao={`Fora do ar. O endereço /s/${slug} para de responder, e nada é apagado.`}
              intent={arquivado ? "publicar" : "despublicar"}
              rotuloDoBotao={arquivado ? "Colocar de volta no ar" : "Tirar do ar"}
              perigo={!arquivado}
              desabilitado={pending || (arquivado && !jaFoiPublicado)}
            />

            {state && "saved" in state && (
              <p className="text-[12.5px] text-(--c-ok)">{state.message}</p>
            )}
            {state && "error" in state && (
              <p className="erro-do-campo">{state.error}</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
