const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const SHEET_PROTECTION_PASSWORD = 'Persona2026';

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

const STYLE_INDEX = {
    Default: 0,
    Title: 1,
    Subtitle: 2,
    Header: 3,
    Section: 4,
    Currency: 5,
    CurrencyPositive: 6,
    CurrencyNegative: 7,
    Percentage: 8,
};

const textEncoder = new TextEncoder();

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
        let crc = index;
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
        }
        table[index] = crc >>> 0;
    }
    return table;
})();

const toUint8Array = (content) => (
    typeof content === 'string' ? textEncoder.encode(content) : content
);

const concatUint8Arrays = (chunks) => {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;

    chunks.forEach((chunk) => {
        merged.set(chunk, offset);
        offset += chunk.length;
    });

    return merged;
};

const crc32 = (bytes) => {
    let crc = 0xFFFFFFFF;

    for (let index = 0; index < bytes.length; index += 1) {
        crc = CRC_TABLE[(crc ^ bytes[index]) & 0xFF] ^ (crc >>> 8);
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
};

const createZipHeader = (signature, size) => {
    const bytes = new Uint8Array(size);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, signature, true);
    return { bytes, view };
};

const getDosDateTime = (date = new Date()) => {
    const year = Math.max(date.getFullYear(), 1980);
    const dosTime = (date.getSeconds() >> 1) | (date.getMinutes() << 5) | (date.getHours() << 11);
    const dosDate = date.getDate() | ((date.getMonth() + 1) << 5) | ((year - 1980) << 9);
    return { dosTime, dosDate };
};

const buildZip = (entries) => {
    let offset = 0;
    const localChunks = [];
    const centralChunks = [];
    const { dosTime, dosDate } = getDosDateTime();

    entries.forEach((entry) => {
        const fileNameBytes = textEncoder.encode(entry.name);
        const dataBytes = toUint8Array(entry.content);
        const crc = crc32(dataBytes);

        const localHeader = createZipHeader(0x04034B50, 30);
        localHeader.view.setUint16(4, 20, true);
        localHeader.view.setUint16(6, 0, true);
        localHeader.view.setUint16(8, 0, true);
        localHeader.view.setUint16(10, dosTime, true);
        localHeader.view.setUint16(12, dosDate, true);
        localHeader.view.setUint32(14, crc, true);
        localHeader.view.setUint32(18, dataBytes.length, true);
        localHeader.view.setUint32(22, dataBytes.length, true);
        localHeader.view.setUint16(26, fileNameBytes.length, true);
        localHeader.view.setUint16(28, 0, true);

        localChunks.push(localHeader.bytes, fileNameBytes, dataBytes);

        const centralHeader = createZipHeader(0x02014B50, 46);
        centralHeader.view.setUint16(4, 20, true);
        centralHeader.view.setUint16(6, 20, true);
        centralHeader.view.setUint16(8, 0, true);
        centralHeader.view.setUint16(10, 0, true);
        centralHeader.view.setUint16(12, dosTime, true);
        centralHeader.view.setUint16(14, dosDate, true);
        centralHeader.view.setUint32(16, crc, true);
        centralHeader.view.setUint32(20, dataBytes.length, true);
        centralHeader.view.setUint32(24, dataBytes.length, true);
        centralHeader.view.setUint16(28, fileNameBytes.length, true);
        centralHeader.view.setUint16(30, 0, true);
        centralHeader.view.setUint16(32, 0, true);
        centralHeader.view.setUint16(34, 0, true);
        centralHeader.view.setUint16(36, 0, true);
        centralHeader.view.setUint32(38, 0, true);
        centralHeader.view.setUint32(42, offset, true);

        centralChunks.push(centralHeader.bytes, fileNameBytes);

        offset += localHeader.bytes.length + fileNameBytes.length + dataBytes.length;
    });

    const centralDirectory = concatUint8Arrays(centralChunks);
    const localFiles = concatUint8Arrays(localChunks);

    const endOfCentralDirectory = createZipHeader(0x06054B50, 22);
    endOfCentralDirectory.view.setUint16(8, entries.length, true);
    endOfCentralDirectory.view.setUint16(10, entries.length, true);
    endOfCentralDirectory.view.setUint32(12, centralDirectory.length, true);
    endOfCentralDirectory.view.setUint32(16, localFiles.length, true);
    endOfCentralDirectory.view.setUint16(20, 0, true);

    return concatUint8Arrays([localFiles, centralDirectory, endOfCentralDirectory.bytes]);
};

const numberToColumnLabel = (columnNumber) => {
    let current = columnNumber;
    let label = '';

    while (current > 0) {
        const remainder = (current - 1) % 26;
        label = String.fromCharCode(65 + remainder) + label;
        current = Math.floor((current - 1) / 26);
    }

    return label;
};

