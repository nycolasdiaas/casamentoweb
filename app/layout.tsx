import type { Metadata } from "next";
import { Italiana, Petit_Formal_Script } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Isabelle & Nycolas | Save the Date",
  description: "Confirme sua presença no nosso casamento",
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
