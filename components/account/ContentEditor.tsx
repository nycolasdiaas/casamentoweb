"use client";

import { useActionState } from "react";
import { saveSiteContentAction } from "@/app/actions/content-actions";

export type ContentEditorValues = {
  coupleNames: string;
  partnerA: string;
  partnerB: string;
  weddingDate: string; // yyyy-mm-dd, já no fuso do site
  weddingTime: string; // hh:mm, "" quando ainda não informado
  ceremonyVenue: string;
  ceremonyAddress: string;
  ceremonyMapUrl: string;
  receptionVenue: string;
  receptionAddress: string;
  receptionTime: string;
  story: string;
  dressCode: string;
  giftMessage: string;
  pixKey: string;
  pixRecipient: string;
  pixCity: string;
  pixInstitution: string;
};

// A pele vem do sistema (`.campo` e `.rotulo` em globals.css), não de uma
// combinação de utilitários montada aqui: era um campo branco de fio fino,
// igual ao de qualquer serviço. Na Prensa o campo afunda e o botão sobe — é
// essa oposição que faz o formulário parecer desenhado.
const campo = "campo";
const rotulo = "flex flex-col gap-[7px]";
const titulo = "rotulo text-(--c-ink-2)";
const ajuda = "t-corpo-p text-(--c-ink-2)";

