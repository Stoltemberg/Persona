import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getNextRecurringDueDate(currentDueDate: string, frequency: string) {
    const nextDate = new Date(currentDueDate)

    if (frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7)
        return nextDate
    }

    nextDate.setMonth(nextDate.getMonth() + 1)
    return nextDate
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const token = authHeader.replace('Bearer ', '').trim()
        if (!token) throw new Error('Missing access token')

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
        if (userError || !user) throw new Error(`User not found: ${userError?.message || 'invalid token'}`)

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('partner_id')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError) {
            throw new Error(`Profile lookup failed: ${profileError.message}`)
        }

        const ownerIds = [user.id]
        if (profile?.partner_id) ownerIds.push(profile.partner_id)

        const now = new Date().toISOString()
        const { data: templates, error: templatesError } = await supabaseAdmin
            .from('recurring_templates')
            .select('id, description, amount, type, category, wallet_id, expense_type, frequency, next_due_date, last_generated_date, profile_id')
            .in('profile_id', ownerIds)
            .eq('active', true)
            .lte('next_due_date', now)

        if (templatesError) {
            throw new Error(`Recurring template fetch failed: ${templatesError.message}`)
        }

        let processedCount = 0
        let skippedCount = 0

        for (const template of templates || []) {
            if (!template.wallet_id) {
                skippedCount += 1
                continue
            }

            const processedAt = new Date().toISOString()
            const nextDate = getNextRecurringDueDate(template.next_due_date, template.frequency)
            const { data: claimedTemplate, error: claimError } = await supabaseAdmin
                .from('recurring_templates')
                .update({
                    last_generated_date: processedAt,
                    next_due_date: nextDate.toISOString(),
                })
                .eq('id', template.id)
                .eq('next_due_date', template.next_due_date)
                .select('id')
                .maybeSingle()

            if (claimError) {
                console.error('Error claiming recurring template:', claimError)
                skippedCount += 1
                continue
            }

            if (!claimedTemplate) {
                skippedCount += 1
                continue
            }

            const { error: txError } = await supabaseAdmin
                .from('transactions')
                .insert([{
                    description: template.description,
                    amount: template.amount,
                    type: template.type,
                    category: template.category,
                    wallet_id: template.wallet_id,
                    expense_type: template.expense_type,
                    date: processedAt,
                    profile_id: template.profile_id || user.id,
                }])

            if (txError) {
                console.error('Error creating transaction from recurring template:', txError)

                await supabaseAdmin
                    .from('recurring_templates')
                    .update({
                        next_due_date: template.next_due_date,
                        last_generated_date: template.last_generated_date ?? null,
                    })
                    .eq('id', template.id)
                    .eq('next_due_date', nextDate.toISOString())

                skippedCount += 1
                continue
            }

            processedCount += 1
        }

        return new Response(
            JSON.stringify({
                processed_count: processedCount,
                skipped_count: skippedCount,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