const toExcelWidth = (pixels) => Math.max(8, Number(Math.max((pixels - 5) / 7, 8).toFixed(2)));

const hashSheetPassword = (password) => {
    let hash = 0;

    for (let index = password.length - 1; index >= 0; index -= 1) {
        const charCode = password.charCodeAt(index);
        const lowBit = hash & 0x0001;
        hash = (hash >> 1) & 0x7FFF;
        if (lowBit) hash |= 0x4000;
        hash ^= charCode;
    }

    hash ^= password.length;
    hash ^= 0xCE4B;
    return hash.toString(16).toUpperCase().padStart(4, '0');
};

const createWorksheetXml = ({ name, columns = [], rows = [] }) => {
    const colsXml = columns.length > 0
        ? `<cols>${columns.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${toExcelWidth(width)}" customWidth="1"/>`).join('')}</cols>`
        : '';

    const rowsXml = rows.map((row, rowIndex) => {
        const rowNumber = rowIndex + 1;
        const rowAttributes = [`r="${rowNumber}"`];

        if (row.height) {
            rowAttributes.push(`ht="${row.height}"`);
            rowAttributes.push('customHeight="1"');
        }

        const cellsXml = row.cells.map((cell, cellIndex) => {
            const cellRef = `${numberToColumnLabel(cellIndex + 1)}${rowNumber}`;
            const styleId = STYLE_INDEX[cell.styleId] ?? STYLE_INDEX.Default;
            const baseAttrs = `r="${cellRef}" s="${styleId}"`;

            if (typeof cell.value === 'number') {
                return `<c ${baseAttrs}><v>${cell.value}</v></c>`;
            }

            return `<c ${baseAttrs} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell.value)}</t></is></c>`;
        }).join('');

        return `<row ${rowAttributes.join(' ')}>${cellsXml}</row>`;
    }).join('');

    const passwordHash = hashSheetPassword(SHEET_PROTECTION_PASSWORD);

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <sheetViews>
        <sheetView workbookViewId="0"/>
    </sheetViews>
    <sheetFormatPr defaultRowHeight="15"/>
    ${colsXml}
    <sheetData>${rowsXml}</sheetData>
    <sheetProtection sheet="1" objects="1" scenarios="1" password="${passwordHash}"/>
</worksheet>`;
};

const createStylesXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <numFmts count="2">
        <numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00"/>
        <numFmt numFmtId="165" formatCode="0.0%"/>
    </numFmts>
    <fonts count="7">
        <font><sz val="11"/><color rgb="FF1C1C1E"/><name val="Calibri"/></font>
        <font><b/><sz val="16"/><color rgb="FF1C1C1E"/><name val="Calibri"/></font>
        <font><sz val="11"/><color rgb="FF6E6E73"/><name val="Calibri"/></font>
        <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
        <font><b/><sz val="12"/><color rgb="FF4F29F0"/><name val="Calibri"/></font>
        <font><b/><sz val="11"/><color rgb="FF1E8E3E"/><name val="Calibri"/></font>
        <font><b/><sz val="11"/><color rgb="FFD93025"/><name val="Calibri"/></font>
    </fonts>
    <fills count="3">
        <fill><patternFill patternType="none"/></fill>
        <fill><patternFill patternType="gray125"/></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="FF4F29F0"/><bgColor indexed="64"/></patternFill></fill>
    </fills>
    <borders count="1">
        <border><left/><right/><top/><bottom/><diagonal/></border>
    </borders>
    <cellStyleXfs count="1">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    </cellStyleXfs>
    <cellXfs count="9">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
        <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
        <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
        <xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
        <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
        <xf numFmtId="164" fontId="5" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
        <xf numFmtId="164" fontId="6" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
        <xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    </cellXfs>
    <cellStyles count="1">
        <cellStyle name="Normal" xfId="0" builtinId="0"/>
    </cellStyles>
</styleSheet>`;

const createWorkbookXml = (worksheets) => {
    const passwordHash = hashSheetPassword(SHEET_PROTECTION_PASSWORD);

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <workbookProtection workbookPassword="${passwordHash}" lockStructure="1"/>
    <bookViews>
        <workbookView xWindow="0" yWindow="0" windowWidth="18000" windowHeight="9000"/>
    </bookViews>
    <sheets>
        ${worksheets.map((worksheet, index) => `<sheet name="${xmlEscape(worksheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}
    </sheets>
</workbook>`;
};

const createWorkbookRelsXml = (worksheets) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    ${worksheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('')}
    <Relationship Id="rId${worksheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const createRootRelsXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const createContentTypesXml = (worksheets) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
    <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
    <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
    ${worksheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
</Types>`;