function Campo({
  name,
  label,
  hint,
  defaultValue,
  type = "text",
  placeholder,
  maxLength,
}: {
  name: keyof ContentEditorValues;
  label: string;
  hint?: string;
  defaultValue: string;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className={rotulo}>
      <span className={titulo}>{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={maxLength}
        className={campo}
      />
      {hint && <span className={ajuda}>{hint}</span>}
    </label>
  );
}

function Area({
  name,
  label,
  hint,
  defaultValue,
  rows = 5,
  placeholder,
  maxLength,
}: {
  name: keyof ContentEditorValues;
  label: string;
  hint?: string;
  defaultValue: string;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className={rotulo}>
      <span className={titulo}>{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`${campo} resize-y`}
      />
      {hint && <span className={ajuda}>{hint}</span>}
    </label>
  );
}

/**
 * O casal edita o próprio conteúdo do site — Fase 4 do SDD.
 *
 * Cada campo é opcional: as seções do molde degradam sozinhas quando falta
 * dado (§4.4 do SDD), então salvar pela metade é um estado válido, não um
 * erro. É o que permite preencher o local da festa semanas depois da data.
 */
export default function ContentEditor({
  siteId,
  values,
  previewUrl,
}: {
  siteId: string;
  values: ContentEditorValues;
  previewUrl: string | null;
}) {
  const [state, action, pending] = useActionState(
    saveSiteContentAction,
    undefined
  );

  /* O que a tela mostra depois de uma recusa: o que o casal DIGITOU, não o
     último valor salvo.
     
     O React reinicia formulário não-controlado quando a action termina —
     inclusive quando ela termina em erro. Como os campos usam `defaultValue`,
     uma chave Pix com um dígito errado devolvia a tela ao estado anterior e
     levava junto os onze campos: locais, endereços, horários, traje e a
     história inteira (UX-004).
     
     `defaultValue` só vale quando o campo MONTA — por isso a `key` no
     formulário. Ela muda a cada recusa, o React remonta, e os valores
     devolvidos aparecem. É o mecanismo que o próprio React oferece para
     "este formulário agora é outro", e custa menos que controlar 18 campos. */
  const recusado = state && "error" in state ? state : null;
  const valoresNaTela = recusado
    ? ({ ...values, ...recusado.valores } as ContentEditorValues)
    : values;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-(--c-ink-2) leading-relaxed">
          Editem quando quiserem — a mudança aparece no site na hora. O que
          ficar em branco não aparece, então dá para preencher aos
          poucos.
        </p>
      </div>

      <form
        key={recusado?.marca ?? "inicial"}
        action={action}
        className="flex flex-col gap-5"
      >
        <input type="hidden" name="siteId" value={siteId} />

        <Campo
          name="coupleNames"
          label="Nomes de vocês"
          hint="Como aparece na capa do convite. Ex: Ana & Pedro"
          defaultValue={valoresNaTela.coupleNames}
          maxLength={120}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo
            name="partnerA"
            label="Primeiro nome"
            hint="Usado nas iniciais do monograma"
            defaultValue={valoresNaTela.partnerA}
            maxLength={60}
          />
          <Campo
            name="partnerB"
            label="Segundo nome"
            hint="Deixem em branco e a gente tira dos nomes acima"
            defaultValue={valoresNaTela.partnerB}
            maxLength={60}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo
            name="weddingDate"
            label="Data do casamento"
            type="date"
            hint="Alimenta a contagem regressiva"
            defaultValue={valoresNaTela.weddingDate}
          />
          <Campo
            name="weddingTime"
            label="Horário da cerimônia"
            type="time"
            hint="Em branco = ainda não divulgado; o horário some do site"
            defaultValue={valoresNaTela.weddingTime}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-(--c-rule) pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--c-mark)">
            Cerimônia
          </p>
          <Campo
            name="ceremonyVenue"
            label="Local"
            placeholder="Ex: Igreja Nossa Senhora do Carmo"
            defaultValue={valoresNaTela.ceremonyVenue}
            maxLength={160}
          />
          <Campo
            name="ceremonyAddress"
            label="Endereço"
            placeholder="Rua, número, bairro, cidade"
            defaultValue={valoresNaTela.ceremonyAddress}
            maxLength={300}
          />
          <Campo
            name="ceremonyMapUrl"
            label="Link do mapa"
            type="url"
            hint="Cole o link do Google Maps. O convidado abre a rota num toque."
            placeholder="https://maps.google.com/…"
            defaultValue={valoresNaTela.ceremonyMapUrl}
            maxLength={600}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-(--c-rule) pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--c-mark)">
            Festa
          </p>
          <Campo
            name="receptionVenue"
            label="Local"
            placeholder="Ex: Espaço Jardim das Oliveiras"
            defaultValue={valoresNaTela.receptionVenue}
            maxLength={160}
          />
          <Campo
            name="receptionAddress"
            label="Endereço"
            placeholder="Rua, número, bairro, cidade"
            defaultValue={valoresNaTela.receptionAddress}
            maxLength={300}
          />
          <Campo
            name="receptionTime"
            label="Horário da festa"
            type="time"
            hint="Aparece no site logo abaixo do local da festa. Em branco, o site mostra só o local."
            defaultValue={valoresNaTela.receptionTime}
          />
          <Campo
            name="dressCode"
            label="Traje"
            placeholder="Ex: Esporte fino. Evitem branco e off-white."
            defaultValue={valoresNaTela.dressCode}
            maxLength={200}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-(--c-rule) pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--c-mark)">
            Textos
          </p>
          <Area
            name="story"
            label="A história de vocês"
            hint="Vira a seção “Nossa história”, aquele trecho que os convidados leem entre as fotos. Escrevam com as palavras de vocês."
            placeholder="A gente se conheceu em 2019, num churrasco de amigos…"
            defaultValue={valoresNaTela.story}
            rows={7}
            maxLength={5000}
          />
          <Area
            name="giftMessage"
            label="Recado sobre presentes"
            hint="Aparece acima da lista de presentes. Ex: “A presença de vocês já é o maior presente — mas se quiserem nos mimar...”"
            defaultValue={valoresNaTela.giftMessage}
            rows={3}
            maxLength={1000}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-(--c-rule) pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--c-mark)">
            Pix dos presentes
          </p>

          {/* O aviso não é rodapé nem tooltip: é a primeira coisa da seção.
              O casal está prestes a publicar um dado que qualquer convidado
              com o link vai ver, e descobrir isso depois não tem desfazer. */}
          <p className="rounded-[3px] border border-(--c-rule) bg-(--c-sunken) px-4 py-3 text-xs leading-relaxed text-(--c-ink)">
            <strong className="font-semibold">
              Esta chave fica visível para quem abrir o site.
            </strong>{" "}
            É assim que o convidado consegue presentear — mas escolham uma
            chave que vocês não se importem de tornar pública. Chave aleatória
            do banco é a mais discreta: não revela CPF, telefone nem e-mail.
          </p>

          <Campo
            name="pixKey"
            label="Chave Pix"
            hint="CPF, CNPJ, e-mail, celular com DDD ou a chave aleatória do banco. Conferimos os dígitos antes de salvar. Em branco = a lista aparece sem forma de pagamento."
            placeholder="00000000-0000-0000-0000-000000000000"
            defaultValue={valoresNaTela.pixKey}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo
              name="pixRecipient"
              label="Nome de quem recebe"
              hint="Aparece na confirmação do app do banco. Até 25 letras, sem acento — é limite do padrão do Pix, não nosso."
              placeholder="Ana Paula Souza"
              defaultValue={valoresNaTela.pixRecipient}
              maxLength={25}
            />
            <Campo
              name="pixCity"
              label="Cidade de quem recebe"
              hint="Também exigida pelo padrão. Até 15 letras."
              placeholder="Fortaleza"
              defaultValue={valoresNaTela.pixCity}
              maxLength={15}
            />
          </div>

          <Campo
            name="pixInstitution"
            label="Banco (opcional)"
            hint="Só para o convidado reconhecer o destino. Não entra no código do Pix."
            placeholder="Nubank"
            defaultValue={valoresNaTela.pixInstitution}
            maxLength={40}
          />
        </div>

        {/* O recado fica ACIMA dos botões: é onde o olho está depois de
            clicar em salvar. Embaixo, numa tela longa como esta, o casal
            clicava, não via nada acontecer e clicava de novo. */}
        <div aria-live="polite" className="min-h-5">
          {state && "saved" in state && (
            <p className="text-sm text-(--c-ink)">
              Salvo ✓ — o site já está com o conteúdo novo.
            </p>
          )}
          {recusado && (
            <p role="alert" className="text-sm text-(--c-danger)">
              {recusado.error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-(--c-rule) pt-5">
          <button type="submit" disabled={pending} className="btn btn-ink">
            {pending ? "Salvando…" : "Salvar e atualizar o site"}
          </button>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-quiet"
            >
              Ver o site
            </a>
          )}
        </div>

      </form>
    </section>
  );
}
