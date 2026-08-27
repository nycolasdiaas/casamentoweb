import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";
import { TEMPLATE_STYLES } from "@/lib/templates";
import {
  SITE_NAME,
  SITE_TAGLINE,
  CONTACT,
  TESTIMONIALS,
} from "@/lib/site";
import { uiPrensa } from "@/lib/fonts/ui";
import PaperBackdrop from "@/components/webgl/PaperBackdrop";
import SplitReveal from "@/components/site/SplitReveal";
import InterruptorDeMovimento from "@/components/ui/InterruptorDeMovimento";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import AccountNav, { LoggedOutLinks } from "@/components/landing/AccountNav";
import Pacotes from "@/components/landing/Pacotes";
import { Icone } from "@/components/ui/prensa";

export const metadata: Metadata = {
  title: `${SITE_NAME} | Sites de Casamento`,
  description:
    "Convite digital, confirmação de presença e lista de presentes com Pix sem taxa. Escolha o pacote ideal para o seu casamento.",
};

const STYLE_FONT_CLASS: Record<string, string> = {
  classico: "font-script",
  moderno: "font-semibold tracking-tight",
  romantico: "font-script",
  toscana: "font-script",
  film: "font-script",
  editorial: "font-semibold tracking-tight",
};

const FEATURES = [
  {
    title: "Mapa integrado",
    text: "Local da cerimônia e da festa com um toque para abrir no Google Maps ou Waze.",
  },
  {
    title: "Confirmação por família",
    text: "Cada família recebe um link exclusivo e confirma todo mundo de uma vez.",
  },
  {
    title: "Pix sem taxa",
    text: "QR Code e copia e cola direto na conta do casal. 100% do presente chega.",
  },
  {
    title: "Dress code",
    text: "Traje explicado com referências visuais, para ninguém errar no look.",
  },
  {
    title: "Mural de recados",
    text: "Convidados deixam mensagens de carinho que ficam guardadas no site.",
  },
  {
    title: "Álbum pós-festa",
    text: "No pacote Para Sempre, o site vira o álbum permanente do casamento.",
  },
];

const COMPARISON: [string, string, string][] = [
  ["Quem monta o site", "O questionário monta — ele nasce pronto", "Vocês mesmos, arrastando bloco"],
  ["Design", "Seis estilos, ajustados às cores e fotos de vocês", "Modelo usado por milhares"],
  ["Taxa sobre os presentes", "0% — Pix direto na conta", "≈ 3,89% sobre cada presente"],
  ["Em R$ 10.000 de presentes", "R$ 0 de taxa", "≈ R$ 389 de taxa"],
  ["Suporte", "Atendimento de quem faz o produto", "Central de ajuda"],
  ["Depois da festa", "Vira álbum permanente (Para Sempre)", "Depende do plano"],
];

const FAQ: [string, string][] = [
  [
    "Quanto custa e tem mensalidade?",
    "São três pacotes com preço fechado: Convite (R$ 9,90), Site do Casamento (R$ 29,90) e Para Sempre (R$ 99,90). Pagamento único — sem mensalidade e sem surpresa.",
  ],
  [
    "Vocês cobram taxa sobre os presentes?",
    "Não. A lista de presentes usa o Pix do próprio casal: QR Code e copia e cola caem direto na conta de vocês. Plataformas \"gratuitas\" costumam reter cerca de 3,89% de cada presente.",
  ],
  [
    "Quanto tempo demora para ficar pronto?",
    "Não demora: o site é criado no mesmo instante em que vocês terminam o questionário, e a prévia já abre na tela. O que falta depois disso é só o pagamento, para o endereço entrar no ar.",
  ],
  [
    "É modelo pronto ou é personalizado de verdade?",
    "Os estilos são o ponto de partida. Cores, fontes, fotos, textos e a ordem das seções vocês ajustam no painel, e a prévia mostra o resultado na hora. Dois casais no mesmo estilo não saem parecidos.",
  ],
  [
    "Como funciona a personalização?",
    "Vocês criam a conta, escolhem o pacote e o estilo e respondem um questionário curto. O site fica pronto na hora, e a prévia aparece na tela de acompanhamento do pedido. Dali em diante vocês editam o conteúdo, trocam as fotos e ajustam as cores quando quiserem — sem depender da gente.",
  ],
  [
    "O que precisamos enviar?",
    "Nada é obrigatório além dos nomes de vocês. Fotos, história, data, horário e local entram quando vocês tiverem — cada seção some sozinha enquanto o dado não existe. No Para Sempre, a lista de presentes e a chave Pix também.",
  ],
  [
    "Podemos mudar as coisas depois?",
    "Podem, quantas vezes quiserem e sem custo — antes e depois de publicar. Texto, fotos, cores e estilo ficam no painel de vocês; não precisa pedir para ninguém.",
  ],
  [
    "Funciona bem no celular?",
    "É feito primeiro para o celular: seus convidados vão abrir o link pelo telefone, e tudo — confirmação, presentes, mapa — funciona perfeitamente na tela pequena.",
  ],
];

