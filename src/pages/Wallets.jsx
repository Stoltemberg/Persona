import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Skeleton } from '../components/Skeleton';
import { Wallet, Plus, Trash2, Edit2, CreditCard, Banknote, Landmark } from 'lucide-react';

import { useToast } from '../context/ToastContext';
import { UpgradeModal } from '../components/UpgradeModal';
import { EmptyState } from '../components/EmptyState';
import { TransferModal } from '../components/TransferModal';
import { ArrowRightLeft } from 'lucide-react';

export default function Wallets() {
    const { user, isPro, planTier, partnerProfile } = useAuth();
    const { addToast } = useToast();
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [walletToEdit, setWalletToEdit] = useState(null);
    const [name, setName] = useState('');
    const [type, setType] = useState('checking');
    const [initialBalance, setInitialBalance] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWallets();

            const handleSync = () => fetchWallets();
            window.addEventListener('supabase-sync', handleSync);
            return () => window.removeEventListener('supabase-sync', handleSync);
        }
    }, [user]);

    const fetchWallets = async () => {
        try {
            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            const { data: transactionsData, error: transactionsError } = await supabase
                .from('transactions')
                .select('*');

            if (transactionsError) throw transactionsError;

            const walletsWithBalance = (data || []).map((wallet) => {
                const walletTransactions = (transactionsData || []).filter((tx) => tx.wallet_id === wallet.id);
                const income = walletTransactions
                    .filter((tx) => tx.type === 'income')
                    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
                const expense = walletTransactions
                    .filter((tx) => tx.type === 'expense')
                    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

                return {
                    ...wallet,
                    current_balance: (parseFloat(wallet.initial_balance) || 0) + income - expense,
                };
            });

            setWallets(walletsWithBalance);
        } catch (error) {
            console.error('Error fetching wallets:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleSaveWallet = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                name,
                type,
                // color: 'neutral', // Deprecated
                initial_balance: parseFloat(initialBalance) || 0,
                profile_id: user.id
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
            addToast(error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza? Isso pode afetar transações antigas.')) return;
        try {
            const { error } = await supabase.from('wallets').delete().eq('id', id);
            if (error) throw error;
            setWallets(wallets.filter(w => w.id !== id));
            addToast('Carteira excluída.', 'success');
        } catch (error) {
            addToast('Erro ao excluir carteira.', 'error');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'cash': return <Banknote />;
            case 'credit_card': return <CreditCard />;
            case 'investment': return <Landmark />;
            default: return <Wallet />;
        }
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '80px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                        Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Carteiras</span>
                    </h1>
                    <p style={{ opacity: 0.6 }}>Gerencie suas contas bancárias e dinheiro físico</p>
                </div>
                {!loading && wallets.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%', maxWidth: '300px' }}>
                        <Button onClick={() => setIsTransferOpen(true)} variant="ghost" icon={ArrowRightLeft} disabled={wallets.length < 2} title={wallets.length < 2 ? "Precisa de pelo menos 2 carteiras" : "Transferir"} style={{ flex: '1', minWidth: '120px' }}>
                            Transferir
                        </Button>
                        <Button onClick={handleOpenNew} icon={Plus} style={{ flex: '1', minWidth: '120px' }}>
                            Nova Carteira
                        </Button>
                    </div>
                )}
            </header>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} width="100%" height="200px" borderRadius="24px" />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <AnimatePresence mode="popLayout">
                        {wallets.map((wallet, index) => (
                            <Card 
                                key={wallet.id} 
                                layout="position"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.3, ease: 'easeOut', opacity: { delay: index * 0.04 }, y: { delay: index * 0.04 } }} 
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--text-main)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {getIcon(wallet.type)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleOpenEdit(wallet)} className="btn-ghost" title="Editar"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(wallet.id)} className="btn-ghost" style={{ color: '#f64f59' }} title="Excluir"><Trash2 size={18} /></button>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {wallet.name}
                                    {wallet.profile_id && wallet.profile_id !== user.id && (
                                        <span style={{ 
                                            fontSize: '0.65rem', 
                                            padding: '0.15rem 0.4rem', 
                                            background: 'rgba(255,255,255,0.05)', 
                                            color: 'var(--text-main)', 
                                            borderRadius: '12px', 
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}>
                                            {partnerProfile?.avatar_url ? (
                                                <img src={partnerProfile.avatar_url} alt="Partner" style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(246, 79, 89, 0.2)', color: '#f64f59', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700 }}>
                                                    {(partnerProfile?.nickname || partnerProfile?.full_name || 'P')[0].toUpperCase()}
                                                </div>
                                            )}
                                            {partnerProfile?.nickname || partnerProfile?.full_name?.split(' ')[0] || 'Parceiro'}
                                        </span>
                                    )}
                                </h3>
                                <p style={{ opacity: 0.7, fontSize: '0.9rem', textTransform: 'capitalize' }}>{wallet.type.replace('_', ' ')}</p>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gap: '0.75rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saldo atual</p>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 700, color: Number(wallet.current_balance || 0) >= 0 ? 'var(--text-main)' : 'var(--color-danger)' }}>
                                        R$ {Number(wallet.current_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saldo inicial</p>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                                        R$ {parseFloat(wallet.initial_balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {wallets.length === 0 && (
                        <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ gridColumn: '1/-1' }}>
                            <EmptyState
                                icon={Wallet}
                                title="Nenhuma carteira encontrada"
                                description="Adicione suas contas bancárias, dinheiro físico ou cartões para começar a controlar seu patrimônio."
                                actionText="Criar Primeira Carteira"
                                onAction={handleOpenNew}
                            />
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={walletToEdit ? "Editar Carteira" : "Nova Carteira"}>
                <form onSubmit={handleSaveWallet}>
                    <Input
                        label="Nome da Carteira"
                        placeholder="Ex: Nubank, Carteira Física"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tipo</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="input-field"
                        >
                            <option value="checking">Conta Corrente</option>
                            <option value="savings">Poupança</option>
                            <option value="cash">Dinheiro Físico</option>
                            <option value="credit_card">Cartão de Crédito</option>
                            <option value="investment">Investimentos</option>
                        </select>
                    </div>

                    <Input
                        label="Saldo Inicial (R$)"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(e.target.value)}
                    />

                    {/* Color Picker Removed for Apple Style */}

                    <Button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} loading={submitting}>
                        {walletToEdit ? "Salvar Alterações" : "Criar Carteira"}
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
