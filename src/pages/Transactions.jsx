import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
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

export default function Transactions() {
    const { user, profile, markTransactionsAsRead } = useAuth();
    const { addToast } = useToast();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [expenseType, setExpenseType] = useState('variable');
    const [isRecurring, setIsRecurring] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [wallets, setWallets] = useState([]);
    const [selectedWalletId, setSelectedWalletId] = useState('');

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        if (user) {
            markTransactionsAsRead();
            fetchTransactions();
            fetchCategories();
            fetchWallets();

            const handleSync = () => {
                fetchTransactions();
                fetchWallets();
            };

            window.addEventListener('supabase-sync', handleSync);
            return () => window.removeEventListener('supabase-sync', handleSync);
        }
    }, [user]);

    const fetchWallets = async () => {
        const { data } = await supabase.from('wallets').select('*');
        setWallets(data || []);

        if (data && data.length > 0 && !selectedWalletId) {
            setSelectedWalletId(data[0].id);
        }
    };

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*');
        setCategories(data || []);
    };

    const handleOpenNew = () => {
        setTransactionToEdit(null);
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (tx) => {
        setTransactionToEdit(tx);
        setDescription(tx.description);
        setAmount(tx.amount);
        setType(tx.type);
        setCategory(tx.category || '');
        setExpenseType(tx.expense_type || 'variable');
        setSelectedWalletId(tx.wallet_id || (wallets.length > 0 ? wallets[0].id : ''));
        setIsRecurring(false);

        const match = categories.find((c) => c.name === tx.category && c.type === tx.type);
        setSelectedCategory(match || null);

        setIsModalOpen(true);
    };

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                description,
                amount: parseFloat(amount),
                type,
                category,
                wallet_id: selectedWalletId || null,
                date: transactionToEdit ? transactionToEdit.date : new Date().toISOString(),
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
                    const nextDate = new Date();
                    nextDate.setMonth(nextDate.getMonth() + 1);

                    const { error: recurError } = await supabase.from('recurring_templates').insert([{
                        description,
                        amount: parseFloat(amount),
                        type,
                        category,
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
            setIsModalOpen(false);
            resetForm();

            if (transactionToEdit) {
                addToast('Transação atualizada!', 'success');
            } else if (newTx) {
                window.dispatchEvent(new CustomEvent('transaction-inserted', { detail: newTx }));
            }
        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
        setExpenseType('variable');
        setTransactionToEdit(null);
        setSelectedCategory(null);
        setIsRecurring(false);
    };

    const handleDeleteTransaction = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;
            setTransactions(transactions.filter((t) => t.id !== id));
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir transação.');
        }
    };

    const availableCategories = categories.filter((c) => c.type === type);
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filteredTransactions = transactions.filter((tx) => {
        if (activeFilter === 'me' && tx.profile_id !== user.id) return false;
        if (activeFilter === 'partner' && tx.profile_id !== profile?.partner_id) return false;

        const txDate = new Date(tx.date);
        txDate.setHours(0, 0, 0, 0);

        let start = null;
        let end = null;

        if (startDate) {
            const [y, m, d] = startDate.split('-');
            start = new Date(Number(y), Number(m) - 1, Number(d));
        }

        if (endDate) {
            const [y, m, d] = endDate.split('-');
            end = new Date(Number(y), Number(m) - 1, Number(d));
            end.setHours(23, 59, 59, 999);
        }

        if (start && txDate < start) return false;
        if (end && txDate > end) return false;

        if (!normalizedSearch) return true;

        const target = `${tx.description} ${tx.category || ''}`.toLowerCase();
        return target.includes(normalizedSearch);
    });

    const filteredIncome = filteredTransactions
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const filteredExpense = filteredTransactions
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const hasActiveFilters = Boolean(searchQuery || startDate || endDate || activeFilter !== 'all');

    const clearFilters = () => {
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setActiveFilter('all');
    };

    const handleOpenExport = () => {
        if (filteredTransactions.length === 0) {
            addToast('Sem transações para exportar no filtro atual.', 'error');
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
        addToast('Planilha compatível em preparação.', 'success');
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={<span>Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Transações</span></span>}
            >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button onClick={handleOpenExport} variant="ghost" icon={Download} title="Exportar dados" style={{ padding: '0.6rem' }} />
                    <Button onClick={handleOpenNew} icon={Plus} className="btn-primary">
                        Nova
                    </Button>
                </div>
            </PageHeader>

            <PartnerFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            <div className="transactions-toolbar">
                <DateRangePicker
                    startDate={startDate ? new Date(startDate.split('-')[0], startDate.split('-')[1] - 1, startDate.split('-')[2]) : null}
                    endDate={endDate ? new Date(endDate.split('-')[0], endDate.split('-')[1] - 1, endDate.split('-')[2]) : null}
                    onChange={({ start, end }) => {
                        if (start) {
                            const y = start.getFullYear();
                            const m = String(start.getMonth() + 1).padStart(2, '0');
                            const d = String(start.getDate()).padStart(2, '0');
                            setStartDate(`${y}-${m}-${d}`);
                        } else {
                            setStartDate('');
                        }

                        if (end) {
                            const y = end.getFullYear();
                            const m = String(end.getMonth() + 1).padStart(2, '0');
                            const d = String(end.getDate()).padStart(2, '0');
                            setEndDate(`${y}-${m}-${d}`);
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
                        placeholder="Buscar por descrição ou categoria"
                        aria-label="Buscar transações"
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
            </div>

            <div className="transactions-summary">
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
                    <span className="transactions-summary-label">Saídas filtradas</span>
                    <strong style={{ color: 'var(--color-danger)' }}>
                        R$ {filteredExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} width="100%" height="72px" borderRadius="16px" />
                    ))
                ) : transactions.length === 0 ? (
                    <EmptyState
                        icon={ArrowUpRight}
                        title="Nenhuma transação ainda"
                        description="Comece registrando seus ganhos e gastos para ver o poder do dashboard."
                        actionText="Nova Transação"
                        onAction={handleOpenNew}
                    />
                ) : filteredTransactions.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="Nenhum resultado encontrado"
                        description="Tente ajustar período, parceiro ou busca para localizar outras movimentações."
                        actionText="Limpar filtros"
                        onAction={clearFilters}
                    />
                ) : (
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
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={transactionToEdit ? 'Editar Transação' : 'Nova Transação'}>
                <form onSubmit={handleSaveTransaction}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Button
                            type="button"
                            className={type === 'expense' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'expense' ? 'var(--color-danger)' : undefined, border: type === 'expense' ? 'none' : undefined, color: type === 'expense' ? '#fff' : undefined }}
                            onClick={() => { setType('expense'); setCategory(''); setSelectedCategory(null); }}
                        >
                            Despesa
                        </Button>
                        <Button
                            type="button"
                            className={type === 'income' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'income' ? 'var(--color-success)' : undefined, border: type === 'income' ? 'none' : undefined, color: type === 'income' ? '#fff' : undefined }}
                            onClick={() => { setType('income'); setCategory(''); setSelectedCategory(null); }}
                        >
                            Receita
                        </Button>
                    </div>

                    <Input
                        label="Valor"
                        placeholder="0,00"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />

                    <div className="input-group">
                        <label className="input-label">Carteira</label>
                        <select
                            className="input-field"
                            value={selectedWalletId}
                            onChange={(e) => setSelectedWalletId(e.target.value)}
                            required
                        >
                            {wallets.length === 0 ? (
                                <option value="">Cadastre uma carteira primeiro</option>
                            ) : (
                                wallets.map((wallet) => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Categoria
                        </label>
                        {availableCategories.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                                {availableCategories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        onClick={() => {
                                            setCategory(cat.name);
                                            setSelectedCategory(cat);
                                        }}
                                        className={!selectedCategory || selectedCategory.id !== cat.id ? 'surface-secondary' : ''}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            background: selectedCategory?.id === cat.id ? `${cat.color}40` : undefined,
                                            border: selectedCategory?.id === cat.id ? `1px solid ${cat.color}` : '1px solid transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.2rem',
                                            transition: 'all 0.2s',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <div style={{ fontSize: '1.5rem' }}>{cat.icon}</div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', color: 'var(--text-main)' }}>{cat.name}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="surface-secondary" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <p>Nenhuma categoria criada.</p>
                                <Button type="button" variant="ghost" className="btn-primary" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }} onClick={() => { window.location.href = '/categories'; }}>Criar agora</Button>
                            </div>
                        )}
                    </div>

                    {type === 'expense' && (
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>
                                Tipo de gasto <span style={{ color: '#f64f59' }}>*</span>
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                {[
                                    { value: 'fixed', label: 'Fixo', icon: 'F' },
                                    { value: 'variable', label: 'Variável', icon: 'V' },
                                    { value: 'lifestyle', label: 'Lazer', icon: 'L' },
                                ].map((opt) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => setExpenseType(opt.value)}
                                        className={expenseType !== opt.value ? 'surface-secondary' : ''}
                                        style={{
                                            padding: '0.75rem 0.5rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            background: expenseType === opt.value ? 'rgba(246, 79, 89, 0.2)' : undefined,
                                            border: expenseType === opt.value ? '1px solid #f64f59' : '1px solid transparent',
                                            transition: 'all 0.2s',
                                            color: 'var(--text-main)',
                                        }}
                                    >
                                        <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{opt.icon}</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: expenseType === opt.value ? 600 : 400 }}>{opt.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!transactionToEdit && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <input
                                type="checkbox"
                                id="recurring"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="recurring" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                                Repetir mensalmente?
                            </label>
                        </div>
                    )}

                    <Input
                        label="Descrição"
                        placeholder="Ex: Supermercado"
                        value={description}
                        onChange={(e) => {
                            const val = e.target.value;
                            setDescription(val);

                            if (!transactionToEdit && val.length > 2 && !category) {
                                const smartMatch = getSmartCategory(val, categories);
                                if (smartMatch) {
                                    if (smartMatch.type !== type) setType(smartMatch.type);
                                    setCategory(smartMatch.name);
                                    setSelectedCategory(smartMatch);
                                }
                            }
                        }}
                        required
                    />

                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} loading={submitting}>
                        {transactionToEdit ? 'Salvar alterações' : 'Salvar'}
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Exportar transações">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="surface-secondary" style={{ padding: '1rem', borderRadius: '12px' }}>
                        <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.35rem' }}>Escolha o formato</strong>
                        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            CSV abre mais rápido em planilhas e mantém a exportação leve. A planilha compatível abre no Excel sem carregar a dependência pesada anterior.
                        </p>
                    </div>

                    <Button type="button" className="btn-primary" onClick={handleExportCsv} style={{ width: '100%', justifyContent: 'center' }}>
                        Exportar CSV rápido
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleExportExcel} style={{ width: '100%', justifyContent: 'center' }}>
                        Exportar planilha compatível
                    </Button>
                </div>
            </Modal>
        </div>
    );
}



