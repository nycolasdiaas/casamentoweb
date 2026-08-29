"use client";

import { useState, useTransition } from "react";
import {
  despublicarConviteAction,
  publicarConviteAction,
} from "@/app/actions/invite-actions";

/**
 * Publicar o convite e copiar o link.
 *
 * ── Por que o link vem antes do download ───────────────────────────────────
 *
 * O convite começou como arquivo para baixar, e o limite apareceu no uso: num
 * PNG o botão "Lista de presentes" é desenho, não botão. O que o casal quer
 * mandar no WhatsApp é um LINK que abre e funciona — então é ele que fica em
 * primeiro, e o download vira o caminho de quem vai imprimir.
 *
 * ── Publicar é um gesto explícito ──────────────────────────────────────────
 *
 * Salvar grava o desenho; publicar é o que faz o convidado poder abrir. São
 * coisas diferentes: o casal mexe no convite durante semanas, e nem toda
 * versão salva deve estar no ar. Republicar mantém o MESMO endereço, então o
 * link que já circulou continua valendo com o desenho novo.
 */
export default function PublicarConvite({
  siteId,
  inviteId,
  urlInicial,
  noAr,
  temMudancaNaoSalva,
  siteNoAr,
  temSaida,
  aoAcrescentarBotao,
}: {
  siteId: string;
  inviteId: string;
  urlInicial: string | null;
  noAr: boolean;
  temMudancaNaoSalva: boolean;
  siteNoAr: boolean;
  /** O convite tem botão ou texto com link? Sem isso, publicar é recusado. */
  temSaida: boolean;
  /** Põe o botão de confirmar presença de volta, no rodapé do convite. */
  aoAcrescentarBotao: () => void;
}) {
  const [url, setUrl] = useState(urlInicial);
  const [publicado, setPublicado] = useState(noAr);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function publicar() {
    setErro(null);
    iniciar(async () => {
      const r = await publicarConviteAction(siteId, inviteId);
      if ("error" in r) {
        /* A action devolve um erro NOMEADO, não uma frase: quem escreve o
           texto é a tela, que sabe onde ele vai aparecer e que tem o botão
           para consertar do lado. */
        setErro(
          r.error === "sem-saida"
            ? "Este convite não tem para onde levar."
            : r.error
        );
        return;
      }
      setUrl(r.url);
      setPublicado(true);
    });
  }

  function tirarDoAr() {
    setErro(null);
    iniciar(async () => {
      const r = await despublicarConviteAction(siteId, inviteId);
      if ("error" in r) {
        setErro(r.error);
        return;
      }
      setPublicado(false);
    });
  }

  async function copiar() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      // Volta ao normal sozinho: um "Copiado!" permanente vira decoração e
      // deixa de confirmar coisa nenhuma no clique seguinte.
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Não consegui copiar. Selecione o endereço e copie à mão.");
    }
  }

  return (
    <div className="surface-raised flex flex-col gap-2.5 rounded-[3px] p-4">
      <span className="meta text-(--c-ink-2)">O link do convite</span>

      {/* Os botões do convite apontam para seções do SITE, e o site só
          responde depois de publicado. Sem este aviso o casal manda o convite,
          o convidado clica em "Lista de presentes" e cai num 404 — e ninguém
          descobre por quê. */}
      {!siteNoAr && (
        <p className="text-[11.5px] leading-snug text-(--c-mark)">
          O site de vocês ainda está em prévia. Os botões do convite
          (presentes, confirmação) só vão funcionar depois que ele estiver no
          ar.
        </p>
      )}

      {/* Beco sem saída é bug — a regra da prancha H. Um convite publicado sem
          botão é uma página que o convidado abre, lê e fecha, sem ter para
          onde ir; e o casal só descobre quando alguém avisa.
          
          O aviso vem com o conserto do lado: apontar o defeito e deixar a
          pessoa procurar sozinha onde arrumar é meio aviso. */}
      {!temSaida && (
        <div className="aviso text-(--c-warn) flex-col items-start gap-2">
          <span className="aviso-texto">
            Este convite não tem para onde levar. Acrescente o botão de
            confirmar presença antes de publicar.
          </span>
          <button
            type="button"
            onClick={aoAcrescentarBotao}
            className="btn btn-quiet btn-sm"
          >
            Acrescentar o botão
          </button>
        </div>
      )}

      {publicado && url ? (
        <>
          <p className="text-[12px] leading-snug text-(--c-ink-2)">
            Mandem este link no WhatsApp. Os botões do convite funcionam ao
            abrir.
          </p>

          <div className="flex items-stretch gap-1.5">
            <input
              readOnly
              value={url.replace(/^https?:\/\//, "")}
              aria-label="Endereço do convite"
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-11 min-w-0 flex-1 border border-(--c-rule) bg-(--c-sunken)/40 px-2 text-[12px]"
            />
            <button
              type="button"
              onClick={copiar}
              className="btn btn-ink btn-sm min-h-11 shrink-0"
            >
              {copiado ? "Copiado!" : "Copiar"}
            </button>
          </div>

          {/* O arquivo é gerado do que está NO BANCO. Avisar aqui evita o
              casal publicar, editar, e achar que o link quebrou. */}
          {temMudancaNaoSalva && (
            <p className="text-[11.5px] leading-snug text-(--c-mark)">
              Vocês mudaram o convite depois de publicar. Salvem e publiquem de
              novo para o link mostrar a versão nova.
            </p>
          )}

          <div className="flex items-center justify-between pt-0.5">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-(--c-ink-2) underline underline-offset-2 transition-colors hover:text-(--c-ink)"
            >
              Ver como o convidado vê
            </a>
            <button
              type="button"
              onClick={tirarDoAr}
              disabled={ocupado}
              className="text-[12px] text-(--c-ink-2) underline underline-offset-2 transition-colors hover:text-(--c-mark) disabled:opacity-40"
            >
              Tirar do ar
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[12px] leading-snug text-(--c-ink-2)">
            {url
              ? "O convite saiu do ar. Publiquem de novo — o link é o mesmo de antes."
              : "Publiquem para gerar o link que vocês mandam no WhatsApp."}
          </p>
          <button
            type="button"
            onClick={publicar}
            disabled={ocupado}
            className="btn btn-ink btn-sm min-h-11 w-full"
          >
            {ocupado ? "Publicando…" : "Publicar convite"}
          </button>
        </>
      )}

      {erro && (
        <p className="text-[11.5px] leading-snug text-(--c-mark)">{erro}</p>
      )}
    </div>
  );
}
