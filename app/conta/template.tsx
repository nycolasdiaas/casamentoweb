import { Suspense } from "react";
import PageTransition from "@/components/ui/PageTransition";
import BrandLoader from "@/components/ui/BrandLoader";

/**
 * Transição e espera em TODA navegação dentro do painel do casal.
 *
 * Duas coisas moram aqui, e as duas por causa do mesmo detalhe do Next:
 *
 * 1. **A transição de entrada.** O template recebe chave única por rota e é
 *    remontado a cada navegação — que é o gancho que faz a animação rodar de
 *    novo. Num `layout.tsx` ela tocaria uma vez só, na primeira carga.
 *
 * 2. **O `<Suspense>`.** Este é o que faltava, e era o que fazia a navegação
 *    parecer crua: *"Suspense boundaries inside layouts only show a fallback
 *    on first load, while templates show it on every navigation"* (doc do
 *    template.js). Com o limite só no layout, o casal clicava e ficava
 *    olhando a TELA ANTIGA durante a ida ao banco — sem nenhum sinal de que
 *    algo estava acontecendo — até a nova aparecer de uma vez.
 *
 * Agora a ordem é: clique → a marca aparece na hora → conteúdo chega e entra
 * animado. O `PageTransition` fica DENTRO do Suspense de propósito: ele só
 * monta quando o conteúdo real chega, e é aí que a entrada deve tocar.
 */
export default function ContaTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <BrandLoader
          label="Abrindo…"
          sublabel="Buscando as informações de vocês."
        />
      }
    >
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}
