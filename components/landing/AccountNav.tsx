import Link from "next/link";
import { getSessionUserId } from "@/lib/auth/userSession";

/**
 * O trecho do menu que depende de estar logado.
 *
 * Existe separado porque ler o cookie de sessão no corpo da landing tornava
 * a página inteira dinâmica: 699 linhas de conteúdo institucional, que são
 * iguais para todo mundo, esperavam por uma decisão de dois links. Isolado
 * aqui e embrulhado em <Suspense>, o resto vira shell estático e só este
 * pedacinho chega por streaming.
 *
 * Ver docs/sdd-geracao-automatica.md §3.2.
 */
export default async function AccountNav() {
  const isLoggedIn = Boolean(await getSessionUserId());

  if (isLoggedIn) {
    return (
      <Link
        href="/conta"
        className="bg-(--c-ink) text-white text-xs font-medium tracking-wide px-4 py-2 rounded-[2px] hover:bg-(--c-ink)/90 transition-colors"
      >
        Minha conta
      </Link>
    );
  }

  return <LoggedOutLinks />;
}

/**
 * Também serve de fallback do <Suspense>: numa landing, a esmagadora maioria
 * das visitas é de quem não tem conta, então mostrar os links de entrada
 * primeiro é o que menos "pisca" para o visitante típico.
 */
export function LoggedOutLinks() {
  return (
    <>
      <Link href="/conta/entrar" className="hover:underline underline-offset-4">
        Entrar
      </Link>
      <Link
        href="/conta/criar"
        className="bg-(--c-ink) text-white text-xs font-medium tracking-wide px-4 py-2 rounded-[2px] hover:bg-(--c-ink)/90 transition-colors"
      >
        Começar agora
      </Link>
    </>
  );
}
