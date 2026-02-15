import { useState, useEffect } from 'react';
import { Plus, X, ArrowUpRight, ArrowDownLeft, Wallet, CheckCircle, Circle, Repeat } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useHaptic } from '../hooks/useHaptic';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

import { usePrivacy } from '../context/PrivacyContext';
import { getSmartCategory } from '../utils/smartCategories';

export function FAB({ className, style }) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const { medium, success } = useHaptic();
    const { isPrivacyMode } = usePrivacy();

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [expenseType, setExpenseType] = useState('variable');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('paid'); // 'paid' or 'pending'
    const [isRecurring, setIsRecurring] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        if (isOpen && user) {
            fetchCategories();
            // Reset date to today on open if needed, or keep last selected
            if (!date) setDate(new Date().toISOString().split('T')[0]);

            // Auto set status based on date
            if (new Date().toISOString().split('T')[0] < date) {
                setStatus('pending');
            } else {
                setStatus('paid');
            }
        }
    }, [isOpen, user]);

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*');
        setCategories(data || []);
    };

    const handleOpen = () => {
        medium();
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
        setExpenseType('variable');
        setDate(new Date().toISOString().split('T')[0]);
        setStatus('paid');
        setIsRecurring(false);
        setSelectedCategory(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.from('transactions').insert([{
                description,
                amount: parseFloat(amount),
                type,
                category,
                expense_type: type === 'expense' ? expenseType : null,
                date: date,
                status: status, // New field
                is_recurring: isRecurring, // New field (assuming DB support)
                profile_id: user.id
            }]).select();

            if (error) throw error;

            success();
            // Removed toast for cleaner UI
            // addToast('Transação registrada!', 'success');
            handleClose();

            // Dispatch event with the new transaction data
            if (data && data.length > 0) {
                window.dispatchEvent(new CustomEvent('transaction-inserted', { detail: data[0] }));
            } else {
                // Fallback if data isn't returned for some reason (though .select() should return it)
                window.dispatchEvent(new Event('transaction-updated'));
            }

        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const availableCategories = categories.filter(c => c.type === type);

    return (
        <>
            <button
                onClick={handleOpen}
                className={`fab-btn ${className || ''}`}
                style={style}
                aria-label="Adicionar Transação"
            >
                <Plus size={28} strokeWidth={2.5} />
            </button>

            <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Rápido">
                <form onSubmit={handleSubmit}>
                    {/* Type Selection */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Button
                            type="button"
                            className={type === 'expense' ? 'btn-primary' : 'btn-ghost'}
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                border: type === 'expense' ? '1px solid #f64f59' : '1px solid var(--glass-border)',
                                background: type === 'expense' ? 'rgba(246, 79, 89, 0.1)' : 'transparent',
                                color: type === 'expense' ? '#f64f59' : 'var(--text-muted)'
                            }}
                            onClick={() => { setType('expense'); setCategory(''); setSelectedCategory(null); medium(); }}
                        >
                            <ArrowDownLeft size={18} style={{ marginRight: '0.5rem' }} />
                            Despesa
                        </Button>
                        <Button
                            type="button"
                            className={type === 'income' ? 'btn-primary' : 'btn-ghost'}
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                border: type === 'income' ? '1px solid #12c2e9' : '1px solid var(--glass-border)',
                                background: type === 'income' ? 'rgba(18, 194, 233, 0.1)' : 'transparent',
                                color: type === 'income' ? '#12c2e9' : 'var(--text-muted)'
                            }}
                            onClick={() => { setType('income'); setCategory(''); setSelectedCategory(null); medium(); }}
                        >
                            <ArrowUpRight size={18} style={{ marginRight: '0.5rem' }} />
                            Receita
                        </Button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Valor"
                            placeholder="0,00"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            autoFocus
                            style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', color: type === 'income' ? '#12c2e9' : '#f64f59' }}
                        />
                        <Input
                            label="Data"
                            type="date"
                            value={date}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                setDate(newDate);
                                // Auto-update status based on date
                                if (newDate > new Date().toISOString().split('T')[0]) {
                                    setStatus('pending');
                                } else {
                                    setStatus('paid');
                                }
                            }}
                            required
                            style={{ fontSize: '1.1rem', fontWeight: 500, textAlign: 'center' }}
                        />
                    </div>

                    {/* Status & Recurrence Toggles */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Button
                            type="button"
                            className={status === 'paid' ? 'btn-primary' : 'btn-ghost'}
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                background: status === 'paid' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: status === 'paid' ? '#2ecc71' : 'var(--text-muted)',
                                border: status === 'paid' ? '1px solid #2ecc71' : '1px solid transparent'
                            }}
                            onClick={() => { setStatus(status === 'paid' ? 'pending' : 'paid'); medium(); }}
                        >
                            {status === 'paid' ? <CheckCircle size={18} style={{ marginRight: '0.5rem' }} /> : <Circle size={18} style={{ marginRight: '0.5rem' }} />}
                            {status === 'paid' ? 'Pago' : 'Pendente'}
                        </Button>

                        <Button
                            type="button"
                            className={isRecurring ? 'btn-primary' : 'btn-ghost'}
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                background: isRecurring ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: isRecurring ? '#3498db' : 'var(--text-muted)',
                                border: isRecurring ? '1px solid #3498db' : '1px solid transparent'
                            }}
                            onClick={() => { setIsRecurring(!isRecurring); medium(); }}
                        >
                            <Repeat size={18} style={{ marginRight: '0.5rem' }} />
                            {isRecurring ? 'Fixo' : 'Único'}
                        </Button>
                    </div>

                    {/* Quick Category Grid */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Categoria
                        </label>
                        <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                            {availableCategories.map(cat => (
                                <div
                                    key={cat.id}
                                    onClick={() => {
                                        setCategory(cat.name);
                                        setSelectedCategory(cat);
                                        medium();
                                    }}
                                    className="category-item"
                                    style={{
                                        background: selectedCategory?.id === cat.id ? `${cat.color}40` : undefined,
                                        border: selectedCategory?.id === cat.id ? `1px solid ${cat.color}` : undefined,
                                        minWidth: '80px',
                                        height: '80px',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: '1.5rem' }}>{cat.icon}</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%', textAlign: 'center' }}>{cat.name}</div>
                                </div>
                            ))}
                            {availableCategories.length === 0 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', width: '100%', textAlign: 'center' }}>
                                    Nenhuma categoria encontrada.
                                </div>
                            )}
                        </div>
                    </div>

                    <Input
                        label="Descrição"
                        placeholder="Ex: Almoço"
                        value={description}
                        onChange={(e) => {
                            const val = e.target.value;
                            setDescription(val);

                            // Smart Category Logic
                            if (val.length > 2 && !category) {
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

                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', height: '50px', fontSize: '1.1rem' }} loading={loading}>
                        Registrar
                    </Button>
                </form>
            </Modal>
        </>
    );
}
