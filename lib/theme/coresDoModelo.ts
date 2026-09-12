/**
 * As três cores do questionário a partir da paleta de um modelo.
 *
 * ── Por que isto é uma função, e não três linhas no componente ─────────────
 *
 * Era três linhas no componente, e estavam trocadas: a cor 1 recebia a tinta e
 * a cor 2 recebia o acento. O casal escolhia Toscana, não tocava em mais nada,
 * e o site nascia com o dourado do acento como cor do TEXTO sobre papel creme.
 * A própria etapa das cores acusava — "o texto vai ficar difícil de ler sobre
 * esse fundo" — e estava certa. Os seis modelos faziam isso (UX-006).
 *
 * Uma troca de duas variáveis não aparece em revisão de código e não quebra
 * teste nenhum: o formulário continua funcionando, só entrega a cor errada no
 * lugar errado. Fora do componente, ela vira uma invariante que dá para
 * trancar — e `coresDoModelo.test.ts` tranca a que importa: **escolher um
 * modelo e não mexer em nada devolve exatamente a paleta daquele modelo.**
 *
 * A ordem de `swatches` é `[papel, tinta, acento]`, a mesma de
 * `TEMPLATE_STYLES` e de `THEME_PRESETS`.
 */
export function coresDoModelo(swatches: readonly string[]): {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
} {
  const [papel, tinta, acento] = swatches;
  return {
    // cor 1 = acento: é o que `resolveTheme` faz com `primaryColor`, e é o que
    // o rótulo da etapa promete ("o acento — detalhes, botões, ornamentos").
    primaryColor: acento ?? "",
    // cor 2 = tinta.
    secondaryColor: tinta ?? "",
    // cor 3 = papel.
    tertiaryColor: papel ?? "",
  };
}
