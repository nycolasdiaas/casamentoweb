# Prompt de geração do site (a partir do pedido)

Quando um casal envia o pedido pela plataforma, os dados viram um JSON
estruturado, visível em **/admin/pedidos**. Lá, o botão **"Copiar prompt
+ pedido"** já entrega este prompt-base somado ao JSON do casal — é só
colar num gerador de código (Claude, etc.) para produzir o site.

**Fonte de verdade do prompt:** `lib/buildPrompt.ts` (constante
`SITE_BUILD_PROMPT`). Este arquivo é uma cópia para leitura/edição fora
do código — se mudar aqui, replique lá (ou peça pro Claude replicar).

---

## Prompt-base

```
Você é o motor de produção da Enlace, uma plataforma que entrega sites de
casamento prontos. Gere o site do casal a partir do JSON do pedido abaixo.

REGRAS:
- Stack: Next.js (App Router) + Tailwind v4, igual aos templates em
  app/pacotes/estilos/. Mobile-first (o convidado abre pelo WhatsApp).
- O pacote define quais seções existem: "Convite" = capa/save-the-date,
  contagem regressiva, história, informações, rodapé. "Site do Casamento"
  = tudo isso + confirmação de presença (RSVP). "Para Sempre" = tudo +
  lista de presentes com Pix (sem taxa) + álbum pós-festa + endereço
  personalizado.
- Se "templateBase" tiver um nome, use-o como ponto de partida visual; se
  for "nenhum", monte do zero a partir das cores e tipografia.
- "corPrincipal" e "corSecundaria" (hex) mandam na paleta. Se vierem
  nulas, escolha uma paleta elegante que combine com as observações.
- "tipografia" indica a direção das fontes dos títulos. Se nula, escolha
  algo coerente com o estilo.
- LEIA "observacoes" e "historiaEDetalhes" com atenção — são os pedidos
  textuais do casal e têm prioridade sobre qualquer padrão.
- Use as fotos do "linkFotos" (o casal compartilhou uma pasta); onde não
  houver foto, use placeholders elegantes.
- Nomes do casal: use "nomeExibicao". Data: "dataCasamento".
- Não invente informações que não estão no pedido; se algo essencial
  faltar, deixe um placeholder claro e liste no final o que falta pedir ao
  casal pelo WhatsApp.

Entregue o código do site e, ao final, um checklist do que ainda falta do
casal.

PEDIDO:
{ ...json do pedido... }
```

---

## Exemplo do JSON gerado por pedido

```json
{
  "pedidoId": "uuid",
  "status": "submitted",
  "casal": {
    "nomeConta": "Ana",
    "nomeExibicao": "Ana & Pedro",
    "email": "ana@email.com",
    "whatsapp": "5585999990000"
  },
  "pacote": { "id": "para-sempre", "nome": "Para Sempre", "recursos": [ ... ] },
  "estilo": {
    "templateBase": "Romântico",
    "corPrincipal": "#7c4a55",
    "corSecundaria": "#d9a3ae",
    "tipografia": "Manuscrita",
    "observacoes": "flores em aquarela, nada de rosa forte"
  },
  "conteudo": {
    "dataCasamento": "2027-05-15",
    "linkFotos": "https://drive.google.com/...",
    "historiaEDetalhes": "Nos conhecemos em..."
  },
  "datas": { "criadoEm": "...", "atualizadoEm": "..." }
}
```
