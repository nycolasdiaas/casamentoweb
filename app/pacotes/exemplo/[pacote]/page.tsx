import { permanentRedirect, notFound } from "next/navigation";
import { PACKAGES, type PackageTier } from "@/lib/packages";

/**
 * B3 · `/pacotes/exemplo/:pacote` — um atalho, não uma tela.
 *
 * As demos mockadas por pacote foram substituídas pelas prévias reais em
 * `/pacotes/estilos/<id>`, que já aceitam `?pacote=` para abrir no pacote
 * certo. Manter uma segunda prévia por pacote seria manter duas — e a segunda
 * é sempre a que fica velha.
 *
 * O que mudou aqui: antes, QUALQUER coisa depois de `/exemplo/` caía num
 * `redirect("/")` — inclusive `/pacotes/exemplo/qualquer-lixo`, que respondia
 * 307 para a home como se fosse um endereço válido. Agora pacote inválido é
 * 404, que é a verdade, e pacote válido é 308 (permanente) para a prévia com
 * o pacote na URL. O 308 conta ao navegador e ao buscador que a mudança é
 * definitiva.
 *
 * `editorial` porque é "a casa" — o estilo que a própria vitrine marca como
 * padrão. O casal troca de estilo dentro da prévia, com um clique.
 */
export function generateStaticParams() {
  return PACKAGES.map((p) => ({ pacote: p.tier }));
}

export default async function ExemploPorPacote({
  params,
}: {
  params: Promise<{ pacote: string }>;
}) {
  const { pacote } = await params;

  const valido = PACKAGES.some((p) => p.tier === pacote);
  if (!valido) notFound();

  permanentRedirect(
    `/pacotes/estilos/editorial?pacote=${pacote as PackageTier}`
  );
}
