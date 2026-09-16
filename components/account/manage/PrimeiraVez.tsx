import Link from "next/link";

/**
 * Faixa I · o painel no minuto zero.
 *
 * A regra da prancha, e é contraintuitiva o bastante para merecer o registro:
 * **nunca mostrar cartão de métrica em zero.** "0 confirmados · 0 presentes ·
 * 0 visitas" é uma cobrança — a pessoa acabou de terminar o questionário e a
 * primeira coisa que a tela faz é listar três coisas que ela não fez. Uma
 * lista de três passos, no mesmo lugar, é um convite.
 *
 * A troca é definitiva e num sentido só: assim que existe movimento (uma foto,
 * um convite, uma confirmação), a régua de números entra e este roteiro sai
 * para sempre. Voltar ao roteiro depois seria dizer ao casal que ele
 * desandou.
 *
 * Um passo por vez em destaque: só o PRÓXIMO tem botão de tinta. Três botões
 * pretos lado a lado não é uma lista de passos, é um menu — e menu não diz por
 * onde começar.
 */

type Passo = {
  titulo: string;
  texto: string;
  href: string;
  rotulo: string;
  feito: boolean;
};

export default function PrimeiraVez({
  base,
  temFoto,
  publicado,
}: {
  /** `/conta/pedidos/<id>` */
  base: string;
  temFoto: boolean;
  publicado: boolean;
}) {
  const passos: Passo[] = [
    {
      titulo: "Escolher uma foto de capa",
      texto:
        "É a imagem que abre o site e a que aparece no link quando vocês mandam no WhatsApp. Uma só já resolve.",
      href: `${base}/fotos`,
      rotulo: "Enviar foto",
      feito: temFoto,
    },
    {
      titulo: "Publicar o site",
      texto:
        "Depois do pagamento o endereço entra no ar e os convidados conseguem confirmar presença.",
      href: base,
      rotulo: "Ver como publicar",
      feito: publicado,
    },
  ];

  // O primeiro passo em aberto é o único com botão de tinta.
  const proximo = passos.findIndex((p) => !p.feito);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="meta text-(--c-mark)">O site de vocês já existe</span>
        <h2 className="t-d2 text-(--c-ink)">
          Agora é deixar com a cara de vocês
        </h2>
        <p className="t-corpo text-(--c-ink-2) medida">
          Três passos e o site está pronto para receber os convidados. Dá para
          fazer aos poucos — tudo fica salvo.
        </p>
      </div>

      <ol className="surface-raised rounded-[3px]">
        {/* O que veio do questionário já nasce feito. Começar uma lista de
            tarefas com tudo em aberto esconde que metade do trabalho já
            aconteceu. */}
        <li className="flex items-start gap-4 px-5 py-4 border-b border-(--c-rule)">
          <Marca feita />
          <div className="flex-1 min-w-0">
            <p className="text-[15.5px] font-medium text-(--c-ink)">
              Nomes, data e local
            </p>
            <p className="t-corpo-p text-(--c-ink-2)">
              Veio do questionário. Dá para ajustar em Conteúdo.
            </p>
          </div>
        </li>

        {passos.map((passo, i) => (
          <li
            key={passo.titulo}
            className={`flex flex-wrap items-start gap-4 px-5 py-4 border-b border-(--c-rule) last:border-b-0 ${
              i === proximo ? "bg-(--c-sunken)/50" : ""
            }`}
          >
            {passo.feito ? <Marca feita /> : <Marca numero={i + 1} atual={i === proximo} />}
            <div className="flex-1 min-w-[220px]">
              <p className="text-[15.5px] font-medium text-(--c-ink)">
                {passo.titulo}
              </p>
              <p className="t-corpo-p text-(--c-ink-2)">{passo.texto}</p>
            </div>
            {!passo.feito && (
              <Link
                href={passo.href}
                className={`btn btn-sm shrink-0 ${
                  i === proximo ? "btn-ink" : "btn-quiet"
                }`}
              >
                {passo.rotulo}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Marca({
  feita,
  numero,
  atual,
}: {
  feita?: boolean;
  numero?: number;
  atual?: boolean;
}) {
  if (feita) {
    return (
      <span
        className="mt-0.5 size-[26px] shrink-0 rounded-full bg-(--c-ok) flex items-center justify-center"
        aria-label="pronto"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className={`mt-0.5 size-[26px] shrink-0 rounded-full border-[1.5px] flex items-center justify-center t-data text-[12px] ${
        atual
          ? "border-(--c-ink) text-(--c-ink)"
          : "border-(--c-rule) text-(--c-ink-2)"
      }`}
    >
      {numero}
    </span>
  );
}
