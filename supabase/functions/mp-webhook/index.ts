import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

serve(async (req) => {
    try {
        const url = new URL(req.url)
        // Mercado Pago sends the ID in the query params or body depending on the topic.
        // For 'payment', it's usually ?data.id=... or body.data.id

        // Parse Payload
        const params = url.searchParams
        const topic = params.get('topic') || params.get('type')
        const id = params.get('id') || params.get('data.id')

        // If payload is in body (POST)
        let body = {}
        try { body = await req.json() } catch { }

        const paymentId = id || body?.data?.id
        const type = topic || body?.type

        console.log(`Webhook Received: Type=${type}, ID=${paymentId}`)

        if (type === 'payment' && paymentId) {

            // 1. Verify Payment with Mercado Pago
            const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${mpAccessToken}` }
            })

            const paymentData = await mpResponse.json()

            if (paymentData.status === 'approved') {
                const userId = paymentData.external_reference

                if (userId) {
                    // 2. Update Supabase
                    const supabaseAdmin = createClient(
                        Deno.env.get('SUPABASE_URL') ?? '',
                        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                    )

                    // Calculate expiration (Now + 30 days)
                    const nextMonth = new Date()
                    nextMonth.setDate(nextMonth.getDate() + 30)

                    const { error } = await supabaseAdmin
                        .from('subscriptions')
                        .upsert({
                            user_id: userId,
                            status: 'active',
                            plan_id: 'pro_monthly_v1',
                            current_period_end: nextMonth.toISOString(),
                            updated_at: new Date().toISOString()
                        })

                    if (error) {
                        console.error('Error updating DB:', error)
                        return new Response('DB Error', { status: 500 })
                    }

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
