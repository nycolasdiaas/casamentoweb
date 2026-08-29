"use client";

import { useState } from "react";
import Image from "next/image";
import { CopiarLink, Icone } from "@/components/ui/prensa";

/**
 * S4 · a aba Compartilhar do painel.
 *
 * ── Por que esta tela existe ───────────────────────────────────────────────
 *
 * Terminado o site, o casal tem UMA tarefa: fazer o link circular. Antes disto
 * ele tinha um botão "Copiar link" perdido num card do Início, e o resto —
 * mensagem, QR, prévia do cartão — não existia. A prancha junta tudo num lugar
 * porque é um gesto só.
 *
 * ── As três mensagens prontas ──────────────────────────────────────────────
 *
 * Não são enfeite. A prancha S2 as escreve porque o casal, na hora de mandar,
 * trava — e o que ele escreve sozinho costuma ser pior que o link nu ("olha o
 * site aí"). Cada uma tem um momento: convidar, lembrar quem não respondeu, e
 * falar de presente sem parecer pedido de dinheiro.
 *
 * ── `navigator.share` com queda para `wa.me` ───────────────────────────────
 *
 * Regra de S2. No celular, `share` abre a folha do sistema e o casal escolhe o
 * grupo — é o caminho de menos atrito. No desktop ele não existe, e aí `wa.me`
 * abre o WhatsApp Web com a mensagem já escrita.
 */

type Props = {
  /** Endereço público completo, com esquema. */
  url: string;
  /** O mesmo endereço sem `https://` — é assim que se compartilha (S2). */
  urlLimpa: string;
  slug: string;
  /** "05 de setembro", quando há prazo de confirmação. */
  prazo: string | null;
  /** Endereço da imagem do cartão de link, para a prévia. */
  cartao: string;
  nomesDoCasal: string | null;
  dataLegivel: string | null;
};

