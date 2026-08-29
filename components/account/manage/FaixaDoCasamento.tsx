"use client";

import { CopiarLink } from "@/components/ui/prensa";
import NumeroQueConta from "@/components/ui/NumeroQueConta";

/**
 * Faixa E1 · a régua do casamento: a contagem e o endereço.
 *
 * Os dois dados que o casal reabre o painel para ver. Estavam no menu lateral;
 * com as abas em cima, ganharam lugar próprio no Início — que é onde o desenho
 * E1 os coloca (a coluna da direita, contagem em oliva e endereço logo
 * abaixo).
 *
 * A contagem é calculada NO CLIENTE de propósito. No servidor seria
 * `Date.now()` durante o render — impuro, e com Cache Components ligado ela
 * congelaria dentro do cache: o casal veria "faltam 102 dias" por dias a fio.
 */
function diasAte(data: string | null): number | null {
  if (!data) return null;
  // Meio-dia evita que o fuso empurre a data um dia para trás.
  const alvo = new Date(`${data}T12:00:00`).getTime();
  if (Number.isNaN(alvo)) return null;
  return Math.ceil((alvo - Date.now()) / 86_400_000);
}

export default function FaixaDoCasamento({
  coluna = false,
  weddingDate,
  dataLegivel,
  endereco,
}: {
  /** Empilha em vez de espalhar — é a coluna da direita do E1. */
  coluna?: boolean;
  /** yyyy-mm-dd */
  weddingDate: string | null;
  /** "19 de setembro de 2026" — já formatado no servidor, no fuso do site. */
  dataLegivel: string | null;
  /** Endereço público completo, ou null enquanto o site não está no ar. */
  endereco: string | null;
}) {
  const dias = diasAte(weddingDate);

  return (
    <div
      className={
        coluna
          ? "flex flex-col gap-4"
          : "grid grid-cols-1 sm:grid-cols-2 gap-4"
      }
    >
      <div className="bg-(--c-olive) text-(--c-paper-warm) rounded-[3px] p-6 flex flex-col items-center justify-center text-center gap-1">
        {dias === null ? (
          <>
            <span className="meta text-white/60">A data</span>
            <p className="t-display text-[22px] leading-tight mt-1">
              Ainda não escolhida
            </p>
            <p className="text-[12.5px] text-white/70">
              Quando marcarem, a contagem começa sozinha.
            </p>
          </>
        ) : (
          <>
            <span className="meta text-white/60">
              {dias > 0 ? "Faltam" : dias === 0 ? "É hoje" : "Foi em"}
            </span>
            {dias > 0 ? (
              <>
                <p className="t-display text-[52px] leading-none">
                  <NumeroQueConta valor={dias} />
                </p>
                <p className="text-[13px] text-white/75">
                  {dias === 1 ? "dia" : "dias"}
                  {dataLegivel ? ` para ${dataLegivel}` : ""}
                </p>
              </>
            ) : (
              <p className="t-display text-[26px] leading-tight mt-1">
                {dataLegivel ?? ""}
              </p>
            )}
          </>
        )}
      </div>

      <div className="surface-raised rounded-[3px] p-6 flex flex-col gap-3 justify-center">
        <span className="meta text-(--c-ink-2)">Endereço do site</span>
        {endereco ? (
          <>
            {/* `break-all` porque o endereço é uma palavra só e sem isso ele
                estoura o cartão no celular. */}
            <p className="t-data text-[14px] text-(--c-ink) break-all">
              {endereco.replace(/^https?:\/\//, "")}
            </p>
            <CopiarLink url={endereco} className="self-start" />
          </>
        ) : (
          <p className="t-corpo-p text-(--c-ink-2)">
            O endereço público entra no ar depois do pagamento. Até lá, a prévia
            é de vocês.
          </p>
        )}
      </div>
    </div>
  );
}
