import Link from "next/link";

/**
 * A4 · Botão. Um botão, um jeito.
 *
 * Existe porque a base tinha `className="btn btn-primary"` em 30 arquivos e
 * `className="rounded-xl border border-(--color-gold)/40 ..."` em outros
 * tantos — e a prancha A4 é explícita: se o botão aparece diferente em três
 * telas, está errado.
 *
 * Quatro variantes, e a hierarquia entre elas é a regra de leitura da tela:
 *
 *   tinta     a decisão da tela. UMA por tela.
 *   contorno  a alternativa ("Ver a prévia" ao lado de "Publicar").
 *   texto     a saída segura ("Manter", "Agora não", "Pular").
 *   perigo    contorno vermelho. Nunca preenchido — ver o CSS.
 *
 * O rótulo é verbo + objeto, 1 a 3 palavras, sem ponto final (Voz e Microcopy
 * V4). "Continuar" só vale dentro de fluxo numerado.
 */

type Variante = "tinta" | "contorno" | "texto" | "perigo";
type Tamanho = "g" | "m" | "p";

const VARIANTE: Record<Variante, string> = {
  tinta: "btn-ink",
  contorno: "btn-quiet",
  texto: "btn-texto",
  perigo: "btn-perigo",
};

const TAMANHO: Record<Tamanho, string> = {
  g: "btn-g",
  m: "",
  p: "btn-sm",
};

function classes({
  variante = "tinta",
  tamanho = "m",
  larguraCheia,
  className,
}: {
  variante?: Variante;
  tamanho?: Tamanho;
  larguraCheia?: boolean;
  className?: string;
}) {
  return [
    "btn",
    VARIANTE[variante],
    TAMANHO[tamanho],
    larguraCheia ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

type Comuns = {
  variante?: Variante;
  tamanho?: Tamanho;
  larguraCheia?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Botao({
  variante,
  tamanho,
  larguraCheia,
  className,
  children,
  carregando,
  disabled,
  ...props
}: Comuns &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    /**
     * Mantém o rótulo e acrescenta a rodinha. Não troca o texto por
     * "Carregando...": quem clicou precisa continuar vendo o que pediu, e o
     * rótulo trocado é o que faz a pessoa achar que clicou no botão errado.
     */
    carregando?: boolean;
  }) {
  return (
    <button
      {...props}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={classes({ variante, tamanho, larguraCheia, className })}
    >
      {children}
      {carregando && <span className="btn-rodinha" aria-hidden="true" />}
    </button>
  );
}

/**
 * A mesma pele, para quando a ação é navegar. Botão que navega tem de ser
 * `<a>`: abrir em nova aba, copiar o endereço e o leitor de tela anunciando
 * "link" dependem disso, e nenhum `onClick={router.push}` devolve os três.
 */
export function BotaoLink({
  href,
  variante,
  tamanho,
  larguraCheia,
  className,
  children,
  ...props
}: Comuns &
  Omit<React.ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link
      href={href}
      {...props}
      className={classes({ variante, tamanho, larguraCheia, className })}
    >
      {children}
    </Link>
  );
}
