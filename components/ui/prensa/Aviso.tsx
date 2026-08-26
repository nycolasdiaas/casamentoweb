import Link from "next/link";

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
        <Link
          href={acao.href}
          className="text-[13.5px] font-medium whitespace-nowrap underline underline-offset-4"
        >
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}
