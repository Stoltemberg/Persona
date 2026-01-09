import { Modal } from './Modal';
import { Button } from './Button';
import { X, Check, Star, Zap, Shield, Crown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';
import { Input } from './Input';

export function UpgradeModal({ isOpen, onClose }) {
    const { user, fetchProfile } = useAuth(); // fetchProfile needed to refresh after coupon
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const [selectedTier, setSelectedTier] = useState('complete'); // Default to best

    const tiers = [
        {
            id: 'free',
            name: 'Grátis',
            price: 'R$ 0',
            features: ['5 Carteiras', '10 Orçamentos', 'Análise Básica'],
            icon: Zap,
            color: '#4ade80'
        },
        {
            id: 'intermediate',
            name: 'Intermediário',
            price: 'R$ 14,90',
            features: ['Carteiras Ilimitadas', 'Orçamentos Ilimitados', 'Sem Anúncios'],
            icon: Shield,
            color: '#12c2e9'
        },
        {
            id: 'complete',
            name: 'Completo',
            price: 'R$ 29,90',
            features: ['Tudo do Intermediário', 'IA Financeira', 'Exportação Excel', 'Suporte VIP'],
            icon: Crown,
            color: '#FFD700'
        }
    ];

    const handleUpgrade = async (tierId) => {
        if (tierId === 'free') {
            onClose();
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Sessão inválida.');

            // Call function to create checkout preference
            // Note: You would likely pass the price/tier to the backend function
            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: { tier: tierId },
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (error) throw error;
            if (data?.init_point) window.open(data.init_point, '_blank');
            onClose();
        } catch (error) {
            console.error('Checkout error:', error);
            addToast('Erro ao iniciar pagamento.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode) return;
        setRedeeming(true);
        try {
            const { data, error } = await supabase.rpc('redeem_coupon', { coupon_code: couponCode.toUpperCase() });

            if (error) throw error;

            if (data.success) {
                addToast(`Cupom aplicado! Plano: ${data.tier}`, 'success');
                await fetchProfile(user.id); // Refresh local state
                onClose();
            }
        } catch (error) {
            console.error('Redeem error:', error);
            addToast(error.message || 'Erro ao resgatar cupom.', 'error');
        } finally {
            setRedeeming(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Escolha seu Plano">
            <div className="upgrade-modal-content">

                {/* Coupon Section */}
                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <form onSubmit={handleRedeemCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                        <Input
                            placeholder="Tem um cupom?"
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value)}
                            style={{ margin: 0 }}
                        />
                        <Button type="submit" loading={redeeming} className="btn-ghost" style={{ border: '1px solid var(--glass-border)' }}>
                            Aplicar
                        </Button>
                    </form>
                </div>

                {/* Tiers Grid */}
                <div className="tiers-grid" style={{ display: 'grid', gap: '1rem' }}>
                    {tiers.map(tier => (
                        <div
                            key={tier.id}
                            onClick={() => setSelectedTier(tier.id)}
                            style={{
                                padding: '1rem',
                                border: `1px solid ${selectedTier === tier.id ? tier.color : 'var(--glass-border)'}`,
                                borderRadius: '12px',
                                background: selectedTier === tier.id ? `rgba(${tier.color === '#FFD700' ? '255, 215, 0' : '255,255,255'}, 0.05)` : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <tier.icon size={20} color={tier.color} />
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{tier.name}</h3>
                                </div>
                                <span style={{ fontWeight: 700 }}>{tier.price}</span>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {tier.features.map((feat, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <Check size={12} color={tier.color} /> {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <Button
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => handleUpgrade(selectedTier)}
                        loading={loading}
                    >
                        {selectedTier === 'free' ? 'Manter Grátis' : `Assinar ${tiers.find(t => t.id === selectedTier)?.name}`}
                    </Button>
                </div>

            </div>
        </Modal>
    );
}
