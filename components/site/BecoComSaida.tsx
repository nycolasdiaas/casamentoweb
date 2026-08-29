import Image from "next/image";
import Link from "next/link";
import { uiPrensa } from "@/lib/fonts/ui";
import { SITE_NAME } from "@/lib/site";

/**
 * Faixa H · a tela do convidado quando dá errado.
 *
 * Quem chega aqui **não fez nada de errado e não tem conta para consultar**:
 * clicou num link que alguém mandou no WhatsApp. As três regras da prancha,
 * e o nome do componente é a terceira:
 *
 * 1. **Dizer o que houve.** O código do erro vai em Meta, pequeno, acima do
 *    título — nunca como manchete. "404" grande não informa ninguém.
 * 2. **Nunca culpar.** "Não achamos esse casamento", não "endereço inválido".
 * 3. **Sempre oferecer uma saída**, e uma delas em tinta. Beco sem saída é
 *    bug, não estado.
 *
 * Estas telas são da ENLACE, não do casal: usam a Prensa e a marca. É a única
 * família de páginas públicas onde isso vale — no site do casamento a marca
 * desaparece de propósito (Voz e Microcopy V2), mas aqui não há site do casal
 * para mostrar, e uma página órfã sem marca nenhuma parece link sequestrado.
 */
export default function BecoComSaida({
  codigo,
  titulo,
  children,
  saidaPrincipal,
  saidaSecundaria,
  rodape,
  cartao,
}: {
  /** Vai em Meta, caixa alta: "endereço não encontrado". */
  codigo: string;
  titulo: string;
  children: React.ReactNode;
  saidaPrincipal: { rotulo: string; href: string };
  saidaSecundaria?: { rotulo: string; href: string };
  /** Linha de ajuda no rodapé, quando existe uma dica útil. */
  rodape?: React.ReactNode;
  /** Bloco extra — o cartão "o casamento continua no ar", por exemplo. */
  cartao?: React.ReactNode;
}) {
  return (
    <main
      className={`${uiPrensa} flex-1 flex flex-col bg-(--c-paper-warm) text-(--c-ink)`}
    >
      <div className="border-b border-(--c-rule) px-6 py-6 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <Image
            src="/logo-enlace.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-auto object-contain"
          />
          <span className="t-display text-[20px] leading-none">
            {SITE_NAME}
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-[540px] flex flex-col items-center text-center gap-4">
          <span className="meta text-(--c-ink-2)">{codigo}</span>
          <h1 className="t-d1 text-(--c-ink) max-w-[20ch]">{titulo}</h1>
          <div className="t-corpo text-(--c-ink-2) max-w-[46ch]">{children}</div>

          {cartao}

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {saidaSecundaria && (
              <Link
                href={saidaSecundaria.href}
                className="btn btn-quiet btn-g"
              >
                {saidaSecundaria.rotulo}
              </Link>
            )}
            <Link href={saidaPrincipal.href} className="btn btn-ink btn-g">
              {saidaPrincipal.rotulo}
            </Link>
          </div>

          {rodape && (
            <p className="t-corpo-p text-(--c-ink-2) pt-4 max-w-[44ch]">
              {rodape}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
