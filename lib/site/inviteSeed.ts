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
    endereco: string;
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

  blocos.push({
    tipo: "texto",
    id: novoId(),
      rotacao: 0,
    x: 0.1,
    y: 0.86,
    w: 0.8,
    texto: dados.endereco,
    tamanho: 0.022,
    cor: cores.accent,
    fonte: "sans",
    peso: "normal",
    alinhamento: "center",
    espacamento: 0.15,
    link: `https://${dados.endereco}`,
  });

  return {
    versao: 1,
    fundo: cores.paper,
    largura: CONVITE_LARGURA,
    altura: CONVITE_ALTURA,
    blocos,
  };
}