export default function PackagesPage() {
  return (
    <div
      id="landing"
      className={`${uiPrensa} flex-1 flex flex-col bg-(--c-surface) text-(--c-ink)`}
    >
      {/* Revela os blocos um a um conforme a pessoa desce a página. Usa
          `gsap.from`, então se o JS não carregar a landing aparece inteira —
          só sem animação. Ver RevealOnScroll. */}
      <RevealOnScroll raiz="#landing" />

      {/* Navegação */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-(--c-rule)">
        <nav className="trilho py-4 flex items-center justify-between gap-4">
          <p className="t-display text-[22px] leading-none tracking-tight">
            {SITE_NAME}
            <span className="hidden sm:inline text-sm font-normal text-(--c-ink-2)">
              {" "}
              · {SITE_TAGLINE}
            </span>
          </p>
          <div className="flex items-center gap-5 text-sm">
            <a href="#estilos" className="hidden sm:inline hover:underline underline-offset-4">
              Estilos
            </a>
            <a href="#pacotes" className="hidden sm:inline hover:underline underline-offset-4">
              Pacotes
            </a>
            <a href="#faq" className="hidden sm:inline hover:underline underline-offset-4">
              Dúvidas
            </a>
            <Suspense fallback={<LoggedOutLinks />}>
              <AccountNav />
            </Suspense>
          </div>
        </nav>
      </header>

      {/* Hero */}
      {/* O hero é o único lugar da landing com o pano de fundo em WebGL.
          `relative` + `isolate` para o canvas absoluto ficar preso a esta
          seção e não vazar por cima do resto; o conteúdo sobe com z-10. */}
      <section className="relative isolate overflow-hidden bg-(--c-paper-warm)">
        <PaperBackdrop />
        {/* Sem trilho central e sem `gap`: a foto precisa alcançar a borda
            direita da janela. Um `max-w` aqui deixaria uma faixa de papel
            sobrando ao lado dela, que é o defeito de largura que a Fundação
            A3 nomeia. O texto recupera o trilho por dentro. */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] items-stretch">
          {/* A ENTRADA DA LANDING.

              Ela não existia: o `RevealOnScroll` pula a primeira seção de
              propósito (animar o que já está na tela faz piscar), então abrir
              o site era uma tela aparecendo pronta — que é exatamente a
              assinatura de interface gerada que o resto do projeto combateu.

              É CSS puro, sem JavaScript: `motion-stagger` já escalona os
              filhos pelo `--i`, e o `SplitReveal` do site do convidado é
              server component. Nada aqui depende do GSAP, então funciona mesmo
              quando ele não é baixado.

              O estado natural do HTML continua sendo o final — se o CSS não
              carregar, o texto está lá. */}
          <div className="motion-stagger flex flex-col items-start gap-6 py-16 sm:py-24 px-6 lg:pl-[max(1.5rem,calc((100vw-1200px)/2))] lg:pr-16">
            {/* Letra a letra aqui, e SÓ aqui. A frase é curta, em caixa alta
                com tracking aberto: o efeito termina antes de alguém começar a
                ler, e o que se vê é tipo sendo composto — que é literalmente o
                assunto do sistema visual. Num parágrafo isto viraria obstáculo,
                e por isso o `porLetra` é opt-in e não o padrão. */}
            <p
              style={{ ["--i" as string]: 0 }}
              className="text-xs font-medium tracking-[0.25em] uppercase text-(--c-ink-2)"
            >
              <SplitReveal text={SITE_TAGLINE} porLetra passo={32} atraso={80} />
            </p>
            {/* O título entra palavra por palavra, de desfocado para nítido.
                Começa depois da sobrancelha (240ms) para a leitura ter ordem. */}
            <h1
              style={{ ["--i" as string]: 1 }}
              className="t-hero text-(--c-ink) max-w-[14ch]"
            >
              <SplitReveal
                text="O site do casamento pronto hoje"
                passo={70}
                atraso={240}
              />
            </h1>
            <p
              style={{ ["--i" as string]: 2 }}
              className="t-corpo-g text-(--c-ink-2) max-w-[44ch]"
            >
              Respondam um questionário curto e o site já existe: história,
              confirmação de presença, lista de presentes por Pix e galeria.
              <strong className="font-semibold"> Paga uma vez</strong> — sem
              mensalidade e sem taxa sobre os presentes.
            </p>
            <div
              style={{ ["--i" as string]: 3 }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <a href="/conta/criar" className="btn btn-ink btn-g">
                Criar meu site
              </a>
              <a href="#estilos" className="btn btn-quiet btn-g">
                Ver um exemplo
              </a>
            </div>
            <ul
              style={{ ["--i" as string]: 4 }}
              className="flex divide-x divide-(--c-rule) pt-6"
            >
              {[
                [String(TEMPLATE_STYLES.length), "estilos prontos"],
                ["0%", "de taxa no presente"],
                ["R$ 0", "de mensalidade"],
              ].map(([numero, rotulo], i) => (
                <li
                  key={rotulo}
                  className={`flex flex-col gap-1 ${i === 0 ? "pr-7" : "px-7"}`}
                >
                  <span className="t-display text-[34px] leading-none text-(--c-ink)">
                    {numero}
                  </span>
                  <span className="meta text-(--c-ink-2)">{rotulo}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* A miniatura entra por último e só com fade: ela já é o elemento
              mais pesado da tela, e fazê-la deslizar junto com o texto daria
              duas coisas grandes se mexendo ao mesmo tempo. */}
          {/* A foto entra por último e só com fade: ela já é o elemento mais
              pesado da tela, e fazê-la deslizar junto com o texto daria duas
              coisas grandes se mexendo ao mesmo tempo. */}
          <div
            style={{ ["--motion-delay" as string]: "560ms" }}
            className="motion-fade-in relative min-h-[320px] lg:min-h-[620px] overflow-hidden order-first lg:order-none"
          >
            <Image
              src="/enlace/noiva.png"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              className="object-cover"
              /* O mesmo tratamento quente das outras fotos do pacote: a
                 direção de fotografia da prancha A5 pede uma pele só em
                 todas, e sem isto cada foto chega com a temperatura do
                 fotógrafo que a tirou. */
              style={{ filter: "saturate(.93) contrast(1.02) brightness(1.01)" }}
            />
            {/* O selo de registro — a marca da gráfica carimbada na foto.
                É o ÚNICO lugar do hero onde a caligrafia aparece, e é ela que
                impede a composição de virar banner de banco de imagens. */}
            <span
              className="absolute top-7 right-7 lg:top-9 lg:right-10 flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-full border border-white/85 text-white"
              style={{ transform: "rotate(-8deg)" }}
              aria-hidden="true"
            >
              <span className="t-data text-[10px] tracking-[0.16em]">FEITO À</span>
              <span className="font-script text-[26px] leading-[0.8]">mão</span>
            </span>
          </div>
        </div>
      </section>

      {/* Faixa de garantias */}
      <section className="border-b border-(--c-rule) bg-white">
        <ul className="trilho py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-sm text-(--c-ink-2)">
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--c-ink-2)">✦</span>
            Nada para instalar
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--c-ink-2)">✦</span>
            Prévia pronta antes de pagar
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--c-ink-2)">✦</span>
            Edição ilimitada, sempre
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--c-ink-2)">✦</span>
            Zero parte técnica para vocês
          </li>
        </ul>
      </section>

      {/* Tudo por nossa conta */}
      <section className="bg-white">
        <div className="trilho py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="t-d1 text-(--c-ink)">
              Vocês só se preocupam com o casamento
            </h2>
            <p className="t-corpo text-(--c-ink-2) max-w-[46ch] mx-auto">
              Nada de configuração, servidor ou código. Vocês escrevem o
              conteúdo e escolhem o visual; o resto acontece sozinho.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            <div className="flex flex-col gap-4 rounded-[3px] border border-(--c-rule) bg-(--c-base) p-8">
              <p className="meta text-(--c-ink-2)">Vocês fazem</p>
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  "Escolhem o pacote e o estilo",
                  "Respondem o questionário — só os nomes são obrigatórios",
                  "Enviam as fotos e ajustam o texto no painel, quando quiserem",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 leading-snug">
                    <span aria-hidden className="text-(--c-ink-2)">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-(--c-ink-2) pt-1">
                Só isso. Sem reunião, sem orçamento, sem esperar resposta.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-[3px] bg-(--c-olive) text-white p-8">
              <p className="meta text-white/60">O site faz</p>
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  "Monta o site inteiro na hora em que vocês terminam",
                  "Cuida do endereço, da hospedagem e da parte técnica",
                  "Gera o QR do Pix de vocês na hora, com o valor da cota",
                  "Cria um link de confirmação para cada família",
                  "Entra no ar sozinho assim que o pagamento é confirmado",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 leading-snug">
                    <span aria-hidden className="text-white/70">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Estilos e exemplos, unificados */}
      <section id="estilos" className="scroll-mt-20 bg-(--c-base)">
        <div className="trilho py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <span className="meta text-(--c-mark)">
              {TEMPLATE_STYLES.length} estilos
            </span>
            <h2 className="t-d1 text-(--c-ink)">O mesmo amor, seis vestidos.</h2>
            <p className="t-corpo text-(--c-ink-2) max-w-[52ch] mx-auto">
              O conteúdo é de vocês; o estilo troca com um clique, antes e
              depois de publicar, sem custo. Cores, fontes, fotos e a ordem das
              seções vocês ajustam no painel — dentro de cada estilo dá para ver
              os três pacotes em ação, seção por seção.
            </p>
          </div>

          <Link
            href="/isabelle-e-nycolas"
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[3px] border border-(--c-rule) bg-white p-5 max-w-2xl mx-auto w-full transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="flex items-center justify-center size-12 rounded-full bg-(--c-sunken) font-script text-xl text-(--c-ink-2) shrink-0">
                I &amp; N
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Isabelle &amp; Nycolas
                </p>
                <p className="text-xs text-(--c-ink-2)">
                  Não é exemplo: o site real de um casal, no ar agora
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-(--c-ink) underline underline-offset-4 shrink-0">
              Ver site →
            </span>
          </Link>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TEMPLATE_STYLES.map((style) => (
              <li key={style.id} className="flex">
                <Link
                  href={`/pacotes/estilos/${style.id}`}
                  className="flex-1 flex flex-col gap-4 rounded-[3px] border border-(--c-rule) bg-white p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div
                    className="flex items-center justify-center h-28 rounded-[3px]"
                    style={{ backgroundColor: style.swatches[0] }}
                  >
                    <span
                      className={`text-2xl ${STYLE_FONT_CLASS[style.id]}`}
                      style={{ color: style.swatches[1] }}
                    >
                      Ana & Pedro
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="t-display text-[19px] leading-none text-(--c-ink) flex items-center gap-2">
                      {style.name}
                      {style.id === "editorial" && (
                        <span className="meta text-[9.5px] text-white bg-(--c-mark) rounded-[2px] px-1.5 py-0.5">
                          a casa
                        </span>
                      )}
                    </p>
                    <div className="flex gap-1.5">
                      {style.swatches.map((color) => (
                        <span
                          key={color}
                          className="size-4 rounded-full border border-black/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-(--c-ink-2) flex-1">
                    {style.description}
                  </p>
                  <span className="text-[13px] font-medium text-(--c-ink) underline underline-offset-4">
                    Ver este estilo →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* A porta da galeria (`/pacotes/estilos`). Aqui os seis já estão
              todos na tela, então "ver todos" não diria nada — o que a
              galeria acrescenta é o painel de detalhe, com as fontes e a
              paleta de cada estilo lado a lado. O rótulo promete isso. */}
          <Link
            href="/pacotes/estilos"
            className="text-[13px] font-medium text-(--c-ink) underline underline-offset-4 mx-auto"
          >
            Comparar fontes e paletas dos seis →
          </Link>
        </div>
      </section>

      {/* Recursos */}
      <section>
        <div className="trilho py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="t-display text-[32px] tracking-tight leading-[1.15]">
              Tudo que acompanha o site
            </h2>
            <p className="text-(--c-ink-2) max-w-lg mx-auto">
              Pensado para os convidados usarem pelo celular, sem precisar de
              explicação.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="flex flex-col gap-2 rounded-[3px] border border-(--c-rule) bg-white p-6"
              >
                <p className="text-[15px] font-medium text-(--c-ink)">
                  {feature.title}
                </p>
                <p className="text-sm text-(--c-ink-2) leading-relaxed">
                  {feature.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Comparativo */}
      <section className="bg-(--c-base)">
        <div className="trilho py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="t-d1 text-(--c-ink)">
              &ldquo;Mas tem site grátis por aí…&rdquo;
            </h2>
            <p className="t-corpo text-(--c-ink-2) max-w-[46ch] mx-auto">
              Tem — e ele se paga com uma taxa sobre cada presente que vocês
              recebem. Compare:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto border-collapse bg-white rounded-[3px] overflow-hidden text-sm">
              <thead>
                <tr className="border-b border-(--c-rule)">
                  <th className="px-5 py-4" />
                  <th className="text-left px-5 py-4 t-display text-[20px] font-normal text-(--c-ink)">
                    {SITE_NAME}
                  </th>
                  <th className="text-left px-5 py-4 meta text-(--c-ink-2)">
                    Plataformas &ldquo;grátis&rdquo;
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([label, us, them], index) => (
                  <tr
                    key={label}
                    className={index % 2 ? "bg-(--c-base)/50" : ""}
                  >
                    <td className="px-5 py-3.5 text-(--c-ink-2)">
                      {label}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-(--c-ink)">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-(--c-ok) shrink-0">
                          <Icone nome="check" tamanho={16} />
                        </span>
                        {us}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-(--c-ink-2)">
                      {them}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-(--c-ink-2) text-center max-w-xl mx-auto">
            Taxa de referência de 3,89% praticada pela principal plataforma
            gratuita de sites de casamento do Brasil (julho/2026).
          </p>
        </div>
      </section>

      {/* Depoimentos — só aparece quando houver um depoimento real
          (TESTIMONIALS vazio hoje; nunca inventar frase de casal). */}
      {TESTIMONIALS.length > 0 && (
        <section>
          <div className="trilho py-20 flex flex-col gap-10">
            <h2 className="t-display text-[32px] tracking-tight leading-[1.15] text-center">
              Quem já casou com a gente
            </h2>
            <ul className="flex flex-wrap justify-center gap-6">
              {TESTIMONIALS.map((testimonial) => (
                <li
                  key={testimonial.couple}
                  className="flex flex-col gap-4 max-w-md rounded-[3px] border border-(--c-rule) bg-white p-8"
                >
                  <span aria-hidden className="font-script text-4xl text-(--c-ink-2) leading-none">
                    &ldquo;
                  </span>
                  <p className="text-sm leading-relaxed text-(--c-ink-2) italic">
                    {testimonial.quote}
                  </p>
                  <div className="pt-2 border-t border-(--c-rule)">
                    <p className="font-semibold text-sm">{testimonial.couple}</p>
                    <p className="text-xs text-(--c-ink-2)">
                      {testimonial.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Pacotes */}
      <Pacotes />

      {/* Como funciona — B1 */}
      <section>
        <div className="trilho py-24 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center items-center">
            <span className="meta text-(--c-ink-2)">Como funciona</span>
            <h2 className="t-d1 text-(--c-ink)">Três passos, nenhum telefonema.</h2>
          </div>

          {/* Grid de fios de 1px: o `gap` de 1px sobre o fundo da régua faz a
              divisória sem uma borda por card (que dobraria o traço no meio). */}
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-(--c-rule) border border-(--c-rule)">
            {[
              [
                "01",
                "Respondam",
                "Nomes, data, local e a história de vocês. Só os nomes são obrigatórios — todo o resto dá para pular e preencher depois.",
              ],
              [
                "02",
                "Escolham o estilo",
                "Seis estilos prontos. Troquem cores e fotos com um clique e vejam a mudança na hora.",
              ],
              [
                "03",
                "Publiquem",
                "O endereço de vocês entra no ar assim que o pagamento cai. Daí é só mandar no grupo da família.",
              ],
            ].map(([passo, titulo, texto]) => (
              <li
                key={passo}
                className="bg-(--c-surface) p-8 lg:p-9 flex flex-col gap-2"
              >
                <span className="t-display text-[30px] leading-none text-(--c-mark)">
                  {passo}
                </span>
                <p className="t-display text-[23px] leading-tight text-(--c-ink) mt-2">
                  {titulo}
                </p>
                <p className="t-corpo-p text-(--c-ink-2)">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-(--c-base)">
        <div className="max-w-3xl mx-auto w-full px-6 py-20 flex flex-col gap-8">
          <h2 className="t-d1 text-(--c-ink) text-center">
            Dúvidas comuns
          </h2>
          <div className="flex flex-col border-t border-(--c-rule)">
            {FAQ.map(([question, answer]) => (
              <details
                key={question}
                className="group border-b border-(--c-rule) py-4"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-[15px] text-(--c-ink)">
                  {question}
                  {/* O mesmo traço vira + e −: fechado tem a haste vertical,
                      aberto ela gira para fora de vista. Um ícone só, dois
                      estados — e o giro é o que diz que a linha respondeu. */}
                  <span className="relative shrink-0 text-(--c-ink-2)">
                    <span className="block w-4 border-t border-current" />
                    <span className="absolute inset-0 block w-4 border-t border-current rotate-90 transition-transform duration-(--t-rapido) group-open:rotate-0" />
                  </span>
                </summary>
                <p className="pt-3 t-corpo-p text-(--c-ink-2) max-w-[70ch]">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="scroll-mt-20 bg-(--c-olive) text-white">
        <div className="trilho py-20 flex flex-col items-center gap-6 text-center">
          <h2 className="t-display text-[32px] tracking-tight leading-[1.15]">
            Vamos criar o site de vocês?
          </h2>
          <p className="text-white/80 max-w-md leading-relaxed">
            Criem a conta, escolham o pacote e vejam a prévia do site de
            vocês em poucos minutos.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="/conta"
              className="bg-white text-(--c-ink) text-sm font-medium px-8 py-3.5 rounded-[2px] hover:bg-(--c-base) transition-colors"
            >
              Criar meu site
            </a>
            {/* Só aparece se houver e-mail da MARCA. Ver lib/site.ts: o
                pessoal saiu daqui, e mostrar um placeholder seria pior que
                não mostrar nada. */}
            {CONTACT.email && (
              <a
                href={`mailto:${CONTACT.email}`}
                className="border border-white/40 text-sm font-medium px-8 py-3.5 rounded-[2px] hover:bg-white/10 transition-colors"
              >
                {CONTACT.email}
              </a>
            )}
            <a
              href={`https://instagram.com/${CONTACT.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/40 text-sm font-medium px-8 py-3.5 rounded-[2px] hover:bg-white/10 transition-colors"
            >
              @{CONTACT.instagram}
            </a>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-(--c-olive) text-white/60 border-t border-white/10">
        <div className="trilho py-6 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p>
            {SITE_NAME} · {SITE_TAGLINE}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>Sem mensalidade · Pix sem taxa · Feito no Brasil</span>
            {/* So aparece para quem tem `reduce` ligado no sistema. */}
            <InterruptorDeMovimento />
          </p>
        </div>
      </footer>

    </div>
  );
}
