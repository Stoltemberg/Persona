const xmlEscape = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('pt-BR');
};

const createCell = (value, styleId = 'Default') => ({
    value: value ?? '',
    styleId,
});

const createRow = (cells, options = {}) => ({
    cells,
    ...options,
});

const buildWorksheetXml = ({ name, columns = [], rows = [] }) => {
    const columnsXml = columns
        .map((width) => `<Column ss:AutoFitWidth="0" ss:Width="${width}" />`)
        .join('');

    const rowsXml = rows.map((row) => {
        const attributes = [];
        if (row.height) attributes.push(`ss:AutoFitHeight="0" ss:Height="${row.height}"`);

        const cellsXml = row.cells.map((cell) => {
            const type = typeof cell.value === 'number' ? 'Number' : 'String';
            const style = cell.styleId ? ` ss:StyleID="${cell.styleId}"` : '';
            return `<Cell${style}><Data ss:Type="${type}">${xmlEscape(cell.value)}</Data></Cell>`;
        }).join('');

        return `<Row ${attributes.join(' ')}>${cellsXml}</Row>`;
    }).join('');

    return `
        <Worksheet ss:Name="${xmlEscape(name)}">
            <Table>
                ${columnsXml}
                ${rowsXml}
            </Table>
        </Worksheet>
    `;
};

const buildWorkbookXml = (worksheets) => `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
    <Styles>
        <Style ss:ID="Default" ss:Name="Normal">
            <Alignment ss:Vertical="Center" />
            <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1C1C1E" />
        </Style>
        <Style ss:ID="Title">
            <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#1C1C1E" />
        </Style>
        <Style ss:ID="Subtitle">
            <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#6E6E73" />
        </Style>
        <Style ss:ID="Header">
            <Alignment ss:Horizontal="Center" ss:Vertical="Center" />
            <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF" />
            <Interior ss:Color="#4F29F0" ss:Pattern="Solid" />
        </Style>
        <Style ss:ID="Section">
            <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#4F29F0" />
        </Style>
        <Style ss:ID="Currency">
            <NumberFormat ss:Format="&quot;R$&quot; #,##0.00" />
        </Style>
        <Style ss:ID="CurrencyPositive">
            <Font ss:Color="#1E8E3E" ss:Bold="1" />
            <NumberFormat ss:Format="&quot;R$&quot; #,##0.00" />
        </Style>
        <Style ss:ID="CurrencyNegative">
            <Font ss:Color="#D93025" ss:Bold="1" />
            <NumberFormat ss:Format="&quot;R$&quot; #,##0.00" />
        </Style>
        <Style ss:ID="Percentage">
            <NumberFormat ss:Format="0.0%" />
        </Style>
    </Styles>
    ${worksheets.map(buildWorksheetXml).join('')}
</Workbook>`;

const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
};

