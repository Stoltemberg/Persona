import ExcelJS from 'exceljs';

export const exportDataToExcel = async (profileName, transactions, wallets, goals) => {
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
    const subHeaderFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF12c2e9' } // Secondary Color
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

    // Protect settings (password: persona123)
    // Note: ExcelJS implementation of sheet protection might vary in strictness depending on viewer, 
    // but we will apply standard protection.
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

    // --- SHEET 1: DASHBOARD / RESUMO ---
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
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const balance = totalIncome - totalExpense;

    const summaryData = [
        ['Métrica', 'Valor'],
        ['Total Receitas', totalIncome],
        ['Total Despesas', totalExpense],
        ['Saldo Líquido', balance]
    ];

    summarySheet.addTable({
        name: 'ResumoTable',
        ref: 'B5',
        headerRow: true,
        totalsRow: false,
        style: {
            theme: 'TableStyleMedium9',
            showRowStripes: true,
        },
        columns: [
            { name: 'Métrica', filterButton: false },
            { name: 'Valor', filterButton: false },
        ],
        rows: summaryData.slice(1) // Remove header from data array as distinct columns def provided? No, addTable expects rows without header if headerRow is true? ExcelJS specific.
        // Actually easiest is to just write rows manually for full style control
    });

    // Let's write manually to control style better
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

    ['C6', 'C7', 'C8'].forEach(cell => {
        summarySheet.getCell(cell).numFmt = '"R$ "#,##0.00';
    });

    // Borders
    ['B5', 'C5', 'B6', 'C6', 'B7', 'C7', 'B8', 'C8'].forEach(cell => {
        summarySheet.getCell(cell).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    summarySheet.getColumn('B').width = 25;
    summarySheet.getColumn('C').width = 25;

    await summarySheet.protect('persona123', protectionSettings);


    // --- SHEET 2: TRANSAÇÕES ---
    const txSheet = workbook.addWorksheet('Transações');
    txSheet.properties.tabColor = { argb: 'FF12c2e9' };

    txSheet.columns = [
        { header: 'Data', key: 'date', width: 15 },
        { header: 'Descrição', key: 'description', width: 30 },
        { header: 'Categoria', key: 'category', width: 20 },
        { header: 'Tipo', key: 'type', width: 15 },
        { header: 'Valor', key: 'amount', width: 20 },
        { header: 'Carteira', key: 'wallet', width: 20 }
    ];

    // Header Style
    txSheet.getRow(1).font = headerFont;
    txSheet.getRow(1).fill = headerFill;

    transactions.forEach(tx => {
        const row = txSheet.addRow({
            date: new Date(tx.date),
            description: tx.description,
            category: tx.category,
            type: tx.type === 'income' ? 'Receita' : 'Despesa',
            amount: parseFloat(tx.amount),
            wallet: wallets.find(w => w.id === tx.wallet_id)?.name || '-'
        });

        // Color coding for amount
        if (tx.type === 'income') {
            row.getCell('amount').font = { color: { argb: 'FF0000FF' } }; // Blueish
        } else {
            row.getCell('amount').font = { color: { argb: 'FFFF0000' } }; // Red
        }
    });

    // Formatting
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
        const income = walletTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
        const expense = walletTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
        const current = (parseFloat(w.initial_balance) || 0) + income - expense;

        walletSheet.addRow({
            name: w.name,
            type: w.type,
            initial: parseFloat(w.initial_balance),
            current: current
        });
    });

    walletSheet.getColumn('initial').numFmt = '"R$ "#,##0.00';
    walletSheet.getColumn('current').numFmt = '"R$ "#,##0.00';

    await walletSheet.protect('persona123', protectionSettings);


    // --- GENERATE FILE ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Relatorio_Financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
};
