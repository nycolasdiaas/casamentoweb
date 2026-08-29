import Link from "next/link";
import Icone from "./Icone";

/**
 * A4 · Aviso — a faixa de "falta alguma coisa".
 *
 * A regra que ele carrega vem da Voz e Microcopy: todo aviso acionável leva o
 * link da ação junto. Aviso sem próximo passo não informa, só produz
 * ansiedade — "falta a chave Pix" sozinho manda o casal caçar onde se
 * resolve isso.
 *
 * O tom pinta o fio, o traço da margem e o ponto; o TEXTO continua em tinta.
 * Corpo em cor semântica lê como erro de contraste, e a cor já está dita três
 * vezes na moldura.
 */

type Tom = "warn" | "danger" | "ok" | "neutro";

const COR: Record<Tom, string> = {
  warn: "text-(--c-warn)",
  danger: "text-(--c-danger)",
  ok: "text-(--c-ok)",
  neutro: "text-(--c-ink-2)",
};

export default function Aviso({
  tom = "warn",
  children,
  acao,
  className,
}: {
  tom?: Tom;
  children: React.ReactNode;
  acao?: { rotulo: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={`aviso ${COR[tom]} ${className ?? ""}`}
      role={tom === "danger" ? "alert" : "status"}
    >
      <span className="etiqueta-ponto" aria-hidden="true" />
      <p className="aviso-texto flex-1">{children}</p>
      {acao && (
        /* A seta e do COMPONENTE, nao do rotulo.

           Antes cada chamador escrevia "→" no fim da propria string, e o
           resultado era uma seta tipografica que nao acompanha peso nem
           tamanho do icone do resto do sistema — e que some da leitura de
           tela como um caractere solto. Aqui ela e desenhada uma vez, e todo
           `Aviso` herda. */
        <Link
          href={acao.href}
          className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13.5px] font-medium"
        >
          <span className="underline underline-offset-4">{acao.rotulo}</span>
          <Icone nome="setaDireita" tamanho={16} />
        </Link>
      )}
    </div>
  );
}
