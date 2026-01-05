const CLIENT_ID = '4711776498636308';
const CLIENT_SECRET = 'FvuLBDIXTP5nsIYTwpO8YsqCHvY9msTC';

async function generateToken() {
    console.log('Gerando novo Access Token...');
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials'
        })
    });

    const data = await response.json();
    if (response.ok) {
        console.log('Token gerado com sucesso.');
        return data.access_token;
    } else {
        throw new Error(`Falha ao gerar token: ${JSON.stringify(data)}`);
    }
}

async function createPlan() {
    try {
        const accessToken = await generateToken();

        console.log('Criando plano no Mercado Pago...');
        const url = 'https://api.mercadopago.com/preapproval_plan';

        const body = {
            reason: 'Persona PRO (Assinatura Mensal)',
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: 29.90,
                currency_id: 'BRL',
                start_date: new Date(new Date().getTime() + 60000).toISOString()
            },
            back_url: 'https://app-persona-demo.com/settings',
            status: 'active'
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
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
        console.error('Erro Fatal:', error.message);
    }
}

createPlan();
