import { useEffect, useState } from 'react';
import { Check, Crown, Shield, Zap } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const paidTierPrices = {
    intermediate: 14.9,
    complete: 29.9,
};

const tierLabels = {
    intermediate: 'One',
    complete: 'Duo',
};

const tiers = [
    {
        id: 'free',
        name: 'Free',
        price: 'R$ 0',
        description: 'Para organizar o essencial e conhecer a plataforma.',
        features: ['1 carteira', '5 orcamentos', 'Analise basica'],
        icon: Zap,
        tone: 'success',
    },
    {
        id: 'intermediate',
        name: 'One',
        price: 'R$ 14,90',
        description: 'Mais espaco para estruturar a vida financeira pessoal.',
        features: ['3 carteiras', '10 orcamentos', 'Analise basica'],
        icon: Shield,
        tone: 'neutral',
    },
    {
        id: 'complete',
        name: 'Duo',
        price: 'R$ 29,90',
        description: 'Experiencia completa com modo casal e exportacoes avancadas.',
        features: ['Carteiras ilimitadas', 'IA financeira', 'Exportacao completa', 'Modo casal', 'Orcamentos ilimitados'],
        icon: Crown,
        tone: 'brand',
    },
];

export function UpgradeModal({ isOpen, onClose }) {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [couponMeta, setCouponMeta] = useState(null);
    const [selectedTier, setSelectedTier] = useState('complete');
    const selectedPaidPrice = paidTierPrices[selectedTier] ?? 0;
    const discountedPrice = couponMeta?.discount_percent
        ? Number((selectedPaidPrice * (1 - couponMeta.discount_percent / 100)).toFixed(2))
        : selectedPaidPrice;

    useEffect(() => {
        if (!appliedCoupon || !couponMeta?.tier || couponMeta.tier === selectedTier) {
            return;
        }

        setAppliedCoupon('');
        setCouponMeta(null);
        setCouponCode('');
        addToast('O cupom removido nao vale para o plano selecionado.', 'info');
    }, [addToast, appliedCoupon, couponMeta, selectedTier]);

    const handleUpgrade = async (tierId) => {
        if (tierId === 'free') {
            onClose();
            return;
        }

        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Sessao invalida.');

            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: {
                    tier: tierId,
                    couponCode: appliedCoupon || null,
                },
                headers: { Authorization: `Bearer ${session.access_token}` },
            });

            if (error) throw error;
            if (!data?.init_point) {
                throw new Error('Checkout sem URL de redirecionamento.')
            }

            const expectedPrice = couponMeta?.discount_percent
                ? Number((paidTierPrices[tierId] * (1 - couponMeta.discount_percent / 100)).toFixed(2))
                : paidTierPrices[tierId]

            const tierMatches = data?.tier === tierId
            const priceMatches = typeof data?.final_price === 'number' && Math.abs(data.final_price - expectedPrice) <= 0.01
            const titleMatches = !data?.plan_title || data.plan_title === `Persona ${tierLabels[tierId]} (Acesso 30 dias)`
            const responseIsValidated = data?.checkout_validated === true

            if (!tierMatches || !priceMatches || !titleMatches || !responseIsValidated) {
                throw new Error('A resposta do checkout nao confirmou o plano selecionado.')
            }

            window.location.href = data.init_point;
        } catch (error) {
            console.error('Checkout error:', error);
            addToast(error.message || 'Erro ao iniciar pagamento.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyCoupon = async (event) => {
        event.preventDefault();
        if (!couponCode.trim()) return;

        try {
            const normalizedCoupon = couponCode.trim().toUpperCase();
            const { data, error } = await supabase.rpc('redeem_coupon', {
                coupon_code: normalizedCoupon,
                selected_tier: selectedTier,
            });
            if (error) throw error;

            if (data?.valid_for_selected_tier === false) {
                setAppliedCoupon('');
                setCouponMeta(null);
                setCouponCode('');
                addToast(`Esse cupom vale apenas para o plano ${data.tier}.`, 'error');
                return;
            }

            setAppliedCoupon(normalizedCoupon);
            setCouponMeta(data ?? null);
            addToast(`Cupom validado para o plano ${data?.tier || selectedTier}.`, 'success');
        } catch (error) {
            console.error('Coupon apply error:', error);
            addToast(error.message || 'Nao foi possivel validar o cupom.', 'error');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Escolha seu plano">
            <div className="upgrade-modal-shell">
                <div className="upgrade-modal-hero">
                    <span className="dashboard-kicker">Recursos premium</span>
                    <h3>Expanda a Persona conforme a sua rotina financeira evolui</h3>
                    <p>Compare os planos, aplique um cupom e siga para o checkout sem sair do mesmo fluxo.</p>
                </div>

                <CardCouponForm
                    couponCode={couponCode}
                    onCouponChange={(value) => {
                        setCouponCode(value);
                        if (appliedCoupon && value.trim().toUpperCase() !== appliedCoupon) {
                            setAppliedCoupon('');
                            setCouponMeta(null);
                        }
                    }}
                    appliedCoupon={appliedCoupon}
                    couponMeta={couponMeta}
                    onSubmit={handleApplyCoupon}
                />

                <div className="upgrade-tier-grid">
                    {tiers.map((tier) => {
                        const Icon = tier.icon;
                        const isSelected = selectedTier === tier.id;

                        return (
                            <button
                                key={tier.id}
                                type="button"
                                className={`upgrade-tier-card ${isSelected ? 'is-selected' : ''} tone-${tier.tone}`}
                                onClick={() => setSelectedTier(tier.id)}
                            >
                                <div className="upgrade-tier-head">
                                    <div className="app-list-card-main">
                                        <span className="app-inline-icon">
                                            <Icon size={18} />
                                        </span>
                                        <div>
                                            <strong>{tier.name}</strong>
                                            <span>{tier.description}</span>
                                        </div>
                                    </div>
                                    <strong className="upgrade-tier-price">{tier.price}</strong>
                                </div>

                                <div className="upgrade-tier-features">
                                    {tier.features.map((feature) => (
                                        <span key={feature} className="upgrade-tier-feature">
                                            <Check size={14} />
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {selectedTier !== 'free' && (
                    <div className="app-section-card upgrade-coupon-card" style={{ paddingTop: '0.9rem', paddingBottom: '0.9rem' }}>
                        <div className="app-list-card-main" style={{ justifyContent: 'space-between' }}>
                            <div>
                                <strong>Resumo do checkout</strong>
                                <span>
                                    {couponMeta?.discount_percent
                                        ? `Desconto de ${couponMeta.discount_percent}% aplicado ao plano ${tiers.find((tier) => tier.id === selectedTier)?.name}.`
                                        : 'Sem desconto aplicado no momento.'}
                                </span>
                            </div>
                            <strong className="upgrade-tier-price">
                                {discountedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </strong>
                        </div>
                    </div>
                )}

                <Button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleUpgrade(selectedTier)}
                    loading={loading}
                >
                    {selectedTier === 'free'
                        ? 'Continuar no plano gratuito'
                        : `Assinar ${tiers.find((tier) => tier.id === selectedTier)?.name}`}
                </Button>
            </div>
        </Modal>
    );
}

function CardCouponForm({ couponCode, onCouponChange, appliedCoupon, couponMeta, onSubmit }) {
    return (
        <div className="app-section-card upgrade-coupon-card">
            <div className="app-list-card-main">
                <span className="app-inline-icon">
                    <Crown size={16} />
                </span>
                <div>
                    <strong>Ja tem um cupom?</strong>
                    <span>Aplique o codigo para desbloquear o plano correspondente.</span>
                </div>
            </div>

            <form onSubmit={onSubmit} className="upgrade-coupon-form">
                <Input
                    placeholder="Digite o cupom"
                    value={couponCode}
                    onChange={(event) => onCouponChange(event.target.value)}
                />
                <Button type="submit" variant="ghost">
                    Aplicar
                </Button>
            </form>
            {appliedCoupon && (
                <p className="text-muted" style={{ margin: 0 }}>
                    Cupom preparado para o checkout: <strong style={{ color: 'var(--text-main)' }}>{appliedCoupon}</strong>
                    {couponMeta?.discount_percent ? ` (${couponMeta.discount_percent}% off)` : ''}
                </p>
            )}
        </div>
    );
}
