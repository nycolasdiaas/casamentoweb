"use client";

import { useState, useTransition } from "react";
import { EstadoVazio, Icone } from "@/components/ui/prensa";
import { esconderRecadoAction } from "@/app/actions/guestbook-actions";
import type { Recado } from "@/lib/repositories/guestbook";

/**
 * Moderação do mural, do lado do casal.
 *
 * A palavra "moderação" não aparece na tela — para o casal isto é "esconder um
 * recado", e ele só vai fazer isso na hipótese rara de alguém escrever
 * bobagem. A tela é uma LISTA de carinho recebido que por acaso tem um botão
 * discreto, não um painel de aprovação com fila.
 *
 * O botão diz "Esconder" e não "Apagar" porque é literalmente o que acontece:
 * o recado sai do site e continua aqui, com "Escondido" ao lado e um
 * "Mostrar" para desfazer. Apagar recado de convidado é decisão que não
 * volta, e um toque errado no celular custaria a mensagem da avó.
 */
export default function Recados({
  orderId,
  recados,
}: {
  orderId: string;
  recados: Recado[];
}) {
  // Cópia local só para o botão responder na hora. O servidor continua sendo
  // a verdade — em caso de erro, o estado volta e a mensagem aparece.
  const [estado, setEstado] = useState(recados);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function alternar(id: string, esconder: boolean) {
    setErro(null);
    setEstado((atual) =>
      atual.map((r) => (r.id === id ? { ...r, hidden: esconder } : r))
    );
    iniciar(async () => {
      const resultado = await esconderRecadoAction(orderId, id, esconder);
      if ("error" in resultado) {
        setEstado((atual) =>
          atual.map((r) => (r.id === id ? { ...r, hidden: !esconder } : r))
        );
        setErro(resultado.error);
      }
    });
  }

  if (estado.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhum recado ainda"
        restricao="O mural aparece no site depois que ele está no ar"
      >
        Os recados dos convidados aparecem aqui assim que alguém escrever no
        mural do site de vocês.
      </EstadoVazio>
    );
  }

  const visiveis = estado.filter((r) => !r.hidden).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="meta text-(--c-ink-2)">
          {visiveis} no site
          {estado.length > visiveis && ` · ${estado.length - visiveis} escondidos`}
        </span>
        {erro && <span className="erro-do-campo">{erro}</span>}
      </div>

      <ul className="surface-flat rounded-[3px]">
        {estado.map((recado) => (
          <li
            key={recado.id}
            className={`flex gap-4 px-5 py-4 border-b border-(--c-rule) last:border-b-0 ${
              recado.hidden ? "opacity-55" : ""
            }`}
          >
            <div className="min-w-0 flex-1 flex flex-col gap-1.5">
              <p className="t-corpo text-(--c-ink)">{recado.message}</p>
              <p className="t-data text-[12px] text-(--c-ink-2)">
                {recado.guestName} ·{" "}
                {recado.createdAt.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
                {recado.hidden && " · escondido"}
              </p>
            </div>
            <button
              type="button"
              disabled={pendente}
              onClick={() => alternar(recado.id, !recado.hidden)}
              className="btn btn-quiet btn-sm self-start shrink-0"
            >
              {recado.hidden ? (
                "Mostrar"
              ) : (
                <>
                  <Icone nome="cadeado" tamanho={16} />
                  Esconder
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
