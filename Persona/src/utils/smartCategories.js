export const categoryKeywords = {
    'alimentation': ['mercado', 'supermercado', 'ifood', 'restaurante', 'almoço', 'jantar', 'lanche', 'padaria', 'cafe', 'café', 'pizza', 'burger', 'açaí', 'bebida', 'bar', 'churrasco'],
    'transport': ['uber', '99', 'taxi', 'ônibus', 'bus', 'metro', 'metrô', 'combustivel', 'gasolina', 'posto', 'estacionamento', 'pedagio', 'pedágio', 'mecânico', 'oficina'],
    'housing': ['aluguel', 'condominio', 'condomínio', 'luz', 'energia', 'agua', 'água', 'internet', 'net', 'claro', 'vivo', 'tim', 'oi', 'gás', 'iptu', 'manutenção', 'limpeza'],
    'health': ['farmacia', 'farmácia', 'drogaria', 'remedio', 'remédio', 'consulta', 'medico', 'médico', 'dentista', 'exame', 'plano de saúde', 'academia', 'suplemento'],
    'entertainment': ['netflix', 'spotify', 'amazon', 'prime', 'cinema', 'filme', 'jogo', 'steam', 'playstation', 'xbox', 'nintendo', 'show', 'teatro', 'livro', 'disney', 'hbo'],
    'shopping': ['amazon', 'mercadolivre', 'shopee', 'shein', 'roupa', 'sapato', 'eletronico', 'celular', 'presente', 'loja', 'shopping'],
    'salary': ['salario', 'salário', 'pagamento', 'freela', 'freelance', 'projeto', 'venda', 'reembolso', 'dividendos', 'rendimento'],
    'education': ['curso', 'escola', 'faculdade', 'livro', 'udemy', 'alura', 'idioma', 'inglês']
};

export const getSmartCategory = (description, categories) => {
    if (!description || !categories || categories.length === 0) return null;

    const lowerDesc = description.toLowerCase();

    for (const [key, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(k => lowerDesc.includes(k))) {
            // Find a category in the user's list that matches this "type" or name
            // simpler approach: match loosely by name
            const match = categories.find(c => {
                const lowerCat = c.name.toLowerCase();
                // Check if user's category name contains the key (e.g. "Alimentação" contains "aliment")
                // Or if it matches common translations
                if (key === 'alimentation' && (lowerCat.includes('aliment') || lowerCat.includes('comida'))) return true;
                if (key === 'transport' && (lowerCat.includes('transport') || lowerCat.includes('carro'))) return true;
                if (key === 'housing' && (lowerCat.includes('casa') || lowerCat.includes('moradia') || lowerCat.includes('contas'))) return true;
                if (key === 'health' && (lowerCat.includes('saude') || lowerCat.includes('saúde'))) return true;
                if (key === 'entertainment' && (lowerCat.includes('lazer') || lowerCat.includes('diversão') || lowerCat.includes('streaming'))) return true;
                if (key === 'shopping' && (lowerCat.includes('compras'))) return true;
                if (key === 'salary' && (lowerCat.includes('salario') || lowerCat.includes('salário') || lowerCat.includes('renda'))) return true;
                if (key === 'education' && (lowerCat.includes('educação') || lowerCat.includes('estudo'))) return true;
                return false;
            });

            if (match) return match;
        }
    }

    return null;
};