export const exportTransactionsToCsv = (transactions) => {
    const rows = [
        ['Data', 'Descricao', 'Categoria', 'Tipo', 'Subtipo', 'Valor'],
        ...transactions.map((tx) => {
            const subtype = tx.expense_type === 'fixed' ? 'Fixo'
                : tx.expense_type === 'variable' ? 'Variavel'
                    : tx.expense_type === 'lifestyle' ? 'Lazer'
                        : '-';

            return [
                formatDate(tx.date),
                tx.description || 'Sem descricao',
                tx.category || 'Geral',
                tx.type === 'income' ? 'Receita' : 'Despesa',
                subtype,
                formatCurrency(tx.amount)
            ];
        }),
    ];

    const csvContent = rows
        .map((row) => row.map(escapeCsvValue).join(';'))
        .join('\n');

    downloadBlob(`\uFEFF${csvContent}`, `Transacoes_Persona_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
};

export const exportDataToExcel = async (profileName, transactions, wallets, goals, categories, budgets) => {
    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    const balance = totalIncome - totalExpense;
    const currentMonthExpense = transactions
        .filter((t) => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth() && new Date(t.date).getFullYear() === new Date().getFullYear())
        .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

    const categoryTotals = {};
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
        const categoryName = t.category || 'Outros';
        if (!categoryTotals[categoryName]) categoryTotals[categoryName] = 0;
        categoryTotals[categoryName] += parseFloat(t.amount || 0);
    });

    const now = new Date();
    const currentMonthTxs = transactions.filter((t) =>
        t.type === 'expense' &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
    );

    const monthlySpentMap = {};
    currentMonthTxs.forEach((t) => {
        const categoryName = t.category || 'Geral';
        if (!monthlySpentMap[categoryName]) monthlySpentMap[categoryName] = 0;
        monthlySpentMap[categoryName] += parseFloat(t.amount || 0);
    });

    const worksheets = [
        {
            name: 'Resumo',
            columns: [220, 180, 180],
            rows: [
                createRow([createCell(`Relatório Financeiro - ${profileName}`, 'Title')], { height: 26 }),
                createRow([createCell(`Gerado em: ${formatDate(now)} às ${now.toLocaleTimeString('pt-BR')}`, 'Subtitle')]),
                createRow([createCell('')]),
                createRow([createCell('Métrica', 'Header'), createCell('Valor', 'Header')]),
                createRow([createCell('Receitas Totais'), createCell(totalIncome, 'CurrencyPositive')]),
                createRow([createCell('Despesas Totais'), createCell(totalExpense, 'CurrencyNegative')]),
                createRow([createCell('Saldo Geral'), createCell(balance, balance >= 0 ? 'CurrencyPositive' : 'CurrencyNegative')]),
                createRow([createCell('Despesas (Mês Atual)'), createCell(currentMonthExpense, 'CurrencyNegative')]),
                createRow([createCell('')]),
                createRow([createCell('Gastos por Categoria', 'Section')]),
                createRow([createCell('Categoria', 'Header'), createCell('Total', 'Header')]),
                ...Object.entries(categoryTotals).map(([categoryName, value]) =>
                    createRow([createCell(categoryName), createCell(value, 'CurrencyNegative')])
                ),
            ],
        },
        {
            name: 'Transações',
            columns: [90, 240, 130, 100, 110, 140],
            rows: [
                createRow([
                    createCell('Data', 'Header'),
                    createCell('Descrição', 'Header'),
                    createCell('Categoria', 'Header'),
                    createCell('Tipo', 'Header'),
                    createCell('Valor', 'Header'),
                    createCell('Carteira', 'Header'),
                ]),
                ...transactions.map((tx) => createRow([
                    createCell(formatDate(tx.date)),
                    createCell(tx.description || 'Sem descrição'),
                    createCell(tx.category || 'Geral'),
                    createCell(tx.type === 'income' ? 'Receita' : 'Despesa'),
                    createCell(Number(tx.amount || 0), tx.type === 'income' ? 'CurrencyPositive' : 'CurrencyNegative'),
                    createCell(wallets.find((wallet) => wallet.id === tx.wallet_id)?.name || '-'),
                ])),
            ],
        },
        {
            name: 'Carteiras',
            columns: [180, 120, 130, 140],
            rows: [
                createRow([
                    createCell('Nome', 'Header'),
                    createCell('Tipo', 'Header'),
                    createCell('Saldo Inicial', 'Header'),
                    createCell('Saldo Atual', 'Header'),
                ]),
                ...wallets.map((wallet) => {
                    const walletTransactions = transactions.filter((tx) => tx.wallet_id === wallet.id);
                    const income = walletTransactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
                    const expense = walletTransactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
                    const currentBalance = (parseFloat(wallet.initial_balance) || 0) + income - expense;

                    return createRow([
                        createCell(wallet.name),
                        createCell(wallet.type?.replace('_', ' ') || '-'),
                        createCell(Number(wallet.initial_balance || 0), 'Currency'),
                        createCell(currentBalance, currentBalance >= 0 ? 'CurrencyPositive' : 'CurrencyNegative'),
                    ]);
                }),
            ],
        },
        {
            name: 'Metas',
            columns: [220, 120, 120, 100, 100],
            rows: [
                createRow([
                    createCell('Objetivo', 'Header'),
                    createCell('Valor Alvo', 'Header'),
                    createCell('Acumulado', 'Header'),
                    createCell('Prazo', 'Header'),
                    createCell('Progresso', 'Header'),
                ]),
                ...goals.map((goal) => {
                    const target = Number(goal.target_amount || 0);
                    const current = Number(goal.current_amount || 0);
                    const progress = target > 0 ? current / target : 0;
                    return createRow([
                        createCell(goal.title),
                        createCell(target, 'Currency'),
                        createCell(current, 'CurrencyPositive'),
                        createCell(formatDate(goal.deadline)),
                        createCell(progress, 'Percentage'),
                    ]);
                }),
            ],
        },
        {
            name: 'Orçamentos',
            columns: [180, 130, 130, 150],
            rows: [
                createRow([
                    createCell('Categoria', 'Header'),
                    createCell('Limite Mensal', 'Header'),
                    createCell('Gasto Atual', 'Header'),
                    createCell('Status', 'Header'),
                ]),
                ...categories.flatMap((category) => {
                    const budget = budgets.find((item) => item.category_id === category.id);
                    if (!budget) return [];

                    const limit = Number(budget.amount || 0);
                    const spent = monthlySpentMap[category.name] || 0;
                    const exceeded = spent > limit;

                    return [createRow([
                        createCell(category.name),
                        createCell(limit, 'Currency'),
                        createCell(spent, exceeded ? 'CurrencyNegative' : 'Currency'),
                        createCell(exceeded ? 'Excedido' : 'Dentro do limite'),
                    ])];
                }),
            ],
        },
    ];

    const workbookXml = buildWorkbookXml(worksheets);
    downloadBlob(workbookXml, `Planilha_Persona_${new Date().toISOString().split('T')[0]}.xml`, 'application/vnd.ms-excel');
};

export const exportTransactionsToExcel = async (transactions) => {
    const worksheet = {
        name: 'Transações',
        columns: [90, 240, 130, 100, 100, 120],
        rows: [
            createRow([
                createCell('Data', 'Header'),
                createCell('Descrição', 'Header'),
                createCell('Categoria', 'Header'),
                createCell('Tipo', 'Header'),
                createCell('Subtipo', 'Header'),
                createCell('Valor', 'Header'),
            ]),
            ...transactions.map((tx) => {
                const subtype = tx.expense_type === 'fixed' ? 'Fixo'
                    : tx.expense_type === 'variable' ? 'Variável'
                        : tx.expense_type === 'lifestyle' ? 'Lazer'
                            : '-';

                return createRow([
                    createCell(formatDate(tx.date)),
                    createCell(tx.description || 'Sem descrição'),
                    createCell(tx.category || 'Geral'),
                    createCell(tx.type === 'income' ? 'Receita' : 'Despesa'),
                    createCell(subtype),
                    createCell(Number(tx.amount || 0), tx.type === 'income' ? 'CurrencyPositive' : 'CurrencyNegative'),
                ]);
            }),
        ],
    };

    const workbookXml = buildWorkbookXml([worksheet]);
    downloadBlob(workbookXml, `Transacoes_Persona_${new Date().toISOString().split('T')[0]}.xml`, 'application/vnd.ms-excel');
};
