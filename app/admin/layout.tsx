import { Suspense } from "react";
import { uiPrensa } from "@/lib/fonts/ui";

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
  // O escopo `.ui-prensa` precisa envolver o admin: os tokens --c-* vivem
  // DENTRO dele, e sem isso a migração de cor não resolveria nada — as
  // classes existiriam apontando para variáveis inexistentes.
  return (
    <div className={`${uiPrensa} flex-1 flex flex-col`}>
      <Suspense fallback={<PainelCarregando />}>{children}</Suspense>
    </div>
  );
}

/**
 * O admin ganha esqueleto de LISTA, não a logo: aqui quem espera é a equipe,
 * várias vezes por dia, e a silhueta das linhas diz o que vem — o rito da
 * marca só cansaria quem já sabe onde está.
 */
function PainelCarregando() {
  return (
    <main className="flex-1 flex flex-col gap-4 px-6 py-12 max-w-3xl mx-auto w-full text-(--c-ink)">
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
