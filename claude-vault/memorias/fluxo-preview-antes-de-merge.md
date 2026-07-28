# Preview antes de merge

> Trabalha em branch, valida em preview de produção e só mergeia na `main`
> quando a versão está estável.

Trabalhar em branch própria, nunca commitar direto na `main`. Mergear só
"quando tivermos uma versão estável" — não a cada fase concluída.

Valida em **preview de build de produção** (`npm run build` + `npm run start`),
não no `next dev`.

**Why:** com Cache Components ligado, o `next dev` é permissivo e o `build` é
estrito. O preview local já pegou uma regressão que o dev deixou passar:
`/rsvp/<slug>` inválido devolvendo HTTP 200 em vez de 404, porque o shell do
PPR já tinha sido enviado quando o `notFound()` disparou.

**How to apply:** ao terminar uma etapa, rodar `npm run build`, subir
`npm run start`, conferir as rotas por HTTP e só então commitar. Deixar o
servidor rodando quando pedirem para "deixar no local" — ele também responde
na rede local, o que serve para testar no celular (o produto é mobile-first:
o convidado abre pelo WhatsApp).

Complementa [disciplina-dados-de-cliente](disciplina-dados-de-cliente.md).
