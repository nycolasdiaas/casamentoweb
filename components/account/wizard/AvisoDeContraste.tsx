"use client";

/**
 * Avisa quando a cor do texto e a cor do fundo escolhidas pelo casal não têm
 * contraste suficiente para o site ser legível.
 *
 * ── Por que existe ─────────────────────────────────────────────────────────
 *
 * Numa auditoria de uso real foi possível escolher a MESMA cor para a tinta e
 * para o papel, avançar o questionário inteiro e gerar um site com texto
 * invisível. Nada avisava. Como uma das promessas do produto é que o casal não
 * trabalha, deixá-lo descobrir isso sozinho — no site pronto, talvez depois de
 * mandar o link no grupo da família — é o oposto do combinado.
 *
 * ── Por que avisa em vez de bloquear ───────────────────────────────────────
 *
 * Porque contraste baixo é escolha estética legítima às vezes (dourado sobre
 * creme é a cara de convite de casamento), e porque o preset do molde continua
 * valendo quando o campo fica vazio. Bloquear transformaria um palpite nosso
 * em regra. O aviso diz o que vai acontecer e deixa a decisão com quem casa.
 *
 * ── A conta ────────────────────────────────────────────────────────────────
 *
 * Razão de contraste da WCAG 2.1 (luminância relativa). O corte em 4.5:1 é o
 * AA para texto normal. Abaixo de 3:1 o texto some de verdade — daí o aviso
 * mudar de tom.
 */

function canalLinear(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminancia(hex: string): number | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = canalLinear((n >> 16) & 255);
  const g = canalLinear((n >> 8) & 255);
  const b = canalLinear(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** `null` quando alguma das duas cores não é um hex de 6 dígitos. */
export function razaoDeContraste(a: string, b: string): number | null {
  const la = luminancia(a);
  const lb = luminancia(b);
  if (la === null || lb === null) return null;
  const claro = Math.max(la, lb);
  const escuro = Math.min(la, lb);
  return (claro + 0.05) / (escuro + 0.05);
}

export default function AvisoDeContraste({
  tinta,
  papel,
}: {
  tinta: string;
  papel: string;
}) {
  // Campo vazio = "sem preferência", e aí vale o preset do molde, que já foi
  // desenhado com contraste. Não há o que avisar.
  if (!tinta || !papel) return null;

  const razao = razaoDeContraste(tinta, papel);
  if (razao === null || razao >= 4.5) return null;

  const ilegivel = razao < 3;

  return (
    <p
      role="status"
      className="rounded-[3px] border border-(--c-rule) bg-(--c-sunken) px-4 py-3 text-xs leading-relaxed text-(--c-ink-2)"
    >
      <span aria-hidden="true">⚠ </span>
      {ilegivel ? (
        <>
          Essas duas cores são parecidas demais: o texto do site vai ficar
          praticamente invisível sobre esse fundo. Vale escurecer a tinta ou
          clarear o papel.
        </>
      ) : (
        <>
          O texto vai ficar difícil de ler sobre esse fundo, principalmente no
          celular e para quem enxerga pouco. Se for de propósito, podem
          continuar.
        </>
      )}
    </p>
  );
}
