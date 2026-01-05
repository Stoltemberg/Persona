
import { Modal } from './Modal';
import { Button } from './Button';
import { X, Check, Star } from 'lucide-react'; // Keep Star as it's used, add X if intended
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';

export function UpgradeModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Usuário não autenticado.');

            // A função invoke envia o token automaticamente se o usuário estiver logado
            const { data, error } = await supabase.functions.invoke('create-checkout');

            if (error) throw error;
            if (!data?.init_point) throw new Error('Link de pagamento não gerado.');

            // Redireciona para o Mercado Pago
            window.open(data.init_point, '_blank');
            onClose();
        } catch (error) {
            console.error('Erro no checkout:', error);
            addToast('Erro ao iniciar pagamento. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sessão Exclusiva ✨">
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                    marginBottom: '1.5rem',
                    display: 'inline-flex',
                    padding: '1rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFD700, #FDB931)',
                    boxShadow: '0 0 20px rgba(253, 185, 49, 0.3)'
                }}>
                    <Star size={40} color="white" fill="white" />
                </div>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
                    Seja Persona PRO
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Desbloqueie todo o potencial da sua gestão financeira.
                </p>

                <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem' }}>
                        <Check size={20} color="#4ade80" />
                        <span>Carteiras Ilimitadas</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem' }}>
                        <Check size={20} color="#4ade80" />
                        <span>Orçamentos Ilimitados</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem' }}>
                        <Check size={20} color="#4ade80" />
                        <span>Exportação para Excel (Contadores)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <Check size={20} color="#4ade80" />
                        <span>Suporte Prioritário</span>
                    </div>
                </div>

                <Button
                    className="btn-primary"
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #00B1EA, #00E5FF)' // Mercado Pago Blue-ish or Gold? Let's go Gold/Premium
                        // Actually use brand primary or gold
                    }}
                    onClick={handleUpgrade}
                >
                    Assinar Agora - R$ 29,90/mês
                </Button>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        marginTop: '1rem',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    Continuar no plano Grátis
                </button>
            </div>
        </Modal>
    );
}
