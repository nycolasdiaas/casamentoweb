import Image from "next/image";

/**
 * A tela de espera da plataforma: a logo respirando sobre o papel.
 *
 * Existe porque o painel não tinha NENHUM `loading.tsx` — o Next reserva um
 * slot por segmento de rota para exatamente isto, e os 28 arquivos de página
 * do projeto não preenchiam um. O efeito era a navegação congelar na tela
 * anterior até o servidor responder, que é a sensação que mais denuncia
 * interface montada às pressas.
 *
 * Server component: é marcação e CSS, sem estado. Não custa um byte de JS.
 */
export default function BrandLoader({
  label = "Carregando",
  sublabel,
}: {
  label?: string;
  sublabel?: string;
}) {
  return (
    <div
      // `polite` e não `assertive`: o leitor de tela anuncia quando terminar a
      // frase atual, em vez de interromper quem está no meio de uma leitura.
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center"
    >
      <Image
        src="/logo-enlace.png"
        alt=""
        // alt vazio + aria-hidden: quem usa leitor de tela já recebe o texto
        // abaixo. Anunciar a logo aqui seria repetir a mesma informação.
        aria-hidden
        width={72}
        height={72}
        priority
        className="motion-breathe size-16 object-contain"
      />

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-(--color-olive)">{label}</p>
        {sublabel && (
          <p className="max-w-xs text-xs leading-relaxed text-(--color-muted)">
            {sublabel}
          </p>
        )}
      </div>

      {/* Trilho de progresso indeterminado. Não promete porcentagem — mentir
          sobre o quanto falta é pior que não dizer. */}
      <div className="h-px w-32 overflow-hidden bg-(--color-gold)/20 text-(--color-gold)">
        <div className="motion-skeleton h-full w-full" />
      </div>
    </div>
  );
}
