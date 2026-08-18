import {
  CONVITE_ALTURA,
  CONVITE_LARGURA,
  type Bloco,
} from "@/lib/site/inviteDoc";
import { clipPathDe } from "@/lib/site/inviteShapes";
import { quebrarLinhas } from "@/lib/site/inviteRender";

/**
 * Desenha UM bloco em HTML — o mesmo componente na miniatura e no editor.
 *
 * Existe porque a marcação estava duplicada nos dois, e duplicada ela diverge:
 * bastaria acrescentar uma forma num lugar e esquecer o outro para a lista
 * mostrar um convite diferente do que o casal desenhou.
 *
 * As medidas saem todas de `cqw`/`%` sobre a caixa do convite, então o mesmo
 * desenho serve para a miniatura de 120px e para a tela de 900px — e bate com
 * o SVG do export, que usa as mesmas frações multiplicadas por 1080.
 */

export function estiloDoBloco(b: Bloco): React.CSSProperties {
  return {
    position: "absolute",
    left: `${b.x * 100}%`,
    top: `${b.y * 100}%`,
    width: `${b.w * 100}%`,
    // Gira em torno do CENTRO, como o SVG do export: com o padrão do CSS
    // (`50% 50%`) já batem, mas declarar deixa explícito que a convenção é
    // compartilhada e não deve mudar de um lado só.
    ...(b.rotacao ? { rotate: `${b.rotacao}deg`, transformOrigin: "50% 50%" } : {}),
  };
}

export default function BlocoVisual({ bloco: b }: { bloco: Bloco }) {
  if (b.tipo === "linha") {
    return (
      <div
        style={{
          height: `${(b.espessura / CONVITE_ALTURA) * 100}cqh`,
          minHeight: 1,
          background: b.cor,
        }}
      />
    );
  }

  if (b.tipo === "forma") {
    const arredondado =
      b.forma === "arredondado"
        ? `${(b.raio / CONVITE_LARGURA) * 100}cqw`
        : b.forma === "circulo"
          ? "50%"
          : undefined;

    return (
      <div
        style={{
          width: "100%",
          aspectRatio: String(b.proporcao || 1),
          background: b.preenchimento || "transparent",
          // `clip-path` recorta a borda junto, então polígono com contorno usa
          // `outline` interno via box-shadow — mas para o caso comum (forma
          // sólida) o recorte simples basta e casa com o SVG.
          clipPath: clipPathDe(b.forma) ?? undefined,
          borderRadius: arredondado,
          border:
            b.espessura > 0 && b.contorno && !clipPathDe(b.forma)
              ? `${(b.espessura / CONVITE_LARGURA) * 100}cqw solid ${b.contorno}`
              : undefined,
          opacity: b.opacidade,
          boxSizing: "border-box",
        }}
      />
    );
  }

  if (b.tipo === "foto") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/f/${b.fotoId}`}
        alt=""
        draggable={false}
        style={{
          width: "100%",
          aspectRatio: String(b.proporcao || 1),
          objectFit: "cover",
          borderRadius: `${(b.raio / CONVITE_LARGURA) * 100}%`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        fontSize: `${b.tamanho * 100}cqw`,
        color: b.cor,
        fontWeight: b.peso,
        textAlign: b.alinhamento,
        letterSpacing: `${b.espacamento}em`,
        lineHeight: 1.25,
        whiteSpace: "pre-wrap",
        fontFamily:
          b.fonte === "sans"
            ? "var(--font-sans, sans-serif)"
            : b.fonte === "script"
              ? "cursive"
              : "var(--font-serif, serif)",
      }}
    >
      {quebrarLinhas(
        b.texto,
        b.w * CONVITE_LARGURA,
        b.tamanho * CONVITE_LARGURA,
        b.fonte
      ).join("\n")}
    </div>
  );
}
