/**
 * Limites do mural, num módulo sem nada de servidor.
 *
 * Eles moravam em `lib/repositories/guestbook.ts` e isso quebrou o build: o
 * formulário do convidado é Client Component, importar a constante de lá
 * arrastava o repositório inteiro para o bundle do navegador — e com ele a
 * função marcada `"use cache"`, que o Turbopack proíbe em componente de
 * cliente.
 *
 * O arquivo existir separado é a correção estrutural, não um remendo: valor
 * compartilhado entre os dois lados não pode viver no módulo que fala com o
 * banco.
 *
 * Quem decide continua sendo o servidor — o `maxLength` do textarea é
 * conveniência, e a action valida de novo. O cliente é do convidado.
 */
export const LIMITE_NOME = 60;
export const LIMITE_RECADO = 500;
