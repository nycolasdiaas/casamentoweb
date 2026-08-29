/**
 * A data do casamento por extenso — o único lugar que sabe formatá-la.
 *
 * Existe porque a mesma expressão estava copiada em quatro telas, e as cópias
 * divergiam justamente no que importa:
 *
 * - `new Intl.DateTimeFormat(...).format(dataInvalida)` **lança `RangeError`**.
 *   Num server component isso derruba a tela inteira: o casal abria o painel
 *   e via página de erro no lugar do próprio pedido. Foi o que aconteceu.
 * - `dataInvalida.toLocaleDateString(...)` não lança — devolve a string
 *   `"Invalid Date"`, que é pior de outro jeito: vai para a tela e o casal lê.
 *
 * A regra do produto é que seção sem dado não aparece. Ela não pode virar
 * seção que explode nem seção que mente. `null` deixa quem chama decidir o
 * que mostrar no lugar ("a definir", "—", ou nada).
 *
 * O `T12:00:00` é o mesmo de sempre: sem ele, o fuso empurra o dia para trás
 * e 19 de setembro vira 18.
 */
export function dataPorExtenso(
  /** "yyyy-mm-dd", como sai de `<input type="date">` e do banco. */
  weddingDate: string | null | undefined,
  formato: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  }
): string | null {
  if (!weddingDate) return null;
  const quando = new Date(`${weddingDate}T12:00:00`);
  if (Number.isNaN(quando.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", formato).format(quando);
}

/**
 * Quantos dias faltam para a data — `null` se não há data, se ela não dá para
 * ler, ou se já passou.
 *
 * Só pode ser chamado de fora de um componente (server action, loader, uma
 * função como esta), e só em rota dinâmica. Numa rota cacheada o número
 * congelaria: o casal veria "faltam 102 dias" por dias a fio, que é o defeito
 * que fez a contagem do menu ser calculada no cliente antes de existir este
 * arquivo.
 */
/* Horizonte de sanidade: dez anos.
   Não é preciosismo — um pedido de teste no banco tem data no ano 4444 e a
   lista mostrava "883017 dias" ao lado do nome do casal. Uma data absurda é
   dado errado, não casamento distante, e um número de seis dígitos numa
   coluna de contagem só faz o casal desconfiar do resto da tela. Acima disso,
   silêncio — o mesmo que já acontece quando não há data. */
const HORIZONTE_EM_DIAS = 3650;

export function diasAte(
  weddingDate: string | null | undefined,
  agora: Date = new Date()
): number | null {
  if (!weddingDate) return null;
  const alvo = new Date(`${weddingDate}T12:00:00`);
  if (Number.isNaN(alvo.getTime())) return null;
  const dias = Math.ceil((alvo.getTime() - agora.getTime()) / 86_400_000);
  if (dias < 0 || dias > HORIZONTE_EM_DIAS) return null;
  return dias;
}
