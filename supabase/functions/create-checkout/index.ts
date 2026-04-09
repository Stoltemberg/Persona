import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const tierCatalog = {
    intermediate: { price: 14.9, title: 'Persona One (Acesso 30 dias)' },
    complete: { price: 29.9, title: 'Persona Duo (Acesso 30 dias)' },
} as const

function resolveAppUrl(req: Request) {
    const configuredUrl = Deno.env.get('APP_URL')?.trim()
    if (configuredUrl) {
        return configuredUrl.replace(/\/+$/, '')
    }

    const requestUrl = new URL(req.url)
    const originHeader = req.headers.get('origin')?.trim()
    return (originHeader || requestUrl.origin).replace(/\/+$/, '')
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error('User not found')

        const { tier, couponCode } = await req.json()
        if (!tier || !(tier in tierCatalog)) {
            throw new Error('Invalid tier')
        }

        const plan = tierCatalog[tier as keyof typeof tierCatalog]
        let finalPrice = plan.price
        let normalizedCoupon = ''

        if (couponCode) {
            normalizedCoupon = String(couponCode).trim().toUpperCase()

            const { data: coupon, error: couponError } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', normalizedCoupon)
                .eq('active', true)
                .maybeSingle()

            if (couponError || !coupon) {
                throw new Error('Cupom invalido ou expirado.')
            }

            if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
                throw new Error('Cupom expirado.')
            }

            if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
                throw new Error('Limite de uso do cupom atingido.')
            }

            if (coupon.target_tier && coupon.target_tier !== tier) {
                throw new Error('Este cupom nao e valido para o plano selecionado.')
            }

            if (coupon.discount_percent) {
                finalPrice = Number((plan.price * (1 - coupon.discount_percent / 100)).toFixed(2))
            }
        }

        const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
        if (!mpAccessToken) throw new Error('Missing MP_ACCESS_TOKEN')

        const checkoutReference = crypto.randomUUID()
        const externalReference = [user.id, tier, normalizedCoupon, checkoutReference].join('|')
        const appUrl = resolveAppUrl(req)

        const body = {
            items: [
                {
                    title: plan.title,
                    description: `Acesso premium ao plano ${tier} por 30 dias`,
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: finalPrice,
                }
            ],
            back_urls: {
                success: `${appUrl}/settings?status=success`,
                failure: `${appUrl}/settings?status=failure`,
                pending: `${appUrl}/settings?status=pending`
            },
            auto_return: 'approved',
            external_reference: externalReference,
            metadata: {
                user_id: user.id,
                tier,
                coupon_code: normalizedCoupon || null,
                checkout_reference: checkoutReference,
            }
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
        if (!response.ok) {
            throw new Error(`MP Error: ${JSON.stringify(data)}`)
        }

        const preferenceItem = data?.items?.[0]
        const preferencePrice = Number(preferenceItem?.unit_price ?? finalPrice)
        const preferenceTitle = preferenceItem?.title ?? plan.title

        if (Math.abs(preferencePrice - finalPrice) > 0.01 || preferenceTitle !== plan.title) {
            throw new Error('Checkout mismatch: Mercado Pago retornou um plano diferente do solicitado.')
        }

        const { error: checkoutIntentError } = await supabaseAdmin
            .from('checkout_intents')
            .upsert({
                external_reference: externalReference,
                user_id: user.id,
                tier,
                coupon_code: normalizedCoupon || null,
                expected_amount: finalPrice,
                currency_id: 'BRL',
                app_url: appUrl,
                coupon_validation_tier: tier,
                mp_preference_id: data.id ?? null,
                mp_init_point: data.init_point ?? null,
                mp_sandbox_init_point: data.sandbox_init_point ?? null,
                mp_preference_payload: data ?? null,
                status: 'pending',
                updated_at: new Date().toISOString(),
            })

        if (checkoutIntentError) {
            throw new Error(`Checkout intent error: ${checkoutIntentError.message}`)
        }

        return new Response(
            JSON.stringify({
                init_point: data.init_point,
                sandbox_init_point: data.sandbox_init_point ?? null,
                preference_id: data.id ?? null,
                external_reference: externalReference,
                checkout_reference: checkoutReference,
                tier,
                plan_title: plan.title,
                final_price: finalPrice,
                coupon_code: normalizedCoupon || null,
                checkout_validated: true,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
