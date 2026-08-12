import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { PACKAGES } from "@/lib/packages";
import { TEMPLATE_STYLES } from "@/lib/templates";
import {
  SITE_NAME,
  SITE_TAGLINE,
  CONTACT,
  WHATSAPP_LINK,
  TESTIMONIALS,
} from "@/lib/site";
import HeroPreview from "@/components/landing/HeroPreview";
import { uiPrensa } from "@/lib/fonts/ui";
import PaperBackdrop from "@/components/webgl/PaperBackdrop";
import SplitReveal from "@/components/site/SplitReveal";
import InterruptorDeMovimento from "@/components/ui/InterruptorDeMovimento";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import FloatingWhatsApp from "@/components/landing/FloatingWhatsApp";
import AccountNav, { LoggedOutLinks } from "@/components/landing/AccountNav";

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
  {    title: "Mapa integrado",
    text: "Local da cerimônia e da festa com um toque para abrir no Google Maps ou Waze.",
  },
  {    title: "RSVP por família",
    text: "Cada família recebe um link exclusivo e confirma todo mundo de uma vez.",
  },
  {    title: "Pix sem taxa",
    text: "QR Code e copia e cola direto na conta do casal. 100% do presente chega.",
  },
  {    title: "Dress code",
    text: "Traje explicado com referências visuais, para ninguém errar no look.",
  },
  {    title: "Mural de recados",
    text: "Convidados deixam mensagens de carinho que ficam guardadas no site.",
  },
  {    title: "Álbum pós-festa",
    text: "No pacote Para Sempre, o site vira o álbum permanente do casamento.",
  },
];

