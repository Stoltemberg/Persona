import { useState, useEffect } from 'react';
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
    const { user, isPro } = useAuth();
    const { addToast } = useToast();
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [walletToEdit, setWalletToEdit] = useState(null);
    const [name, setName] = useState('');
    const [type, setType] = useState('checking');
    const [color, setColor] = useState('#12c2e9');
    const [initialBalance, setInitialBalance] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWallets();
        }
    }, [user]);

    const fetchWallets = async () => {
        try {
            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setWallets(data || []);
        } catch (error) {
            console.error('Error fetching wallets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNew = () => {
        if (!isPro && wallets.length >= 1) {
            setShowUpgrade(true);
            return;
        }
        setWalletToEdit(null);
        setName('');
        setType('checking');
        setColor('#12c2e9');
        setInitialBalance('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (wallet) => {
        setWalletToEdit(wallet);
        setName(wallet.name);
        setType(wallet.type);
        setColor(wallet.color || '#12c2e9');
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
                color,
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
        <div className="container fade-in" style={{ paddingBottom: '100px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-main)' }}>Minhas Carteiras</h1>
                    <p style={{ opacity: 0.6 }}>Gerencie suas contas bancárias e dinheiro físico</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button onClick={() => setIsTransferOpen(true)} variant="ghost" icon={ArrowRightLeft} disabled={wallets.length < 2} title={wallets.length < 2 ? "Precisa de pelo menos 2 carteiras" : "Transferir"}>
                        Transferir
                    </Button>
                    <Button onClick={handleOpenNew} icon={Plus}>
                        Nova Carteira
                    </Button>
                </div>
            </header>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} width="100%" height="200px" borderRadius="24px" />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {wallets.map((wallet, index) => (
                        <Card key={wallet.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: '14px',
                                    background: `${wallet.color}20`,
                                    color: wallet.color
                                }}>
                                    {getIcon(wallet.type)}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleOpenEdit(wallet)} className="btn-ghost" title="Editar"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(wallet.id)} className="btn-ghost" style={{ color: '#f64f59' }} title="Excluir"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{wallet.name}</h3>
                            <p style={{ opacity: 0.7, fontSize: '0.9rem', textTransform: 'capitalize' }}>{wallet.type.replace('_', ' ')}</p>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saldo Inicial</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>R$ {parseFloat(wallet.initial_balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </Card>
                    ))}

                    {wallets.length === 0 && (
                        <div style={{ gridColumn: '1/-1' }}>
                            <EmptyState
                                icon={Wallet}
                                title="Nenhuma carteira encontrada"
                                description="Adicione suas contas bancárias, dinheiro físico ou cartões para começar a controlar seu patrimônio."
                                actionText="Criar Primeira Carteira"
                                onAction={handleOpenNew}
                            />
                        </div>
                    )}
                </div>
            )
            }

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

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cor</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['#12c2e9', '#c471ed', '#f64f59', '#11998e', '#F2994A', '#8E2DE2'].map(c => (
                                <div
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: c,
                                        cursor: 'pointer',
                                        border: color === c ? '2px solid white' : '2px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

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
