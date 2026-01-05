import fetch from 'node-fetch'; // Requires "type": "module" in package.json or .mjs extension
// Or standard fetch if Node 18+

const ACCESS_TOKEN = 'APP_USR-ffa5816d-b8a5-429c-be24-eb95f795a3a8';

async function createPlan() {
    console.log('Criando plano no Mercado Pago...');

    const url = 'https://api.mercadopago.com/preapproval_plan';

    const body = {
        reason: 'Persona PRO (Assinatura Mensal)',
        auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: 29.90,
            currency_id: 'BRL',
            start_date: new Date(new Date().getTime() + 60000).toISOString() // Now + 1min
        },
        back_url: 'https://app-persona-demo.com/settings', // Placeholder return URL
        status: 'active'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('--- SUCESSO ---');
            console.log('PLAN_ID:', data.id);
            console.log('INIT_POINT:', data.init_point); // This is the checkout link for the PLAN
            console.log('---------------');
        } else {
            console.error('Erro ao criar plano:', data);
        }
    } catch (error) {
        console.error('Erro de rede:', error);
    }
}

createPlan();
