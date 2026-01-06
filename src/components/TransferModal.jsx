import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { ArrowRightLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export function TransferModal({ isOpen, onClose, wallets, onTransferSuccess }) {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [sourceWalletId, setSourceWalletId] = useState('');
    const [destWalletId, setDestWalletId] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && wallets.length >= 2) {
            // Smart defaults
            setSourceWalletId(wallets[0].id);
            setDestWalletId(wallets[1].id);
        }
    }, [isOpen, wallets]);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (sourceWalletId === destWalletId) {
            addToast('A carteira de origem e destino devem ser diferentes.', 'error');
            setSubmitting(false);
            return;
        }

        try {
            const numAmount = parseFloat(amount);
            if (!numAmount || numAmount <= 0) throw new Error('Valor inválido.');

            const sourceWallet = wallets.find(w => w.id === sourceWalletId);
            const destWallet = wallets.find(w => w.id === destWalletId);

            // 1. Create Expense in Source
            const { error: error1 } = await supabase.from('transactions').insert([{
                description: `Transferência para ${destWallet.name}`,
                amount: numAmount,
                type: 'expense',
                category: 'Transferência',
                wallet_id: sourceWalletId,
                date: new Date(date).toISOString(),
                profile_id: user.id,
                expense_type: 'variable' // Default
            }]);
            if (error1) throw error1;

            // 2. Create Income in Destination
            const { error: error2 } = await supabase.from('transactions').insert([{
                description: `Recebido de ${sourceWallet.name}`,
                amount: numAmount,
                type: 'income',
                category: 'Transferência',
                wallet_id: destWalletId,
                date: new Date(date).toISOString(),
                profile_id: user.id
            }]);
            if (error2) throw error2;

            addToast('Transferência realizada com sucesso!', 'success');
            onTransferSuccess();
            onClose();
            setAmount('');
        } catch (error) {
            console.error(error);
            addToast('Erro ao realizar transferência.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nova Transferência">
            <form onSubmit={handleTransfer}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>De</label>
                        <select
                            value={sourceWalletId}
                            onChange={e => setSourceWalletId(e.target.value)}
                            className="input-field"
                            style={{ fontSize: '0.9rem' }}
                        >
                            {wallets.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ paddingTop: '1rem', color: 'var(--text-muted)' }}>
                        <ArrowRightLeft size={20} />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Para</label>
                        <select
                            value={destWalletId}
                            onChange={e => setDestWalletId(e.target.value)}
                            className="input-field"
                            style={{ fontSize: '0.9rem' }}
                        >
                            {wallets.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Input
                    label="Valor (R$)"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                />

                <Input
                    label="Data"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                />

                <Button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} loading={submitting}>
                    Confirmar Transferência
                </Button>
            </form>
        </Modal>
    );
}
