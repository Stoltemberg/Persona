import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const tierCatalog = {
    intermediate: { price: 14.9 },
    complete: { price: 29.9 },
} as const

const textEncoder = new TextEncoder()

function parseSignatureHeader(signatureHeader: string | null) {
    const pairs = (signatureHeader || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)

    return pairs.reduce<Record<string, string>>((accumulator, pair) => {
        const [key, value] = pair.split('=')
        if (key && value) accumulator[key] = value
        return accumulator
    }, {})
}

async function createHmacHex(secret: string, payload: string) {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        textEncoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, textEncoder.encode(payload))
    return Array.from(new Uint8Array(signature))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
}

function safeEqual(left: string, right: string) {
    if (left.length !== right.length) return false

    let mismatch = 0
    for (let index = 0; index < left.length; index += 1) {
        mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
    }

    return mismatch === 0
}

async function verifyWebhookSignature(req: Request, dataId: string) {
    const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET')
    if (!webhookSecret) {
        console.error('Missing MP_WEBHOOK_SECRET')
        return false
    }

    const signatureHeader = parseSignatureHeader(req.headers.get('x-signature'))
    const requestId = req.headers.get('x-request-id')
    const timestamp = signatureHeader.ts
    const signature = signatureHeader.v1

    if (!requestId || !timestamp || !signature) {
        return false
    }

    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`
    const expectedSignature = await createHmacHex(webhookSecret, manifest)
    return safeEqual(expectedSignature, signature)
}

function getExpectedAmount(intentAmount: number, tier: keyof typeof tierCatalog) {
    const plan = tierCatalog[tier]
    if (!plan) return intentAmount
    return Number(intentAmount.toFixed(2))
}

serve(async (req) => {
    try {
        const url = new URL(req.url)
        const params = url.searchParams
        const topic = params.get('topic') || params.get('type')

        let body: any = {}
        try {
            body = await req.json()
        } catch {
            body = {}
        }

        const paymentId = params.get('id') || params.get('data.id') || body?.data?.id
        const type = topic || body?.type

        console.log(`Webhook Received: Type=${type}, ID=${paymentId}`)

        if (type !== 'payment' || !paymentId) {
            return new Response('OK', { status: 200 })
        }

        const signatureIsValid = await verifyWebhookSignature(req, String(paymentId))
        if (!signatureIsValid) {
            return new Response('Unauthorized', { status: 401 })
        }

        const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
        if (!mpAccessToken) {
            return new Response('Missing MP_ACCESS_TOKEN', { status: 500 })
        }

        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${mpAccessToken}` }
        })

        if (!mpResponse.ok) {
            console.error('Mercado Pago payment lookup failed:', await mpResponse.text())
            return new Response('Upstream Error', { status: 502 })
        }

        const paymentData = await mpResponse.json()

        if (paymentData.status !== 'approved') {
            return new Response('OK', { status: 200 })
        }

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

        const externalReference = String(paymentData.external_reference || '')
        const referenceParts = externalReference.split('|')
        const userId = referenceParts[0] || ''
        const rawTier = referenceParts[1] || 'complete'
        const checkoutReference = referenceParts.at(-1) || ''
        const tier = rawTier as keyof typeof tierCatalog

        if (!userId || !checkoutReference || !(tier in tierCatalog)) {
            return new Response('Invalid external reference', { status: 400 })
        }

        const { data: checkoutIntent, error: checkoutIntentError } = await supabaseAdmin
            .from('checkout_intents')
            .select('*')
            .eq('external_reference', externalReference)
            .maybeSingle()

        if (checkoutIntentError || !checkoutIntent) {
            console.error('Missing checkout intent:', checkoutIntentError)
            return new Response('Checkout intent not found', { status: 400 })
        }

        const userMatches = checkoutIntent.user_id === userId
        const tierMatches = checkoutIntent.tier === tier

        if (!userMatches || !tierMatches) {
            console.error('Checkout intent mismatch', {
                paymentId,
                externalReference,
                checkoutIntent,
            })
            return new Response('Checkout validation failed', { status: 400 })
        }

        const paidAmount = Number(paymentData.transaction_amount || 0)
        const expectedAmount = getExpectedAmount(Number(checkoutIntent.expected_amount || 0), tier)
        const amountMatches = Math.abs(paidAmount - expectedAmount) <= 0.01
        const currencyMatches = paymentData.currency_id === checkoutIntent.currency_id

        if (!amountMatches || !currencyMatches) {
            console.error('Payment mismatch', {
                paymentId,
                paidAmount,
                expectedAmount,
                currency: paymentData.currency_id,
                expectedCurrency: checkoutIntent.currency_id,
            })
            return new Response('Payment validation failed', { status: 400 })
        }

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

        const { error: processedError } = await supabaseAdmin
            .from('processed_payments')
            .insert({
                payment_id: String(paymentId),
                user_id: userId,
                tier,
            })

        if (processedError) {
            console.error('Error storing processed payment:', processedError)
            return new Response('DB Error', { status: 500 })
        }

        const { error: checkoutUpdateError } = await supabaseAdmin
            .from('checkout_intents')
            .update({
                status: 'paid',
                mp_payment_id: String(paymentId),
                verified_amount: paidAmount,
                verified_currency: paymentData.currency_id,
                mp_payment_payload: paymentData,
                updated_at: new Date().toISOString(),
            })
            .eq('external_reference', externalReference)

        if (checkoutUpdateError) {
            console.error('Error updating checkout intent:', checkoutUpdateError)
            return new Response('DB Error', { status: 500 })
        }

        return new Response('OK', { status: 200 })
    } catch (error) {
        console.error(error)
        return new Response('Internal Server Error', { status: 500 })
    }
})
