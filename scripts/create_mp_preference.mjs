const CLIENT_ID = '4711776498636308';
const CLIENT_SECRET = 'FvuLBDIXTP5nsIYTwpO8YsqCHvY9msTC';

async function generateToken() {
    console.log('Gerando Access Token...');
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
    if (response.ok) return data.access_token;
    throw new Error(`Erro Token: ${JSON.stringify(data)}`);
}

async function createPreference() {
    try {
        const accessToken = await generateToken();

        console.log('Criando Preferência de Pagamento (Checkout Pro)...');
        const url = 'https://api.mercadopago.com/checkout/preferences';

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
            payment_methods: {
                excluded_payment_types: [],
                excluded_payment_methods: []
                // Empty means allow ALL (PIX, Boleto, Credit Card)
            },
            back_urls: {
                success: 'https://app-persona-demo.com/settings?status=success',
                failure: 'https://app-persona-demo.com/settings?status=failure',
                pending: 'https://app-persona-demo.com/settings?status=pending'
            },
            auto_return: 'approved',
            external_reference: 'user_123_temp' // You would put user ID here dynamically
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
            console.log('PREFERENCE_ID:', data.id);
            console.log('INIT_POINT (Link):', data.init_point);
            console.log('---------------');
        } else {
            console.error('Erro ao criar preferência:', data);
        }

    } catch (error) {
        console.error('Erro Fatal:', error.message);
    }
}

createPreference();
