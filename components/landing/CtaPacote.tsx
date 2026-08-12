import Link from "next/link";
import { getSessionUserId } from "@/lib/auth/userSession";

/**
 * O "Começar agora" dos cartões de pacote, que precisa saber se há sessão.
 *
 * O defeito que isto conserta: o link era `/conta/criar` fixo. Quem já estava
 * logado clicava em comprar e caía na tela de CRIAR CONTA — a tela que ele
 * menos precisa ver, e que sugere que a conta dele não existe. O caminho certo
 * é o questionário.
 *
 * Server component isolado e embrulhado em <Suspense> pela mesma razão do
 * `AccountNav`: ler o cookie de sessão no corpo da landing tornaria as ~700
 * linhas de conteúdo institucional dinâmicas, para decidir um href. Assim o
 * resto continua shell estático e só este pedaço chega por streaming.
 */
export default async function CtaPacote({
  className,
}: {
  className: string;
}) {
  const logado = Boolean(await getSessionUserId());

  return (
    <Link
      href={logado ? "/conta/pedido/novo" : "/conta/criar"}
      className={className}
    >
      Começar agora
    </Link>
  );
}

/**
 * Fallback do <Suspense> — e o padrão seguro.
 *
 * Numa landing a esmagadora maioria das visitas é de quem não tem conta, então
 * apontar para o cadastro é o que menos pisca para o visitante típico. E se o
 * streaming falhar, o pior caso é o comportamento de hoje, não um link morto.
 */
export function CtaPacoteFallback({ className }: { className: string }) {
  return (
    <Link href="/conta/criar" className={className}>
      Começar agora
    </Link>
  );
}
