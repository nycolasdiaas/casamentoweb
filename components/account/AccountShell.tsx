import Link from "next/link";
import Image from "next/image";
import { uiPrensa } from "@/lib/fonts/ui";
import { SITE_NAME } from "@/lib/site";
import { iniciaisDe } from "@/lib/iniciais";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getUserById } from "@/lib/repositories/users";

type Tab = "inicio" | "pedidos";

/**
 * Casca comum das telas logadas do casal.
 *
 * O CONSERTO CENTRAL desta casca é o trilho. Antes:
 *
 *     header:  max-w-3xl mx-auto  ->   768px
 *     main:    max-w-7xl mx-auto  ->  1280px
 *
 * Os dois centralizados, em trilhos diferentes. Em 1440px a marca começava em
 * x=360 e o título da página logo abaixo dela em x=104: 256px de desencontro,
 * e nenhuma aresta esquerda comum na tela inteira. Era literalmente o
 * "desalinhado" do diagnóstico, e nenhuma paleta nova consertaria isso.
 *
 * Agora header e main dividem O MESMO trilho de 1200px e o mesmo padding, então
 * a marca e o h1 nascem na mesma vertical. Medir é a prova: as duas arestas
 * têm de dar o mesmo x.
 */
export default async function AccountShell({
  active,
  children,
}: {
  active: Tab;
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  const user = userId ? await getUserById(userId) : null;
  const iniciais = iniciaisDe(user?.name, "EU");

  const linkClass = (tab: Tab) =>
    active === tab
      ? "inline-flex min-h-11 items-center text-[13px] font-medium text-(--c-ink) border-b border-(--c-ink) pb-0.5"
      : "inline-flex min-h-11 items-center text-[13px] text-(--c-ink-2) border-b border-transparent pb-0.5 transition-colors hover:text-(--c-ink) hover:border-(--c-rule)";

  return (
    <div className={`${uiPrensa} flex-1 flex flex-col`}>
      <header className="bg-(--c-surface) border-b border-(--c-rule)">
        {/* MESMO trilho e MESMO padding do main abaixo. Se estes dois valores
            divergirem outra vez, o desalinhamento volta inteiro. */}
        <div className="trilho py-4 flex items-center justify-between gap-4">
          <Link href="/conta" className="flex items-center gap-2.5">
            <Image
              src="/logo-enlace.png"
              alt=""
              width={27}
              height={27}
              className="h-[27px] w-auto object-contain"
            />
            <span className="t-display text-[22px] leading-none text-(--c-ink)">
              {SITE_NAME}
            </span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/conta/pedidos" className={linkClass("pedidos")}>
              Meus pedidos
            </Link>
            {/* O círculo é o que diz de quem é esta conta — e, com o painel
                do casal e o admin abertos lado a lado, qual das duas telas
                está na frente. */}
            <span
              className="flex size-8 items-center justify-center rounded-full bg-(--c-olive) t-data text-[12px] text-(--c-paper-warm)"
              aria-hidden="true"
            >
              {iniciais}
            </span>
          </nav>
        </div>
      </header>

      {/* O gap-8 continua aqui para as telas ainda não refeitas desta passada,
          que contam com ele entre os blocos. As telas já refeitas entregam UM
          filho só e controlam o próprio ritmo — 8/16 dentro de um componente,
          24/32 entre irmãos, 64/96 entre seções —, então o gap não age sobre
          elas. Ele sai quando a última tela da passada for convertida. */}
      <main className="flex-1 trilho py-12 lg:py-16 flex flex-col gap-8">
        {children}
      </main>
    </div>
  );
}
