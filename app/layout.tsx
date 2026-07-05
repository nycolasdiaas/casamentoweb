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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
