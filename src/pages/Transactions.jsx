import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Plus, ArrowUpRight, Download, Search, X } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/EmptyState';
import { getSmartCategory } from '../utils/smartCategories';
import { TransactionItem } from '../components/TransactionItem';
import { DateRangePicker } from '../components/DateRangePicker';
import { PageHeader } from '../components/PageHeader';
import { PartnerFilter } from '../components/PartnerFilter';
import { TransactionForm } from '../components/TransactionForm';

const getToday = () => new Date().toISOString().split('T')[0];

const formatDateInput = (value) => {
    if (!value) return getToday();
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return getToday();
    return parsed.toISOString().split('T')[0];
};

const sortTransactions = (items) => (
    [...items].sort((a, b) => new Date(b.date) - new Date(a.date))
);

const pageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.06,
            delayChildren: 0.04,
        },
    },
};

const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

const listVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
    exit: { opacity: 0, y: -8 },
};

export default function Transactions() {
    const { user, profile, markTransactionsAsRead } = useAuth();
    const { addToast, addActionToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || 'all');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [startDate, setStartDate] = useState(searchParams.get('start') || '');
    const [endDate, setEndDate] = useState(searchParams.get('end') || '');

    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(getToday());
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [expenseType, setExpenseType] = useState('variable');
    const [isRecurring, setIsRecurring] = useState(false);

    const [wallets, setWallets] = useState([]);
    const [selectedWalletId, setSelectedWalletId] = useState('');

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const pendingDeleteTimers = useRef(new Map());

    useEffect(() => {
        if (user) {
            markTransactionsAsRead();
            fetchTransactions();
            fetchCategories();
            fetchWallets();

            const handleSync = (event) => {
                const table = event?.detail?.table;

                if (!table || table === 'transactions') {
                    fetchTransactions();
                }

                if (!table || table === 'wallets') {
                    fetchWallets();
                }
            };

            window.addEventListener('supabase-sync', handleSync);
            return () => window.removeEventListener('supabase-sync', handleSync);
        }
    }, [user]);

    useEffect(() => () => {
        pendingDeleteTimers.current.forEach((timer) => clearTimeout(timer));
        pendingDeleteTimers.current.clear();
    }, []);

    useEffect(() => {
        const nextParams = new URLSearchParams();
        if (activeFilter !== 'all') nextParams.set('filter', activeFilter);
        if (searchQuery.trim()) nextParams.set('q', searchQuery.trim());
        if (startDate) nextParams.set('start', startDate);
        if (endDate) nextParams.set('end', endDate);
        setSearchParams(nextParams, { replace: true });
    }, [activeFilter, searchQuery, startDate, endDate, setSearchParams]);

    const fetchWallets = async () => {
        const { data } = await supabase.from('wallets').select('id, name, type, initial_balance, profile_id, created_at').order('created_at', { ascending: true });
        setWallets(data || []);

        if (data && data.length > 0 && !selectedWalletId) {
            setSelectedWalletId(data[0].id);
        }
    };

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('id, description, amount, type, category, wallet_id, date, profile_id, expense_type')
                .order('date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Erro ao buscar transacoes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('id, name, type, color, icon');
        setCategories(data || []);
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setDate(getToday());
        setType('expense');
        setCategory('');
        setExpenseType('variable');
        setTransactionToEdit(null);
        setSelectedCategory(null);
        setIsRecurring(false);
        setSelectedWalletId(wallets[0]?.id || '');
    };

    const handleTypeChange = (nextType) => {
        setType(nextType);
        setCategory('');
        setSelectedCategory(null);
    };

    const handleDescriptionChange = (value) => {
        setDescription(value);

        if (!transactionToEdit && value.length > 2 && !category) {
            const smartMatch = getSmartCategory(value, categories);
            if (smartMatch) {
                if (smartMatch.type !== type) setType(smartMatch.type);
                setCategory(smartMatch.name);
                setSelectedCategory(smartMatch);
            }
        }
    };

    const handleOpenNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (tx) => {
        setTransactionToEdit(tx);
        setDescription(tx.description);
        setAmount(String(tx.amount));
        setDate(formatDateInput(tx.date));
        setType(tx.type);
        setCategory(tx.category || '');
        setExpenseType(tx.expense_type || 'variable');
        setSelectedWalletId(tx.wallet_id || (wallets.length > 0 ? wallets[0].id : ''));
        setIsRecurring(false);

        const match = categories.find((item) => item.name === tx.category && item.type === tx.type);
        setSelectedCategory(match || null);

        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!selectedWalletId) {
                throw new Error('Selecione uma carteira para registrar esta transacao.');
            }

            const payload = {
                description,
                amount: parseFloat(amount),
                type,
                category,
                wallet_id: selectedWalletId,
                date,
                profile_id: user.id,
                expense_type: type === 'expense' ? expenseType : null,
            };

            let error;
            let newTx = null;

            if (transactionToEdit) {
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update(payload)
                    .eq('id', transactionToEdit.id);
                error = updateError;
            } else {
                const { data, error: insertError } = await supabase
                    .from('transactions')
                    .insert([payload])
                    .select();
                error = insertError;
                if (data) newTx = data[0];

                if (!error && isRecurring) {
                    const nextDate = new Date(date);
                    nextDate.setMonth(nextDate.getMonth() + 1);

                    const { error: recurError } = await supabase.from('recurring_templates').insert([{
                        description,
                        amount: parseFloat(amount),
                        type,
                        category,
                        wallet_id: selectedWalletId,
                        expense_type: type === 'expense' ? expenseType : null,
                        frequency: 'monthly',
                        next_due_date: nextDate.toISOString(),
                        profile_id: user.id,
                    }]);

                    if (recurError) console.error('Error creating recurring template:', recurError);
                }
            }

            if (error) throw error;

            await fetchTransactions();
            handleCloseModal();
            addToast(transactionToEdit ? 'Transacao atualizada.' : 'Transacao criada.', 'success');

            if (!transactionToEdit && newTx) {
                window.dispatchEvent(new CustomEvent('transaction-inserted', { detail: newTx }));
            } else {
                window.dispatchEvent(new Event('transaction-updated'));
            }
        } catch (error) {
            addToast(error.message || 'Erro ao salvar transacao.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const commitDeleteTransaction = async (transaction) => {
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', transaction.id);
            if (error) throw error;
            window.dispatchEvent(new Event('transaction-updated'));
        } catch (error) {
            console.error('Erro ao excluir:', error);
            setTransactions((prev) => sortTransactions([...prev, transaction]));
            addToast('Nao foi possivel excluir a transacao.', 'error');
        }
    };

    const handleDeleteTransaction = (id) => {
        const transaction = transactions.find((item) => item.id === id);
        if (!transaction) return;

        setTransactions((prev) => prev.filter((item) => item.id !== id));

        const timer = setTimeout(() => {
            pendingDeleteTimers.current.delete(id);
            commitDeleteTransaction(transaction);
        }, 5000);

        pendingDeleteTimers.current.set(id, timer);

        addActionToast('Transacao removida.', 'Desfazer', () => {
            const pendingTimer = pendingDeleteTimers.current.get(id);
            if (pendingTimer) {
                clearTimeout(pendingTimer);
                pendingDeleteTimers.current.delete(id);
                setTransactions((prev) => sortTransactions([...prev, transaction]));
            }
        }, 'info');
    };

    const availableCategories = useMemo(
        () => categories.filter((item) => item.type === type),
        [categories, type],
    );

    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filteredTransactions = useMemo(() => transactions.filter((tx) => {
        if (activeFilter === 'me' && tx.profile_id !== user.id) return false;
        if (activeFilter === 'partner' && tx.profile_id !== profile?.partner_id) return false;

        const txDate = new Date(tx.date);
        txDate.setHours(0, 0, 0, 0);

        let start = null;
        let end = null;

        if (startDate) {
            const [year, month, day] = startDate.split('-');
            start = new Date(Number(year), Number(month) - 1, Number(day));
        }

        if (endDate) {
            const [year, month, day] = endDate.split('-');
            end = new Date(Number(year), Number(month) - 1, Number(day));
            end.setHours(23, 59, 59, 999);
        }

        if (start && txDate < start) return false;
        if (end && txDate > end) return false;

        if (!normalizedSearch) return true;

        const target = `${tx.description} ${tx.category || ''}`.toLowerCase();
        return target.includes(normalizedSearch);
    }), [transactions, activeFilter, user.id, profile?.partner_id, startDate, endDate, normalizedSearch]);

    const filteredIncome = useMemo(() => filteredTransactions
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0), [filteredTransactions]);
    const filteredExpense = useMemo(() => filteredTransactions
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0), [filteredTransactions]);
    const hasActiveFilters = Boolean(searchQuery || startDate || endDate || activeFilter !== 'all');

    const clearFilters = () => {
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setActiveFilter('all');
    };

    const handleOpenExport = () => {
        if (filteredTransactions.length === 0) {
            addToast('Sem transacoes para exportar no filtro atual.', 'error');
            return;
        }

        setIsExportModalOpen(true);
    };

    const handleExportCsv = async () => {
        const { exportTransactionsToCsv } = await import('../lib/exportUtils');
        exportTransactionsToCsv(filteredTransactions);
        setIsExportModalOpen(false);
        addToast('CSV gerado com sucesso.', 'success');
    };

    const handleExportExcel = async () => {
        const { exportTransactionsToExcel } = await import('../lib/exportUtils');
        exportTransactionsToExcel(filteredTransactions);
        setIsExportModalOpen(false);
        addToast('Arquivo Excel protegido gerado com sucesso.', 'success');
    };

    return (
        <motion.div className="container app-page-shell" style={{ paddingBottom: '80px' }} variants={pageVariants} initial="hidden" animate="visible">
            <motion.div variants={sectionVariants}>
            <PageHeader
                title={<span>Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{'Transa\u00E7\u00F5es'}</span></span>}
                subtitle="Movimentacoes em uma leitura mais limpa, com filtros, busca e exportacao tratados como parte do fluxo principal."
            >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button onClick={handleOpenExport} variant="ghost" icon={Download} title="Exportar dados">
                        Exportar
                    </Button>
                    <Button onClick={handleOpenNew} icon={Plus} className="btn-primary">
                        Nova transacao
                    </Button>
                </div>
            </PageHeader>
            </motion.div>

            <motion.div variants={sectionVariants}>
                <PartnerFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            </motion.div>

            <motion.section className="glass-card app-spotlight-card" variants={sectionVariants}>
                <div className="app-spotlight-copy">
                    <span className="app-spotlight-kicker">Fluxo editorial</span>
                    <h3>Veja o que entrou, saiu e merece atencao sem poluicao visual.</h3>
                    <p>Os filtros agora ficam mais integrados ao topo para a leitura das movimentacoes parecer parte do produto, nao um bloco genérico.</p>
                </div>
                <div className="app-spotlight-note">
                    <div>
                        <strong>{filteredTransactions.length} resultados no recorte atual</strong>
                        <p>
                            {hasActiveFilters
                                ? 'O painel esta mostrando um recorte filtrado do seu historico.'
                                : 'Sem filtros extras, voce esta vendo a leitura completa das movimentacoes.'}
                        </p>
                    </div>
                </div>
            </motion.section>

            <motion.div className="transactions-toolbar" variants={sectionVariants}>
                <DateRangePicker
                    startDate={startDate ? new Date(startDate.split('-')[0], startDate.split('-')[1] - 1, startDate.split('-')[2]) : null}
                    endDate={endDate ? new Date(endDate.split('-')[0], endDate.split('-')[1] - 1, endDate.split('-')[2]) : null}
                    onChange={({ start, end }) => {
                        if (start) {
                            const year = start.getFullYear();
                            const month = String(start.getMonth() + 1).padStart(2, '0');
                            const day = String(start.getDate()).padStart(2, '0');
                            setStartDate(`${year}-${month}-${day}`);
                        } else {
                            setStartDate('');
                        }

                        if (end) {
                            const year = end.getFullYear();
                            const month = String(end.getMonth() + 1).padStart(2, '0');
                            const day = String(end.getDate()).padStart(2, '0');
                            setEndDate(`${year}-${month}-${day}`);
                        } else {
                            setEndDate('');
                        }
                    }}
                />

                <div className="transactions-search">
                    <Search size={16} />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={'Buscar por descri\u00E7\u00E3o ou categoria'}
                        aria-label={'Buscar transa\u00E7\u00F5es'}
                    />
                    {searchQuery && (
                        <button type="button" onClick={() => setSearchQuery('')} aria-label="Limpar busca">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                        Limpar filtros
                    </Button>
                )}
            </motion.div>

            <motion.div className="transactions-summary" variants={sectionVariants}>
                <Card hover={false} className="transactions-summary-card">
                    <span className="transactions-summary-label">Resultados</span>
                    <strong>{filteredTransactions.length}</strong>
                </Card>
                <Card hover={false} className="transactions-summary-card">
                    <span className="transactions-summary-label">Entradas filtradas</span>
                    <strong style={{ color: 'var(--color-success)' }}>
                        R$ {filteredIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                </Card>
                <Card hover={false} className="transactions-summary-card">
                    <span className="transactions-summary-label">{'Sa\u00EDdas filtradas'}</span>
                    <strong style={{ color: 'var(--color-danger)' }}>
                        R$ {filteredExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                </Card>
            </motion.div>

            <AnimatePresence mode="wait" initial={false}>
                {loading ? (
                    <motion.div
                        key="transactions-loading"
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {Array(5).fill(0).map((_, index) => (
                            <Skeleton key={index} width="100%" height="72px" borderRadius="16px" />
                        ))}
                    </motion.div>
                ) : transactions.length === 0 ? (
                    <motion.div
                        key="transactions-empty"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <EmptyState
                            icon={ArrowUpRight}
                            title={'Nenhuma transa\u00E7\u00E3o ainda'}
                            description="Comece registrando seus ganhos e gastos para ver o poder do dashboard."
                            actionText={'Nova Transa\u00E7\u00E3o'}
                            onAction={handleOpenNew}
                        />
                    </motion.div>
                ) : filteredTransactions.length === 0 ? (
                    <motion.div
                        key="transactions-filtered-empty"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <EmptyState
                            icon={Search}
                            title="Nenhum resultado encontrado"
                            description="Tente ajustar periodo, parceiro ou busca para localizar outras movimentacoes."
                            actionText="Limpar filtros"
                            onAction={clearFilters}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key={`transactions-list-${activeFilter}-${searchQuery}-${startDate}-${endDate}`}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredTransactions.map((tx, index) => (
                                <TransactionItem
                                    key={tx.id}
                                    transaction={tx}
                                    categories={categories}
                                    onEdit={handleOpenEdit}
                                    onDelete={handleDeleteTransaction}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={transactionToEdit ? 'Editar Transa\u00E7\u00E3o' : 'Nova Transa\u00E7\u00E3o'}>
                <TransactionForm
                    amount={amount}
                    onAmountChange={setAmount}
                    date={date}
                    onDateChange={setDate}
                    type={type}
                    onTypeChange={handleTypeChange}
                    wallets={wallets}
                    selectedWalletId={selectedWalletId}
                    onWalletChange={setSelectedWalletId}
                    availableCategories={availableCategories}
                    selectedCategory={selectedCategory}
                    onCategorySelect={(cat) => {
                        setCategory(cat.name);
                        setSelectedCategory(cat);
                    }}
                    expenseType={expenseType}
                    onExpenseTypeChange={setExpenseType}
                    showRecurringToggle={!transactionToEdit}
                    isRecurring={isRecurring}
                    onRecurringChange={setIsRecurring}
                    description={description}
                    onDescriptionChange={handleDescriptionChange}
                    onSubmit={handleSaveTransaction}
                    submitLabel={transactionToEdit ? 'Salvar alteracoes' : 'Salvar'}
                    loading={submitting}
                />
            </Modal>

            <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title={'Exportar transa\u00E7\u00F5es'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="surface-secondary" style={{ padding: '1rem', borderRadius: '12px' }}>
                        <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.35rem' }}>Escolha o formato</strong>
                        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            CSV abre mais rapido em planilhas e mantem a exportacao leve. O arquivo Excel protegido exporta em formato .xlsx para uso completo no Excel.
                        </p>
                    </div>

                    <Button type="button" className="btn-primary" onClick={handleExportCsv} style={{ width: '100%', justifyContent: 'center' }}>
                        Exportar CSV rapido
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleExportExcel} style={{ width: '100%', justifyContent: 'center' }}>
                        Exportar arquivo Excel protegido
                    </Button>
                </div>
            </Modal>
        </motion.div>
    );
}
