import ExcelJS from 'exceljs';

export const exportDataToExcel = async (profileName, transactions, wallets, goals, categories, budgets) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Persona App';
    workbook.lastModifiedBy = 'Persona App';
    workbook.created = new Date();
    workbook.modified = new Date();

    // --- STYLES ---
    const headerFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4f29f0' } // Primary Brand Color
    };
    const headerFont = {
        name: 'Arial',
        color: { argb: 'FFFFFFFF' },
        size: 12,
        bold: true
    };
    const titleFont = {
        name: 'Arial',
        color: { argb: 'FF333333' },
        size: 16,
        bold: true
    };

    const protectionSettings = {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: true,
        autoFilter: true,
        pivotTables: false
    };

    // --- SHEET 1: RESUMO ---
    const summarySheet = workbook.addWorksheet('Resumo');
    summarySheet.properties.tabColor = { argb: 'FF4f29f0' };

    summarySheet.mergeCells('B2:E2');
    summarySheet.getCell('B2').value = `Relatório Financeiro - ${profileName}`;
    summarySheet.getCell('B2').font = titleFont;
    summarySheet.getCell('B2').alignment = { horizontal: 'center' };

    summarySheet.mergeCells('B3:E3');
    summarySheet.getCell('B3').value = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
    summarySheet.getCell('B3').alignment = { horizontal: 'center' };

    // Metrics
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    const balance = totalIncome - totalExpense;
    const currentMonthExpense = transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth() && new Date(t.date).getFullYear() === new Date().getFullYear())
        .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

    // Summary Table headers
    summarySheet.getCell('B5').value = 'Métrica';
    summarySheet.getCell('C5').value = 'Valor';
    summarySheet.getRow(5).font = headerFont;
    summarySheet.getCell('B5').fill = headerFill;
    summarySheet.getCell('C5').fill = headerFill;

    summarySheet.getCell('B6').value = 'Receitas Totais';
    summarySheet.getCell('C6').value = totalIncome;
    summarySheet.getCell('B7').value = 'Despesas Totais';
    summarySheet.getCell('C7').value = totalExpense;
    summarySheet.getCell('B8').value = 'Saldo Geral';
    summarySheet.getCell('C8').value = balance;
    summarySheet.getCell('B9').value = 'Despesas (Mês Atual)';
    summarySheet.getCell('C9').value = currentMonthExpense;

    ['C6', 'C7', 'C8', 'C9'].forEach(cell => {
        summarySheet.getCell(cell).numFmt = '"R$ "#,##0.00';
    });

    // Categorias Table below
    let row = 12;
    summarySheet.mergeCells(`B${row}:C${row}`);
    summarySheet.getCell(`B${row}`).value = 'Gastos por Categoria (Histórico)';
    summarySheet.getCell(`B${row}`).font = { bold: true, size: 12 };

    row++;
    summarySheet.getCell(`B${row}`).value = 'Categoria';
    summarySheet.getCell(`C${row}`).value = 'Total';
    summarySheet.getRow(row).font = headerFont;
    summarySheet.getCell(`B${row}`).fill = headerFill;
    summarySheet.getCell(`C${row}`).fill = headerFill;

    // Calculate Category Totals
    const catTotals = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const catName = t.category || 'Outros';
        if (!catTotals[catName]) catTotals[catName] = 0;
        catTotals[catName] += parseFloat(t.amount || 0);
    });

    Object.entries(catTotals).forEach(([cat, val]) => {
        row++;
        summarySheet.getCell(`B${row}`).value = cat;
        summarySheet.getCell(`C${row}`).value = val;
        summarySheet.getCell(`C${row}`).numFmt = '"R$ "#,##0.00';
    });

    summarySheet.getColumn('B').width = 30;
    summarySheet.getColumn('C').width = 25;

    await summarySheet.protect('persona123', protectionSettings);


    // --- SHEET 2: TRANSAÇÕES ---
    const txSheet = workbook.addWorksheet('Transações');
    txSheet.properties.tabColor = { argb: 'FF12c2e9' };

    txSheet.columns = [
        { header: 'Data', key: 'date', width: 15 },
        { header: 'Descrição', key: 'description', width: 35 },
        { header: 'Categoria', key: 'category', width: 20 },
        { header: 'Tipo', key: 'type', width: 15 },
        { header: 'Valor', key: 'amount', width: 20 },
        { header: 'Carteira', key: 'wallet', width: 20 }
    ];

    txSheet.getRow(1).font = headerFont;
    txSheet.getRow(1).fill = headerFill;

    if (transactions && transactions.length > 0) {
        transactions.forEach(tx => {
            const row = txSheet.addRow({
                date: new Date(tx.date),
                description: tx.description || 'Sem descrição',
                category: tx.category || 'Geral',
                type: tx.type === 'income' ? 'Receita' : 'Despesa',
                amount: parseFloat(tx.amount || 0),
                wallet: wallets.find(w => w.id === tx.wallet_id)?.name || '-'
            });

            if (tx.type === 'income') {
                row.getCell('amount').font = { color: { argb: 'FF0000FF' } };
            } else {
                row.getCell('amount').font = { color: { argb: 'FFFF0000' } };
            }
        });
    }

    txSheet.getColumn('amount').numFmt = '"R$ "#,##0.00';
    txSheet.getColumn('date').numFmt = 'dd/mm/yyyy';

    await txSheet.protect('persona123', protectionSettings);


    // --- SHEET 3: CARTEIRAS ---
    const walletSheet = workbook.addWorksheet('Carteiras');
    walletSheet.properties.tabColor = { argb: 'FFc471ed' };

    walletSheet.columns = [
        { header: 'Nome', key: 'name', width: 25 },
        { header: 'Tipo', key: 'type', width: 20 },
        { header: 'Saldo Inicial', key: 'initial', width: 20 },
        { header: 'Saldo Atual (Calc.)', key: 'current', width: 20 }
    ];

    walletSheet.getRow(1).font = headerFont;
    walletSheet.getRow(1).fill = headerFill;

    wallets.forEach(w => {
        const walletTxs = transactions.filter(tx => tx.wallet_id === w.id);
        const income = walletTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
        const expense = walletTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
        const current = (parseFloat(w.initial_balance) || 0) + income - expense;

        walletSheet.addRow({
            name: w.name,
            type: w.type?.replace('_', ' '),
            initial: parseFloat(w.initial_balance || 0),
            current: current
        });
    });

    walletSheet.getColumn('initial').numFmt = '"R$ "#,##0.00';
    walletSheet.getColumn('current').numFmt = '"R$ "#,##0.00';

    await walletSheet.protect('persona123', protectionSettings);

    // --- SHEET 4: METAS (GOALS) ---
    const goalSheet = workbook.addWorksheet('Metas');
    goalSheet.properties.tabColor = { argb: 'FF4f29f0' }; // Use Primary

    goalSheet.columns = [
        { header: 'Objetivo', key: 'title', width: 30 },
        { header: 'Valor Alvo', key: 'target', width: 20 },
        { header: 'Acumulado', key: 'current', width: 20 },
        { header: 'Prazo', key: 'deadline', width: 15 },
        { header: 'Progresso', key: 'progress', width: 15 }
    ];

    goalSheet.getRow(1).font = headerFont;
    goalSheet.getRow(1).fill = headerFill;

    goals.forEach(g => {
        const target = parseFloat(g.target_amount || 0);
        const current = parseFloat(g.current_amount || 0);
        const progress = target > 0 ? (current / target) : 0;

        goalSheet.addRow({
            title: g.title,
            target: target,
            current: current,
            deadline: g.deadline ? new Date(g.deadline) : '-',
            progress: progress
        });
    });

    goalSheet.getColumn('target').numFmt = '"R$ "#,##0.00';
    goalSheet.getColumn('current').numFmt = '"R$ "#,##0.00';
    goalSheet.getColumn('deadline').numFmt = 'dd/mm/yyyy';
    goalSheet.getColumn('progress').numFmt = '0.0%';

    await goalSheet.protect('persona123', protectionSettings);

    // --- SHEET 5: ORÇAMENTOS (BUDGETS) ---
    const budgetSheet = workbook.addWorksheet('Orçamentos');
    budgetSheet.properties.tabColor = { argb: 'FFFF5722' }; // Orange-ish

    budgetSheet.columns = [
        { header: 'Categoria', key: 'category', width: 25 },
        { header: 'Limite Mensal', key: 'limit', width: 20 },
        { header: 'Gasto (Mês Atual)', key: 'spent', width: 20 },
        { header: 'Status', key: 'status', width: 20 }
    ];

    budgetSheet.getRow(1).font = headerFont;
    budgetSheet.getRow(1).fill = headerFill;

    // Calculate monthly spent
    const now = new Date();
    const currentMonthTxs = transactions.filter(t =>
        t.type === 'expense' &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
    );

    const monthlySpentMap = {};
    currentMonthTxs.forEach(t => {
        const cat = t.category || 'Geral';
        if (!monthlySpentMap[cat]) monthlySpentMap[cat] = 0;
        monthlySpentMap[cat] += parseFloat(t.amount || 0);
    });

    // If categories data passed, Iterate; else iterate budgets?
    // Categories should be passed.
    if (categories && categories.length > 0) {
        categories.forEach(cat => {
            const budget = budgets.find(b => b.category_id === cat.id);
            if (budget) {
                const limit = parseFloat(budget.amount || 0);
                const spent = monthlySpentMap[cat.name] || 0;

                const row = budgetSheet.addRow({
                    category: cat.name,
                    limit: limit,
                    spent: spent,
                    status: spent > limit ? 'EXCEDIDO' : 'Dentro do Limite'
                });

                if (spent > limit) {
                    row.getCell('status').font = { color: { argb: 'FFFF0000' }, bold: true };
                    row.getCell('spent').font = { color: { argb: 'FFFF0000' } };
                }
            }
        });
    }

    budgetSheet.getColumn('limit').numFmt = '"R$ "#,##0.00';
    budgetSheet.getColumn('spent').numFmt = '"R$ "#,##0.00';

    await budgetSheet.protect('persona123', protectionSettings);

    // --- GENERATE FILE ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Relatorio_Completo_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
};


