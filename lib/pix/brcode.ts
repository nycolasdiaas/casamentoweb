// BR Code — o "Pix copia e cola", no padrão EMV® QRCPS do Banco Central.
//
// Por que gerar em vez de guardar a string pronta: o campo 54 carrega o VALOR.
// Uma string estática (como a que estava chumbada em lib/pix.ts) não tem valor
// nenhum, então o convidado abria o app do banco e tinha que digitar o preço
// da cota à mão — e digitava errado, ou desistia. Gerando por cota, o app já
// abre com "R$ 180,00" preenchido.
//
// O formato é TLV: cada campo é ID (2 dígitos) + tamanho (2 dígitos) + valor.
// Campos aninhados são TLV dentro do valor. A ordem é crescente por ID e não
// é opcional — app de banco recusa fora de ordem.

/** Comprimentos máximos que o padrão impõe. Estourar = QR recusado no app. */
const MAX = {
  /** campo 59 — nome do recebedor */
  recipient: 25,
  /** campo 60 — cidade do recebedor */
  city: 15,
  /** campo 62/05 — identificador da transação */
  txid: 25,
} as const;

/** Um campo TLV: ID + tamanho em 2 dígitos + valor. */
function tlv(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

/**
 * Reduz a ASCII maiúsculo.
 *
 * O padrão do BC é ASCII; acento em nome de recebedor é a causa clássica de
 * "QR inválido" que só aparece no app de um banco e não no de outro. Melhor
 * "JOAO" garantido que "JOÃO" que falha em metade dos bancos.
 */
export function normalizarTexto(bruto: string, limite: number): string {
  const limpo = bruto
    // NFD separa "Ã" em "A" + til combinante; o filtro ASCII abaixo então
    // descarta o til e preserva o "A". Sem o NFD, "Ã" inteiro seria jogado
    // fora e "JOÃO" viraria "JOO".
    .normalize("NFD")
    .replace(/[^A-Za-z0-9 ]/g, "") // acentos soltos e pontuação fora
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  if (limpo.length <= limite) return limpo;

  // Corta na última palavra inteira que cabe. O app do banco mostra este nome
  // na confirmação do pagamento, e "FRANCISCO NYCOLAS SALES D" parece defeito
  // — "FRANCISCO NYCOLAS SALES" parece um nome. Se nem a primeira palavra
  // couber, corta no seco: um campo dentro do limite vale mais que a estética.
  const cortado = limpo.slice(0, limite);
  const ultimoEspaco = cortado.lastIndexOf(" ");
  return ultimoEspaco > 0 ? cortado.slice(0, ultimoEspaco) : cortado;
}

/**
 * CRC16/CCITT-FALSE — polinômio 0x1021, inicial 0xFFFF, sem inversão.
 *
 * É o que o padrão exige, e é calculado sobre o payload INTEIRO já com
 * "6304" no fim (o ID e o tamanho do próprio CRC entram na conta). Errar isso
 * gera um código que parece certo e o app recusa sem dizer por quê.
 */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export type BrCodeInput = {
  /** chave já normalizada por parsePixKey */
  chave: string;
  recebedor: string;
  cidade: string;
  /** valor em centavos; omitir deixa o convidado escolher quanto dar */
  valorCentavos?: number | null;
  /** identificador curto da cota; vira "***" quando não há */
  txid?: string | null;
};

/**
 * Monta o BR Code estático com valor.
 *
 * Devolve string pronta para o "copia e cola" e para virar QR — os dois são o
 * MESMO payload, e é por isso que o QR não pode ser uma imagem que o casal
 * sobe: uma imagem não acompanha o valor da cota.
 */
export function buildBrCode({
  chave,
  recebedor,
  cidade,
  valorCentavos,
  txid,
}: BrCodeInput): string {
  const nome = normalizarTexto(recebedor, MAX.recipient) || "RECEBEDOR";
  const municipio = normalizarTexto(cidade, MAX.city) || "BRASIL";

  // Conta do recebedor: o GUI do arranjo Pix + a chave.
  const conta = tlv("00", "br.gov.bcb.pix") + tlv("01", chave);

  const campos = [
    tlv("00", "01"), // versão do payload
    tlv("26", conta), // conta do recebedor
    tlv("52", "0000"), // MCC: 0000 = não informado (pessoa física)
    tlv("53", "986"), // moeda ISO 4217: 986 = BRL
  ];

  // Valor é OPCIONAL no padrão, e a ausência significa "o pagador escolhe" —
  // exatamente o que a lista de presentes quer para a cota de preço livre.
  if (typeof valorCentavos === "number" && valorCentavos > 0) {
    campos.push(tlv("54", (valorCentavos / 100).toFixed(2)));
  }

  campos.push(
    tlv("58", "BR"),
    tlv("59", nome),
    tlv("60", municipio),
    // Campo adicional: o txid identifica a cota no extrato do casal. "***"
    // é o valor que o padrão reserva para "sem identificador".
    tlv("62", tlv("05", normalizarTxid(txid)))
  );

  const semCrc = `${campos.join("")}6304`;
  return semCrc + crc16(semCrc);
}

/**
 * O txid aceita só letras e números, até 25. Um id vazio vira "***", que é o
 * que o padrão manda usar — string vazia faria o app recusar.
 */
function normalizarTxid(bruto: string | null | undefined): string {
  if (!bruto) return "***";
  const limpo = bruto.replace(/[^A-Za-z0-9]/g, "").slice(0, MAX.txid);
  return limpo === "" ? "***" : limpo;
}
