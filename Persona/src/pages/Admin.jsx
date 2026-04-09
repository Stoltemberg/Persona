import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../app/providers/ToastContext';

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
        <div className="container fade-in app-page-shell" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={<span>Painel <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Admin</span></span>}
                subtitle="Acompanhe a base ativa e o status das assinaturas sem fluxos promocionais paralelos."
            />

            <div className="app-summary-grid">
                <Card hover={false} className="app-summary-card app-summary-card-neutral">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-neutral">
                            <Users size={18} />
                        </div>
                        <span className="app-summary-label">Usuarios</span>
                    </div>
                    <strong className="app-summary-value">{stats.totalUsers}</strong>
                </Card>

                <Card hover={false} className="app-summary-card app-summary-card-success">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-success">
                            <TrendingUp size={18} />
                        </div>
                        <span className="app-summary-label">Perfis premium</span>
                    </div>
                    <strong className="app-summary-value">{stats.proUsers}</strong>
                </Card>

                <Card hover={false} className="app-summary-card app-summary-card-neutral">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-neutral">
                            <ShieldCheck size={18} />
                        </div>
                        <span className="app-summary-label">Assinaturas vigentes</span>
                    </div>
                    <strong className="app-summary-value">{stats.activeSubscriptions}</strong>
                </Card>
            </div>

            <div className="app-two-column-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
                <Card className="app-section-card">
                    <div className="app-section-header">
                        <div>
                            <h3>Sistema simplificado</h3>
                            <p>O sistema de cupons foi removido. O app agora trabalha apenas com assinatura direta por plano.</p>
                        </div>
                    </div>

                    {isLoadingData ? (
                        <p className="text-muted">Carregando metricas...</p>
                    ) : (
                        <div className="app-stack-list">
                            <Card hover={false} className="app-list-card">
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
                            <Card hover={false} className="app-list-card">
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
    );
}
