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
        sizes="(max-width: 480px) 100vw, 480px"
        className="object-cover"
        {...(photo.blurDataUrl
          ? { placeholder: "blur" as const, blurDataURL: photo.blurDataUrl }
          : {})}
        {...(priority ? { priority: true } : { loading: "lazy" as const })}
      />
    </div>
  );
}
