/**
 * A biblioteca da prancha A4 (`Enlace - Fundacao.dc.html`).
 *
 * Uma porta só. A regra do pacote de design é literal — "um botão, um jeito;
 * se aparece diferente em três telas, está errado" —, e a maneira de fazer
 * essa regra valer é não haver um segundo lugar de onde importar botão.
 *
 * O que NÃO mora aqui, e por quê:
 *
 * - Superfície, tipografia e cor são CLASSE (`surface-raised`, `t-d2`,
 *   `meta`), não componente. Envolver `<p>` num `<Texto>` só para escolher
 *   um tamanho troca CSS por JavaScript sem devolver nada.
 * - Nada daqui pode ser usado em `lib/templates/*`: lá a cor vem do ThemeSpec
 *   do casal e `npm run verify:template` reprova qualquer token da
 *   plataforma. Estes componentes são da PLATAFORMA — vitrine, conta,
 *   painel, admin.
 */
export { Botao, BotaoLink } from "./Botao";
export { Campo, AreaDeTexto } from "./Campo";
export { Etiqueta, EtiquetaDoPedido, type TomDaEtiqueta } from "./Etiqueta";
export { default as Aviso } from "./Aviso";
export { default as EstadoVazio } from "./EstadoVazio";
export { default as Numero } from "./Numero";
export { default as Abas, type Aba } from "./Abas";
export { default as Trilha } from "./Trilha";
export { default as Icone, type NomeDoIcone } from "./Icone";
export { default as CopiarLink } from "./CopiarLink";
export { BrindeProvider, useBrinde } from "./Brinde";
export { default as DialogoDestrutivo } from "./DialogoDestrutivo";
