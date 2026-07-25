// Dados da plataforma (marca e contato). TROQUE aqui: aparecem na landing
// de pacotes. O número do WhatsApp usa o formato internacional, só dígitos.
export const SITE_NAME = "Enlace";

export const SITE_TAGLINE = "Sites de casamento";

export const CONTACT = {
  // TROCAR: coloque seu número real, ex: "5585912345678"
  whatsappNumber: "5521982605543",
  whatsappLabel: "(21) 98260-5543",
  email: "andersondiasss018@gmail.com",
  // TROCAR: seu perfil do Instagram (sem @)
  instagram: "enlace.sites",
};

// Sem emoji no texto pré-preenchido: alguns clientes do WhatsApp corrompem
// emoji vindo de URL (vira "?").
export const WHATSAPP_LINK = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
  "Oi! Quero um site de casamento"
)}`;

// Depoimentos. IMPORTANTE: a frase abaixo é um PLACEHOLDER genérico só para
// a seção não ficar quebrada — troque pela frase REAL da Isabelle e do
// Nycolas assim que tiver. Depoimento inventado não sustenta confiança e não
// deve ficar no ar de forma permanente.
export const TESTIMONIALS = [
  {
    couple: "Isabelle & Nycolas",
    detail: "Casamento em outubro de 2026 · pacote Para Sempre",
    quote:
      "Ficou tudo com a nossa cara e sem dor de cabeça nenhuma — a gente só mandou as fotos e a história, e eles cuidaram do resto.",
  },
];
