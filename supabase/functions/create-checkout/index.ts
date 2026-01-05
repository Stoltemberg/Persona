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
        // 1. Get User from Auth Header
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not found')
        }

        // 2. Prepare Mercado Pago Preference
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
            external_reference: user.id // <--- CRITICAL: Links payment to User
        }

        // 3. Call Mercado Pago API
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

        // 4. Return Init Point
        return new Response(
            JSON.stringify({ init_point: data.init_point }),
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
