import { ImageResponse } from "next/og";

/**
 * O cartão de link, desenhado — prancha `Compartilhamento` S1.
 *
 * ── Duas variantes, e a segunda não é fallback de emergência ───────────────
 *
 * A prancha desenha as duas de propósito e anota a regra:
 * *"sem foto: cai para o cartão tipográfico em papel — **nunca um cartão
 * vazio**"*. Um casal que ainda não subiu foto tem um cartão legítimo, não um
 * retângulo quebrado — é a mesma regra do "SEM FOTO DE CAPA AINDA" na prancha
 * I3, aplicada ao que o convidado vê.
 *
 * ── Por que não usa as classes da Prensa ───────────────────────────────────
 *
 * `ImageResponse` roda num renderizador de Satori, não num navegador: ele
 * entende um subconjunto de CSS em `style` inline e ignora folha de estilo,
 * `className` e custom property. Então as medidas vêm escritas aqui, e é por
 * isso que este arquivo repete cores que em qualquer outro lugar seriam token.
 *
 * ── Área segura ───────────────────────────────────────────────────────────
 *
 * A prancha pede 60px livres nas bordas e nada essencial fora do centro: o
 * WhatsApp recorta o cartão em proporções diferentes conforme o aparelho, e o
 * que estiver na borda some.
 */

export const TAMANHO_OG = { width: 1200, height: 630 };

const TINTA = "#1a1d21";
const PAPEL = "#f2efe7";
const MARCA = "#b8412c";
const FIO = "#c9c9c2";

type Fonte = { name: string; data: ArrayBuffer; weight?: 400; style?: "normal" };

/**
 * Cartão COM foto — o do site do casamento.
 *
 * A foto entra como `<img>` com `objectPosition: "center 26%"`, que é o
 * enquadramento que a prancha usa em todas as fotos de casal: centralizado
 * corta cabeça, e 26% do topo pega o rosto.
 */
export function CartaoComFoto({
  nomes,
  data,
  cidade,
  fotoUrl,
}: {
  nomes: string;
  data: string | null;
  cidade: string | null;
  fotoUrl: string;
}) {
  /* MEDIDAS EXPLÍCITAS EM TUDO QUE É ABSOLUTO.
     O Satori não é um navegador: ele não resolve `inset: 0` nem herda a caixa
     do pai posicionado. A primeira versão usava `inset` + `alignItems/
     justifyContent` e o texto saía encalhado no canto superior esquerdo, por
     cima do rosto do casal. Com `top/left/width/height` escritos, o
     alinhamento volta a valer. */
  const CAIXA = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: TAMANHO_OG.width,
    height: TAMANHO_OG.height,
  };

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: TAMANHO_OG.width,
        height: TAMANHO_OG.height,
        backgroundColor: TINTA,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fotoUrl}
        alt=""
        width={TAMANHO_OG.width}
        height={TAMANHO_OG.height}
        style={{ ...CAIXA, objectFit: "cover", objectPosition: "center 26%" }}
      />

      {/* O ESCURECIMENTO, e por que ele é `backgroundImage`.
          `background: linear-gradient(…)` não pinta nada aqui — o Satori lê a
          propriedade longa, não o atalho. Sem isto o texto branco caía sobre
          uma foto clara e sumia, que foi o que aconteceu na primeira prova.

          Topo e base escurecem; o meio fica limpo para o rosto aparecer. */}
      <div
        style={{
          ...CAIXA,
          display: "flex",
          backgroundImage:
            "linear-gradient(to bottom, rgba(26,29,33,0.55), rgba(26,29,33,0.15) 40%, rgba(26,29,33,0.72))",
        }}
      />

      <div
        style={{
          ...CAIXA,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          padding: 60,
        }}
      >
        <div
          style={{
            fontFamily: "Mono",
            fontSize: 22,
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          Vamos nos casar
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Display",
            fontSize: nomes.length > 26 ? 76 : 96,
            lineHeight: 1,
            margin: "24px 0",
            textAlign: "center",
          }}
        >
          {nomes}
        </div>
        {(data || cidade) && (
          <div style={{ fontFamily: "Mono", fontSize: 24, letterSpacing: 2 }}>
            {[data, cidade?.toUpperCase()].filter(Boolean).join("  —  ")}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Cartão TIPOGRÁFICO — sem foto, e também o do convite.
 *
 * O `&` sai em `--mark`: é o único acento do cartão, e a Fundação A1 permite
 * uma aparição por peça.
 */
export function CartaoTipografico({
  sobrancelha,
  nomes,
  data,
  cidade,
}: {
  sobrancelha: string;
  nomes: string;
  data: string | null;
  cidade: string | null;
}) {
  /* Divide no "&" para pintar só ele. Um `replace` com HTML não serve: o
     Satori recebe elementos, não string com marcação. */
  const partes = nomes.split(/\s*&\s*/);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: PAPEL,
        color: TINTA,
        padding: 60,
      }}
    >
      <div
        style={{
          fontFamily: "Mono",
          fontSize: 22,
          letterSpacing: 7,
          textTransform: "uppercase",
          color: MARCA,
        }}
      >
        {sobrancelha}
      </div>

      <div
        style={{
          display: "flex",
          fontFamily: "Display",
          fontSize: partes.join("").length > 26 ? 72 : 88,
          lineHeight: 1,
          margin: "28px 0",
          textAlign: "center",
        }}
      >
        {partes.length > 1 ? (
          <>
            <span>{partes[0]}</span>
            <span style={{ color: MARCA, padding: "0 18px" }}>&amp;</span>
            <span>{partes.slice(1).join(" & ")}</span>
          </>
        ) : (
          <span>{nomes}</span>
        )}
      </div>

      <div style={{ display: "flex", width: 96, height: 1, backgroundColor: FIO }} />

      {(data || cidade) && (
        <div
          style={{
            fontFamily: "Mono",
            fontSize: 24,
            letterSpacing: 2,
            marginTop: 28,
          }}
        >
          {[data, cidade?.toUpperCase()].filter(Boolean).join("  ·  ")}
        </div>
      )}
    </div>
  );
}

