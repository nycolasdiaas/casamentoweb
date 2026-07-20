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

// Depoimentos de casais reais. NUNCA invente depoimento: peça a frase ao
// casal e cole aqui. Enquanto `quote` estiver com o texto de exemplo, fica
// óbvio na página que precisa ser trocado.
export const TESTIMONIALS = [
  {
    couple: "Isabelle & Nycolas",
    detail: "Casamento em outubro de 2026 · pacote Para Sempre",
    quote:
      "[TROCAR: peça uma frase real para a Isabelle e o Nycolas e cole aqui]",
  },
];
