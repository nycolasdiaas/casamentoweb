import Link from "next/link";
import { WHATSAPP_LINK } from "@/lib/site";
import type { ReactNode } from "react";

// Moldura comum das 3 prévias de template: fundo escuro "letterbox", cartão
// central de até 480px (como as prévias foram desenhadas, pensando em
// celular), barra de navegação fixa e CTA de WhatsApp no rodapé.
export default function TemplateChrome({
  styleName,
  outerBg,
  cardBg,
  ink,
  accent,
  children,
}: {
  styleName: string;
  outerBg: string;
  cardBg: string;
  ink: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{ background: outerBg }}
    >
      <div
        className="w-full max-w-[480px] flex flex-col shadow-2xl"
        style={{ background: cardBg }}
      >
        <div
          className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 text-[11px]"
          style={{
            background: cardBg,
            borderBottom: `1px solid ${accent}66`,
            color: ink,
          }}
        >
          <Link href="/" className="underline underline-offset-2">
            ← Pacotes
          </Link>
          <span className="tracking-[0.15em] uppercase">
            {styleName} · exemplo
          </span>
        </div>

        {children}

        <div
          className="flex flex-col items-center gap-3 px-6 py-12 text-center"
          style={{ background: ink }}
        >
          <p className="text-sm" style={{ color: cardBg }}>
            Gostaram deste modelo?
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium tracking-wide px-7 py-3 rounded-full transition-opacity hover:opacity-90"
            style={{ background: accent, color: ink }}
          >
            Quero um site assim
          </a>
        </div>
      </div>
    </div>
  );
}
