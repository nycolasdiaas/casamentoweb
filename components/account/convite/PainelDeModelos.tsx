"use client";

import type { TemplateStyleId } from "@/lib/templates";
import type { ModeloDeConvite } from "@/lib/templates/modelos";
import { DialogoDestrutivo } from "@/components/ui/prensa";
import type { ThemePalette } from "@/lib/theme/spec";

/**
 * E9 · o painel de Modelos do editor de convite.
 *
 * Seis miniaturas, uma por estilo. Clicar troca **cor e fonte** do convite —
 * nunca o desenho. O texto, a posição e a ordem das camadas ficam onde estão.
 *
 * ── A cor sai do preset do molde, nunca de hex escrito aqui ────────────────
 *
 * Mesma regra da galeria da vitrine: se o preset do Toscana mudar, a miniatura
 * muda junto. Uma lista de cores ao lado seria uma segunda verdade — e a
 * segunda verdade é sempre a que fica velha.
 *
 * As paletas chegam prontas do SERVIDOR (`modelosDeConvite`). Importar o
 * registry aqui arrastaria os seis moldes para o navegador, e com eles as
 * consultas com `"use cache"` que o Next recusa em componente de cliente.
 *
 * ── Por que um diálogo antes ───────────────────────────────────────────────
 *
 * Trocar de modelo mexe em cor que o casal pode ter escolhido — e mesmo com a
 * regra que preserva escolha manual, o resultado muda a tela inteira de uma
 * vez. O desfazer cobre o arrependimento tardio, mas ele só ajuda quem sabe
 * que perdeu algo. Uma pergunta antes custa um clique.
 *
 * ── O que ele NÃO faz ──────────────────────────────────────────────────────
 *
 * Não troca o estilo do SITE. As duas escolhas são independentes desde o
 * `inviteSeed`, e ligá-las agora faria o casal mudar o site sem saber, a
 * partir de uma tela de convite.
 */
export default function PainelDeModelos({
  modelos,
  atual,
  aoTrocar,
}: {
  modelos: ModeloDeConvite[];
  /** O estilo do site — só para marcar qual miniatura está em uso. */
  atual: TemplateStyleId | null;
  aoTrocar: (paleta: ThemePalette) => void;
}) {
  return (
    <div className="surface-raised flex flex-col gap-2.5 rounded-[3px] p-4">
      <span className="meta text-(--c-ink-2)">Modelos</span>

      <div className="grid grid-cols-2 gap-2">
        {modelos.map((estilo) => {
          const paleta = estilo.paleta;
          const emUso = estilo.id === atual;

          return (
            <DialogoDestrutivo
              key={estilo.id}
              gatilho={
                <span
                  data-modelo={estilo.id}
                  aria-current={emUso ? "true" : undefined}
                  className="flex aspect-3/4 w-full flex-col items-center justify-center gap-1 rounded-[2px]"
                  style={{
                    background: paleta.paper,
                    border: emUso
                      ? "2px solid var(--c-mark)"
                      : "1px solid var(--c-rule)",
                  }}
                >
                  <span
                    className="text-[13px] leading-none"
                    style={{ color: paleta.ink }}
                  >
                    Ana & João
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-px w-6"
                    style={{ background: paleta.accent }}
                  />
                  <span
                    className="meta text-[9px]"
                    style={{ color: paleta.ink }}
                  >
                    {estilo.nome}
                  </span>
                </span>
              }
              titulo="Trocar o modelo do convite?"
              confirmar="Trocar modelo"
              onConfirmar={() => aoTrocar(paleta)}
            >
              As cores e as fontes mudam para as do estilo novo. O texto e a
              posição dos blocos ficam como estão.
            </DialogoDestrutivo>
          );
        })}
      </div>
    </div>
  );
}
