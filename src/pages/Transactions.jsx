import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Plus, ArrowUpRight, ArrowDownLeft, Trash2, Edit2, Download } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/EmptyState';
import { exportTransactionsToExcel } from '../lib/exportUtils';
import { getSmartCategory } from '../utils/smartCategories';
import { TransactionItem } from '../components/TransactionItem';

export default function Transactions() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [expenseType, setExpenseType] = useState('variable');
    const [isRecurring, setIsRecurring] = useState(false);

    // Filter State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Wallets State
    const [wallets, setWallets] = useState([]);
    const [selectedWalletId, setSelectedWalletId] = useState('');

    // Category State
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null); // Stores the full object

    useEffect(() => {
        if (user) {
            fetchTransactions();
            fetchCategories();
            fetchWallets();
        }
    }, [user]);

    // ... fetchTransactions ...

    const fetchWallets = async () => {
        const { data } = await supabase.from('wallets').select('*');
        setWallets(data || []);
        // Set default wallet if none selected or available
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

        // Try to match existing string category to a category object for UI highlight
        const match = categories.find(c => c.name === tx.category && c.type === tx.type);
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
                // If editing, keep original date or update? Let's keep original date for now unless we add a date picker
                // Actually, let's allow updating date if we had a field, but we don't. 
                // Creating new: use now(). Editing: keep existing date.
                date: transactionToEdit ? transactionToEdit.date : new Date().toISOString(),
                profile_id: user.id,
                expense_type: type === 'expense' ? expenseType : null
            };

            let error;
            if (transactionToEdit) {
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update(payload)
                    .eq('id', transactionToEdit.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('transactions')
                    .insert([payload]);
                error = insertError;

                // Handle Recurring Creation (Only for new transactions for now)
                if (!error && isRecurring) {
                    const nextDate = new Date(date);
                    nextDate.setMonth(nextDate.getMonth() + 1);

                    const { error: recurError } = await supabase.from('recurring_templates').insert([{
                        description,
                        amount: parseFloat(amount),
                        type,
                        category,
                        expense_type: type === 'expense' ? expenseType : null,
                        frequency: 'monthly',
                        next_due_date: nextDate.toISOString(),
                        profile_id: user.id
                    }]);

                    if (recurError) console.error("Error creating recurring template:", recurError);
                }
            }

            if (error) throw error;

            await fetchTransactions();
            setIsModalOpen(false);
            resetForm();
            addToast(transactionToEdit ? 'Transação atualizada!' : 'Transação criada!', 'success');
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
            setTransactions(transactions.filter(t => t.id !== id));
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir transação.');
        }
    };

    const handleExport = () => {
        if (transactions.length === 0) {
            addToast('Sem transações para exportar.', 'error');
            return;
        }

        // Use the filtered transactions if needed, but usually export all is preferred or explicitly filtered.
        // Let's filter based on the current date filters if active.
        const filteredTransactions = transactions.filter(tx => {
            if (!startDate && !endDate) return true;
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

            return true;
        });

        if (filteredTransactions.length === 0) {
            addToast('Nenhuma transação encontrada no período selecionado.', 'error');
            return;
        }

        exportTransactionsToExcel(filteredTransactions);
    };

    // Filter categories for the modal based on current type
    const availableCategories = categories.filter(c => c.type === type);

    return (
        <div className="container fade-in">
            <header className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <h1 className="text-gradient">Transações</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button onClick={handleExport} variant="ghost" icon={Download}>
                            <span className="responsive-btn-text">Exportar</span>
                        </Button>
                        <Button onClick={handleOpenNew} icon={Plus} className="btn-primary">
                            <span className="responsive-btn-text">Nova Transação</span>
                        </Button>
                    </div>
                </div>

                {/* Date Filters */}
                <div className="date-filters">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>De:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-main)',
                                padding: '0.3rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Até:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-main)',
                                padding: '0.3rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>
                    {(startDate || endDate) && (
                        <Button
                            variant="ghost"
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', height: 'auto', minHeight: 'unset' }}
                        >
                            Limpar
                        </Button>
                    )}
                </div>
            </header>

            {/* Transaction List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                ) : (

                    <AnimatePresence mode="popLayout">
                        {transactions
                            .filter(tx => {
                                if (!startDate && !endDate) return true;
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

                                return true;
                            })
                            .map((tx, index) => (
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

            {/* Add/Edit Transaction Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={transactionToEdit ? "Editar Transação" : "Nova Transação"}>
                <form onSubmit={handleSaveTransaction}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Button
                            type="button"
                            className={type === 'expense' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'expense' ? 'var(--color-3)' : undefined, border: type === 'expense' ? 'none' : undefined }}
                            onClick={() => { setType('expense'); setCategory(''); setSelectedCategory(null); }}
                        >
                            Despesa
                        </Button>
                        <Button
                            type="button"
                            className={type === 'income' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'income' ? 'var(--color-4)' : undefined, border: type === 'income' ? 'none' : undefined }}
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

                    {/* Category Selection Grid */}
                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Categoria
                        </label>
                        {availableCategories.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                                {availableCategories.map(cat => (
                                    <div
                                        key={cat.id}
                                        onClick={() => {
                                            setCategory(cat.name);
                                            setSelectedCategory(cat);
                                        }}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            background: selectedCategory?.id === cat.id ? `${cat.color}40` : 'rgba(255,255,255,0.05)',
                                            border: selectedCategory?.id === cat.id ? `1px solid ${cat.color}` : '1px solid transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.2rem',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{ fontSize: '1.5rem' }}>{cat.icon}</div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{cat.name}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <p>Nenhuma categoria criada.</p>
                                <Button type="button" variant="ghost" className="btn-primary" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }} onClick={() => window.location.href = '/categories'}>Criar Agora</Button>
                            </div>
                        )}
                        {/* Fallback Input if needed (hidden or optional? Let's hide it if categories exist) */}
                    </div>

                    {/* Mandatory Expense Type Selection */}
                    {type === 'expense' && (
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>
                                Tipo de Gasto <span style={{ color: '#f64f59' }}>*</span>
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                {[
                                    { value: 'fixed', label: 'Fixo', icon: '🔒' },
                                    { value: 'variable', label: 'Variável', icon: '💳' },
                                    { value: 'lifestyle', label: 'Lazer', icon: '🍿' }
                                ].map((opt) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => setExpenseType(opt.value)}
                                        style={{
                                            padding: '0.75rem 0.5rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            background: expenseType === opt.value ? 'rgba(246, 79, 89, 0.2)' : 'rgba(255,255,255,0.05)',
                                            border: expenseType === opt.value ? '1px solid #f64f59' : '1px solid transparent',
                                            transition: 'all 0.2s'
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

                            // Smart Category (Only if adding new or category is empty)
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
                        {transactionToEdit ? "Salvar Alterações" : "Salvar"}
                    </Button>
                </form>
            </Modal>
        </div >
    );
}
