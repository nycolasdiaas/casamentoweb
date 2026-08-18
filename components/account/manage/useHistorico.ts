"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Desfazer / refazer para a edição de conteúdo.
 *
 * ── O que conta como UM passo ───────────────────────────────────────────────
 *
 * Um campo editado. Não uma tecla.
 *
 * É a decisão que faz ou quebra este recurso. Empilhar a cada tecla dá um
 * histórico que ninguém consegue percorrer — vinte desfazeres para voltar uma
 * palavra — e ainda briga com o desfazer NATIVO do `<input>`, que já funciona
 * letra a letra enquanto o campo está aberto. Aqui os dois convivem: dentro do
 * campo, o ⌘Z do navegador; fora dele, este.
 *
 * Por isso quem empilha é o `registrar()`, chamado quando a edição de um campo
 * é CONCLUÍDA (a linha fecha, ou outra abre), e não o `onChange`.
 *
 * ── Por que estado, e não histórico do banco ────────────────────────────────
 *
 * O histórico vive no navegador e morre ao recarregar, de propósito. Desfazer
 * é sobre a sessão de edição — "não era isso que eu queria digitar" —, não
 * sobre auditoria. Um histórico persistido precisaria de tabela, de limpeza e
 * de resposta para "desfazer o quê, se meu par salvou depois de mim". Nada
 * disso é o problema que o casal tem ao mexer no site.
 */
export function useHistorico<T>(inicial: T) {
  const [presente, setPresente] = useState<T>(inicial);
  // Espelho do presente para leitura SÍNCRONA. O estado do React só muda no
  // próximo render; desfazer e refazer precisam do valor de agora.
  const presenteRef = useRef<T>(inicial);
  // O passado e o futuro em refs: mexer neles não precisa repintar a tela, e
  // só a contagem (que habilita os botões) vira estado.
  const passado = useRef<T[]>([]);
  const futuro = useRef<T[]>([]);
  const [tamanhos, setTamanhos] = useState({ atras: 0, frente: 0 });

  const sincronizar = useCallback(() => {
    setTamanhos({ atras: passado.current.length, frente: futuro.current.length });
  }, []);

  /** Escreve estado e espelho de uma vez. Ninguém deve chamar `setPresente`. */
  const aplicar = useCallback((valor: T) => {
    presenteRef.current = valor;
    setPresente(valor);
  }, []);

  /** Muda o valor SEM criar passo — para o que o usuário digita. */
  const escrever = useCallback(
    (proximo: T | ((atual: T) => T)) => {
      const valor =
        typeof proximo === "function"
          ? (proximo as (a: T) => T)(presenteRef.current)
          : proximo;
      aplicar(valor);
    },
    [aplicar]
  );

  /**
   * Fecha um passo: o valor de ANTES vai para o passado.
   *
   * Recebe o anterior em vez de ler o presente porque quem chama é o fecho da
   * edição, e nesse instante o presente já é o valor novo.
   */
  const registrar = useCallback(
    (anterior: T) => {
      // Nada mudou? Não cria passo. Abrir e fechar uma linha sem digitar não é
      // uma edição, e um passo vazio faz o desfazer "não funcionar" aos olhos
      // de quem clica.
      if (JSON.stringify(anterior) === JSON.stringify(presenteRef.current)) return;
      passado.current.push(anterior);
      // Editar depois de desfazer descarta o futuro — é o comportamento que
      // todo editor tem, e o contrário deixaria um refazer que reescreve algo
      // que a pessoa acabou de trocar.
      futuro.current = [];
      sincronizar();
    },
    [sincronizar]
  );

  // As duas pilhas mexem no `presente`, e por isso NÃO podem empilhar dentro do
  // updater do `setPresente`: o React só o executa na hora de repintar, então o
  // `sincronizar()` logo abaixo leria a pilha ANTES do push e deixaria o botão
  // de refazer desabilitado depois de desfazer. Medido no navegador: desfazer
  // funcionava, refazer nascia morto.
  //
  // Por isso o valor atual vem de `presenteRef`, que é escrito no mesmo gesto
  // em que o estado muda — o empilhamento acontece aqui, síncrono, e o
  // `setPresente` recebe um valor pronto em vez de uma função.
  const desfazer = useCallback(() => {
    const anterior = passado.current.pop();
    if (anterior === undefined) return;
    futuro.current.push(presenteRef.current);
    aplicar(anterior);
    sincronizar();
  }, [aplicar, sincronizar]);

  const refazer = useCallback(() => {
    const proximo = futuro.current.pop();
    if (proximo === undefined) return;
    passado.current.push(presenteRef.current);
    aplicar(proximo);
    sincronizar();
  }, [aplicar, sincronizar]);

  /** Depois de salvar, o histórico recomeça: o salvo vira o novo zero. */
  const zerar = useCallback(
    (valor: T) => {
      passado.current = [];
      futuro.current = [];
      aplicar(valor);
      setTamanhos({ atras: 0, frente: 0 });
    },
    [aplicar]
  );

  return {
    presente,
    escrever,
    registrar,
    desfazer,
    refazer,
    zerar,
    podeDesfazer: tamanhos.atras > 0,
    podeRefazer: tamanhos.frente > 0,
  };
}
