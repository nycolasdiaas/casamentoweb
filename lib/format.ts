export function formatPriceCents(priceCents: number | null): string {
  if (priceCents === null) {
    return "você decide";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(priceCents / 100);
}

/** Converte "150", "150,50" ou "R$ 1.500" em centavos; null se vazio/inválido. */
export function parsePriceToCents(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,\.]/g, "");
  if (!cleaned) return null;
  // formato pt-BR: ponto como milhar, vírgula como decimal
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}