const createCorePropsXml = () => {
    const created = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dc:creator>Persona</dc:creator>
    <cp:lastModifiedBy>Persona</cp:lastModifiedBy>
    <dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created>
    <dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified>
</cp:coreProperties>`;
};

const createAppPropsXml = (worksheets) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
    <Application>Persona</Application>
    <TitlesOfParts>
        <vt:vector size="${worksheets.length}" baseType="lpstr">
            ${worksheets.map((worksheet) => `<vt:lpstr>${xmlEscape(worksheet.name)}</vt:lpstr>`).join('')}
        </vt:vector>
    </TitlesOfParts>
</Properties>`;

const buildXlsxBuffer = (worksheets) => {
    const entries = [
        { name: '[Content_Types].xml', content: createContentTypesXml(worksheets) },
        { name: '_rels/.rels', content: createRootRelsXml() },
        { name: 'docProps/core.xml', content: createCorePropsXml() },
        { name: 'docProps/app.xml', content: createAppPropsXml(worksheets) },
        { name: 'xl/workbook.xml', content: createWorkbookXml(worksheets) },
        { name: 'xl/_rels/workbook.xml.rels', content: createWorkbookRelsXml(worksheets) },
        { name: 'xl/styles.xml', content: createStylesXml() },
        ...worksheets.map((worksheet, index) => ({
            name: `xl/worksheets/sheet${index + 1}.xml`,
            content: createWorksheetXml(worksheet),
        })),
    ];

    return buildZip(entries);
};

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
                formatCurrency(tx.amount),
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
                createRow([createCell(`Relatorio Financeiro - ${profileName}`, 'Title')], { height: 26 }),
                createRow([createCell(`Gerado em: ${formatDate(now)} as ${now.toLocaleTimeString('pt-BR')}`, 'Subtitle')]),
                createRow([createCell('')]),
                createRow([createCell('Metrica', 'Header'), createCell('Valor', 'Header')]),
                createRow([createCell('Receitas Totais'), createCell(totalIncome, 'CurrencyPositive')]),
                createRow([createCell('Despesas Totais'), createCell(totalExpense, 'CurrencyNegative')]),
                createRow([createCell('Saldo Geral'), createCell(balance, balance >= 0 ? 'CurrencyPositive' : 'CurrencyNegative')]),
                createRow([createCell('Despesas (Mes Atual)'), createCell(currentMonthExpense, 'CurrencyNegative')]),
                createRow([createCell('')]),
                createRow([createCell('Gastos por Categoria', 'Section')]),
                createRow([createCell('Categoria', 'Header'), createCell('Total', 'Header')]),
                ...Object.entries(categoryTotals).map(([categoryName, value]) =>
                    createRow([createCell(categoryName), createCell(value, 'CurrencyNegative')])
                ),
            ],
        },
        {
            name: 'Transacoes',
            columns: [90, 240, 130, 100, 110, 140],
            rows: [
                createRow([
                    createCell('Data', 'Header'),
                    createCell('Descricao', 'Header'),
                    createCell('Categoria', 'Header'),
                    createCell('Tipo', 'Header'),
                    createCell('Valor', 'Header'),
                    createCell('Carteira', 'Header'),
                ]),
                ...transactions.map((tx) => createRow([
                    createCell(formatDate(tx.date)),
                    createCell(tx.description || 'Sem descricao'),
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
            name: 'Orcamentos',
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

    const workbook = buildXlsxBuffer(worksheets);
    downloadBlob(workbook, `Relatorio_Completo_Persona_${new Date().toISOString().split('T')[0]}.xlsx`, XLSX_MIME);
};

export const exportTransactionsToExcel = async (transactions) => {
    const worksheet = {
        name: 'Transacoes',
        columns: [90, 240, 130, 100, 100, 120],
        rows: [
            createRow([
                createCell('Data', 'Header'),
                createCell('Descricao', 'Header'),
                createCell('Categoria', 'Header'),
                createCell('Tipo', 'Header'),
                createCell('Subtipo', 'Header'),
                createCell('Valor', 'Header'),
            ]),
            ...transactions.map((tx) => {
                const subtype = tx.expense_type === 'fixed' ? 'Fixo'
                    : tx.expense_type === 'variable' ? 'Variavel'
                        : tx.expense_type === 'lifestyle' ? 'Lazer'
                            : '-';

                return createRow([
                    createCell(formatDate(tx.date)),
                    createCell(tx.description || 'Sem descricao'),
                    createCell(tx.category || 'Geral'),
                    createCell(tx.type === 'income' ? 'Receita' : 'Despesa'),
                    createCell(subtype),
                    createCell(Number(tx.amount || 0), tx.type === 'income' ? 'CurrencyPositive' : 'CurrencyNegative'),
                ]);
            }),
        ],
    };

    const workbook = buildXlsxBuffer([worksheet]);
    downloadBlob(workbook, `Transacoes_Persona_${new Date().toISOString().split('T')[0]}.xlsx`, XLSX_MIME);
};
