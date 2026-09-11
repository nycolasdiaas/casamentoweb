# Evidência UX-007 — "Já fiz o Pix" falha para todo site que não é o legado

Convidado clica em "Já fiz o Pix" no site de Ana & Bruno. O navegador registra 500 e a tela não muda.

## Console do navegador
```
[error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
[error] Uncaught (in promise)
```

## Log do servidor
```
⨯ Error: Gift not found
    at registerContributionAction (app\actions\gift-actions.ts:235:11)
  233 |   const gift = await getGiftById(siteId, giftId);
  234 |   if (!gift) {
> 235 |     throw new Error("Gift not found");
      |           ^
  236 |   }
  237 |
  238 |   const trimmedName = guestName.trim().slice(0, 120); {
--
[browser] ⨯ unhandledRejection: Error: Gift not found
    at registerContributionAction (app\actions\gift-actions.ts:235:11)
  233 |   const gift = await getGiftById(siteId, giftId);
  234 |   if (!gift) {
```
