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

        const { tier, couponCode } = await req.json()
        if (!tier || !(tier in tierCatalog)) {
            throw new Error('Invalid tier')
        }

        const plan = tierCatalog[tier as keyof typeof tierCatalog]
        let finalPrice = plan.price
        let normalizedCoupon = ''

        if (couponCode) {
            normalizedCoupon = String(couponCode).trim().toUpperCase()

            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

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

        const externalReference = [user.id, tier, normalizedCoupon].join('|')

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
                success: 'https://app-persona-demo.com/settings?status=success',
                failure: 'https://app-persona-demo.com/settings?status=failure',
                pending: 'https://app-persona-demo.com/settings?status=pending'
            },
            auto_return: 'approved',
            external_reference: externalReference,
            metadata: {
                user_id: user.id,
                tier,
                coupon_code: normalizedCoupon || null,
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

        return new Response(
            JSON.stringify({ init_point: data.init_point, final_price: finalPrice, coupon_code: normalizedCoupon || null }),
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
