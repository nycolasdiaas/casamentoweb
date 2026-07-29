import type { SectionKey } from "@/lib/templates/contract";

// Como cada seção se chama para o casal. As chaves de `SECTION_KEYS` são
// técnicas ("details", "cover"); o casal precisa ler o que a seção faz no
// site dele.
export const SECTION_LABELS: Record<
  SectionKey,
  { label: string; descricao: string }
> = {
  cover: {
    label: "Capa",
    descricao: "Nomes, data e a foto principal — a primeira tela do convite.",
  },
  countdown: {
    label: "Contagem regressiva",
    descricao: "Quantos dias faltam para o grande dia.",
  },
  story: {
    label: "Nossa história",
    descricao: "O texto de vocês, entre as fotos.",
  },
  details: {
    label: "Cerimônia e festa",
    descricao: "Data, horário, locais, endereços e mapa.",
  },
  gallery: {
    label: "Galeria de fotos",
    descricao: "As fotos que vocês subiram.",
  },
  rsvp: {
    label: "Confirmação de presença",
    descricao: "O convidado confirma por ali, e vocês acompanham aqui.",
  },
  gifts: {
    label: "Lista de presentes",
    descricao: "Presentes com Pix, sem taxa nenhuma sobre o valor.",
  },
  guestbook: {
    label: "Mural de recados",
    descricao: "Os convidados deixam mensagens para vocês.",
  },
  album: {
    label: "Álbum da festa",
    descricao: "As fotos reais do casamento, publicadas depois.",
  },
  footer: {
    label: "Rodapé",
    descricao: "Hashtag, data e o fechamento do site.",
  },
};
