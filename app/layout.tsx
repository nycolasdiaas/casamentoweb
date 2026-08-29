import type { Metadata } from "next";
import { Italiana, Petit_Formal_Script } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { baseUrlEstatica } from "@/lib/baseUrl";

const italiana = Italiana({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const script = Petit_Formal_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

/* O metadata RAIZ é o fallback de toda rota que não declara o próprio — e ele
   anunciava o casamento de UM casal. Qualquer rota nova, qualquer 404, qualquer
   página sem `metadata` abria a aba com "Isabelle & Nycolas". Resquício de
   antes da multi-tenancy.

   O `template` deixa as rotas declararem só o próprio nome ("Fotos") e ganharem
   o sufixo sozinhas. As que já escrevem "Fotos | Enlace" continuam válidas —
   `template` só age sobre `title` string, e trocar as 20 é limpeza opcional. */
export const metadata: Metadata = {
  /* Resolve as URLs relativas de `openGraph.images` e `openGraph.url`.
     Sem isto o Next avisa no build e cai em `http://localhost:3000` — o que
     faria o cartão do WhatsApp apontar para a máquina de quem fez o deploy. */
  metadataBase: new URL(baseUrlEstatica()),
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Convite digital, confirmação de presença e lista de presentes com Pix sem taxa. Paga uma vez, sem mensalidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${italiana.variable} ${script.variable} h-full antialiased`}
      /* O script abaixo escreve `data-movimento` no <html> ANTES da primeira
         pintura — é o que evita o flash de quem já ligou as animações. O
         servidor não tem localStorage, então o atributo existe no cliente e
         não no HTML enviado: exatamente a divergência que o React reporta
         como erro de hidratação.

         `suppressHydrationWarning` é a saída documentada para este caso e
         vale só para os atributos DESTE elemento, não para a árvore. Sem ela
         o painel abria com o overlay de erro do dev por cima, e o defeito
         aparecia para quem tivesse a preferência ligada. */
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Restaura a escolha de movimento ANTES da primeira pintura.
            Se isto rodasse só na hidratação, quem já ligou as animações veria
            a página entrar reduzida e "acordar" no quadro seguinte — o mesmo
            flash que scripts de tema existem para evitar. É minúsculo e não
            depende de React. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("enlace:movimento")==="ligado")document.documentElement.dataset.movimento="ligado"}catch(e){}',
          }}
        />
        {children}
      </body>
    </html>
  );
}