const COMPARISON: [string, string, string][] = [
  ["Quem monta o site", "A gente, para vocês", "Vocês mesmos, no editor"],
  ["Design", "Exclusivo, com a cara do casal", "Template usado por milhares"],
  ["Taxa sobre os presentes", "0% — Pix direto na conta", "≈ 3,89% sobre cada presente"],
  ["Em R$ 10.000 de presentes", "R$ 0 de taxa", "≈ R$ 389 de taxa"],
  ["Suporte", "WhatsApp direto com quem faz", "Central de ajuda"],
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
    "Depois que vocês enviam o material: até 3 dias no Convite, 5 dias no Site do Casamento e 7 dias no Para Sempre.",
  ],
  [
    "É template pronto ou é personalizado de verdade?",
    "Os estilos são só o ponto de partida. Cores, fontes, fotos, textos, ordem das seções — tudo é ajustado para o casal, 100% personalizável. Nenhum site nosso sai igual ao outro, e vocês aprovam a prévia antes de ir ao ar.",
  ],
  [
    "Como funciona a personalização?",
    "Vocês criam a conta, escolhem o pacote e o template, e mandam o material pela plataforma: fotos por link (Google Drive, Dropbox...), história e preferências. A gente monta, envia a prévia pelo WhatsApp e vocês pedem os ajustes respondendo a mensagem. Nenhum editor, nada técnico.",
  ],
  [
    "O que precisamos enviar?",
    "Fotos em boa qualidade, a história de vocês (pode ser curtinha), data, horário e local. No pacote Para Sempre, também a lista de presentes com valores e a chave Pix. Tudo pelo WhatsApp mesmo.",
  ],
  [
    "Podemos pedir mudanças?",
    "Sim — todo pacote inclui uma rodada de ajustes depois da prévia. Mudanças extras a gente combina à parte, sem pegadinha.",
  ],
  [
    "Funciona bem no celular?",
    "É feito primeiro para o celular: seus convidados vão abrir o link pelo WhatsApp, e tudo — confirmação, presentes, mapa — funciona perfeitamente na tela do telefone.",
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
        <nav className="max-w-6xl mx-auto w-full px-6 py-4 flex items-center justify-between gap-4">
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
      <section className="relative isolate overflow-hidden bg-(--c-base)">
        <PaperBackdrop />
        <div className="relative z-10 max-w-6xl mx-auto w-full px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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
          <div className="motion-stagger flex flex-col items-center lg:items-start gap-6 text-center lg:text-left">
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
              className="t-display text-[40px] sm:text-[52px] tracking-tight max-w-xl leading-[1.05]"
            >
              <SplitReveal
                text="O site do seu casamento, do convite ao para sempre"
                passo={70}
                atraso={240}
              />
            </h1>
            <p
              style={{ ["--i" as string]: 2 }}
              className="text-base sm:text-lg text-(--c-ink-2) max-w-xl leading-relaxed"
            >
              Convite digital, confirmação de presença e lista de presentes com
              Pix — sem mensalidade e sem taxa sobre os presentes. E o melhor:
              <strong className="font-semibold"> zero dor de cabeça</strong> —
              vocês escolhem o template, mandam as fotos e a história em
              minutos, e a gente cuida de absolutamente todo o resto.
            </p>
            <div
              style={{ ["--i" as string]: 3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2"
            >
              <a
                href="#pacotes"
                className="bg-(--c-ink) text-white text-sm font-medium px-8 py-3.5 rounded-[2px] hover:bg-(--c-ink)/90 transition-colors"
              >
                Ver pacotes
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-(--c-rule) text-sm font-medium px-8 py-3.5 rounded-[2px] hover:bg-white transition-colors"
              >
                Chamar no WhatsApp
              </a>
            </div>
            <ul
              style={{ ["--i" as string]: 4 }}
              className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-2 pt-4 text-sm text-(--c-ink-2)"
            >
              <li>✓ Sem mensalidade</li>
              <li>✓ Pix sem taxa — 100% para o casal</li>
              <li>✓ Entrega em até 7 dias</li>
            </ul>
          </div>

          {/* A miniatura entra por último e só com fade: ela já é o elemento
              mais pesado da tela, e fazê-la deslizar junto com o texto daria
              duas coisas grandes se mexendo ao mesmo tempo. */}
          <div
            style={{ ["--motion-delay" as string]: "560ms" }}
            className="motion-fade-in flex justify-center lg:justify-end"
          >
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Faixa de garantias */}
      <section className="border-b border-(--c-rule) bg-white">
        <ul className="max-w-6xl mx-auto w-full px-6 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-sm text-(--c-ink-2)">
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--c-ink-2)">✦</span>
            Atendimento pessoal no WhatsApp
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--c-ink-2)">✦</span>
            Prévia do site antes da entrega
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--c-ink-2)">✦</span>
            1 rodada de ajustes inclusa
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--c-ink-2)">✦</span>
            Zero parte técnica para vocês
          </li>
        </ul>
      </section>

      {/* Tudo por nossa conta */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="t-display text-[32px] tracking-tight leading-[1.15]">
              Vocês só se preocupam com o casamento
            </h2>
            <p className="text-(--c-ink-2) max-w-xl mx-auto">
              Nada de editor, formulário chato ou configuração. A
              personalização inteira acontece numa conversa de WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            <div className="flex flex-col gap-4 rounded-2xl border border-(--c-rule) bg-(--c-base) p-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-(--c-ink-2)">
                Vocês fazem
              </p>
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  "Escolhem o pacote e o estilo visual",
                  "Mandam fotos (por link) e a história aqui na plataforma",
                  "Aprovam a prévia pelo WhatsApp (ajustes na mesma conversa)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 leading-snug">
                    <span aria-hidden className="text-(--c-ink-2)">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-(--c-ink-2) pt-1">
                Só isso. Três mensagens e pronto.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-(--c-ink) text-white p-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/60">
                A gente faz
              </p>
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  "Design e montagem completa do site",
                  "Endereço na internet, hospedagem e toda a parte técnica",
                  "Lista de presentes configurada com o Pix de vocês",
                  "Links de confirmação para cada família de convidados",
                  "Suporte até (e depois de) o site estar no ar",
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
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="t-display text-[32px] tracking-tight leading-[1.15]">
              Escolha o estilo de vocês
            </h2>
            <p className="text-(--c-ink-2) max-w-lg mx-auto">
              Três direções visuais para começar — e a partir daí é{" "}
              <strong className="font-semibold text-(--c-ink)">
                100% personalizável
              </strong>
              : cores, fontes, fotos, textos e seções, tudo ajustado até ficar
              com a cara do casal. Nenhum site sai igual ao outro. Dentro de
              cada estilo dá pra ver os 3 pacotes em ação, seção por seção.
            </p>
          </div>

          <Link
            href="/isabelle-e-nycolas"
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-(--c-rule) bg-white p-5 max-w-2xl mx-auto w-full transition-all hover:shadow-md hover:-translate-y-0.5"
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
                  className="flex-1 flex flex-col gap-4 rounded-xl border border-(--c-rule) bg-white p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div
                    className="flex items-center justify-center h-28 rounded-lg"
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
                    <p className="font-semibold">
                      {style.name}
                      <span className="ml-2 text-[10px] font-medium tracking-wide uppercase text-(--c-ink-2) border border-(--c-rule) rounded-[2px] px-2 py-0.5">
                        100% personalizável
                      </span>
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
                  <span className="text-xs font-medium text-(--c-ink) underline underline-offset-4">
                    Ver modelo completo →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recursos */}
      <section>
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
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
                className="flex flex-col gap-2 rounded-xl border border-(--c-rule) bg-white p-6"
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
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="t-display text-[32px] tracking-tight leading-[1.15]">
              &ldquo;Mas tem site grátis por aí…&rdquo;
            </h2>
            <p className="text-(--c-ink-2) max-w-xl mx-auto">
              Tem — e ele se paga com uma taxa sobre cada presente que vocês
              recebem. Compare:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto border-collapse bg-white rounded-xl overflow-hidden text-sm">
              <thead>
                <tr className="bg-(--c-ink) text-white">
                  <th className="text-left font-medium px-5 py-4"></th>
                  <th className="text-left font-semibold px-5 py-4">
                    {SITE_NAME}
                  </th>
                  <th className="text-left font-medium px-5 py-4 text-white/80">
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
                    <td className="px-5 py-3.5 font-semibold">
                      <span className="text-(--c-ink-2) mr-1.5" aria-hidden>
                        ✓
                      </span>
                      {us}
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
          <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
            <h2 className="t-display text-[32px] tracking-tight leading-[1.15] text-center">
              Quem já casou com a gente
            </h2>
            <ul className="flex flex-wrap justify-center gap-6">
              {TESTIMONIALS.map((testimonial) => (
                <li
                  key={testimonial.couple}
                  className="flex flex-col gap-4 max-w-md rounded-xl border border-(--c-rule) bg-white p-8"
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
      <section id="pacotes" className="scroll-mt-20 bg-(--c-base)">
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="t-display text-[32px] tracking-tight leading-[1.15]">Pacotes</h2>
            <p className="text-(--c-ink-2) max-w-lg mx-auto">
              Três formatos, um único cuidado. Sem surpresa no preço.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PACKAGES.map((pkg) => (
              <article
                key={pkg.tier}
                className={`relative flex flex-col gap-6 rounded-2xl p-8 ${
                  pkg.highlight
                    ? "bg-(--c-ink) text-white shadow-lg"
                    : "bg-white border border-(--c-rule)"
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-(--c-mark) text-white text-[10px] font-semibold tracking-[0.2em] uppercase px-4 py-1 rounded-[2px]">
                    {pkg.priceNote ?? "recomendado"}
                  </span>
                )}

                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold">{pkg.name}</h3>
                  <p
                    className={`text-xs uppercase tracking-wide ${
                      pkg.highlight ? "text-white/70" : "text-(--c-ink-2)"
                    }`}
                  >
                    {pkg.tagline}
                  </p>
                </div>

                <p className="text-4xl font-bold tracking-tight">{pkg.price}</p>

                <p
                  className={`text-sm leading-relaxed ${
                    pkg.highlight ? "text-white/85" : "text-(--c-ink-2)"
                  }`}
                >
                  {pkg.description}
                </p>

                <ul className="flex flex-col gap-2.5 flex-1 text-sm">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 leading-snug">
                      <span
                        aria-hidden
                        className={pkg.highlight ? "text-white/70" : "text-(--c-ink-2)"}
                      >
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3 pt-2">
                  <p
                    className={`text-xs text-center ${
                      pkg.highlight ? "text-white/60" : "text-(--c-ink-2)"
                    }`}
                  >
                    {pkg.deliveryTime}
                  </p>
                  <Link
                    href="/conta/criar"
                    className={`text-center text-sm font-medium px-6 py-3 rounded-[2px] transition-colors ${
                      pkg.highlight
                        ? "bg-white text-(--c-ink) hover:bg-(--c-base)"
                        : "bg-(--c-ink) text-white hover:bg-(--c-ink)/90"
                    }`}
                  >
                    Começar agora
                  </Link>
                  <Link
                    href={`/pacotes/estilos/classico?pacote=${pkg.tier}`}
                    className={`text-center text-xs font-medium underline underline-offset-4 ${
                      pkg.highlight ? "text-white/80" : "text-(--c-ink-2)"
                    }`}
                  >
                    Ver exemplo
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section>
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
          <h2 className="t-display text-[32px] tracking-tight leading-[1.15] text-center">
            Como funciona
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-4 gap-8 max-w-4xl mx-auto w-full">
            {[
              ["1", "Criem a conta", "escolham o pacote e o estilo do template de vocês"],
              ["2", "Mandem o material", "fotos por link, história e data — tudo aqui, em minutos"],
              ["3", "Confirmem no WhatsApp", "a gente fecha os detalhes e envia a prévia — 1 rodada de ajustes inclusa"],
              ["4", "Só compartilhar", "site no ar — domínio, hospedagem e técnica por nossa conta"],
            ].map(([step, title, text]) => (
              <li key={step} className="flex flex-col items-center gap-2 text-center">
                <span className="flex items-center justify-center size-10 rounded-[2px] bg-(--c-sunken) text-(--c-ink) font-bold">
                  {step}
                </span>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-(--c-ink-2) leading-relaxed">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-(--c-base)">
        <div className="max-w-3xl mx-auto w-full px-6 py-20 flex flex-col gap-8">
          <h2 className="t-display text-[32px] tracking-tight leading-[1.15] text-center">
            Dúvidas frequentes
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ.map(([question, answer]) => (
              <details
                key={question}
                className="group rounded-xl border border-(--c-rule) bg-white px-6 py-4"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-sm">
                  {question}
                  <span
                    aria-hidden
                    className="text-(--c-ink-2) transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pt-3 text-sm text-(--c-ink-2) leading-relaxed">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="scroll-mt-20 bg-(--c-ink) text-white">
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col items-center gap-6 text-center">
          <h2 className="t-display text-[32px] tracking-tight leading-[1.15]">
            Vamos criar o site de vocês?
          </h2>
          <p className="text-white/80 max-w-md leading-relaxed">
            Chama no WhatsApp e conta a data do casamento — respondemos com o
            passo a passo e o prazo certinho.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-(--c-ink) text-sm font-medium px-8 py-3.5 rounded-[2px] hover:bg-(--c-base) transition-colors"
            >
              WhatsApp · {CONTACT.whatsappLabel}
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
      <footer className="bg-(--c-ink) text-white/60 border-t border-white/10">
        <div className="max-w-6xl mx-auto w-full px-6 py-6 flex flex-wrap items-center justify-between gap-2 text-xs">
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

      <FloatingWhatsApp />
    </div>
  );
}
