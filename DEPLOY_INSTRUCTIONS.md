# Como Publicar suas Funções no Supabase (Manual)

Como você não tem o **Supabase CLI** instalado, faremos o processo pelo Painel Online. É rápido e você só precisa copiar e colar o código que gerei.

## Passo 1: Acesse o Dashboard
1. Entre em [supabase.com/dashboard](https://supabase.com/dashboard) e selecione seu projeto (`Persona` ou `Stoltemberg`).
2. No menu lateral esquerdo, clique em **Edge Functions**.

---

## Passo 2: Criar a Função `create-checkout`
Esta função gera o link de pagamento.

1. Clique em **Create a new Function** (botão verde).
2. **Name:** `create-checkout`
3. **Region:** Escolha `sa-east-1` (São Paulo) se disponível, ou a padrão `us-east-1`.
4. Clique em **Create function**.
5. No editor que abrir, apague todo o código de exemplo.
6. Copie e cole o código abaixo:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) throw new Error('User not found')

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpAccessToken) throw new Error('Missing MP_ACCESS_TOKEN')

    const body = {
      items: [
        {
          title: 'Persona PRO (Acesso 30 dias)',
          description: 'Acesso Premium a todas funcionalidades por 1 mês',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 29.90
        }
      ],
      back_urls: {
        success: 'https://app-persona-demo.com/settings?status=success',
        failure: 'https://app-persona-demo.com/settings?status=failure',
        pending: 'https://app-persona-demo.com/settings?status=pending'
      },
      auto_return: 'approved',
      external_reference: user.id
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    if (!response.ok) throw new Error(`MP Error: ${JSON.stringify(data)}`)

    return new Response(
      JSON.stringify({ init_point: data.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```
7. Clique em **Deploy**.

---

## Passo 3: Criar a Função `mp-webhook`
Esta função libera o acesso Pro quando o pagamento é aprovado.

1. Volte para **Edge Functions**.
2. Clique em **Create a new Function** novamente.
3. **Name:** `mp-webhook`
4. **Create function**.
5. Apague o código padrão.
6. Copie e cole o código abaixo:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const params = url.searchParams
    const topic = params.get('topic') || params.get('type')
    const id = params.get('id') || params.get('data.id')

    let body = {}
    try { body = await req.json() } catch {}
    
    const paymentId = id || body?.data?.id
    const type = topic || body?.type

    if (type === 'payment' && paymentId) {
        const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${mpAccessToken}` }
        })
        const paymentData = await mpResponse.json()
        
        if (paymentData.status === 'approved') {
            const userId = paymentData.external_reference
            if (userId) {
                 const supabaseAdmin = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                 )
                 const nextMonth = new Date()
                 nextMonth.setDate(nextMonth.getDate() + 30)

                 await supabaseAdmin
                    .from('subscriptions')
                    .upsert({
                        user_id: userId,
                        status: 'active',
                        plan_id: 'pro_monthly_v1',
                        current_period_end: nextMonth.toISOString(),
                        updated_at: new Date().toISOString()
                    })
                 console.log(`User ${userId} upgraded to PRO!`)
            }
        }
    }
    return new Response('OK', { status: 200 })
  } catch (error) {
      console.error(error)
      return new Response('Internal Server Error', { status: 500 })
  }
})
```
7. Clique em **Deploy**.

---

## Passo 4: Definindo a Chave (Modo Simples)
Como você não achou o menu de variáveis, vamos colocar a chave direto no código (Hardcode).

1. Volte na edição da função `create-checkout`.
2. Procure a linha:
   `const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')`
3. Troque por:
   `const mpAccessToken = 'APP_USR-ffa5816d-b8a5-429c-be24-eb95f795a3a8'`
4. Clique em **Deploy** novamente para salvar.

5. Faça o mesmo na função `mp-webhook`:
   - Troque `Deno.env.get('MP_ACCESS_TOKEN')` pela chave real.
   - Clique em **Deploy**.

---

## Passo 5: Configurar o Webhook no Mercado Pago
Agora avise o Mercado Pago para chamar sua função.

1. Copie a URL da função `mp-webhook` no Supabase (algo como `https://xyz.supabase.co/functions/v1/mp-webhook`).
2. Vá no [Painel de Desenvolvedor do Mercado Pago](https://www.mercadopago.com.br/developers/panel/notifications/webhooks).
3. Selecione sua aplicação.
4. Em **Webhooks**, clique em **Criar Notificação**.
5. **URL de Produção:** Cole a URL da função do Supabase.
6. **Eventos:** Marque `Pagamentos` (Payments).
7. Salve.

Pronto! Seu sistema de automação está no ar.