export default function Compartilhar({
  url,
  urlLimpa,
  slug,
  prazo,
  cartao,
  nomesDoCasal,
  dataLegivel,
}: Props) {
  const mensagens = montarMensagens(urlLimpa, prazo);
  const [escolhida, setEscolhida] = useState(0);

  async function enviar() {
    const texto = mensagens[escolhida].texto;
    /* `navigator.share` pode não existir, e pode existir e ser recusado (o
       usuário fecha a folha do sistema). Os dois casos caem no `wa.me` — e o
       segundo NÃO é erro, então não vira aviso na tela. */
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: texto });
        return;
      } catch {
        /* fecha a folha ou não deu — segue para o WhatsApp */
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(texto)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <div className="flex flex-col gap-6">
        {/* O LINK */}
        <section className="surface-raised p-6">
          <h2 className="meta text-(--c-ink-2)">O link do site</h2>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* `break-all`: o endereço é uma palavra só e estoura o card no
                celular sem isto. */}
            <p className="surface-sunken t-data min-w-0 flex-1 break-all px-3.5 py-3 text-[15px] text-(--c-ink)">
              {urlLimpa}
            </p>
            <CopiarLink url={url} />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={enviar} className="btn btn-ink">
              Enviar pelo WhatsApp
            </button>
          </div>

          <fieldset className="mt-5 border-t border-(--c-rule) pt-4">
            <legend className="sr-only">Mensagem pronta</legend>
            <p className="meta text-(--c-ink-2)">Mensagem</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {mensagens.map((m, i) => (
                <button
                  key={m.rotulo}
                  type="button"
                  onClick={() => setEscolhida(i)}
                  aria-pressed={i === escolhida}
                  className={`rounded-[2px] px-3 py-2 text-[13px] transition-colors duration-(--t-rapido) ${
                    i === escolhida
                      ? "border-[1.5px] border-(--c-ink) text-(--c-ink)"
                      : "border border-(--c-rule) text-(--c-ink-2) hover:border-(--c-ink)"
                  }`}
                >
                  {m.rotulo}
                </button>
              ))}
            </div>

            <p className="surface-sunken mt-3 whitespace-pre-line px-4 py-3 text-[14.5px] leading-relaxed text-(--c-ink)">
              {mensagens[escolhida].texto}
            </p>
          </fieldset>
        </section>

        {/* COMO APARECE NO WHATSAPP */}
        <section className="surface-raised p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="meta text-(--c-ink-2)">Como aparece no WhatsApp</h2>
          </div>

          <div className="mt-3 max-w-[340px] overflow-hidden rounded-[6px] border border-(--c-rule)">
            <div className="relative aspect-[1200/630] bg-(--c-sunken)">
              {/* `unoptimized`: é a imagem do cartão, gerada sob medida em
                  1200×630. Passar pelo otimizador seria reprocessar um PNG que
                  já nasceu no tamanho certo. */}
              <Image
                src={cartao}
                alt="Prévia do cartão que aparece ao compartilhar o link"
                fill
                unoptimized
                sizes="340px"
                className="object-cover"
              />
            </div>
            <div className="bg-(--c-base) px-3 py-2.5">
              <p className="text-[12.5px] font-medium text-(--c-ink)">
                {[nomesDoCasal, dataLegivel].filter(Boolean).join(" · ") ||
                  "Nosso casamento"}
              </p>
              <p className="mt-0.5 text-[11.5px] text-(--c-ink-2)">
                Confirme sua presença e veja a lista de presentes.
              </p>
              <p className="meta mt-1 text-[10px] text-(--c-ink-2)">{urlLimpa}</p>
            </div>
          </div>

          <p className="t-corpo-p mt-3 text-(--c-ink-2)">
            É este cartão que aparece na conversa. Ele muda sozinho quando vocês
            trocam a foto de capa.
          </p>
        </section>
      </div>

      {/* QR CODE */}
      <div className="flex flex-col gap-6">
        <section className="surface-raised flex flex-col items-center p-6 text-center">
          <h2 className="meta self-start text-(--c-ink-2)">QR code</h2>

          {/* A ÁREA DE SILÊNCIO É BRANCA, sempre.
              Regra de S3: nunca sobre foto, nunca em papel escuro, nunca em cor
              da marca — a leitura falha e o convidado não avisa, só desiste. */}
          <div className="mt-4 border border-(--c-rule) bg-white p-3.5">
            <Image
              src={`/api/qr/${slug}`}
              alt={`QR code para ${urlLimpa}`}
              width={140}
              height={140}
              unoptimized
            />
          </div>

          <div className="mt-4 flex w-full gap-2">
            <a
              href={`/api/qr/${slug}?f=png`}
              download
              className="btn btn-quiet btn-sm flex-1"
            >
              PNG
            </a>
            <a
              href={`/api/qr/${slug}`}
              download={`qr-${slug}.svg`}
              className="btn btn-quiet btn-sm flex-1"
            >
              SVG
            </a>
          </div>

          <p className="t-corpo-p mt-4 text-(--c-ink-2)">
            Imprimam o endereço em texto embaixo do código — quem não conseguir
            escanear não avisa, só desiste.
          </p>
        </section>

        <section className="surface-flat flex items-start gap-3 p-5">
          <span className="mt-0.5 shrink-0 text-(--c-ink-2)">
            <Icone nome="informacao" tamanho={16} />
          </span>
          <p className="t-corpo-p text-(--c-ink-2)">
            Cada convite tem um link próprio (<span className="t-data">/c/…</span>
            ). Não mandem o link de um grupo para outro — os lugares reservados
            são diferentes.
          </p>
        </section>
      </div>
    </div>
  );
}

/**
 * As três mensagens da prancha S2, com o endereço e o prazo do casal.
 *
 * O link vai **sem `https://`** de propósito: o WhatsApp encurta visualmente e
 * o endereço nu parece endereço, não propaganda.
 */
function montarMensagens(
  urlLimpa: string,
  prazo: string | null
): { rotulo: string; texto: string }[] {
  return [
    {
      rotulo: "Convidar",
      texto: `Saiu o site do nosso casamento! Tudo o que vocês precisam saber está aqui — e dá para confirmar presença por lá.\n${urlLimpa}`,
    },
    {
      rotulo: "Lembrar",
      texto: prazo
        ? `Oi! Passando só para lembrar de confirmar presença até ${prazo} — é rapidinho.\n${urlLimpa}`
        : `Oi! Passando só para lembrar de confirmar presença — é rapidinho.\n${urlLimpa}`,
    },
    {
      rotulo: "Presentes",
      texto: `Quem quiser nos presentear, a lista está no site — e dá para pagar por Pix.\n${urlLimpa}`,
    },
  ];
}
