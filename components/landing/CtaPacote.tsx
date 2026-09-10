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
  rotulo = "Começar agora",
  tier,
}: {
  className: string;
  /**
   * O pacote deste cartão, para o questionário abrir com ele escolhido.
   *
   * Sem isto, "Escolher Para Sempre" levava ao questionário com a etapa 1
   * em branco: o casal já tinha decidido, e a primeira coisa que a tela fazia
   * era perguntar de novo. Antes o efeito ficava escondido porque a etapa
   * vinha pré-marcada no pacote mais caro — o que dava a resposta certa por
   * acaso em um dos três cartões e a errada nos outros dois.
   */
  tier?: string;
  /** "Escolher Para Sempre" diz mais que "Começar agora" (Voz V4: o botão
      descreve a ação, não o conceito). Fica opcional porque o mesmo CTA
      aparece no topo da landing, onde ainda não há pacote escolhido. */
  rotulo?: string;
}) {
  const logado = Boolean(await getSessionUserId());
  const query = tier ? `?pacote=${tier}` : "";

  return (
    <Link
      href={logado ? `/conta/pedido/novo${query}` : `/conta/criar${query}`}
      className={className}
    >
      {rotulo}
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
export function CtaPacoteFallback({
  className,
  rotulo = "Começar agora",
  tier,
}: {
  className: string;
  rotulo?: string;
  tier?: string;
}) {
  return (
    <Link
      href={tier ? `/conta/criar?pacote=${tier}` : "/conta/criar"}
      className={className}
    >
      {rotulo}
    </Link>
  );
}
