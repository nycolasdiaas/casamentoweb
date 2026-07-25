import Link from "next/link";
import { WHATSAPP_LINK } from "@/lib/site";
import { PACKAGES, type PackageTier } from "@/lib/packages";
import { TEMPLATE_STYLES, type TemplateStyleId } from "@/lib/templates";
import type { ReactNode } from "react";

// Moldura comum das 3 prévias de template: fundo escuro "letterbox", cartão
// central de até 480px (como as prévias foram desenhadas, pensando em
// celular), barra de navegação fixa com o seletor de pacote (mesma prévia
// muda de seções conforme o pacote escolhido) e CTA de WhatsApp no rodapé.
export default function TemplateChrome({
  styleId,
  styleName,
  outerBg,
  cardBg,
  ink,
  accent,
  tier,
  onTierChange,
  children,
}: {
  styleId: TemplateStyleId;
  styleName: string;
  outerBg: string;
  cardBg: string;
  ink: string;
  accent: string;
  tier: PackageTier;
  onTierChange: (tier: PackageTier) => void;
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
          className="sticky top-0 z-50 flex flex-col gap-2.5 px-4 py-2.5 text-[11px]"
          style={{
            background: cardBg,
            borderBottom: `1px solid ${accent}66`,
            color: ink,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="underline underline-offset-2">
              ← Pacotes
            </Link>
            <Link href="/conta" className="underline underline-offset-2">
              Minha conta
            </Link>
          </div>

          {/* Trocar de modelo sem sair da prévia (mantém o pacote atual) */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-12 tracking-[0.12em] uppercase text-[9px] opacity-55">
              Modelo
            </span>
            <div className="flex-1 flex gap-1.5">
              {TEMPLATE_STYLES.map((t) => {
                const active = t.id === styleId;
                return (
                  <Link
                    key={t.id}
                    href={`/pacotes/estilos/${t.id}?pacote=${tier}`}
                    aria-current={active ? "page" : undefined}
                    className="flex-1 text-center leading-tight py-1.5 rounded-full border transition-colors"
                    style={{
                      background: active ? ink : "transparent",
                      borderColor: active ? ink : `${ink}33`,
                      color: active ? cardBg : ink,
                      opacity: active ? 1 : 0.7,
                    }}
                  >
                    {t.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Trocar de pacote (muda quais seções aparecem) */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-12 tracking-[0.12em] uppercase text-[9px] opacity-55">
              Pacote
            </span>
            <div className="flex-1 flex gap-1.5">
              {PACKAGES.map((pkg) => {
                const active = pkg.tier === tier;
                return (
                  <button
                    key={pkg.tier}
                    type="button"
                    onClick={() => onTierChange(pkg.tier)}
                    className="flex-1 text-center leading-tight py-1.5 rounded-full border transition-colors"
                    style={{
                      background: active ? accent : "transparent",
                      borderColor: active ? accent : `${ink}33`,
                      color: active ? cardBg : ink,
                      opacity: active ? 1 : 0.7,
                    }}
                  >
                    {pkg.name}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-center opacity-70">
            {PACKAGES.find((pkg) => pkg.tier === tier)?.price} · prévia deste
            pacote no template {styleName}
          </p>
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
