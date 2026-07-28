import { Suspense } from "react";

/**
 * Painel do admin: tudo aqui depende de sessão e lê o banco, então é
 * dinâmico por natureza — não existe shell estático útil para uma tela que
 * só faz sentido depois de autenticar.
 *
 * O <Suspense> vive aqui, e não em cada página, porque a fronteira é a mesma
 * para todas: nada do /admin é cacheável entre usuários.
 *
 * Ver docs/sdd-geracao-automatica.md §3.2.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<PainelCarregando />}>{children}</Suspense>;
}

function PainelCarregando() {
  return (
    <main className="flex-1 flex flex-col gap-4 px-6 py-12 max-w-3xl mx-auto w-full">
      <div className="h-6 w-40 rounded bg-(--color-olive)/10 animate-pulse" />
      <div className="h-24 w-full rounded bg-(--color-olive)/10 animate-pulse" />
      <div className="h-24 w-full rounded bg-(--color-olive)/10 animate-pulse" />
    </main>
  );
}
