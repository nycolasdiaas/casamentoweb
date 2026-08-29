/**
 * "há 12 min", "há 2 h", "ontem", "12 set".
 *
 * Estava dentro de `Avisos.tsx`, privado. Saiu de lá quando o editor de
 * convite passou a mostrar "salvo há N min": duas faixas de tempo escritas
 * separadamente divergem na primeira vez que alguém acha que "há 1 h" deveria
 * ser "há 60 min" num dos dois lugares — e o casal veria o mesmo instante
 * descrito de dois jeitos na mesma tela.
 *
 * `agora` entra como parâmetro, e não é lido aqui: `Date.now()` dentro de uma
 * função chamada no render torna o render impuro, e num render de servidor com
 * Cache Components o valor congelaria — o casal veria "há 12 min" por horas.
 * Quem chama decide de onde vem o relógio.
 */
export function quando(em: Date, agora: number): string {
  const min = Math.round((agora - em.getTime()) / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return em.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
