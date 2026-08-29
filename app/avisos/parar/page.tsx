import { Suspense } from "react";
import { uiPrensa } from "@/lib/fonts/ui";
import { tokenConfere } from "@/lib/site/descadastro";
import { pararResumoSemanal } from "@/lib/repositories/users";

/**
 * "Parar de receber" — o fim do link do rodapé do resumo semanal.
 *
 * Sem login de propósito: ver `lib/site/descadastro.ts`. Quem quer parar de
 * receber está no cliente de e-mail, e um descadastro que pede senha vira
 * denúncia de spam.
 *
 * A tela confirma o que aconteceu e diz como voltar atrás. Um descadastro que
 * não avisa que foi feito deixa a pessoa clicando de novo.
 */
export default function PararDeReceber({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; t?: string }>;
}) {
  return (
    <main
      className={`${uiPrensa} flex min-h-screen items-center justify-center bg-(--c-surface) p-6 text-(--c-ink)`}
    >
      {/* `searchParams` é dado não cacheado: lido no corpo da página, ele
          trava a rota inteira no build ("Uncached data was accessed outside of
          `<Suspense>`") — e o `next dev` não avisa. A promessa desce sem
          `await`. */}
      <Suspense fallback={<Moldura>Um instante…</Moldura>}>
        <Resultado busca={searchParams} />
      </Suspense>
    </main>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-raised flex max-w-[440px] flex-col gap-3 rounded-[3px] p-8 text-center">
      {children}
    </div>
  );
}

async function Resultado({
  busca,
}: {
  busca: Promise<{ u?: string; t?: string }>;
}) {
  const { u, t } = await busca;

  const ok = Boolean(u && t && tokenConfere(u, t));
  if (ok && u) await pararResumoSemanal(u);

  if (!ok) {
    return (
      <Moldura>
        <h1 className="t-d2">Este link não confere.</h1>
        <p className="t-corpo-p text-(--c-ink-2)">
          Ele pode ter sido copiado pela metade. Abra o e-mail de novo e clique
          direto no link, ou entre no painel e desligue por lá.
        </p>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <h1 className="t-d2">Pronto, parou por aqui.</h1>
      <p className="t-corpo-p text-(--c-ink-2)">
        Vocês não vão mais receber o resumo semanal. Os e-mails sobre o pedido
        de vocês — pagamento e publicação — continuam, porque eles não são
        aviso: são o recibo do que aconteceu.
      </p>
      <p className="t-corpo-p text-(--c-ink-2)">
        Mudou de ideia? É só voltar pelo painel.
      </p>
    </Moldura>
  );
}
