/**
 * Sistema · Ícones (`Enlace - Icones.dc.html`).
 *
 * Base Lucide: monoline, `viewBox 0 0 24 24`, `stroke-width 1.5`, pontas e
 * junções redondas, **`stroke: currentColor`** e nunca preenchido.
 *
 * O `currentColor` é a decisão inteira. Com ele o mesmo ícone funciona no
 * papel claro do painel, no tema escuro do admin e sobre foto, sem uma
 * segunda cópia e sem prop de cor: quem escolhe é o `color` do container.
 *
 * Tamanhos 16 / 20 / 24. Nada fora disso — um ícone de 19px ao lado de um de
 * 20px é o tipo de desalinho que ninguém aponta e todo mundo sente.
 *
 * Por que um módulo com os `path` colados, e não `lucide-react`: são ~60
 * ícones num produto de vinte telas. A dependência traria a biblioteca inteira
 * (mais de mil) para o bundle e um segundo lugar de onde importar ícone — que
 * é exatamente o que a prancha existe para impedir.
 *
 * ── Três primitivas, não uma ───────────────────────────────────────────────
 *
 * A versão anterior só sabia desenhar `path`, e por isso escrevia moldura como
 * `"M3 4h18v16H3z"` — canto vivo onde a prancha usa `rx="1.5"`. O ícone de
 * foto tinha a montanha e não tinha a LENTE, porque a lente é um `<circle>`.
 * Um ícone de foto sem lente é uma moldura com um triângulo dentro.
 *
 * Agora são três: `path`, `circle` e `rect`. É o que a prancha usa, e o que
 * permite copiar o SVG dela sem reescrever a geometria no caminho.
 */

const CAMINHOS = {
  /* ── Navegação e estrutura ─────────────────────────────────────────────── */
  casa: "M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  layout: "M3 9h18",
  menu: "M4 6h16M4 12h16M4 18h16",
  chevronBaixo: "m6 9 6 6 6-6",
  chevronDireita: "m9 18 6-6-6-6",
  setaDireita: "M5 12h14m-7-7 7 7-7 7",
  setaEsquerda: "M19 12H5m7-7-7 7 7 7",
  buscar: "m21 21-4.3-4.3",
  lixeira: "M3 6h18M6 6l1 14h10l1-14M9 6V4h6v2",
  mais: "M12 5v14M5 12h14",
  menos: "M5 12h14",
  x: "M18 6 6 18M6 6l12 12",
  mostrarMais: "",
  ajustes:
    "M12.2 3a2 2 0 0 1 1.9 1.4l.3 1a7.7 7.7 0 0 1 1.7 1l1-.3a2 2 0 0 1 2.3 1l.2.3a2 2 0 0 1-.4 2.5l-.8.6a7.5 7.5 0 0 1 0 2l.8.6a2 2 0 0 1 .4 2.5l-.2.3a2 2 0 0 1-2.3 1l-1-.3a7.7 7.7 0 0 1-1.7 1l-.3 1A2 2 0 0 1 12.2 21h-.4a2 2 0 0 1-1.9-1.4l-.3-1a7.7 7.7 0 0 1-1.7-1l-1 .3a2 2 0 0 1-2.3-1l-.2-.3a2 2 0 0 1 .4-2.5l.8-.6a7.5 7.5 0 0 1 0-2l-.8-.6a2 2 0 0 1-.4-2.5l.2-.3a2 2 0 0 1 2.3-1l1 .3a7.7 7.7 0 0 1 1.7-1l.3-1A2 2 0 0 1 11.8 3z",
  linkExterno:
    "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  copiar: "M5 15V5a2 2 0 0 1 2-2h10",
  lista: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",

  /* ── Ações e domínio do casamento ──────────────────────────────────────── */
  check: "M20 6 9 17l-5-5",
  coracao: "M12 21s-7.5-4.6-9.7-9A5 5 0 0 1 12 6a5 5 0 0 1 9.7 6c-2.2 4.4-9.7 9-9.7 9z",
  envelope: "M4 8h16v12H4zM4 8 12 3l8 5M12 12v4M9 14h6",
  calendario: "M3 9h18M8 2v4M16 2v4",
  relogio: "M12 7v5l3 2",
  local: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z",
  presente:
    "M3 12h18M12 8v13M12 8S9.5 3 7.5 4.5 9 8 12 8zM12 8s2.5-5 4.5-3.5S15 8 12 8z",
  pessoas:
    "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4a3.5 3.5 0 0 1 0 7M21 20c0-2.5-1.5-4.7-3.7-5.6",
  pessoa: "M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8",
  mensagem: "M4 4h16v14H7l-3 3z",
  sino: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0",
  compartilhar: "M12 3v13m0-13-4 4m4-4 4 4M5 21h14",
  cartao: "M8 3v18M8 8h4M8 12h4",
  moeda: "M12 3v18M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  baixar: "M12 15V3m0 12-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  enviar: "M12 3v12m0-12L8 7m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",

  /* ── Status e feedback ─────────────────────────────────────────────────── */
  checkCirculo: "m8.5 12 2.5 2.5 4.5-5",
  alertaTriangulo:
    "M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0zM12 9v4m0 4h.01",
  alerta: "M12 8v4m0 4h.01",
  informacao: "M12 16v-4m0-4h.01",
  atualizar: "M12 3a9 9 0 1 0 9 9M21 3v6h-6",
  olho: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z",
  olhoFechado:
    "M10.7 6.2A9.3 9.3 0 0 1 12 6c6.5 0 10 6 10 6a15 15 0 0 1-3 3.5M6.5 7.5A15 15 0 0 0 2 12s3.5 6 10 6a9 9 0 0 0 3.5-.7M3 3l18 18",
  cadeado: "M8 11V8a4 4 0 0 1 8 0v3",
  cadeadoAberto: "M8 11V8a4 4 0 0 1 7.5-2",
  escudo: "M12 2 4 6v6c0 4.5 3.2 7.8 8 10 4.8-2.2 8-5.5 8-10V6z",
  estrela: "m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z",
  marcador: "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l7-3z",
  menosCirculo: "M8 12h8",
  checkSelo: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3",
  local2: "M4 20h16M4 20V10l8-6 8 6v10M9 20v-6h6v6",

  /* ── Editor de convite ─────────────────────────────────────────────────── */
  modelos: "",
  texto: "M4 7V5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V7M9 20h6M12 4v16",
  foto: "m21 16-5-5L5 20",
  formas: "",
  fundo: "M3 16l5-5 4 4 3-3 6 6",
  camadas: "M12 3 21 8l-9 5-9-5 9-5zM3 13l9 5 9-5M3 18l9 5 9-5",
  desfazer: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v5",
  refazer: "m15 14 5-5-5-5M20 9H10a6 6 0 0 0-6 6v5",
  alinharCentro: "M4 6h16M7 12h10M5 18h14",
  alinharEsquerda: "M4 6h16M4 12h10M4 18h14",
  alinharDireita: "M4 6h16M10 12h10M6 18h14",
  girar: "M12 3a9 9 0 1 0 9 9M21 3v6h-6",
  redimensionar: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  aproximar: "m21 21-4.3-4.3M8 11h6M11 8v6",
  recortar:
    "M5 3a2 2 0 0 0-2 2M9 3h2M15 3h2M21 5a2 2 0 0 0-2-2M3 9v2M3 15v2M5 21a2 2 0 0 1-2-2M9 21h2M15 21h2M21 19a2 2 0 0 1-2 2M21 9v2M21 15v2",
  lapis: "m9 11-6 6v4h4l6-6M13 7l4 4M14 4l3-1 4 4-1 3z",
  salvar: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  arrastar: "",
} as const;

