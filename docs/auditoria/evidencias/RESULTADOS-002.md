# Evidências da feature 002 — verificado em 11/09/2026

## UX-004 · errar a chave Pix não apaga mais o resto

Tela de Conteúdo preenchida, chave Pix `abc`, salvar:
```
erro ....... "Não reconhecemos essa chave. Use CPF, CNPJ, e-mail, celular com
             DDD ou a chave aleatória do banco."
story ...... "TEXTO NOVO QUE NAO PODE SUMIR — a história reescrita agora."
dressCode .. "TRAJE NOVO QUE NAO PODE SUMIR"
ceremony ... "LOCAL NOVO QUE NAO PODE SUMIR"
pixKey ..... "abc"   (volta também: é o campo a corrigir)
```

Corrigindo só a chave e salvando de novo:
```
mensagem ... "Salvo ✓ — o site já está com o conteúdo novo."
story ...... continua "TEXTO NOVO QUE NAO PODE SUMIR…"
```

No celular (390x844), com a tela rolada até o botão:
```
scrollWidth ......... 390 (sem rolagem lateral)
erro visível ........ sim, sem rolar
erro acima do botão . sim
story preservado .... sim
```

Antes: os onze campos voltavam ao último valor salvo, história inteira inclusive.

## UX-012 · o mural da prévia
```
mensagem ... "O mural começa a valer quando o site estiver no ar. Aí os
              recados ficam guardados."
nome ....... "Tia Antônia"        (continua no campo)
recado ..... "Que Deus abençoe vocês dois! 💛"  (continua no campo)
```

Antes: "Não achamos esse casamento." — e os dois campos esvaziados.
