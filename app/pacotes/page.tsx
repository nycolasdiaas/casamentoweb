import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { uiPrensa } from "@/lib/fonts/ui";
import { PACKAGES, type PackageTier } from "@/lib/packages";
import { formatPriceCents } from "@/lib/format";
import { tierAllowsSection } from "@/lib/templates/contract";
import { LINHAS_DA_VITRINE } from "@/lib/site/vitrine";
import AccountNav, { LoggedOutLinks } from "@/components/landing/AccountNav";
import CtaPacote, { CtaPacoteFallback } from "@/components/landing/CtaPacote";
import InterruptorDeMovimento from "@/components/ui/InterruptorDeMovimento";

export const metadata: Metadata = {
  /* Só "Pacotes": o `template` do layout raiz (`%s | Enlace`) põe a marca.
     Escrever "Pacotes | Enlace" aqui, como a spec pede ao pé da letra, sai
     como "Pacotes | Enlace | Enlace" na aba do navegador. */
  title: "Pacotes",
  description:
    "Três pacotes, pagamento único, sem mensalidade. O preço que está na tela é o preço inteiro.",
};

/**
 * B2 · a página `/pacotes`.
 *
 * Ela era um `redirect("/")` de duas linhas. O comentário de lá dizia a
 * verdade sobre a origem ("a landing virou a home") e escondia o custo: quem
 * recebia `enlace.com.br/pacotes` de um amigo caía na home e tinha que
 * procurar. As regras de negócio §1 são literais sobre isso — **a página é a
 * proposta**, e §7 lista "funil por WhatsApp antes da compra" entre as
 * decisões já descartadas. Uma proposta que exige procurar não é proposta.
 *
 * A seção de pacotes da home continua onde está: lá ela é um capítulo de uma
 * página que argumenta; aqui é a página inteira, para quem já decidiu comparar.
 */

const DUVIDAS: { pergunta: string; resposta: string[] }[] = [
  {
    pergunta: "É pagamento único mesmo? Tem mensalidade escondida?",
    resposta: [
      "Único. Você paga uma vez, pelo valor que está no cartão, e pronto — não existe mensalidade, taxa de renovação nem cobrança automática depois. O preço que você vê é o preço inteiro: não tem “a partir de”, não tem orçamento, não tem taxa sobre os presentes que você receber.",
    ],
  },
  {
    pergunta: "Consigo trocar o estilo depois de publicar?",
    resposta: [
      "Consegue, quantas vezes quiser, inclusive com o site já no ar. O texto, as fotos, as confirmações de presença e as cores que vocês escolheram continuam exatamente onde estão, e o link que vocês mandaram no grupo da família não muda. A troca vale na hora — é só recarregar a página.",
      "A única coisa que muda junto é o tipo de letra: cada estilo traz as fontes que combinam com ele, então o texto passa a ser desenhado com as do estilo novo.",
    ],
  },
  {
    pergunta: "Como funciona a lista de presentes por Pix?",
    resposta: [
      "A chave Pix é de vocês. Vocês cadastram a chave e montam a lista com os valores que quiserem; o convidado escolhe um presente, copia o código Pix ou lê o QR Code e paga direto na conta de vocês, pelo banco dele.",
      "O dinheiro nunca passa pela Enlace — por isso não existe taxa: chega 100% do que o convidado enviou. Depois de pagar, ele avisa que fez o Pix e deixa o nome, e vocês veem no painel quem presenteou o quê. O valor em si aparece no extrato da conta de vocês, como em qualquer Pix.",
      "A lista de presentes faz parte do pacote Para Sempre.",
    ],
  },
];