/** Ícones que precisam de um círculo além do traço. */
const CIRCULOS: Partial<
  Record<keyof typeof CAMINHOS, [number, number, number][]>
> = {
  buscar: [[11, 11, 7]],
  aproximar: [[11, 11, 7]],
  alerta: [[12, 12, 9]],
  alertaTriangulo: [],
  informacao: [[12, 12, 9]],
  checkCirculo: [[12, 12, 9]],
  menosCirculo: [[12, 12, 9]],
  relogio: [[12, 12, 9]],
  local: [[12, 10, 2.5]],
  pessoas: [[9, 8, 3.5]],
  pessoa: [[12, 8, 4]],
  // A LENTE da câmera. Ela existe na prancha e não existia aqui — sem ela o
  // ícone é uma moldura com uma montanha, não uma foto.
  foto: [[8.5, 9, 1.5]],
  formas: [[8, 8, 4.5]],
  mostrarMais: [
    [12, 12, 1],
    [19, 12, 1],
    [5, 12, 1],
  ],
  arrastar: [
    [9, 6, 1],
    [9, 12, 1],
    [9, 18, 1],
    [15, 6, 1],
    [15, 12, 1],
    [15, 18, 1],
  ],
  ajustes: [[12, 12, 3]],
};

/**
 * Ícones com moldura. `[x, y, largura, altura, raio]`.
 *
 * A prancha usa `rx="1.5"` em todos — canto vivo denuncia o ícone reescrito à
 * mão a partir da descrição, em vez de copiado do desenho.
 */
const RETANGULOS: Partial<
  Record<keyof typeof CAMINHOS, [number, number, number, number, number][]>
> = {
  layout: [[3, 4, 18, 16, 1.5]],
  foto: [[3, 4, 18, 16, 1.5]],
  calendario: [[3, 4, 18, 17, 1.5]],
  presente: [[3, 8, 18, 13, 1.5]],
  cadeado: [[5, 11, 14, 10, 1.5]],
  cadeadoAberto: [[5, 11, 14, 10, 1.5]],
  cartao: [[4, 3, 16, 18, 1.5]],
  copiar: [[9, 9, 12, 12, 1.5]],
  modelos: [
    [3, 3, 7, 7, 1],
    [14, 3, 7, 7, 1],
    [3, 14, 7, 7, 1],
    [14, 14, 7, 7, 1],
  ],
  formas: [[12, 12, 8, 8, 1]],
  fundo: [[3, 3, 18, 18, 1.5]],
};

export type NomeDoIcone = keyof typeof CAMINHOS;

export default function Icone({
  nome,
  tamanho = 20,
  className,
}: {
  nome: NomeDoIcone;
  tamanho?: 16 | 20 | 24;
  className?: string;
}) {
  const d = CAMINHOS[nome];
  const circulos = CIRCULOS[nome];
  const retangulos = RETANGULOS[nome];

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      /* Decorativo por padrão: o significado está no texto ao lado. Ícone
         sozinho num botão precisa de `aria-label` no BOTÃO, não aqui. */
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {retangulos?.map(([x, y, w, h, rx], i) => (
        <rect key={`r${i}`} x={x} y={y} width={w} height={h} rx={rx} />
      ))}
      {d && <path d={d} />}
      {circulos?.map(([cx, cy, r], i) => (
        <circle key={`c${i}`} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  );
}
