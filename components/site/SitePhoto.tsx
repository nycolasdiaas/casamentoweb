import Image from "next/image";
import PhotoSlot from "@/components/templates/PhotoSlot";
import Icone from "@/components/ui/prensa/Icone";
import type { SitePhotoRow } from "@/lib/repositories/sitePhotos";

/**
 * Uma foto do casal no site — ou o placeholder, enquanto não houver foto.
 *
 * O fallback é deliberado: o site é provisionado em segundos, antes de o
 * casal subir qualquer imagem. Sem ele a prévia nasceria com buracos, e a
 * prévia é justamente o que convence o casal a pagar.
 *
 * ── O sinal de que dá para clicar ──────────────────────────────────────────
 *
 * `PhotoLightbox` abre QUALQUER `img` dentro de `.site-canvas` que seja grande
 * o bastante e não esteja dentro de um link — por delegação, sem que nenhum
 * molde saiba que ele existe. O problema era que a foto também não sabia:
 * clicável e sem nenhum sinal disso, ninguém clicava.
 *
 * O sinal mora aqui, e não em cada molde, pelo mesmo motivo do lightbox:
 * alcança os seis de uma vez e um molde novo herda sem saber que existe. São
 * três, do mais forte ao mais discreto — o cursor de lupa, um aproximar de
 * 3% na foto, e o selo com o ícone de lupa que sobe no canto.
 *
 * As cores do selo saem de `--paper`/`--ink`: é foto do casal dentro do tema
 * do casal, e um selo branco fixo apareceria cinza-claro sobre o Editorial e
 * berrante sobre o Film.
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
    <div
      data-foto
      className={`group/foto relative overflow-hidden bg-black/5 cursor-zoom-in ${className}`}
    >
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
        //
        // 28/08/2026 — o cartão virou largura cheia (spec 002, Opção B), e o
        // teto subiu de 1120 para 1920. O número aqui é o MESMO que o
        // `lg:max-w-[1920px]` do `SiteRenderer`: deixar 1120 aqui repetiria o
        // defeito que este comentário descreve, só que uma vez e meia pior —
        // a capa do Editorial sangra metade de 1920 e a foto chegaria com
        // 1120 de origem para preencher 960 de moldura em tela retina.
        sizes="(max-width: 1024px) 100vw, 1920px"
        className="object-cover transition-transform duration-500 ease-out group-hover/foto:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover/foto:scale-100"
        {...(photo.blurDataUrl
          ? { placeholder: "blur" as const, blurDataURL: photo.blurDataUrl }
          : {})}
        {...(priority ? { priority: true } : { loading: "lazy" as const })}
      />

      {/* Só no ponteiro. Em tela de toque não existe "passar o mouse": o véu
          ficaria ou sempre visível, sujando a foto, ou nunca — e no celular a
          foto ampliada é o próprio toque, que já é o gesto esperado.

          O sinal era discreto demais: zoom de 3% e um selo pequeno passavam
          despercebidos, e o dono relatou não perceber que dava para clicar
          (15/09/2026). Agora o zoom é de 5%, entra um véu na cor da tinta do
          tema, e o selo cresce e ganha a palavra — três sinais que aparecem
          juntos, em vez de um que ninguém nota. O véu usa `--ink` do casal:
          um preto fixo estouraria sobre o Film e sumiria sobre o Editorial. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-300 group-hover/foto:opacity-100 [@media(hover:hover)]:block"
        style={{ background: "color-mix(in srgb, var(--ink) 18%, transparent)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-3 right-3 hidden translate-y-1 items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium tracking-wide uppercase opacity-0 transition-all duration-300 group-hover/foto:translate-y-0 group-hover/foto:opacity-100 [@media(hover:hover)]:flex"
        style={{
          background: "color-mix(in srgb, var(--paper) 92%, transparent)",
          color: "var(--ink)",
        }}
      >
        <Icone nome="aproximar" tamanho={16} />
        Ampliar
      </span>
    </div>
  );
}