export default function PacotesPage() {
  return (
    <div
      className={`${uiPrensa} flex-1 flex flex-col bg-(--c-surface) text-(--c-ink)`}
    >
      {/* A mesma casca da home: quem chega direto por um link compartilhado
          precisa ter como entrar na conta e como voltar. */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-(--c-rule)">
        <nav className="trilho py-4 flex items-center justify-between gap-4">
          <Link href="/" className="t-display text-[22px] leading-none tracking-tight">
            {SITE_NAME}
            <span className="hidden sm:inline text-sm font-normal text-(--c-ink-2)">
              {" "}
              · {SITE_TAGLINE}
            </span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/#estilos" className="hidden sm:inline hover:underline underline-offset-4">
              Estilos
            </Link>
            <Suspense fallback={<LoggedOutLinks />}>
              <AccountNav />
            </Suspense>
          </div>
        </nav>
      </header>

      <main className="trilho flex flex-col gap-14 py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="meta text-(--c-mark)">
            PAGAMENTO ÚNICO · SEM MENSALIDADE
          </span>
          <h1 className="t-d1">Escolha uma vez.</h1>
        </div>

        {/* `items-start` para o cartão do meio não esticar até a altura do
            "Para Sempre": os três têm o mesmo número de linhas de benefício,
            mas a etiqueta que sai pela borda de cima muda a altura de um só. */}
        <div
          data-grade-pacotes
          className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3"
        >
          {PACKAGES.map((pacote) => (
            <CartaoDePacote key={pacote.tier} pacote={pacote} />
          ))}
        </div>

        <section className="flex flex-col gap-5">
          <h2 className="t-d2 text-center">Dúvidas comuns</h2>
          {/* `<details>` nativo: abre sem JavaScript, é acessível por padrão e
              deixa a página inteira continuar server component. Um acordeão de
              três itens não justifica bundle nenhum no navegador de quem ainda
              está decidindo se compra. */}
          <div className="mx-auto flex w-full max-w-[760px] flex-col">
            {DUVIDAS.map(({ pergunta, resposta }) => (
              <details
                key={pergunta}
                className="group border-b border-(--c-rule) first:border-t"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium marker:hidden">
                  {pergunta}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-(--c-ink-3) transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="flex flex-col gap-3 pb-5 text-[14px] leading-relaxed text-(--c-ink-2)">
                  {resposta.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-auto bg-(--c-olive) text-white/60 border-t border-white/10">
        <div className="trilho py-6 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p>
            {SITE_NAME} · {SITE_TAGLINE}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>Sem mensalidade · Pix sem taxa · Feito no Brasil</span>
            <InterruptorDeMovimento />
          </p>
        </div>
      </footer>
    </div>
  );
}

function CartaoDePacote({
  pacote,
}: {
  pacote: (typeof PACKAGES)[number];
}) {
  const destaque = pacote.highlight;

  return (
    <div
      data-pacote={pacote.tier}
      className="relative flex h-full flex-col gap-5 rounded-[3px] bg-(--c-surface) p-[34px]"
      /* Estilo e não classe: o Tailwind não gera `border-[1.5px]` — conferido
         no CSS do build, a regra simplesmente não existe, e a borda do
         "Para Sempre" saía igual à dos outros dois. O meio ponto é o que
         separa o cartão escolhido dos vizinhos sem precisar de cor de fundo,
         então ele não podia ficar a cargo de uma classe que não nasce. */
      style={{
        border: destaque
          ? "1.5px solid var(--c-ink)"
          : "1px solid var(--c-rule)",
      }}
    >
      {destaque && (
        <span className="meta absolute -top-[9px] left-[34px] bg-(--c-surface) px-2 text-(--c-mark)">
          MAIS ESCOLHIDO
        </span>
      )}

      <h2 className="t-d2">{pacote.name}</h2>

      {/* `min-height` iguala os três: sem ele, uma frase de duas linhas
          empurra o preço de um cartão para baixo e a fileira de preços deixa
          de ser comparável de relance, que é a única coisa que esta grade
          precisa fazer bem. */}
      <p className="min-h-[42px] text-[14px] leading-snug text-(--c-ink-2)">
        {pacote.tagline}
      </p>

      <p className="flex items-baseline gap-2">
        <span className="t-data text-[38px] leading-none">
          {formatPriceCents(pacote.priceCents)}
        </span>
        <span className="meta text-(--c-ink-2)">uma vez</span>
      </p>

      <hr className="border-t border-(--c-rule)" />

      {/* As mesmas linhas nos três cartões, marcadas pelo gating de verdade.
          A lista NÃO é escrita à mão aqui: quem decide o ✓ é
          `tierAllowsSection`, o mesmo que decide o que o `SiteRenderer`
          renderiza. Uma lista à mão sairia do sincronismo na primeira mudança
          de pacote, e a vitrine passaria a vender o que o site não monta. */}
      <ul className="flex flex-col gap-2.5 text-[13.5px] leading-snug">
        {LINHAS_DA_VITRINE.map(({ chave, rotulo }) => {
          const inclui = tierAllowsSection(pacote.tier as PackageTier, chave);
          return (
            <li key={chave} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className={inclui ? "text-(--c-ok)" : "text-(--c-ink-3)"}
              >
                {inclui ? "✓" : "✕"}
              </span>
              <span className={inclui ? undefined : "text-(--c-ink-3)"}>
                {rotulo}
                <span className="sr-only">
                  {inclui ? " — incluído" : " — não incluído neste pacote"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {/* Um único primário por tela (Fundação A4): o `.btn-ink` é do
          "Para Sempre", os outros dois são `.btn-quiet`.

          `CtaPacote` e não um `href` escrito aqui: ele resolve o destino pela
          sessão. O comentário do próprio arquivo registra o defeito que isso
          conserta — quem já estava logado clicava em comprar e caía na tela de
          CRIAR CONTA. Server component que lê cookie, então vem em
          `<Suspense>`, senão o build reprova a rota inteira. */}
      <div className="mt-auto pt-2">
        <Suspense
          fallback={
            <CtaPacoteFallback
              className={botao(destaque)}
              rotulo={`Escolher ${pacote.name}`}
            />
          }
        >
          <CtaPacote
            className={botao(destaque)}
            rotulo={`Escolher ${pacote.name}`}
          />
        </Suspense>
      </div>
    </div>
  );
}

const botao = (destaque: boolean) =>
  `btn ${destaque ? "btn-ink" : "btn-quiet"} w-full justify-center`;
