// Identificação e normalização de chave Pix.
//
// A chave do casal é DIGITADA por ele e fica visível ao convidado. Errar aqui
// manda o presente para a conta errada — ou para conta nenhuma. Por isso a
// validação é por tipo, não um "não está vazio".
//
// Os cinco tipos que o Banco Central define:
//   CPF        11 dígitos
//   CNPJ       14 dígitos
//   E-mail     até 77 caracteres
//   Telefone   +55 + DDD + número
//   Aleatória  UUID v4 (as "chaves aleatórias" do banco)

export type PixKeyType = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function digitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Dígitos verificadores do CPF. Chave errada = presente perdido. */
function cpfValido(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const [tamanho, posicao] of [
    [9, 10],
    [10, 11],
  ] as const) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (posicao - i);
    }
    const resto = (soma * 10) % 11;
    const esperado = resto === 10 ? 0 : resto;
    if (esperado !== Number(cpf[tamanho])) return false;
  }
  return true;
}

function cnpjValido(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calcula = (base: string, pesos: number[]) => {
    const soma = base
      .split("")
      .reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calcula(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(cnpj[12])) return false;
  const d2 = calcula(
    cnpj.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );
  return d2 === Number(cnpj[13]);
}

/** Celular brasileiro: DDD (11–99) + 9 + 8 dígitos. */
function celularValido(num: string): boolean {
  const ddd = Number(num.slice(0, 2));
  return num.length === 11 && ddd >= 11 && ddd <= 99 && num[2] === "9";
}

export type PixKeyResult =
  | { ok: true; type: PixKeyType; normalizada: string }
  | { ok: false; error: string };

/**
 * Descobre o tipo e devolve a chave no formato que o BR Code espera.
 *
 * A normalização importa: CPF vai só com dígitos, telefone vai com `+55`,
 * e-mail em minúsculas. Banco recusa Pix com chave fora do formato, e o
 * convidado só descobre no app dele.
 */
export function parsePixKey(bruta: string): PixKeyResult {
  const valor = bruta.trim();
  if (valor === "") return { ok: false, error: "Informem a chave Pix." };

  if (EMAIL.test(valor)) {
    if (valor.length > 77) {
      return { ok: false, error: "Esse e-mail é longo demais para chave Pix." };
    }
    return { ok: true, type: "email", normalizada: valor.toLowerCase() };
  }

  if (UUID.test(valor)) {
    return { ok: true, type: "aleatoria", normalizada: valor.toLowerCase() };
  }

  const nums = digitos(valor);

  // Com +55 explícito não há ambiguidade: é telefone.
  if (nums.length === 13 && nums.startsWith("55")) {
    const semPais = nums.slice(2);
    if (celularValido(semPais)) {
      return { ok: true, type: "telefone", normalizada: `+55${semPais}` };
    }
    return {
      ok: false,
      error: "Esse celular não parece válido. Confiram o DDD e o 9.",
    };
  }

  // 11 dígitos são AMBÍGUOS: CPF e celular têm o mesmo tamanho, e um CPF que
  // começa com "X X 9" passaria pelo teste de celular. O CPF vem primeiro
  // porque tem dígito verificador — evidência muito mais forte que o "9" na
  // terceira posição. Só o que não é CPF é considerado celular.
  if (nums.length === 11) {
    if (cpfValido(nums)) return { ok: true, type: "cpf", normalizada: nums };
    if (celularValido(nums)) {
      return { ok: true, type: "telefone", normalizada: `+55${nums}` };
    }
    return {
      ok: false,
      error:
        "Esses 11 dígitos não formam um CPF válido nem um celular com DDD. Confiram os números.",
    };
  }

  if (nums.length === 14) {
    if (cnpjValido(nums)) return { ok: true, type: "cnpj", normalizada: nums };
    return { ok: false, error: "Esse CNPJ não é válido. Confiram os números." };
  }

  return {
    ok: false,
    error:
      "Não reconhecemos essa chave. Use CPF, CNPJ, e-mail, celular com DDD ou a chave aleatória do banco.",
  };
}

export const ROTULO_TIPO: Record<PixKeyType, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "e-mail",
  telefone: "celular",
  aleatoria: "chave aleatória",
};
