import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Ticket, Trash2, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../context/ToastContext';

export default function Admin() {
    const { role, loading } = useAuth();
    const { addToast, addActionToast } = useToast();
    const [stats, setStats] = useState({ totalUsers: 0, proUsers: 0, activeCoupons: 0 });
    const [coupons, setCoupons] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const pendingDeleteTimers = useRef(new Map());
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_percent: 0,
        target_tier: 'intermediate',
        max_uses: 100,
        expires_at: '',
    });

    useEffect(() => {
        if (role === 'admin') {
            fetchStats();
            fetchCoupons();
        }
    }, [role]);

    useEffect(() => () => {
        pendingDeleteTimers.current.forEach((timer) => clearTimeout(timer));
        pendingDeleteTimers.current.clear();
    }, []);

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

            const { count: couponCount } = await supabase
                .from('coupons')
                .select('*', { count: 'exact', head: true })
                .eq('active', true);

            setStats({
                totalUsers: userCount || 0,
                proUsers: (tierCount || 0) + (subCount || 0),
                activeCoupons: couponCount || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchCoupons = async () => {
        try {
            setIsLoadingData(true);
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            addToast('Erro ao carregar cupons.', 'error');
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleCreateCoupon = async (event) => {
        event.preventDefault();

        try {
            const { error } = await supabase.from('coupons').insert([{
                code: newCoupon.code.toUpperCase(),
                discount_percent: parseInt(newCoupon.discount_percent, 10),
                target_tier: newCoupon.target_tier,
                max_uses: parseInt(newCoupon.max_uses, 10),
                expires_at: newCoupon.expires_at ? new Date(newCoupon.expires_at).toISOString() : null,
            }]);

            if (error) throw error;

            addToast('Cupom criado com sucesso.', 'success');
            setNewCoupon({ code: '', discount_percent: 0, target_tier: 'intermediate', max_uses: 100, expires_at: '' });
            fetchCoupons();
            fetchStats();
        } catch (error) {
            console.error('Error creating coupon:', error);
            addToast('Erro ao criar cupom. Verifique se o codigo ja existe.', 'error');
        }
    };

    const handleDeleteCoupon = (id) => {
        const coupon = coupons.find((item) => item.id === id);
        if (!coupon) return;

        setCoupons((prev) => prev.filter((item) => item.id !== id));

        const timer = setTimeout(async () => {
            pendingDeleteTimers.current.delete(id);
            try {
                const { error } = await supabase.from('coupons').delete().eq('id', id);
                if (error) throw error;
                addToast('Cupom removido.', 'success');
                fetchStats();
            } catch (error) {
                setCoupons((prev) => [coupon, ...prev]);
                addToast('Erro ao remover cupom.', 'error');
            }
        }, 5000);

        pendingDeleteTimers.current.set(id, timer);

        addActionToast('Cupom removido.', 'Desfazer', () => {
            const pendingTimer = pendingDeleteTimers.current.get(id);
            if (pendingTimer) {
                clearTimeout(pendingTimer);
                pendingDeleteTimers.current.delete(id);
                setCoupons((prev) => [coupon, ...prev]);
            }
        }, 'info');
    };

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Carregando...</div>;
    if (role !== 'admin') return <Navigate to="/" />;

    return (
        <div className="container fade-in app-page-shell" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={<span>Painel <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Admin</span></span>}
                subtitle="Acompanhe a base ativa e gerencie cupons usando o mesmo padrao visual das outras areas."
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
                        <span className="app-summary-label">Assinantes ativos</span>
                    </div>
                    <strong className="app-summary-value">{stats.proUsers}</strong>
                </Card>

                <Card hover={false} className="app-summary-card app-summary-card-danger">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-danger">
                            <Ticket size={18} />
                        </div>
                        <span className="app-summary-label">Cupons ativos</span>
                    </div>
                    <strong className="app-summary-value">{stats.activeCoupons}</strong>
                </Card>
            </div>

            <div className="app-two-column-grid">
                <Card className="app-section-card">
                    <div className="app-section-header">
                        <div>
                            <h3>Novo cupom</h3>
                            <p>Crie codigos promocionais com limite de uso e prazo opcional.</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateCoupon} className="admin-coupon-form">
                        <Input
                            label="Codigo do cupom"
                            value={newCoupon.code}
                            onChange={(event) => setNewCoupon({ ...newCoupon, code: event.target.value })}
                            placeholder="EX: WELCOME2026"
                            required
                        />

                        <div className="admin-form-grid">
                            <Input
                                label="Desconto (%)"
                                type="number"
                                value={newCoupon.discount_percent}
                                onChange={(event) => setNewCoupon({ ...newCoupon, discount_percent: event.target.value })}
                            />
                            <div className="input-group">
                                <label>Plano alvo</label>
                                <select
                                    className="input-field"
                                    value={newCoupon.target_tier}
                                    onChange={(event) => setNewCoupon({ ...newCoupon, target_tier: event.target.value })}
                                >
                                    <option value="free">Gratis</option>
                                    <option value="intermediate">Intermediario</option>
                                    <option value="complete">Completo</option>
                                </select>
                            </div>
                        </div>

                        <div className="admin-form-grid">
                            <Input
                                label="Maximo de usos"
                                type="number"
                                value={newCoupon.max_uses}
                                onChange={(event) => setNewCoupon({ ...newCoupon, max_uses: event.target.value })}
                            />
                            <Input
                                label="Validade"
                                type="date"
                                value={newCoupon.expires_at}
                                onChange={(event) => setNewCoupon({ ...newCoupon, expires_at: event.target.value })}
                            />
                        </div>

                        <Button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                            <Plus size={18} />
                            Criar cupom
                        </Button>
                    </form>
                </Card>

                <Card className="app-section-card">
                    <div className="app-section-header">
                        <div>
                            <h3>Cupons existentes</h3>
                            <p>Revise uso, validade e remova codigos que nao fazem mais sentido.</p>
                        </div>
                    </div>

                    {isLoadingData ? (
                        <p className="text-muted">Carregando cupons...</p>
                    ) : coupons.length === 0 ? (
                        <div className="app-empty-inline">
                            <Ticket size={16} />
                            <span>Nenhum cupom criado ate o momento.</span>
                        </div>
                    ) : (
                        <div className="app-stack-list">
                            {coupons.map((coupon) => (
                                <Card key={coupon.id} hover={false} className="app-list-card admin-coupon-row">
                                    <div className="app-list-card-main">
                                        <span className="app-inline-icon">
                                            <Ticket size={16} />
                                        </span>
                                        <div>
                                            <strong>{coupon.code}</strong>
                                            <span>
                                                {coupon.target_tier} • {coupon.used_count} / {coupon.max_uses} usos
                                            </span>
                                            <span style={{ display: 'block', marginTop: '0.2rem' }}>
                                                {coupon.expires_at ? `Expira em ${new Date(coupon.expires_at).toLocaleDateString('pt-BR')}` : 'Sem validade'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCoupon(coupon.id)}
                                        className="btn-ghost btn-icon"
                                        style={{ color: '#f64f59' }}
                                        aria-label={`Remover cupom ${coupon.code}`}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
