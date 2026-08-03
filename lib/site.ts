// Dados da plataforma (marca e contato). TROQUE aqui: aparecem na landing
// de pacotes. O número do WhatsApp usa o formato internacional, só dígitos.
export const SITE_NAME = "Enlace";

export const SITE_TAGLINE = "Sites de casamento";

export const CONTACT = {
  // TROCAR: coloque seu número real, ex: "5585912345678"
  whatsappNumber: "5521982605543",
  whatsappLabel: "(21) 98260-5543",
  // E-mail da MARCA, nunca o pessoal de quem construiu.
  //
  // Aqui estava um Gmail pessoal, exposto na landing para qualquer visitante.
  // Além de parecer amador ao lado de "Enlace · Sites de casamento", é um
  // endereço que a pessoa usa para outras coisas — publicá-lo num site de
  // vendas é convidar spam para a caixa de entrada dela.
  //
  // `null` esconde o bloco de e-mail na landing em vez de mostrar um
  // placeholder. Quando existir contato@enlace.com.br (ou o domínio que for),
  // é só preencher aqui.
  email: null as string | null,
  // TROCAR: seu perfil do Instagram (sem @)
  instagram: "enlace.sites",
};

// Sem emoji no texto pré-preenchido: alguns clientes do WhatsApp corrompem
// emoji vindo de URL (vira "?").
export const WHATSAPP_LINK = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
  "Oi! Quero um site de casamento"
)}`;

// Depoimentos. NUNCA invente depoimento: peça a frase real ao casal e
// adicione aqui. Vazio = a seção de depoimentos fica oculta na landing.
export const TESTIMONIALS: {
  couple: string;
  detail: string;
  quote: string;
}[] = [];
