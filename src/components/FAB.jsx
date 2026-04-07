import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useHaptic } from '../hooks/useHaptic';
import { Modal } from './Modal';
import { TransactionForm } from './TransactionForm';
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

    const handleTypeChange = (nextType) => {
        setType(nextType);
        setCategory('');
        setSelectedCategory(null);
        medium();
    };

    const handleDescriptionChange = (value) => {
        setDescription(value);

        if (value.length > 2 && !category) {
            const smartMatch = getSmartCategory(value, categories);
            if (smartMatch) {
                if (smartMatch.type !== type) setType(smartMatch.type);
                setCategory(smartMatch.name);
                setSelectedCategory(smartMatch);
            }
        }
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
                    wallet_id: selectedWalletId,
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
                <div className="fab-modal-form">
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
                            medium();
                        }}
                        expenseType={expenseType}
                        onExpenseTypeChange={setExpenseType}
                        showRecurringToggle={true}
                        isRecurring={isRecurring}
                        onRecurringChange={setIsRecurring}
                        description={description}
                        onDescriptionChange={handleDescriptionChange}
                        onSubmit={handleSubmit}
                        submitLabel="Registrar"
                        loading={loading}
                    />
                </div>
            </Modal>
        </>
    );
}
