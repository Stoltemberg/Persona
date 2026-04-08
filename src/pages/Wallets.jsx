import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightLeft, Banknote, CreditCard, Landmark, Plus, Trash2, Edit2, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Skeleton } from '../components/Skeleton';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../context/ToastContext';
import { UpgradeModal } from '../components/UpgradeModal';
import { EmptyState } from '../components/EmptyState';
import { TransferModal } from '../components/TransferModal';

export default function Wallets() {
    const { user, planTier, partnerProfile } = useAuth();
    const { addToast, addActionToast } = useToast();
    const [wallets, setWallets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [walletToEdit, setWalletToEdit] = useState(null);
    const [name, setName] = useState('');
    const [type, setType] = useState('checking');
    const [initialBalance, setInitialBalance] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const pendingDeleteTimers = useRef(new Map());

    useEffect(() => {
        if (!user) return undefined;

        fetchWalletData();
        const handleSync = (event) => {
            const table = event?.detail?.table;

            if (!table || table === 'wallets') {
                fetchWallets();
            }

            if (!table || table === 'transactions') {
                fetchTransactions();
            }
        };
        window.addEventListener('supabase-sync', handleSync);
        return () => window.removeEventListener('supabase-sync', handleSync);
    }, [user]);

    useEffect(() => () => {
        pendingDeleteTimers.current.forEach((timer) => clearTimeout(timer));
        pendingDeleteTimers.current.clear();
    }, []);

    const fetchWallets = async () => {
        try {
            const { data, error } = await supabase
                .from('wallets')
                .select('id, name, type, initial_balance, profile_id, created_at')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setWallets(data || []);
        } catch (error) {
            console.error('Error fetching wallets:', error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('id, amount, type, wallet_id');

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const fetchWalletData = async () => {
        setLoading(true);

        try {
            const [walletResponse, transactionResponse] = await Promise.all([
                supabase.from('wallets').select('id, name, type, initial_balance, profile_id, created_at').order('created_at', { ascending: true }),
                supabase.from('transactions').select('id, amount, type, wallet_id'),
            ]);

            if (walletResponse.error) throw walletResponse.error;
            if (transactionResponse.error) throw transactionResponse.error;

            setWallets(walletResponse.data || []);
            setTransactions(transactionResponse.data || []);
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const walletsWithBalance = useMemo(() => wallets.map((wallet) => {
        let income = 0;
        let expense = 0;

        transactions.forEach((transaction) => {
            if (transaction.wallet_id !== wallet.id) return;
            const amount = Number(transaction.amount || 0);
            if (transaction.type === 'income') income += amount;
            if (transaction.type === 'expense') expense += amount;
        });

        return {
            ...wallet,
            current_balance: (parseFloat(wallet.initial_balance) || 0) + income - expense,
        };
    }), [wallets, transactions]);

    const totalBalance = walletsWithBalance.reduce((sum, wallet) => sum + Number(wallet.current_balance || 0), 0);
    const negativeWallets = walletsWithBalance.filter((wallet) => Number(wallet.current_balance || 0) < 0).length;
    const topWallet = useMemo(
        () => walletsWithBalance.slice().sort((a, b) => Number(b.current_balance || 0) - Number(a.current_balance || 0))[0] || null,
        [walletsWithBalance],
    );

    const handleOpenNew = () => {
        let maxWallets = 1;
        if (planTier === 'intermediate') maxWallets = 3;
        if (planTier === 'complete') maxWallets = Infinity;

        if (wallets.length >= maxWallets) {
            setShowUpgrade(true);
            return;
        }

        setWalletToEdit(null);
        setName('');
        setType('checking');
        setInitialBalance('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (wallet) => {
        setWalletToEdit(wallet);
        setName(wallet.name);
        setType(wallet.type);
        setInitialBalance(wallet.initial_balance);
        setIsModalOpen(true);
    };

    const handleSaveWallet = async (event) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                name,
                type,
                initial_balance: parseFloat(initialBalance) || 0,
                profile_id: user.id,
            };

            if (walletToEdit) {
                const { error } = await supabase
                    .from('wallets')
                    .update(payload)
                    .eq('id', walletToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('wallets')
                    .insert([payload]);
                if (error) throw error;
            }

            await fetchWallets();
            setIsModalOpen(false);
            addToast(walletToEdit ? 'Carteira atualizada.' : 'Carteira criada.', 'success');
        } catch (error) {
            addToast(error.message || 'Erro ao salvar carteira.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        const wallet = wallets.find((item) => item.id === id);
        if (!wallet) return;

        setWallets((prev) => prev.filter((item) => item.id !== id));

        const timer = setTimeout(async () => {
            pendingDeleteTimers.current.delete(id);

            try {
                const { error } = await supabase.from('wallets').delete().eq('id', id);
                if (error) throw error;
                addToast('Carteira excluida.', 'success');
            } catch (error) {
                setWallets((prev) => [...prev, wallet].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
                addToast('Erro ao excluir carteira.', 'error');
            }
        }, 5000);

        pendingDeleteTimers.current.set(id, timer);

        addActionToast('Carteira removida.', 'Desfazer', () => {
            const pendingTimer = pendingDeleteTimers.current.get(id);
            if (pendingTimer) {
                clearTimeout(pendingTimer);
                pendingDeleteTimers.current.delete(id);
                setWallets((prev) => [...prev, wallet].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
            }
        }, 'info');
    };

    const getIcon = (walletType) => {
        switch (walletType) {
            case 'cash':
                return Banknote;
            case 'credit_card':
                return CreditCard;
            case 'investment':
                return Landmark;
            default:
                return Wallet;
        }
    };

    return (
        <div className="container fade-in app-page-shell" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={<span>Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Carteiras</span></span>}
                subtitle="Organize saldos, transferencia entre contas e distribuicao do dinheiro em um layout mais limpo."
            >
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {walletsWithBalance.length > 0 && (
                        <Button onClick={() => setIsTransferOpen(true)} variant="ghost" icon={ArrowRightLeft} disabled={walletsWithBalance.length < 2}>
                            Transferir
                        </Button>
                    )}
                    <Button onClick={handleOpenNew} icon={Plus} className="btn-primary">
                        Nova carteira
                    </Button>
                </div>
            </PageHeader>

            <div className="app-summary-grid">
                <Card hover={false} className="app-summary-card app-summary-card-neutral">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-neutral">
                            <Wallet size={18} />
                        </div>
                        <span className="app-summary-label">Saldo consolidado</span>
                    </div>
                    <strong className="app-summary-value">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </Card>
                <Card hover={false} className="app-summary-card app-summary-card-neutral">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-neutral">
                            <Banknote size={18} />
                        </div>
                        <span className="app-summary-label">Carteiras ativas</span>
                    </div>
                    <strong className="app-summary-value">{walletsWithBalance.length}</strong>
                </Card>
                <Card hover={false} className={`app-summary-card ${negativeWallets > 0 ? 'app-summary-card-danger' : 'app-summary-card-success'}`}>
                    <div className="app-summary-topline">
                        <div className={`app-summary-icon ${negativeWallets > 0 ? 'app-summary-icon-danger' : 'app-summary-icon-success'}`}>
                            <Landmark size={18} />
                        </div>
                        <span className="app-summary-label">Ponto de atencao</span>
                    </div>
                    <strong className="app-summary-value">
                        {negativeWallets > 0 ? `${negativeWallets} com saldo negativo` : (topWallet ? topWallet.name : 'Tudo em ordem')}
                    </strong>
                </Card>
            </div>

            {loading ? (
                <div className="app-list-grid">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} width="100%" height="220px" borderRadius="20px" />
                    ))}
                </div>
            ) : walletsWithBalance.length === 0 ? (
                <EmptyState
                    icon={Wallet}
                    title="Nenhuma carteira encontrada"
                    description="Adicione contas bancarias, caixa ou investimentos para o painel refletir onde seu dinheiro esta."
                    actionText="Criar primeira carteira"
                    onAction={handleOpenNew}
                />
            ) : (
                <div className="app-list-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    <AnimatePresence mode="popLayout">
                        {walletsWithBalance.map((wallet, index) => {
                            const Icon = getIcon(wallet.type);
                            const isNegative = Number(wallet.current_balance || 0) < 0;

                            return (
                                <Card
                                    key={wallet.id}
                                    className="app-section-card"
                                    layout="position"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ duration: 0.3, ease: 'easeOut', opacity: { delay: index * 0.04 }, y: { delay: index * 0.04 } }}
                                >
                                    <div className="app-section-header">
                                        <div className="app-list-card-main">
                                            <span className="app-inline-icon">
                                                <Icon size={18} />
                                            </span>
                                            <div>
                                                <strong>{wallet.name}</strong>
                                                <span>{wallet.type.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                        <div className="app-list-card-actions">
                                            <button onClick={() => handleOpenEdit(wallet)} className="btn-ghost btn-icon" title="Editar">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(wallet.id)} className="btn-ghost btn-icon" style={{ color: '#f64f59' }} title="Excluir">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {wallet.profile_id && wallet.profile_id !== user.id && (
                                        <div className="dashboard-partner-chip" style={{ marginLeft: 0 }}>
                                            {partnerProfile?.avatar_url ? (
                                                <img src={partnerProfile.avatar_url} alt="Parceiro" style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div className="dashboard-partner-fallback">
                                                    {(partnerProfile?.nickname || partnerProfile?.full_name || 'P')[0].toUpperCase()}
                                                </div>
                                            )}
                                            {partnerProfile?.nickname || partnerProfile?.full_name?.split(' ')[0] || 'Parceiro'}
                                        </div>
                                    )}

                                    <div className="app-summary-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <Card hover={false} className={`app-summary-card ${isNegative ? 'app-summary-card-danger' : 'app-summary-card-success'}`}>
                                            <span className="app-summary-label">Saldo atual</span>
                                            <strong className="app-summary-value">R$ {Number(wallet.current_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                        </Card>
                                        <Card hover={false} className="app-summary-card app-summary-card-neutral">
                                            <span className="app-summary-label">Saldo inicial</span>
                                            <strong className="app-summary-value">R$ {parseFloat(wallet.initial_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                        </Card>
                                    </div>
                                </Card>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={walletToEdit ? 'Editar carteira' : 'Nova carteira'}>
                <form onSubmit={handleSaveWallet}>
                    <Input
                        label="Nome da carteira"
                        placeholder="Ex: Nubank, Carteira fisica"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label>Tipo</label>
                        <select value={type} onChange={(event) => setType(event.target.value)} className="input-field">
                            <option value="checking">Conta corrente</option>
                            <option value="savings">Poupanca</option>
                            <option value="cash">Dinheiro fisico</option>
                            <option value="credit_card">Cartao de credito</option>
                            <option value="investment">Investimentos</option>
                        </select>
                    </div>

                    <Input
                        label="Saldo inicial (R$)"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={initialBalance}
                        onChange={(event) => setInitialBalance(event.target.value)}
                    />

                    <Button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }} loading={submitting}>
                        {walletToEdit ? 'Salvar alteracoes' : 'Criar carteira'}
                    </Button>
                </form>
            </Modal>

            <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
            <TransferModal
                isOpen={isTransferOpen}
                onClose={() => setIsTransferOpen(false)}
                wallets={wallets}
                onTransferSuccess={fetchWallets}
            />
        </div>
    );
}