/**
 * Monta a resposta de imagem com as fontes carregadas.
 *
 * O Satori não tem acesso às fontes do sistema nem ao `next/font`: cada peça
 * de texto precisa do arquivo `.ttf` em memória. Sem isto, o cartão sai numa
 * fonte padrão e perde a assinatura da marca — que é metade do motivo de ele
 * existir.
 */
export async function responderComImagem(
  elemento: React.ReactElement,
  fontes: Fonte[]
): Promise<Response> {
  const png = new ImageResponse(elemento, {
    ...TAMANHO_OG,
    fonts: fontes.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight ?? 400,
      style: f.style ?? "normal",
    })),
  });

  /* ── O CARTÃO SAI EM JPEG, e isso não é preferência ─────────────────────
     `ImageResponse` só sabe emitir PNG, que é formato SEM PERDA. Para o
     cartão tipográfico isso é ótimo (35 KB, tipo nítido). Para o cartão COM
     FOTO é o contrário: medido, um retrato de casamento em 1200×630 sai com
     **1,7 MB** em PNG.

     A prancha pede `< 300kb`, e o número não é capricho de designer: cliente
     de mensagem baixa a prévia antes de mostrar, e acima de algumas centenas
     de KB vários simplesmente desistem e exibem o link nu — que é exatamente
     o estado que esta funcionalidade existe para corrigir.

     JPEG a 82 resolve: a mesma foto cai para ~90 KB, e o cartão tipográfico
     continua abaixo de 40 KB. `mozjpeg` porque comprime melhor no mesmo nível
     de qualidade, e `chromaSubsampling 4:4:4` porque o texto branco fino
     sobre foto é a primeira coisa que a subamostragem de cor borra.

     O `sharp` já vinha instalado — é ele que o Next usa para otimizar imagem —
     mas passou a ser dependência DECLARADA no `package.json`: depender de um
     pacote transitivo é depender de uma decisão que não é nossa. */
  const { default: sharp } = await import("sharp");
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      /* O endereço já é versionado pelo conteúdo (`?v=`), então o arquivo
         naquele endereço nunca muda. `immutable` é honesto aqui. */
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
