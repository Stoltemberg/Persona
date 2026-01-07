import { useState, useEffect } from 'react';
import { Plus, X, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useHaptic } from '../hooks/useHaptic';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { usePrivacy } from '../context/PrivacyContext';

export function FAB() {
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
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        if (isOpen && user) {
            fetchCategories();
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
        setSelectedCategory(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('transactions').insert([{
                description,
                amount: parseFloat(amount),
                type,
                category,
                expense_type: type === 'expense' ? expenseType : null,
                date: new Date().toISOString(),
                profile_id: user.id
            }]);

            if (error) throw error;

            success();
            addToast('Transação registrada!', 'success');
            handleClose();

            // Optional: trigger a global refresh event or just let pages refetch on mount/focus
            // For now, simpler is better. Dashboard listens to focus? No, but it auto-updates if we force refresh or similar.
            // React Router navigation usually doesn't unmount, so Dashboard state might be stale.
            // A simple hack is reloading, but that's bad UX.
            // Ideally we use a global transaction context, but let's just accept it might not update instantly on the background page until refresh.
            // OR: we can dispatch a custom event.
            window.dispatchEvent(new Event('transaction-updated'));

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
                style={{
                    position: 'fixed',
                    bottom: 'calc(80px + env(safe-area-inset-bottom))', // Above mobile nav
                    right: '20px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #c471ed, #f64f59)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(196, 113, 237, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    cursor: 'pointer',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                className="fab-btn"
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
                            style={{ flex: 1, justifyContent: 'center', background: type === 'expense' ? 'var(--color-3)' : undefined, border: type === 'expense' ? 'none' : undefined }}
                            onClick={() => { setType('expense'); setCategory(''); setSelectedCategory(null); medium(); }}
                        >
                            <ArrowDownLeft size={18} style={{ marginRight: '0.5rem' }} />
                            Despesa
                        </Button>
                        <Button
                            type="button"
                            className={type === 'income' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'income' ? 'var(--color-4)' : undefined, border: type === 'income' ? 'none' : undefined }}
                            onClick={() => { setType('income'); setCategory(''); setSelectedCategory(null); medium(); }}
                        >
                            <ArrowUpRight size={18} style={{ marginRight: '0.5rem' }} />
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
                        autoFocus
                        style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', color: type === 'income' ? '#12c2e9' : '#f64f59' }}
                    />

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
                                    style={{
                                        minWidth: '70px',
                                        padding: '0.8rem 0.5rem',
                                        borderRadius: '12px',
                                        background: selectedCategory?.id === cat.id ? `${cat.color}40` : 'rgba(255,255,255,0.05)',
                                        border: selectedCategory?.id === cat.id ? `1px solid ${cat.color}` : '1px solid transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        transition: 'all 0.2s',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '1.4rem' }}>{cat.icon}</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{cat.name}</div>
                                </div>
                            ))}
                            {availableCategories.length === 0 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    Nenhuma categoria encontrada.
                                </div>
                            )}
                        </div>
                    </div>

                    <Input
                        label="Descrição"
                        placeholder="Ex: Almoço"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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
