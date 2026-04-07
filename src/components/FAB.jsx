import { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, Repeat } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useHaptic } from '../hooks/useHaptic';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { getSmartCategory } from '../utils/smartCategories';

export function FAB({ className, style }) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const { medium, success } = useHaptic();

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [expenseType, setExpenseType] = useState('variable');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [categories, setCategories] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        if (isOpen && user) {
            fetchCategories();
            fetchWallets();
        }
    }, [isOpen, user]);

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*');
        setCategories(data || []);
    };

    const fetchWallets = async () => {
        const { data } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });
        setWallets(data || []);

        if (data && data.length > 0 && !selectedWalletId) {
            setSelectedWalletId(data[0].id);
        }
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
        setIsRecurring(false);
        setSelectedWalletId(wallets[0]?.id || '');
        setSelectedCategory(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!selectedWalletId) {
                throw new Error('Cadastre uma carteira antes de registrar transações pelo atalho rápido.');
            }

            const payload = {
                description,
                amount: parseFloat(amount),
                type,
                category,
                wallet_id: selectedWalletId,
                expense_type: type === 'expense' ? expenseType : null,
                date,
                profile_id: user.id,
            };

            const { data, error } = await supabase.from('transactions').insert([payload]).select();

            if (error) throw error;

            if (isRecurring) {
                const nextDate = new Date(date || new Date().toISOString());
                nextDate.setMonth(nextDate.getMonth() + 1);

                const { error: recurringError } = await supabase.from('recurring_templates').insert([{
                    description,
                    amount: parseFloat(amount),
                    type,
                    category,
                    expense_type: type === 'expense' ? expenseType : null,
                    frequency: 'monthly',
                    next_due_date: nextDate.toISOString(),
                    profile_id: user.id,
                    active: true,
                }]);

                if (recurringError) {
                    console.error('FAB recurring error:', recurringError);
                }
            }

            success();
            addToast('Transação registrada!', 'success');
            handleClose();

            if (data && data.length > 0) {
                window.dispatchEvent(new CustomEvent('transaction-inserted', { detail: data[0] }));
            } else {
                window.dispatchEvent(new Event('transaction-updated'));
            }
        } catch (error) {
            console.error('FAB save error:', error);
            addToast(error.message || 'Erro ao salvar', 'error');
        } finally {
            setLoading(false);
        }
    };

    const availableCategories = categories.filter((c) => c.type === type);

    return (
        <>
            <button
                onClick={handleOpen}
                className={`fab-btn ${className || ''}`}
                style={style}
                aria-label="Adicionar transação"
            >
                <Plus size={24} strokeWidth={2.2} />
            </button>

            <Modal isOpen={isOpen} onClose={handleClose} title="Nova Transação">
                <form onSubmit={handleSubmit} className="fab-modal-form">
                    <div className="fab-type-toggle">
                        <button
                            type="button"
                            className={`fab-type-btn ${type === 'expense' ? 'active expense' : ''}`}
                            onClick={() => { setType('expense'); setCategory(''); setSelectedCategory(null); medium(); }}
                        >
                            <ArrowDownLeft size={15} />
                            Despesa
                        </button>
                        <button
                            type="button"
                            className={`fab-type-btn ${type === 'income' ? 'active income' : ''}`}
                            onClick={() => { setType('income'); setCategory(''); setSelectedCategory(null); medium(); }}
                        >
                            <ArrowUpRight size={15} />
                            Receita
                        </button>
                    </div>

                    <div className="fab-row">
                        <Input
                            label="Valor"
                            placeholder="0,00"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            autoFocus
                            style={{ fontSize: '1.2rem', fontWeight: 500, textAlign: 'center' }}
                        />
                        <Input
                            label="Data"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="fab-chips-row">
                        <button
                            type="button"
                            className={`fab-chip ${isRecurring ? 'active' : ''}`}
                            onClick={() => { setIsRecurring(!isRecurring); medium(); }}
                        >
                            <Repeat size={14} />
                            {isRecurring ? 'Mensal' : 'Único'}
                        </button>
                    </div>

                    <div className="input-group">
                        <label className="fab-label">Carteira</label>
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

                    <div className="fab-section">
                        <label className="fab-label">Categoria</label>
                        <div className="fab-categories-scroll">
                            {availableCategories.map((cat) => (
                                <div
                                    key={cat.id}
                                    onClick={() => { setCategory(cat.name); setSelectedCategory(cat); medium(); }}
                                    className={`fab-category-item ${selectedCategory?.id === cat.id ? 'selected' : ''}`}
                                    style={selectedCategory?.id === cat.id ? { borderColor: cat.color, background: `${cat.color}15` } : undefined}
                                >
                                    <span className="fab-category-icon">{cat.icon}</span>
                                    <span className="fab-category-name">{cat.name}</span>
                                </div>
                            ))}
                            {availableCategories.length === 0 && (
                                <div className="fab-empty-cats">Nenhuma categoria encontrada.</div>
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

                    <Button type="submit" className="btn-primary fab-submit" loading={loading}>
                        Registrar
                    </Button>
                </form>
            </Modal>
        </>
    );
}
