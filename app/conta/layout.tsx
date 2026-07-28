import { Suspense } from "react";

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

function ContaCarregando() {
  return (
    <main className="flex-1 flex flex-col gap-4 px-6 py-12 max-w-2xl mx-auto w-full">
      <div className="h-6 w-40 rounded bg-(--color-olive)/10 animate-pulse" />
      <div className="h-32 w-full rounded bg-(--color-olive)/10 animate-pulse" />
    </main>
  );
}
