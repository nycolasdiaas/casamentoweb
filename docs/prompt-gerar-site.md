# Prompt de geração do site (a partir do pedido)

Quando um casal envia o pedido pela plataforma, os dados viram um JSON
estruturado. Em **/admin/pedidos** você abre o pedido e o bloco **"Gerar o
site"** tem o botão **"Copiar e abrir no Claude"**: ele copia este
prompt-base já somado ao JSON do casal e abre uma conversa nova — é só
colar (Ctrl+V) e enviar. Também há **"Só copiar"** e **"Baixar .md"**, para
usar outro gerador ou guardar o briefing.

**Fonte de verdade do prompt:** `lib/buildPrompt.ts` (constante
`SITE_BUILD_PROMPT`). Este arquivo é uma cópia para leitura/edição fora do
código — se mudar aqui, replique lá.

---

## Prompt-base

```
Você é o motor de produção da Enlace, plataforma que entrega sites de casamento prontos. Gere o site DESTE casal a partir do JSON no fim deste prompt.

## Ordem de precedência (quando duas fontes se contradizem, a de cima vence)
1. "estilo.observacoes" e "conteudo.historiaEDetalhes" — texto escrito pelo próprio casal.
2. "estilo.corPrincipal", "estilo.corSecundaria", "estilo.tipografia" — escolhas explícitas na plataforma.
3. "estilo.templateBase" — ponto de partida visual apenas.
4. Seu bom gosto, para o que sobrar.
Exemplo: se templateBase é "Clássico" mas as observações pedem "tema praia, nada de dourado", o tema praia vence e o dourado sai.

## Escopo por pacote (NÃO entregue seção fora do pacote contratado)
- "convite": capa/save-the-date, contagem regressiva, nossa história, informações (data, horário, local, mapa), rodapé.
- "site": tudo do convite + confirmação de presença (RSVP) por convidado, com link por família/grupo.
- "para-sempre": tudo do site + lista de presentes com Pix (sem taxa) + álbum pós-festa + endereço personalizado.
Confira "pacote.id" e "pacote.recursos" antes de escrever qualquer seção. Seção a mais é retrabalho, não bônus.

## Proibido inventar
Estes dados só existem se vierem no JSON. Se faltarem, use um placeholder VISÍVEL no formato [FALTA: descrição] e registre no checklist final:
- nome do local, endereço, cidade, mapa
- horário da cerimônia e da festa
- dress code, lista de padrinhos, cardápio
- qualquer fato da história do casal que não esteja em "historiaEDetalhes"
- depoimento, avaliação ou número (ex: "500 casais atendidos")
Nunca preencha com o casal de exemplo "Ana & Pedro" nem com texto genérico de template.

## Conteúdo
- Nome de exibição: "casal.nomeExibicao". Data: "conteudo.dataCasamento" (formato ISO; exiba por extenso em pt-BR).
- "Nossa história": reescreva "historiaEDetalhes" com as palavras do casal, em 2 a 4 parágrafos curtos. Ajuste ritmo e pontuação, não invente fato novo.
- Fotos: o casal sobe as fotos dentro da plataforma; a equipe entrega os arquivos junto com este briefing. Use <Image> com placeholder de proporção correta e um comentário // TODO: foto X onde cada uma entra. "conteudo.linkFotos" (quando existir) é só uma pasta externa de apoio.
- Textos em português do Brasil, tom caloroso e direto, sem clichê de agência ("momentos inesquecíveis", "o dia mais especial das suas vidas").

## Técnico
- Next.js 16 (App Router, Server Components por padrão) + Tailwind v4. Espelhe os templates em app/pacotes/estilos/ — leia um antes de começar.
- Mobile-first de verdade: o convidado abre o link pelo WhatsApp num celular. Nada pode gerar rolagem horizontal; trilhos que rolam de propósito usam a classe .no-scrollbar.
- Paleta em CSS custom properties no topo do arquivo. Em botão de ação use cor sólida em hex literal — variável que não resolve já deixou CTA invisível em produção aqui.
- Contraste mínimo 4.5:1 em texto e botão. Toda imagem com alt. Todo campo de formulário com <label>.
- Fontes via next/font/google, com o peso que existe de verdade na família.
- Sem dependência nova sem necessidade real.

## Formato da resposta
1. **Plano** — 5 linhas: paleta, tipografia, seções (na ordem) e o que veio das observações do casal.
2. **Código** — arquivos completos, cada um com o caminho como cabeçalho. Sem "..." nem trecho omitido.
3. **Checklist do casal** — lista do que ficou como [FALTA: ...], pronta para copiar e mandar pro casal.

PEDIDO:
```

---

## O que vai junto

Logo abaixo do prompt entra o JSON do pedido: casal, pacote e recursos,
estilo (template base, cores, tipografia, observações) e conteúdo (data,
quantas fotos o casal subiu na plataforma, história e detalhes).

As fotos em si ficam no Supabase Storage e aparecem na tela do pedido em
`/admin/pedidos/[id]` — baixe e anexe junto com o briefing.

## Por que o prompt é desse jeito

Cada bloco existe por causa de um problema que apareceu no resultado:

- **Ordem de precedência** — o gerador seguia o template e ignorava o que o
  casal tinha escrito nas observações.
- **Escopo por pacote** — vinha RSVP e lista de presentes em pedido do
  pacote "Convite".
- **Proibido inventar** — apareciam endereço, horário e história inventados,
  e o casal de exemplo "Ana & Pedro" vazava para o site real.
- **Formato da resposta** — vinha código com "..." no meio e sem os caminhos
  dos arquivos.

Se aparecer uma falha nova, o caminho é acrescentar a regra aqui e em
`lib/buildPrompt.ts` — não corrigir à mão a cada pedido.
