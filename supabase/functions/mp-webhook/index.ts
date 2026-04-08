import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

serve(async (req) => {
    try {
        const url = new URL(req.url)
        const params = url.searchParams
        const topic = params.get('topic') || params.get('type')
        const id = params.get('id') || params.get('data.id')

        let body: any = {}
        try { body = await req.json() } catch { }

        const paymentId = id || body?.data?.id
        const type = topic || body?.type

        console.log(`Webhook Received: Type=${type}, ID=${paymentId}`)

        if (type === 'payment' && paymentId) {
            const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${mpAccessToken}` }
            })

            const paymentData = await mpResponse.json()

            if (paymentData.status === 'approved') {
                const supabaseAdmin = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                )

                const { data: existingPayment } = await supabaseAdmin
                    .from('processed_payments')
                    .select('payment_id')
                    .eq('payment_id', String(paymentId))
                    .maybeSingle()

                if (existingPayment) {
                    return new Response('OK', { status: 200 })
                }

                const [userId, tier = 'complete', couponCode = ''] = String(paymentData.external_reference || '').split('|')

                if (userId) {
                    const nextMonth = new Date()
                    nextMonth.setDate(nextMonth.getDate() + 30)

                    const { error: subscriptionError } = await supabaseAdmin
                        .from('subscriptions')
                        .upsert({
                            user_id: userId,
                            status: 'active',
                            plan_id: `${tier}_monthly_v1`,
                            current_period_end: nextMonth.toISOString(),
                            updated_at: new Date().toISOString()
                        })

                    if (subscriptionError) {
                        console.error('Error updating subscription:', subscriptionError)
                        return new Response('DB Error', { status: 500 })
                    }

                    const { error: profileError } = await supabaseAdmin
                        .from('profiles')
                        .update({ plan_tier: tier })
                        .eq('id', userId)

                    if (profileError) {
                        console.error('Error updating profile:', profileError)
                        return new Response('DB Error', { status: 500 })
                    }

                    if (couponCode) {
                        const { error: incrementError } = await supabaseAdmin.rpc('increment_coupon_usage', {
                            coupon_code: couponCode
                        })

                        if (incrementError) {
                            console.error('Error incrementing coupon usage:', incrementError)
                        }
                    }

                    const { error: processedError } = await supabaseAdmin
                        .from('processed_payments')
                        .insert({
                            payment_id: String(paymentId),
                            user_id: userId,
                            tier,
                            coupon_code: couponCode || null,
                        })

                    if (processedError) {
                        console.error('Error storing processed payment:', processedError)
                        return new Response('DB Error', { status: 500 })
                    }
                }
            }
        }

        return new Response('OK', { status: 200 })
    } catch (error) {
        console.error(error)
        return new Response('Internal Server Error', { status: 500 })
    }
})
