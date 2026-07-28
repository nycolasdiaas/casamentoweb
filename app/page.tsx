import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
import FloatingWhatsApp from "@/components/landing/FloatingWhatsApp";
import AccountNav, { LoggedOutLinks } from "@/components/landing/AccountNav";

const inter = Inter({ subsets: ["latin"] });

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
    icon: "📍",
    title: "Mapa integrado",
    text: "Local da cerimônia e da festa com um toque para abrir no Google Maps ou Waze.",
  },
  {
    icon: "✅",
    title: "RSVP por família",
    text: "Cada família recebe um link exclusivo e confirma todo mundo de uma vez.",
  },
  {
    icon: "💚",
    title: "Pix sem taxa",
    text: "QR Code e copia e cola direto na conta do casal. 100% do presente chega.",
  },
  {
    icon: "👗",
    title: "Dress code",
    text: "Traje explicado com referências visuais, para ninguém errar no look.",
  },
  {
    icon: "💌",
    title: "Mural de recados",
    text: "Convidados deixam mensagens de carinho que ficam guardadas no site.",
  },
  {
    icon: "📸",
    title: "Álbum pós-festa",
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
      className={`${inter.className} flex-1 flex flex-col bg-white text-(--color-olive)`}
    >
      {/* Navegação */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-(--color-gold)/30">
        <nav className="max-w-6xl mx-auto w-full px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-lg font-semibold tracking-tight">
            {SITE_NAME}
            <span className="hidden sm:inline text-sm font-normal text-(--color-muted)">
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
      <section className="bg-(--color-paper)">
        <div className="max-w-6xl mx-auto w-full px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-center lg:items-start gap-6 text-center lg:text-left">
            <p className="text-xs font-medium tracking-[0.25em] uppercase text-(--color-gold)">
              {SITE_TAGLINE}
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-xl leading-tight">
              O site do seu casamento, do convite ao para sempre
            </h1>
            <p className="text-base sm:text-lg text-(--color-olive)/80 max-w-xl leading-relaxed">
              Convite digital, confirmação de presença e lista de presentes com
              Pix — sem mensalidade e sem taxa sobre os presentes. E o melhor:
              <strong className="font-semibold"> zero dor de cabeça</strong> —
              vocês escolhem o template, mandam as fotos e a história em
              minutos, e a gente cuida de absolutamente todo o resto.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
              <a
                href="#pacotes"
                className="bg-(--color-olive) text-white text-sm font-medium px-8 py-3.5 rounded-full hover:bg-(--color-olive)/90 transition-colors"
              >
                Ver pacotes
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-(--color-olive)/30 text-sm font-medium px-8 py-3.5 rounded-full hover:bg-white transition-colors"
              >
                Chamar no WhatsApp
              </a>
            </div>
            <ul className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-2 pt-4 text-sm text-(--color-olive)/70">
              <li>✓ Sem mensalidade</li>
              <li>✓ Pix sem taxa — 100% para o casal</li>
              <li>✓ Entrega em até 7 dias</li>
            </ul>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Faixa de garantias */}
      <section className="border-b border-(--color-gold)/30 bg-white">
        <ul className="max-w-6xl mx-auto w-full px-6 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-sm text-(--color-olive)/80">
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--color-gold)">✦</span>
            Atendimento pessoal no WhatsApp
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--color-gold)">✦</span>
            Prévia do site antes da entrega
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--color-gold)">✦</span>
            1 rodada de ajustes inclusa
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-(--color-gold)">✦</span>
            Zero parte técnica para vocês
          </li>
        </ul>
      </section>

      {/* Tudo por nossa conta */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Vocês só se preocupam com o casamento
            </h2>
            <p className="text-(--color-olive)/70 max-w-xl mx-auto">
              Nada de editor, formulário chato ou configuração. A
              personalização inteira acontece numa conversa de WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            <div className="flex flex-col gap-4 rounded-2xl border border-(--color-gold)/40 bg-(--color-paper) p-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-(--color-gold)">
                Vocês fazem
              </p>
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  "Escolhem o pacote e o estilo visual",
                  "Mandam fotos (por link) e a história aqui na plataforma",
                  "Aprovam a prévia pelo WhatsApp (ajustes na mesma conversa)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 leading-snug">
                    <span aria-hidden className="text-(--color-gold)">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-(--color-muted) pt-1">
                Só isso. Três mensagens e pronto.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-(--color-olive) text-white p-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-(--color-gold)">
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
                    <span aria-hidden className="text-(--color-gold)">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Estilos e exemplos, unificados */}
      <section id="estilos" className="scroll-mt-20 bg-(--color-paper)">
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Escolha o estilo de vocês
            </h2>
            <p className="text-(--color-olive)/70 max-w-lg mx-auto">
              Três direções visuais para começar — e a partir daí é{" "}
              <strong className="font-semibold text-(--color-olive)">
                100% personalizável
              </strong>
              : cores, fontes, fotos, textos e seções, tudo ajustado até ficar
              com a cara do casal. Nenhum site sai igual ao outro. Dentro de
              cada estilo dá pra ver os 3 pacotes em ação, seção por seção.
            </p>
          </div>

          <Link
            href="/isabelle-e-nycolas"
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-(--color-gold)/40 bg-white p-5 max-w-2xl mx-auto w-full transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="flex items-center justify-center size-12 rounded-full bg-(--color-blush) font-script text-xl text-(--color-gold) shrink-0">
                I &amp; N
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Isabelle &amp; Nycolas
                </p>
                <p className="text-xs text-(--color-olive)/60">
                  Não é exemplo: o site real de um casal, no ar agora
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-(--color-olive) underline underline-offset-4 shrink-0">
              Ver site →
            </span>
          </Link>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TEMPLATE_STYLES.map((style) => (
              <li key={style.id} className="flex">
                <Link
                  href={`/pacotes/estilos/${style.id}`}
                  className="flex-1 flex flex-col gap-4 rounded-xl border border-(--color-gold)/40 bg-white p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
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
                      <span className="ml-2 text-[10px] font-medium tracking-wide uppercase text-(--color-gold) border border-(--color-gold)/50 rounded-full px-2 py-0.5">
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
                  <p className="text-sm text-(--color-olive)/70 flex-1">
                    {style.description}
                  </p>
                  <span className="text-xs font-medium text-(--color-olive) underline underline-offset-4">
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
            <h2 className="text-3xl font-bold tracking-tight">
              Tudo que acompanha o site
            </h2>
            <p className="text-(--color-olive)/70 max-w-lg mx-auto">
              Pensado para os convidados usarem pelo celular, sem precisar de
              explicação.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="flex flex-col gap-2 rounded-xl border border-(--color-gold)/40 bg-white p-6"
              >
                <span aria-hidden className="text-2xl">
                  {feature.icon}
                </span>
                <p className="font-semibold">{feature.title}</p>
                <p className="text-sm text-(--color-olive)/70 leading-relaxed">
                  {feature.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Comparativo */}
      <section className="bg-(--color-paper)">
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              &ldquo;Mas tem site grátis por aí…&rdquo;
            </h2>
            <p className="text-(--color-olive)/70 max-w-xl mx-auto">
              Tem — e ele se paga com uma taxa sobre cada presente que vocês
              recebem. Compare:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto border-collapse bg-white rounded-xl overflow-hidden text-sm">
              <thead>
                <tr className="bg-(--color-olive) text-white">
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
                    className={index % 2 ? "bg-(--color-paper)/50" : ""}
                  >
                    <td className="px-5 py-3.5 text-(--color-olive)/70">
                      {label}
                    </td>
                    <td className="px-5 py-3.5 font-semibold">
                      <span className="text-(--color-gold) mr-1.5" aria-hidden>
                        ✓
                      </span>
                      {us}
                    </td>
                    <td className="px-5 py-3.5 text-(--color-olive)/60">
                      {them}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-(--color-muted) text-center max-w-xl mx-auto">
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
            <h2 className="text-3xl font-bold tracking-tight text-center">
              Quem já casou com a gente
            </h2>
            <ul className="flex flex-wrap justify-center gap-6">
              {TESTIMONIALS.map((testimonial) => (
                <li
                  key={testimonial.couple}
                  className="flex flex-col gap-4 max-w-md rounded-xl border border-(--color-gold)/40 bg-white p-8"
                >
                  <span aria-hidden className="font-script text-4xl text-(--color-gold) leading-none">
                    &ldquo;
                  </span>
                  <p className="text-sm leading-relaxed text-(--color-olive)/80 italic">
                    {testimonial.quote}
                  </p>
                  <div className="pt-2 border-t border-(--color-gold)/30">
                    <p className="font-semibold text-sm">{testimonial.couple}</p>
                    <p className="text-xs text-(--color-muted)">
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
      <section id="pacotes" className="scroll-mt-20 bg-(--color-paper)">
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Pacotes</h2>
            <p className="text-(--color-olive)/70 max-w-lg mx-auto">
              Três formatos, um único cuidado. Sem surpresa no preço.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PACKAGES.map((pkg) => (
              <article
                key={pkg.tier}
                className={`relative flex flex-col gap-6 rounded-2xl p-8 ${
                  pkg.highlight
                    ? "bg-(--color-olive) text-white shadow-lg"
                    : "bg-white border border-(--color-gold)/40"
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-(--color-gold) text-white text-[10px] font-semibold tracking-[0.2em] uppercase px-4 py-1 rounded-full">
                    {pkg.priceNote ?? "recomendado"}
                  </span>
                )}

                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold">{pkg.name}</h3>
                  <p
                    className={`text-xs uppercase tracking-wide ${
                      pkg.highlight ? "text-white/70" : "text-(--color-muted)"
                    }`}
                  >
                    {pkg.tagline}
                  </p>
                </div>

                <p className="text-4xl font-bold tracking-tight">{pkg.price}</p>

                <p
                  className={`text-sm leading-relaxed ${
                    pkg.highlight ? "text-white/85" : "text-(--color-olive)/80"
                  }`}
                >
                  {pkg.description}
                </p>

                <ul className="flex flex-col gap-2.5 flex-1 text-sm">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 leading-snug">
                      <span aria-hidden className="text-(--color-gold)">
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3 pt-2">
                  <p
                    className={`text-xs text-center ${
                      pkg.highlight ? "text-white/60" : "text-(--color-muted)"
                    }`}
                  >
                    {pkg.deliveryTime}
                  </p>
                  <Link
                    href="/conta/criar"
                    className={`text-center text-sm font-medium px-6 py-3 rounded-full transition-colors ${
                      pkg.highlight
                        ? "bg-white text-(--color-olive) hover:bg-(--color-paper)"
                        : "bg-(--color-olive) text-white hover:bg-(--color-olive)/90"
                    }`}
                  >
                    Começar agora
                  </Link>
                  <Link
                    href={`/pacotes/estilos/classico?pacote=${pkg.tier}`}
                    className={`text-center text-xs font-medium underline underline-offset-4 ${
                      pkg.highlight ? "text-white/80" : "text-(--color-olive)/70"
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
          <h2 className="text-3xl font-bold tracking-tight text-center">
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
                <span className="flex items-center justify-center size-10 rounded-full bg-(--color-blush) text-(--color-olive) font-bold">
                  {step}
                </span>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-(--color-olive)/60 leading-relaxed">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-(--color-paper)">
        <div className="max-w-3xl mx-auto w-full px-6 py-20 flex flex-col gap-8">
          <h2 className="text-3xl font-bold tracking-tight text-center">
            Dúvidas frequentes
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ.map(([question, answer]) => (
              <details
                key={question}
                className="group rounded-xl border border-(--color-gold)/40 bg-white px-6 py-4"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-sm">
                  {question}
                  <span
                    aria-hidden
                    className="text-(--color-gold) transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pt-3 text-sm text-(--color-olive)/75 leading-relaxed">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="scroll-mt-20 bg-(--color-olive) text-white">
        <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
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
              className="bg-white text-(--color-olive) text-sm font-medium px-8 py-3.5 rounded-full hover:bg-(--color-paper) transition-colors"
            >
              WhatsApp · {CONTACT.whatsappLabel}
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              className="border border-white/40 text-sm font-medium px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors"
            >
              {CONTACT.email}
            </a>
            <a
              href={`https://instagram.com/${CONTACT.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/40 text-sm font-medium px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors"
            >
              @{CONTACT.instagram}
            </a>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-(--color-olive) text-white/60 border-t border-white/10">
        <div className="max-w-6xl mx-auto w-full px-6 py-6 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p>
            {SITE_NAME} · {SITE_TAGLINE}
          </p>
          <p>Sem mensalidade · Pix sem taxa · Feito no Brasil 💚</p>
        </div>
      </footer>

      <FloatingWhatsApp />
    </div>
  );
}
