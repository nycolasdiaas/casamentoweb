import Image from "next/image";
import PhotoSlot from "@/components/templates/PhotoSlot";
import type { SitePhotoRow } from "@/lib/repositories/sitePhotos";

/**
 * Uma foto do casal no site — ou o placeholder, enquanto não houver foto.
 *
 * O fallback é deliberado: o site é provisionado em segundos, antes de o
 * casal subir qualquer imagem. Sem ele a prévia nasceria com buracos, e a
 * prévia é justamente o que convence o casal a pagar.
 *
 * A largura do site é travada em 480px (ver SiteRenderer), então `sizes`
 * pode ser exato — o navegador não baixa uma versão maior à toa.
 */
export default function SitePhoto({
  photo,
  label,
  className = "",
  priority = false,
}: {
  photo: SitePhotoRow | undefined;
  label: string;
  className?: string;
  /** só para a foto da capa: ela é o LCP da página */
  priority?: boolean;
}) {
  if (!photo) {
    return <PhotoSlot label={label} className={className} />;
  }

  return (
    <div className={`relative overflow-hidden bg-black/5 ${className}`}>
      <Image
        src={`/f/${photo.id}`}
        alt={photo.alt ?? label}
        fill
        // O `sizes` ficou para trás quando o cartão cresceu.
        //
        // Ele dizia "no máximo 480px" — a largura de quando o site do
        // convidado era só o cartão de celular. Hoje o cartão vai a 1120px no
        // desktop, e a vitrine é full-bleed: o navegador baixava uma imagem de
        // 480px e a esticava para duas ou três vezes isso. Foto de casamento
        // borrada no computador, que é onde o casal mostra o site para a
        // família.
        //
        // O caminho do CELULAR não muda (100vw abaixo de 1024px), e é ele que
        // carrega a meta de LCP de 2,5 s — quem abre pelo WhatsApp continua
        // recebendo exatamente o que recebia.
        sizes="(max-width: 1024px) 100vw, 1120px"
        className="object-cover"
        {...(photo.blurDataUrl
          ? { placeholder: "blur" as const, blurDataURL: photo.blurDataUrl }
          : {})}
        {...(priority ? { priority: true } : { loading: "lazy" as const })}
      />
    </div>
  );
}
