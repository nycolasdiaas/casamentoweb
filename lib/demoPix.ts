// Código Pix fictício usado nas demos de template. NÃO é uma chave real —
// existe só para o modal de presente parecer funcional nas prévias de venda.
export function buildDemoPixCode(valueReais: number): string {
  const value = valueReais.toFixed(2);
  return (
    "00020126430014br.gov.bcb.pix0121casal@anaepedro.com.br5204000053039865" +
    "40" +
    String(value.length).padStart(2, "0") +
    value +
    "5802BR5911ANA E PEDRO6009FORTALEZA62120508ANAPEDRO6304B14F"
  );
}
