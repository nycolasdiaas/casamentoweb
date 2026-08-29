import Image from "next/image";
import Link from "next/link";
import { uiPrensa } from "@/lib/fonts/ui";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

/**
 * Faixa C · a casca das quatro telas de porta (entrar, criar, esqueci,
 * redefinir).
 *
 * O desenho é a composição editorial: foto de um lado, papel do outro. Não é
 * enfeite — é a única coisa nessas telas que diz de que produto elas são. Um
 * formulário de e-mail e senha centralizado num fundo liso é igual ao de
 * qualquer serviço, e essa é a primeira tela que o casal vê depois de decidir
 * comprar.
 *
 * Três decisões que valem registro:
 *
 * - A FONTE. As quatro telas carregavam `Inter` por conta própria — uma
 *   quarta família, fora do sistema, só nelas. Sai: a casca traz `uiPrensa`,
 *   que é IBM Plex Sans + Instrument Serif + IBM Plex Mono, as mesmas do
 *   resto da plataforma.
 * - A LEGENDA sobre a foto é uma promessa do produto, nunca um casal. Casal
 *   com nome e endereço na tela de login lê como depoimento, e depoimento
 *   inventado é o que `TESTIMONIALS` (vazio, em `lib/site.ts`) existe para
 *   impedir.
 * - `semFoto` para esqueci/redefinir. São telas de meio-de-caminho, abertas a
 *   partir de um link do e-mail: quem chega ali quer resolver uma coisa e
 *   sair, e meia tela de foto atrasa a leitura do único campo que importa.
 */
export default function CascaDeConta({
  titulo,
  chamada,
  foto,
  rodape,
  children,
  semFoto,
}: {
  titulo: string;
  chamada?: string;
  /** Lado da foto no desktop. No celular ela é sempre uma faixa no topo. */
  foto?: { src: string; lado: "esquerda" | "direita"; legenda: string };
  rodape?: React.ReactNode;
  children: React.ReactNode;
  semFoto?: boolean;
}) {
  const painelDoFormulario = (
    <div className="flex items-center justify-center bg-(--c-base) px-6 py-12 lg:px-16">
      <div className="w-full max-w-[380px] flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <h1 className="t-d2 text-(--c-ink)">{titulo}</h1>
          {chamada && (
            <p className="t-corpo text-(--c-ink-2) medida">{chamada}</p>
          )}
        </div>
        {children}
        {rodape}
      </div>
    </div>
  );

  if (semFoto || !foto) {
    return (
      <main className={`${uiPrensa} flex-1 flex flex-col bg-(--c-base)`}>
        <div className="px-6 lg:px-16 pt-10">
          <Marca />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[560px]">{painelDoFormulario}</div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${uiPrensa} flex-1 flex flex-col`}>
      <div className="flex-1 grid lg:grid-cols-2">
        {/* No celular a foto é sempre a faixa do topo (a ordem do DOM), e é no
            desktop que ela troca de lado. Empilhada, foto embaixo do
            formulário viraria rolagem inútil. */}
        <div
          className={`relative min-h-[190px] lg:min-h-[620px] overflow-hidden bg-(--c-olive) ${
            foto.lado === "direita" ? "lg:order-2" : ""
          }`}
        >
          <Image
            src={foto.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            style={{ filter: "saturate(.9) contrast(1.02) brightness(.94)" }}
            priority
          />
          {/* Duas paradas escuras, topo e base: é o que garante contraste da
              marca em cima e da legenda embaixo sem escurecer o meio da foto. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgb(26 29 33 / .38), rgb(26 29 33 / .06) 42%, rgb(26 29 33 / .58))",
            }}
          />
          <div className="absolute top-7 left-7 lg:top-9 lg:left-10">
            <Marca claro />
          </div>
          <p className="absolute left-7 right-7 bottom-6 lg:left-10 lg:right-10 lg:bottom-10 t-display text-[22px] lg:text-[30px] leading-tight text-(--c-paper-warm)">
            {foto.legenda}
          </p>
        </div>

        {painelDoFormulario}
      </div>
    </main>
  );
}

function Marca({ claro }: { claro?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <Image
        src="/logo-enlace.png"
        alt=""
        width={30}
        height={30}
        className="h-[27px] w-auto object-contain"
        style={claro ? { filter: "brightness(0) invert(1)" } : undefined}
      />
      <span
        className={`t-display text-[24px] leading-none ${
          claro ? "text-white" : "text-(--c-ink)"
        }`}
      >
        {SITE_NAME}
      </span>
      <span className="sr-only">— {SITE_TAGLINE}</span>
    </Link>
  );
}
