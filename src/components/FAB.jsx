import { useEffect, useState } from 'react';
import { CalendarDays, Plus, Repeat, Sparkles, Wallet } from 'lucide-react';
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            if (!selectedWalletId) {
                throw new Error('Cadastre uma carteira antes de registrar transacoes pelo atalho rapido.');
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
            addToast('Transacao registrada.', 'success');
            handleClose();

            if (data && data.length > 0) {
                window.dispatchEvent(new CustomEvent('transaction-inserted', { detail: data[0] }));
            } else {
                window.dispatchEvent(new Event('transaction-updated'));
            }
        } catch (error) {
            console.error('FAB save error:', error);
            addToast(error.message || 'Erro ao salvar.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const availableCategories = categories.filter((item) => item.type === type);
    const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId);

    return (
        <>
            <button
                onClick={handleOpen}
                className={`fab-btn ${className || ''}`}
                style={style}
                aria-label="Adicionar transacao"
            >
                <span className="fab-btn-ring" aria-hidden="true" />
                <Plus size={24} strokeWidth={2.2} />
            </button>

            <Modal isOpen={isOpen} onClose={handleClose} title="Novo lancamento">
                <div className="fab-modal-form">
                    <div className="fab-modal-intro">
                        <div>
                            <span className="dashboard-kicker">Atalho rapido</span>
                            <h3>Registrar sem sair da tela</h3>
                            <p>Escolha a carteira, a categoria e a data para atualizar o saldo no mesmo instante.</p>
                        </div>

                        <div className="fab-modal-highlights">
                            <div className="fab-highlight-card">
                                <span className="fab-highlight-icon">
                                    <Wallet size={16} />
                                </span>
                                <div>
                                    <strong>{selectedWallet?.name || 'Selecione a carteira'}</strong>
                                    <span>Origem do valor</span>
                                </div>
                            </div>

                            <div className="fab-highlight-card">
                                <span className="fab-highlight-icon">
                                    <CalendarDays size={16} />
                                </span>
                                <div>
                                    <strong>{date ? new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR') : 'Hoje'}</strong>
                                    <span>Data do registro</span>
                                </div>
                            </div>

                            <div className="fab-highlight-card">
                                <span className="fab-highlight-icon">
                                    {isRecurring ? <Repeat size={16} /> : <Sparkles size={16} />}
                                </span>
                                <div>
                                    <strong>{isRecurring ? 'Mensal' : 'Lancamento unico'}</strong>
                                    <span>{isRecurring ? 'Recorrencia ativa' : 'Entrada imediata'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

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
                        onCategorySelect={(selected) => {
                            setCategory(selected.name);
                            setSelectedCategory(selected);
                            medium();
                        }}
                        expenseType={expenseType}
                        onExpenseTypeChange={setExpenseType}
                        showRecurringToggle
                        isRecurring={isRecurring}
                        onRecurringChange={setIsRecurring}
                        description={description}
                        onDescriptionChange={handleDescriptionChange}
                        onSubmit={handleSubmit}
                        submitLabel="Salvar lancamento"
                        loading={loading}
                    />
                </div>
            </Modal>
        </>
    );
}
