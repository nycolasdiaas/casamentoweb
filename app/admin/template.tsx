import { Suspense } from "react";
import PageTransition from "@/components/ui/PageTransition";

/**
 * Mesma estrutura do painel do casal — ver app/conta/template.tsx para o
 * porquê do Suspense morar aqui e não no layout.
 *
 * O fallback é esqueleto de lista, não a marca: aqui quem espera é a equipe,
 * várias vezes por dia, e o rito da logo só cansaria quem já sabe onde está.
 */
export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ListaCarregando />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}

function ListaCarregando() {
  return (
    <main className="flex-1 flex flex-col gap-4 px-6 py-12 max-w-3xl mx-auto w-full text-(--color-olive)">
      <div className="motion-skeleton h-6 w-40" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="motion-skeleton h-24 w-full"
          style={{ "--motion-delay": `${i * 90}ms` } as React.CSSProperties}
        />
      ))}
    </main>
  );
}
