import type { MetricasDoSite } from "@/lib/repositories/siteMetrics";

/**
 * Os números do site, em régua.
 *
 * Vem do painel do iCasei, que o Anderson elogiou — mas não são os quatro
 * cartões azuis dele. Aqui é uma régua contínua em mono, com números
 * tabulares: a linguagem de ficha de gráfica que o resto do produto usa. O
 * cartão colorido chamaria mais atenção que a prévia, e a prévia é o que o
 * casal veio ver.
 *
 * São TRÊS métricas, não quatro. As outras duas do protótipo não sobreviveram
 * ao banco, e o motivo está em `siteMetrics.ts`: recados não têm tabela, e
 * presente não tem valor porque o Pix nunca passa por nós.
 *
 * Cada número traz uma nota embaixo, porque número sozinho não informa: "23"
 * não diz nada; "23 de 31 convidados" diz.
 */
export default function ReguaDeNumeros({
  metricas,
}: {
  metricas: MetricasDoSite;
}) {
  const { convidados, confirmados, presentesEscolhidos, presentesNaLista, visitas30d } =
    metricas;

  const itens = [
    {
      rotulo: "Confirmados",
      valor: String(confirmados),
      nota:
        convidados > 0
          ? `de ${convidados} convidado${convidados > 1 ? "s" : ""}`
          : "ninguém convidado ainda",
    },
    {
      rotulo: "Presentes",
      valor: String(presentesEscolhidos),
      nota:
        presentesNaLista > 0
          ? `escolhidos de ${presentesNaLista} na lista`
          : "lista ainda vazia",
    },
    {
      rotulo: "Visitas",
      valor: String(visitas30d),
      nota: "nos últimos 30 dias",
    },
  ];

  return (
    <div className="surface-raised grid grid-cols-1 rounded-[3px] sm:grid-cols-3">
      {itens.map((item, i) => (
        <div
          key={item.rotulo}
          className={`flex flex-col gap-1.5 px-6 py-5 ${
            i < itens.length - 1
              ? "border-b border-(--c-rule) sm:border-b-0 sm:border-r"
              : ""
          }`}
        >
          <span className="meta text-(--c-ink-2)">{item.rotulo}</span>
          <span className="t-data text-[28px] leading-none text-(--c-ink)">
            {item.valor}
          </span>
          <span className="text-[13px] text-(--c-ink-2)">{item.nota}</span>
        </div>
      ))}
    </div>
  );
}
