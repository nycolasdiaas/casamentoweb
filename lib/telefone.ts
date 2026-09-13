/**
 * A máscara do WhatsApp, enquanto o casal digita.
 *
 * O campo pedia "(11) 98888-7777" no exemplo e aceitava `11999998888` sem
 * formatar. Sozinho isso é cosmético; o que não era cosmético é que o número
 * não aparecia em lugar nenhum depois do cadastro — um dígito errado ficava
 * invisível para sempre (UX-017). O número passou a aparecer nos dados da
 * conta, e a máscara existe para o erro ser visto na hora de digitar, não
 * depois.
 *
 * Formata só o que está digitado: quem parou no DDD vê "(11", não
 * "(11) ____-____". Campo de convite não tem por que parecer formulário de
 * banco.
 */
export function mascaraDeWhatsapp(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;

  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);

  // Celular tem nove dígitos e o hífen cai depois do quinto; fixo tem oito, e
  // ele cai depois do quarto. Enquanto a pessoa digita, o corte acompanha.
  const corte = resto.length > 8 ? 5 : 4;
  if (resto.length <= corte) return `(${ddd}) ${resto}`;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
