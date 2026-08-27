import {
  CONVITE_ALTURA,
  CONVITE_LARGURA,
  novoId,
  type InviteDoc,
} from "@/lib/site/inviteDoc";

export type ThemeCoresLocal = { paper: string; ink: string; accent: string };

/**
 * O convite que o casal encontra ao criar — já preenchido com os dados do site.
 *
 * Um editor que abre em branco é um editor que a pessoa fecha. Aqui ela abre e
 * já vê o próprio convite pronto, com os nomes e a data no lugar; o trabalho
 * dela vira ajustar, não construir.
 *
 * A partir deste momento o texto é do CONVITE. Mudar a data no site não mexe
 * mais aqui — ver a nota em `siteInvites`.
 */
export function conviteInicial(
  dados: {
    nomes: string;
    data: string | null;
    hora: string | null;
    local: string | null;
    /** Como o endereço APARECE no convite, sem `https://`. */
    endereco: string;
    /** O endereço de verdade, com esquema. Hoje só o texto o usa. */
    url: string;
    /** O pacote inclui confirmação de presença? Decide o botão semeado. */
    temRsvp: boolean;
  },
  cores: ThemeCoresLocal
): InviteDoc {
  const blocos: InviteDoc["blocos"] = [
    {
      tipo: "texto",
      id: novoId(),
      rotacao: 0,
      x: 0.1,
      y: 0.16,
      w: 0.8,
      texto: "SAVE THE DATE",
      tamanho: 0.024,
      cor: cores.accent,
      fonte: "sans",
      peso: "normal",
      alinhamento: "center",
      espacamento: 0.5,
      link: "",
    },
    {
      tipo: "texto",
      id: novoId(),
      rotacao: 0,
      x: 0.08,
      y: 0.3,
      w: 0.84,
      texto: dados.nomes,
      tamanho: 0.085,
      cor: cores.ink,
      fonte: "serif",
      peso: "normal",
      alinhamento: "center",
      espacamento: 0,
      link: "",
    },
    {
      tipo: "linha",
      id: novoId(),
      rotacao: 0,
      x: 0.44,
      y: 0.47,
      w: 0.12,
      cor: cores.accent,
      espessura: 2,
    },
  ];

  if (dados.data) {
    blocos.push({
      tipo: "texto",
      id: novoId(),
      rotacao: 0,
      x: 0.1,
      y: 0.54,
      w: 0.8,
      texto: dados.hora ? `${dados.data} · ${dados.hora}` : dados.data,
      tamanho: 0.036,
      cor: cores.ink,
      fonte: "serif",
      peso: "normal",
      alinhamento: "center",
      espacamento: 0.05,
      link: "",
    });
  }

  if (dados.local) {
    blocos.push({
      tipo: "texto",
      id: novoId(),
      rotacao: 0,
      x: 0.1,
      y: 0.62,
      w: 0.8,
      texto: dados.local,
      tamanho: 0.028,
      cor: cores.ink,
      fonte: "serif",
      peso: "normal",
      alinhamento: "center",
      espacamento: 0,
      link: "",
    });
  }

  /* O convite termina num BOTÃO, não num texto com link.
     
     Antes era um bloco de texto apontando para a capa do site: o convidado
     clicava em "confirmar presença" e caía na primeira tela, de onde ainda
     precisava rolar até achar a confirmação. O SDD §15.1 é a razão de o
     convite ter virado página — *"numa imagem, o botão 'Lista de presentes' é
     desenho; aqui ele leva à lista"*.

     O `destino` é uma chave, não um endereço: gravar a URL congelaria o slug
     do site dentro do convite. Quem resolve é o render. */
  blocos.push({
    tipo: "botao",
    id: novoId(),
    rotacao: 0,
    x: 0.22,
    y: 0.82,
    w: 0.56,
    /* Num pacote sem confirmação de presença o botão leva à capa e diz isso.
       Semear "Confirmar presença" onde não há confirmação seria vender pelo
       desenho o que o pacote não entrega. */
    destino: dados.temRsvp ? "rsvp" : "site",
    rotulo: dados.temRsvp ? "Confirmar presença" : "Ver o site",
    fundo: cores.ink,
    cor: cores.paper,
    raio: 2,
    fonte: "sans",
    tamanho: 0.028,
  });

  /* O endereço abaixo do botão, como texto SEM link — igual ao artboard F3.
     Ele serve a quem vai digitar, não a quem vai clicar; quem clica tem o
     botão logo acima, e dois destinos colados confundem mais do que ajudam. */
  blocos.push({
    tipo: "texto",
    id: novoId(),
    rotacao: 0,
    x: 0.1,
    y: 0.9,
    w: 0.8,
    texto: dados.endereco,
    tamanho: 0.02,
    cor: cores.accent,
    fonte: "sans",
    peso: "normal",
    alinhamento: "center",
    espacamento: 0.15,
    link: "",
  });

  return {
    versao: 1,
    fundo: cores.paper,
    largura: CONVITE_LARGURA,
    altura: CONVITE_ALTURA,
    blocos,
  };
}
