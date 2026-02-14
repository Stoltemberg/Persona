import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Plus, Download, ChevronRight, Filter } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { exportTransactionsToExcel } from '../lib/exportUtils';
import { getSmartCategory } from '../utils/smartCategories';
import { DateRangePicker } from '../components/DateRangePicker';

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
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (user) {
            fetchTransactions();
            fetchCategories();
        }
    }, [user]);

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
        setIsRecurring(false);
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
                date: transactionToEdit ? transactionToEdit.date : new Date().toISOString(),
                profile_id: user.id,
                expense_type: type === 'expense' ? expenseType : null
            };

            let error;
            if (transactionToEdit) {
                const { error: updateError } = await supabase.from('transactions').update(payload).eq('id', transactionToEdit.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('transactions').insert([payload]);
                error = insertError;

                if (!error && isRecurring) {
                    // Recurring logic simplified for this snippet
                    const nextDate = new Date();
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    await supabase.from('recurring_templates').insert([{
                        description, amount: parseFloat(amount), type, category,
                        frequency: 'monthly', next_due_date: nextDate.toISOString(), profile_id: user.id
                    }]);
                }
            }

            if (error) throw error;
            await fetchTransactions();
            setIsModalOpen(false);
            resetForm();
            addToast(transactionToEdit ? 'Atualizado' : 'Criado', 'success');
        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTransaction = async () => {
        if (!transactionToEdit) return;
        if (!confirm('Excluir?')) return;
        try {
            await supabase.from('transactions').delete().eq('id', transactionToEdit.id);
            setTransactions(transactions.filter(t => t.id !== transactionToEdit.id));
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
        setExpenseType('variable');
        setTransactionToEdit(null);
        setIsRecurring(false);
    };

    // Filter Logic
    const filteredTransactions = transactions.filter(tx => {
        if (!startDate && !endDate) return true;
        const txDate = new Date(tx.date);
        txDate.setHours(0, 0, 0, 0);

        if (startDate) {
            const [y, m, d] = startDate.split('-');
            if (txDate < new Date(y, m - 1, d)) return false;
        }
        if (endDate) {
            const [y, m, d] = endDate.split('-');
            const end = new Date(y, m - 1, d);
            end.setHours(23, 59, 59, 999);
            if (txDate > end) return false;
        }
        return true;
    });

    const availableCategories = categories.filter(c => c.type === type);

    return (
        <div className="container fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Transações</h1>
                    <Button onClick={handleOpenNew} style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="btn-primary">
                        <Plus size={24} />
                    </Button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <DateRangePicker
                            startDate={startDate ? new Date(startDate) : null}
                            endDate={endDate ? new Date(endDate) : null}
                            onChange={({ start, end }) => {
                                setStartDate(start ? start.toISOString().split('T')[0] : '');
                                setEndDate(end ? end.toISOString().split('T')[0] : '');
                            }}
                        />
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => exportTransactionsToExcel(filteredTransactions)}
                        style={{ padding: '0.6rem', color: 'var(--color-blue)' }}
                    >
                        <Download size={20} />
                    </Button>
                </div>
            </header>

            <div className="list-group">
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="list-item" style={{ padding: '1rem 0' }}>
                            <Skeleton width="100%" height="50px" />
                        </div>
                    ))
                ) : filteredTransactions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Nenhuma transação.</p>
                ) : (
                    filteredTransactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="list-item"
                            onClick={() => handleOpenEdit(tx)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: tx.type === 'income' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: tx.type === 'income' ? 'var(--color-green)' : 'var(--color-red)',
                                    fontSize: '1.2rem'
                                }}>
                                    {/* Icon based on category or type */}
                                    {categories.find(c => c.name === tx.category)?.icon || (tx.type === 'income' ? '+' : '-')}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.1rem' }}>{tx.description}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                        {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {tx.category}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    fontWeight: '600',
                                    color: tx.type === 'income' ? 'var(--color-green)' : 'var(--text-primary)'
                                }}>
                                    {tx.type === 'income' ? '+' : '-'} R$ {parseFloat(tx.amount).toFixed(2)}
                                </span>
                                <ChevronRight size={16} color="var(--text-tertiary)" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={transactionToEdit ? "Editar" : "Nova Transação"}>
                <form onSubmit={handleSaveTransaction}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', display: 'flex', marginBottom: '1.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            style={{
                                flex: 1,
                                padding: '0.6rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: type === 'expense' ? 'white' : 'transparent',
                                boxShadow: type === 'expense' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                fontWeight: '600',
                                color: type === 'expense' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                transition: 'all 0.2s'
                            }}
                        >
                            Despesa
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            style={{
                                flex: 1,
                                padding: '0.6rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: type === 'income' ? 'white' : 'transparent',
                                boxShadow: type === 'income' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                fontWeight: '600',
                                color: type === 'income' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                transition: 'all 0.2s'
                            }}
                        >
                            Receita
                        </button>
                    </div>

                    <Input
                        label="Valor"
                        placeholder="0,00"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                        style={{ fontSize: '1.5rem', fontWeight: '700', color: type === 'income' ? 'var(--color-green)' : 'var(--color-red)' }}
                    />

                    <Input
                        label="Descrição"
                        placeholder="Ex: Almoço"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                    />

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>Categoria</label>
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="no-scrollbar">
                            {availableCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.name)}
                                    style={{
                                        minWidth: '70px',
                                        padding: '0.6rem 0.4rem',
                                        borderRadius: '12px',
                                        border: category === cat.name ? `1px solid ${cat.color}` : '1px solid var(--bg-secondary)',
                                        background: category === cat.name ? `${cat.color}10` : 'transparent',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                                    <span style={{ fontSize: '0.7rem' }}>{cat.name}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => window.location.href = '/categories'}
                                style={{
                                    minWidth: '70px',
                                    padding: '0.6rem 0.4rem',
                                    borderRadius: '12px',
                                    border: '1px dashed var(--text-tertiary)',
                                    background: 'transparent',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem',
                                    color: 'var(--text-tertiary)'
                                }}
                            >
                                <Plus size={20} />
                                <span style={{ fontSize: '0.7rem' }}>Novo</span>
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="btn-primary" style={{ width: '100%', borderRadius: '14px', padding: '1rem', justifyContent: 'center' }} loading={submitting}>
                        {transactionToEdit ? 'Salvar' : 'Criar Transação'}
                    </Button>

                    {transactionToEdit && (
                        <Button type="button" variant="ghost" onClick={handleDeleteTransaction} style={{ width: '100%', marginTop: '0.5rem', color: 'var(--color-red)', justifyContent: 'center' }}>
                            Excluir Transação
                        </Button>
                    )}
                </form>
            </Modal>
        </div>
    );
}
