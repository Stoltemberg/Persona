import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Plus, ArrowUpRight, ArrowDownLeft, Trash2, Edit2 } from 'lucide-react';

export default function Transactions() {
    const { user } = useAuth();
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

    // Category State
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null); // Stores the full object

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
            }

            if (error) throw error;

            await fetchTransactions();
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            alert(error.message);
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

    // Filter categories for the modal based on current type
    const availableCategories = categories.filter(c => c.type === type);

    return (
        <div className="container fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1 className="text-gradient">Transações</h1>
                <Button onClick={handleOpenNew} icon={Plus}>
                    Nova Transação
                </Button>
            </header>

            {/* Transaction List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <p>Carregando...</p>
                ) : transactions.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: '1.2rem' }}>Nenhuma transação encontrada</p>
                    </div>
                ) : (
                    transactions.map((tx, index) => (
                        <Card key={tx.id} hover className="fade-in" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.5rem 2rem',
                            animationDelay: `${index * 0.05}s`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                {/* Try to find icon for this transaction category */}
                                {(() => {
                                    const cat = categories.find(c => c.name === tx.category && c.type === tx.type);
                                    return (
                                        <div style={{
                                            padding: '1rem',
                                            borderRadius: '50%',
                                            background: cat ? `${cat.color}20` : (tx.type === 'income' ? 'rgba(18, 194, 233, 0.1)' : 'rgba(246, 79, 89, 0.1)'),
                                            color: cat ? cat.color : (tx.type === 'income' ? '#12c2e9' : '#f64f59'),
                                            display: 'flex', alignItems: 'center', justifyItems: 'center',
                                            fontSize: '1.2rem'
                                        }}>
                                            {cat ? cat.icon : (tx.type === 'income' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />)}
                                        </div>
                                    );
                                })()}

                                <div>
                                    <h4 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>{tx.description}</h4>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                                        {tx.category} • {new Date(tx.date).toLocaleDateString('pt-BR')}
                                        {tx.expense_type && (
                                            <span style={{
                                                marginLeft: '0.5rem',
                                                padding: '0.1rem 0.4rem',
                                                borderRadius: '4px',
                                                background: 'rgba(255,255,255,0.1)',
                                                fontSize: '0.75rem'
                                            }}>
                                                {tx.expense_type === 'fixed' && 'Fixo'}
                                                {tx.expense_type === 'variable' && 'Variável'}
                                                {tx.expense_type === 'lifestyle' && 'Lazer'}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                                    <h3 style={{
                                        color: tx.type === 'income' ? '#12c2e9' : 'white',
                                        fontWeight: 700,
                                        fontSize: '1.25rem'
                                    }}>
                                        {tx.type === 'income' ? '+ ' : '- '}R$ {parseFloat(tx.amount).toFixed(2).replace('.', ',')}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => handleOpenEdit(tx)}
                                    className="btn-ghost"
                                    style={{ padding: '0.6rem' }}
                                    title="Editar"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button
                                    onClick={() => handleDeleteTransaction(tx.id)}
                                    className="btn-ghost"
                                    style={{ color: '#f64f59', padding: '0.6rem' }}
                                    title="Excluir"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </Card>
                    ))
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

                    <Input
                        label="Descrição"
                        placeholder="Ex: Supermercado"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />

                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} loading={submitting}>
                        {transactionToEdit ? "Salvar Alterações" : "Salvar"}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
