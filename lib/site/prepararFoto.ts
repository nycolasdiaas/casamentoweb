/**
 * Prepara uma foto no NAVEGADOR antes de subir: redimensiona, comprime e já
 * gera a miniatura do blur.
 *
 * Morava dentro do `PhotoManager`. Saiu quando o editor de convites passou a
 * subir foto também — duplicar isso significaria uma tela comprimindo a 0.85 e
 * a outra a 0.9, ou uma esquecendo o EXIF, e a diferença só apareceria numa
 * foto tirada de lado num celular específico.
 *
 * `imageOrientation: "from-image"` NÃO é detalhe: sem isso, foto tirada na
 * vertical pelo celular chega deitada — o canvas ignora o EXIF.
 */

/** Alvo de tamanho depois de comprimir. Acima disto a página fica lenta no 4G. */
export const ALVO_BYTES = 500 * 1024;

/** Maior lado da imagem enviada. O site tem 480px de largura; 1600 cobre retina e zoom. */
export const MAIOR_LADO = 1600;

export type FotoPreparada = {
  blob: Blob;
  width: number;
  height: number;
  blurDataUrl: string;
};

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem"))),
      "image/jpeg",
      quality
    );
  });
}

export async function prepararFoto(file: File): Promise<FotoPreparada> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  try {
    const escala = Math.min(
      1,
      MAIOR_LADO / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.max(1, Math.round(bitmap.width * escala));
    const height = Math.max(1, Math.round(bitmap.height * escala));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não conseguiu preparar a imagem.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    // Vai baixando a qualidade só até caber. Começa alto: foto de casamento
    // com rosto pequeno sofre mais com compressão do que uma paisagem.
    let blob = await toBlob(canvas, 0.85);
    for (const q of [0.75, 0.65, 0.55, 0.45]) {
      if (blob.size <= ALVO_BYTES) break;
      blob = await toBlob(canvas, q);
    }

    // Miniatura de 16px de largura: é o borrão que segura o lugar da foto
    // enquanto ela carrega, embutido no HTML como base64.
    const mini = document.createElement("canvas");
    mini.width = 16;
    mini.height = Math.max(1, Math.round((16 * height) / width));
    mini.getContext("2d")?.drawImage(bitmap, 0, 0, mini.width, mini.height);
    const blurDataUrl = mini.toDataURL("image/jpeg", 0.4);

    return { blob, width, height, blurDataUrl };
  } finally {
    bitmap.close();
  }
}
