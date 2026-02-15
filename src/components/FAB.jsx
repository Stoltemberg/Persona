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
            addToast('Transação registrada!', 'success');
            handleClose();

            // Dispatch event with the new transaction data
            if (data && data.length > 0) {
                window.dispatchEvent(new CustomEvent('transaction-inserted', { detail: data[0] }));
            } else {
                // Fallback if data isn't returned for some reason (though .select() should return it)
                window.dispatchEvent(new Event('transaction-updated'));
            }

        } catch (error) {
            console.error('FAB save error:', error);
            addToast(error.message || 'Erro ao salvar', 'error');
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
                <Plus size={24} strokeWidth={2.2} />
            </button>

            <Modal isOpen={isOpen} onClose={handleClose} title="Nova Transação">
                <form onSubmit={handleSubmit} className="fab-modal-form">
                    {/* Type Segmented Control */}
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

                    {/* Amount & Date */}
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
                            onChange={(e) => {
                                const newDate = e.target.value;
                                setDate(newDate);
                                if (newDate > new Date().toISOString().split('T')[0]) {
                                    setStatus('pending');
                                } else {
                                    setStatus('paid');
                                }
                            }}
                            required
                        />
                    </div>

                    {/* Status & Recurrence Chips */}
                    <div className="fab-chips-row">
                        <button
                            type="button"
                            className={`fab-chip ${status === 'paid' ? 'active' : ''}`}
                            onClick={() => { setStatus(status === 'paid' ? 'pending' : 'paid'); medium(); }}
                        >
                            {status === 'paid' ? <CheckCircle size={14} /> : <Circle size={14} />}
                            {status === 'paid' ? 'Pago' : 'Pendente'}
                        </button>
                        <button
                            type="button"
                            className={`fab-chip ${isRecurring ? 'active' : ''}`}
                            onClick={() => { setIsRecurring(!isRecurring); medium(); }}
                        >
                            <Repeat size={14} />
                            {isRecurring ? 'Fixo' : 'Único'}
                        </button>
                    </div>

                    {/* Category Scroll */}
                    <div className="fab-section">
                        <label className="fab-label">Categoria</label>
                        <div className="fab-categories-scroll">
                            {availableCategories.map(cat => (
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

                    {/* Description */}
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