export const exportTransactionsToExcel = async (transactions) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Persona App';
    workbook.lastModifiedBy = 'Persona App';

    const headerFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4f29f0' } // Primary Brand Color
    };
    const headerFont = {
        name: 'Segoe UI',
        color: { argb: 'FFFFFFFF' },
        size: 11,
        bold: true
    };
    const protectionSettings = {
        autoFilter: true,
        sort: true,
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: true,
        formatColumns: true
    };

    const sheet = workbook.addWorksheet('Transações');

    // Improve column widths
    sheet.columns = [
        { header: 'Data', key: 'date', width: 14 },
        { header: 'Descrição', key: 'description', width: 40 },
        { header: 'Categoria', key: 'category', width: 20 },
        { header: 'Tipo', key: 'type', width: 15 },
        { header: 'Subtipo', key: 'subtype', width: 15 },
        { header: 'Valor', key: 'amount', width: 18 }
    ];

    // Style Header
    sheet.getRow(1).font = headerFont;
    sheet.getRow(1).fill = headerFill;
    sheet.getRow(1).height = 25; // Taller header
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    transactions.forEach(tx => {
        const subtype = tx.expense_type === 'fixed' ? 'Fixo' :
            tx.expense_type === 'variable' ? 'Variável' :
                tx.expense_type === 'lifestyle' ? 'Lazer' : '-';

        const row = sheet.addRow({
            date: new Date(tx.date),
            description: tx.description,
            category: tx.category || 'Geral',
            type: tx.type === 'income' ? 'Receita' : 'Despesa',
            subtype: subtype,
            amount: parseFloat(tx.amount || 0)
        });

        // Color coding for amounts
        if (tx.type === 'income') {
            row.getCell('amount').font = { color: { argb: 'FF0000FF' } };
        } else {
            row.getCell('amount').font = { color: { argb: 'FFFF0000' } };
        }

        // Align date and currency content
        row.getCell('date').alignment = { horizontal: 'center' };
        // Description left aligned (default)
        row.getCell('type').alignment = { horizontal: 'center' };
        row.getCell('subtype').alignment = { horizontal: 'center' };
    });

    // Formatting
    sheet.getColumn('amount').numFmt = '"R$ "#,##0.00';
    sheet.getColumn('date').numFmt = 'dd/mm/yyyy';

    await sheet.protect('persona123', protectionSettings);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Transacoes_Persona_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
};
