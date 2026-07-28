# Disciplina com dados de cliente

> Exige backup e plano de rollback para qualquer alteração; nada de dado de
> cliente pode ser apagado.

Toda alteração que toque o banco precisa de **backup verificado antes** e
**plano de rollback escrito antes**. Nada de dado de cliente é apagado ou
reescrito — nem registros que parecem lixo de teste.

**Why:** o banco de produção tem um casamento real no ar (22 confirmações de
presença, links de RSVP já distribuídos aos convidados). Quando propus limpar
3 pedidos com dados obviamente fake (`casal: "11"`, data `1222-12-12`), a
resposta foi "não apague nada". A régua é de integridade, não de utilidade do
dado.

**How to apply:** migrações estritamente aditivas (nada de `DROP`, `DELETE`,
`UPDATE` em coluna preexistente); `NOT NULL` e constraints só numa migração
posterior, após verificar em produção; dump antes; `down` escrito à mão no
mesmo commit. Ensaiar aplicando em transação com `ROLLBACK` antes de valer.
Registros indesejados ganham flag, não `DELETE`.

Complementa [fluxo-preview-antes-de-merge](fluxo-preview-antes-de-merge.md).
Os detalhes técnicos estão em [AGENTS.md](../../AGENTS.md), e o ensaio virou
executável: `npm run db:rehearse`.
