"use client";

import Link from "next/link";
import { Icone, useBrinde } from "@/components/ui/prensa";

/**
 * E10 · a comemoração de "seu site está no ar".
 *
 * Aparece uma vez, no primeiro carregamento depois de publicar — o sinal é o
 * `?publicado=1` que `/api/pagamento/confirmar` põe e que a `CascaDoPainel`
 * apaga do endereço logo em seguida (transição #6). Na navegação seguinte ela
 * some sozinha, porque o parâmetro já não existe.
 *
 * É comemoração de um momento, não estado da tela. Um bloco permanente
 * dizendo "está no ar!" viraria decoração em duas visitas, e a etiqueta da
 * barra já conta o estado o tempo todo.
 *
 * Os dois botões não são simétricos de propósito. Copiar o link é o que a
 * pessoa quer fazer nos próximos dez segundos; mandar convite é o passo
 * seguinte, de outro dia.
 */
export default function SiteNoAr({
  endereco,
  urlCompleta,
  linkDosConvites,
}: {
  /** Sem esquema — é assim que o casal reconhece o próprio endereço. */
  endereco: string;
  urlCompleta: string;
  linkDosConvites: string;
}) {
  const brinde = useBrinde();

  async function copiar() {
    try {
      await navigator.clipboard.writeText(urlCompleta);
      brinde("Link copiado.");
    } catch {
      /* Área de transferência negada (contexto sem HTTPS, permissão do
         navegador). O endereço está escrito acima em texto selecionável, então
         o caminho manual continua aberto — e dizer isso é melhor que um botão
         que não faz nada em silêncio. */
      brinde("Não consegui copiar. O endereço está logo acima.");
    }
  }

  return (
    <div
      data-site-no-ar
      className="surface-raised flex flex-col items-center gap-3 rounded-[3px] px-6 py-8 text-center"
    >
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-(--c-ok) text-white selo-noar"
      >
        <Icone nome="check" tamanho={24} />
      </span>

      <h2 className="t-d1 text-(--c-ink)">Seu site está no ar!</h2>

      <p className="t-corpo-p text-(--c-ink-2)">
        Pagamento confirmado.{" "}
        <span className="t-data text-[13px] text-(--c-ink)">{endereco}</span> já
        pode ser compartilhado com os convidados.
      </p>

      <span className="etiqueta etiqueta-noar">No ar</span>

      <div className="flex flex-wrap justify-center gap-2 pt-2">
        <button type="button" onClick={copiar} className="btn btn-ink">
          Copiar link do site
        </button>
        <Link href={linkDosConvites} className="btn btn-quiet">
          Enviar convites
        </Link>
      </div>
    </div>
  );
}
