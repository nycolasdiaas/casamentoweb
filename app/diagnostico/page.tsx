import Link from "next/link";
import DiagnosticoMovimento from "@/components/ui/DiagnosticoMovimento";
import DiagnosticoTelas from "@/components/ui/DiagnosticoTelas";

/**
 * Página de diagnóstico do movimento.
 *
 * Existe porque "no meu headless a animação roda" e "na minha tela não
 * acontece nada" ficaram se contradizendo por várias rodadas. Em vez de
 * continuar adivinhando de longe, esta página responde na máquina de quem
 * está olhando: o navegador dele pede movimento reduzido? o CSS chegou? a
 * animação de fato dispara?
 *
 * Não é rota de produto — pode ser apagada quando o assunto fechar.
 */
export default function DiagnosticoPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Diagnóstico de movimento
        </h1>
        <p className="text-sm leading-relaxed text-(--color-olive)/70">
          Tudo abaixo é medido no SEU navegador, agora. Se algum item vier
          vermelho, é ele que explica a ausência de animação.
        </p>
      </div>

      <DiagnosticoMovimento />

      <DiagnosticoTelas />

      <div className="flex flex-col gap-2 border-t border-(--color-gold)/30 pt-5">
        <p className="text-sm font-medium">Testar a transição de tela real</p>
        <p className="text-xs text-(--color-olive)/60">
          Clique e volte. É a mesma transição do painel — 520 ms, com
          deslocamento, escala e desfoque.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href="/conta/entrar" className="btn btn-secondary btn-sm">
            Ir para Entrar
          </Link>
          <Link href="/conta/criar" className="btn btn-secondary btn-sm">
            Ir para Criar conta
          </Link>
          <Link href="/diagnostico" className="btn btn-secondary btn-sm">
            Voltar aqui
          </Link>
        </div>
      </div>
    </main>
  );
}
