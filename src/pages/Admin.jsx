import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../context/ToastContext';

function AdminBackdrop() {
    const reducedMotion = useReducedMotion();

    return (
        <div
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(circle at 18% 16%, rgba(212, 175, 55, 0.12), transparent 24%), radial-gradient(circle at 80% 12%, rgba(92, 132, 255, 0.09), transparent 22%), radial-gradient(circle at 50% 88%, rgba(0, 235, 199, 0.07), transparent 24%)',
                }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    left: '-8%',
                    top: '12%',
                    width: '28vw',
                    height: '28vw',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.16) 0%, rgba(212, 175, 55, 0.02) 64%, transparent 72%)',
                    filter: 'blur(16px)',
                }}
                animate={reducedMotion ? {} : { x: [0, 24, 0], y: [0, -12, 0], scale: [1, 1.05, 1] }}
                transition={reducedMotion ? {} : { duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    right: '-10%',
                    bottom: '8%',
                    width: '30vw',
                    height: '30vw',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(92, 132, 255, 0.12) 0%, rgba(92, 132, 255, 0.02) 64%, transparent 72%)',
                    filter: 'blur(18px)',
                }}
                animate={reducedMotion ? {} : { x: [0, -18, 0], y: [0, 14, 0], scale: [1, 1.04, 1] }}
                transition={reducedMotion ? {} : { duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
        </div>
    );
}

export default function Admin() {
    const { role, loading } = useAuth();
    const { addToast } = useToast();
    const [stats, setStats] = useState({ totalUsers: 0, proUsers: 0, activeSubscriptions: 0 });
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (role === 'admin') {
            fetchStats();
        }
    }, [role]);

    const fetchStats = async () => {
        try {
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: tierCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .in('plan_tier', ['intermediate', 'complete']);

            const now = new Date().toISOString();
            const { count: subCount } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .gt('current_period_end', now);

            setStats({
                totalUsers: userCount || 0,
                proUsers: tierCount || 0,
                activeSubscriptions: subCount || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            addToast('Erro ao carregar metricas administrativas.', 'error');
        } finally {
            setIsLoadingData(false);
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Carregando...</div>;
    if (role !== 'admin') return <Navigate to="/" />;

    return (
        <div className="container fade-in app-page-shell" style={{ paddingBottom: '96px', position: 'relative', isolation: 'isolate' }}>
            <AdminBackdrop />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <PageHeader
                    title={<span>Painel <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Admin</span></span>}
                    subtitle="Leitura administrativa mais limpa, com foco em base ativa e assinaturas vigentes."
                />

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)',
                        gap: '1rem',
                        padding: '1.35rem',
                        borderRadius: '28px',
                        border: '1px solid var(--glass-border)',
                        background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                        backdropFilter: 'blur(18px)',
                        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.16)',
                        marginBottom: '1rem',
                    }}
                >
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <span className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.72rem' }}>
                            Resumo operacional
                        </span>
                        <strong style={{ fontSize: 'clamp(1.55rem, 2.2vw, 2.15rem)', lineHeight: 1.05 }}>
                            Estado da base sem ruído e com foco em leitura rápida.
                        </strong>
                        <p className="text-muted" style={{ margin: 0, maxWidth: '58ch', lineHeight: 1.65 }}>
                            Abaixo estão os indicadores que importam para acompanhar tração, receita recorrente e volume de usuários ativos.
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gap: '0.85rem',
                            padding: '1rem',
                            borderRadius: '22px',
                            background: 'rgba(0,0,0,0.14)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            alignContent: 'start',
                        }}
                    >
                        <span className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.7rem' }}>
                            Acesso restrito
                        </span>
                        <strong style={{ fontSize: '1.2rem' }}>Operacao interna</strong>
                        <p className="text-muted" style={{ margin: 0, lineHeight: 1.6 }}>
                            O painel expõe apenas sinais de uso e assinatura, sem fluxo promocional paralelo.
                        </p>
                    </div>
                </motion.section>

                <div className="app-summary-grid" style={{ marginBottom: '1rem' }}>
                    <Card hover={false} className="app-summary-card app-summary-card-neutral" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="app-summary-topline">
                            <div className="app-summary-icon app-summary-icon-neutral">
                                <Users size={18} />
                            </div>
                            <span className="app-summary-label">Usuarios</span>
                        </div>
                        <strong className="app-summary-value">{stats.totalUsers}</strong>
                    </Card>

                    <Card hover={false} className="app-summary-card app-summary-card-success" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="app-summary-topline">
                            <div className="app-summary-icon app-summary-icon-success">
                                <TrendingUp size={18} />
                            </div>
                            <span className="app-summary-label">Perfis premium</span>
                        </div>
                        <strong className="app-summary-value">{stats.proUsers}</strong>
                    </Card>

                    <Card hover={false} className="app-summary-card app-summary-card-neutral" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="app-summary-topline">
                            <div className="app-summary-icon app-summary-icon-neutral">
                                <ShieldCheck size={18} />
                            </div>
                            <span className="app-summary-label">Assinaturas vigentes</span>
                        </div>
                        <strong className="app-summary-value">{stats.activeSubscriptions}</strong>
                    </Card>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    <Card className="app-section-card" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '28px', padding: '1.35rem' }}>
                        <div className="app-section-header">
                            <div>
                                <h3>Sistema simplificado</h3>
                                <p>O sistema de cupons foi removido. O app agora trabalha apenas com assinatura direta por plano.</p>
                            </div>
                        </div>

                        {isLoadingData ? (
                            <p className="text-muted" style={{ margin: 0 }}>Carregando metricas...</p>
                        ) : (
                            <div className="app-stack-list">
                                <Card hover={false} className="app-list-card" style={{ background: 'rgba(0,0,0,0.12)' }}>
                                    <div className="app-list-card-main">
                                        <span className="app-inline-icon">
                                            <ShieldCheck size={16} />
                                        </span>
                                        <div>
                                            <strong>Checkout direto</strong>
                                            <span>As assinaturas seguem apenas pelo plano escolhido, sem promocao, resgate ou consumo de cupom.</span>
                                        </div>
                                    </div>
                                </Card>
                                <Card hover={false} className="app-list-card" style={{ background: 'rgba(0,0,0,0.12)' }}>
                                    <div className="app-list-card-main">
                                        <span className="app-inline-icon">
                                            <TrendingUp size={16} />
                                        </span>
                                        <div>
                                            <strong>Leitura administrativa mais limpa</strong>
                                            <span>O painel passa a refletir apenas usuarios e assinaturas, sem operacao promocional paralela.</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
