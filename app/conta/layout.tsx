import { Suspense } from "react";
import BrandLoader from "@/components/ui/BrandLoader";

/**
 * Área do casal: mesma razão do /admin/layout.tsx — todas as telas dependem
 * de sessão e do banco, então a fronteira dinâmica é a área inteira.
 *
 * Ver docs/sdd-geracao-automatica.md §3.2.
 */
export default function ContaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<ContaCarregando />}>{children}</Suspense>;
}

/**
 * Antes: dois retângulos cinzas pulsando, iguais aos de qualquer painel
 * genérico. Agora a marca aparece na espera — é o momento em que o casal está
 * olhando para a tela sem nada acontecer, e o único em que a logo tem toda a
 * atenção dele.
 */
function ContaCarregando() {
  return (
    <main className="flex-1 flex flex-col">
      <BrandLoader
        label="Abrindo o painel de vocês"
        sublabel="Buscando os pedidos e o conteúdo do site."
      />
    </main>
  );
}
