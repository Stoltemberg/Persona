const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'MP_ACCESS_TOKEN'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
    console.error(`Missing required env vars: ${missingEnv.join(', ')}`);
    process.exit(1);
}

const args = process.argv.slice(2);
const latestMode = args.includes('--latest');
const externalReference = args.find((arg) => !arg.startsWith('--'));

if (!latestMode && !externalReference) {
    console.error('Usage: node scripts/inspect-checkout.mjs <external_reference>');
    console.error('   or: node scripts/inspect-checkout.mjs --latest');
    process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mpAccessToken = process.env.MP_ACCESS_TOKEN;

async function fetchSupabase(path) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
        headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Supabase request failed (${response.status}): ${await response.text()}`);
    }

    return response.json();
}

async function fetchMercadoPago(path) {
    const response = await fetch(`https://api.mercadopago.com/${path}`, {
        headers: {
            Authorization: `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Mercado Pago request failed (${response.status}): ${await response.text()}`);
    }

    return response.json();
}

async function loadIntent() {
    if (latestMode) {
        const rows = await fetchSupabase(
            "checkout_intents?select=*&order=created_at.desc&limit=1"
        );
        return rows[0] ?? null;
    }

    const rows = await fetchSupabase(
        `checkout_intents?select=*&external_reference=eq.${encodeURIComponent(externalReference)}`
    );
    return rows[0] ?? null;
}

try {
    const intent = await loadIntent();

    if (!intent) {
        console.error('Checkout intent not found.');
        process.exit(1);
    }

    const summary = {
        external_reference: intent.external_reference,
        status: intent.status,
        tier: intent.tier,
        plan_title: intent.plan_title,
        expected_amount: intent.expected_amount,
        checkout_validated: intent.checkout_validated,
        verified_amount: intent.verified_amount,
        currency_id: intent.currency_id,
        verified_currency: intent.verified_currency,
        mp_preference_id: intent.mp_preference_id,
        mp_payment_id: intent.mp_payment_id,
        app_url: intent.app_url,
        created_at: intent.created_at,
        updated_at: intent.updated_at,
    };

    console.log('Checkout intent summary:');
    console.log(JSON.stringify(summary, null, 2));

    if (intent.mp_preference_id) {
        const preference = await fetchMercadoPago(`checkout/preferences/${intent.mp_preference_id}`);
        console.log('\nMercado Pago preference:');
        console.log(JSON.stringify({
            id: preference.id,
            init_point: preference.init_point,
            sandbox_init_point: preference.sandbox_init_point,
            external_reference: preference.external_reference,
            item: preference.items?.[0] ?? null,
        }, null, 2));
    }

    if (intent.mp_payment_id) {
        const payment = await fetchMercadoPago(`v1/payments/${intent.mp_payment_id}`);
        console.log('\nMercado Pago payment:');
        console.log(JSON.stringify({
            id: payment.id,
            status: payment.status,
            transaction_amount: payment.transaction_amount,
            currency_id: payment.currency_id,
            external_reference: payment.external_reference,
        }, null, 2));
    }
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
