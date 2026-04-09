# Deploy das Edge Functions e migrations

Este projeto depende de duas Edge Functions do Supabase e de migrations recentes para que o checkout respeite o plano escolhido e o cupom aplicado.

## Regra principal

Nao publique codigo copiado manualmente com preco hardcoded.

O fluxo correto ja esta versionado nestes arquivos:

- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/mp-webhook/index.ts`
- `supabase/migrations/20260408_coupon_checkout_safety.sql`
- `supabase/migrations/20260408_checkout_webhook_hardening.sql`
- `supabase/migrations/20260409_checkout_observability_and_coupon_guards.sql`

Se a producao estiver cobrando sempre o mesmo valor, a causa mais provavel e uma Edge Function antiga ainda publicada.
Se o frontend passar a bloquear o redirecionamento com erro de resposta inconsistente, isso indica que a `create-checkout` publicada nao retornou os novos campos de validacao e precisa ser redeployada.

## O que precisa existir em producao

1. A function `create-checkout` publicada com a versao atual do repositorio.
2. A function `mp-webhook` publicada com a versao atual do repositorio.
3. As duas migrations de seguranca e checkout aplicadas no mesmo projeto Supabase usado pelo frontend.
4. Variaveis de ambiente configuradas no Supabase. Nao hardcode credenciais no codigo.

## Variaveis de ambiente minimas

Configure no painel do Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `APP_URL`

`APP_URL` deve apontar para o dominio real do app publicado, porque `create-checkout` usa essa base para `success`, `failure` e `pending`.

## Checklist de verificacao do bug de valor fixo

1. Abrir a Edge Function `create-checkout` publicada no painel do Supabase.
2. Confirmar que ela le `tier` e `couponCode` e calcula `finalPrice` dinamicamente.
3. Confirmar que `unit_price` enviado ao Mercado Pago usa `finalPrice`, nao um numero fixo.
4. Confirmar que a resposta da function inclui `tier`, `plan_title`, `final_price` e `checkout_validated: true`.
5. Confirmar que a migration `20260408_coupon_checkout_safety.sql` foi aplicada e que `redeem_coupon` nao promove plano diretamente.
6. Confirmar que a migration `20260408_checkout_webhook_hardening.sql` foi aplicada e que a tabela `checkout_intents` existe.
7. Confirmar que a migration `20260409_checkout_observability_and_coupon_guards.sql` foi aplicada.
8. Confirmar que o frontend publicado usa o mesmo `VITE_SUPABASE_URL` do projeto onde essas functions e migrations foram publicadas.
9. Fazer uma tentativa real e conferir o registro em `checkout_intents.expected_amount`.
10. Comparar esse valor com `transaction_amount` do pagamento recebido no webhook.
11. Se precisar validar via terminal, usar `node scripts/inspect-checkout.mjs <external_reference>` com `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `MP_ACCESS_TOKEN`.

## Sinais claros de ambiente desatualizado

- Checkout sempre abre com `29.90` para qualquer plano.
- Cupom parece validar, mas o valor no Mercado Pago nao muda.
- `redeem_coupon` ainda ativa plano sem pagamento.
- URLs de retorno ainda apontam para dominio antigo.

## Observacoes operacionais

- `render.yaml` cuida apenas do frontend estatico. Ele nao publica Edge Functions do Supabase.
- Publicar frontend novo sem redeploy das functions deixa o sistema inconsistente.
- Scripts antigos em `scripts/` nao devem ser usados como base de deploy em producao.
