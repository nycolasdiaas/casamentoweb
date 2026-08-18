import Link from "next/link";

/**
 * O convite como ARQUIVO, ao lado das áreas editáveis.
 *
 * Fica aqui, e não numa tela própria, porque o que ele mostra é exatamente o
 * que o casal acabou de editar na coluna: nomes, data, local. Baixar logo
 * depois de corrigir a data é o gesto natural — e ver o botão lembra que o
 * convite existe, o que uma tela escondida no menu não faz.
 *
 * É uma âncora, não um botão com fetch: a rota devolve a imagem com
 * `Content-Disposition: attachment`, então o navegador cuida do download
 * sozinho — sem estado de carregando, sem blob na memória, e funciona com o
 * JS ainda carregando.
 *
 * Sem data, o botão não existe. A rota recusa (409) porque um "Save the Date"
 * sem data é um convite quebrado; aqui a gente diz POR QUE não dá, em vez de
 * oferecer um download que falha. É a mesma regra do OQueFalta: a tela mostra
 * o caminho, não o erro.
 */
export default function BaixarConvite({
  siteId,
  temData,
}: {
  siteId: string;
  temData: boolean;
}) {
  if (!temData) {
    return (
      <div className="surface-raised flex flex-col gap-2 rounded-[3px] p-4">
        <span className="meta text-(--c-ink-2)">Convite</span>
        <p className="text-[13px] leading-relaxed text-(--c-ink-2)">
          Assim que a data do casamento estiver preenchida, o convite para
          baixar aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-raised flex flex-col gap-3 rounded-[3px] p-4">
      <span className="meta text-(--c-ink-2)">Convite</span>
      <p className="text-[13px] leading-relaxed text-(--c-ink-2)">
        Uma imagem com o nome de vocês, a data e o endereço do site — no
        formato que o WhatsApp não corta.
      </p>
      <Link
        href={`/api/convite/${siteId}`}
        prefetch={false}
        download
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-(--c-ink) px-4 text-[13px] text-(--c-ink) transition-colors hover:bg-(--c-ink) hover:text-(--c-surface)"
      >
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M8 2v8M4.5 7L8 10.5L11.5 7M2.5 13.5h11" />
        </svg>
        Baixar convite
      </Link>
    </div>
  );
}
