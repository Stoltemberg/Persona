import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Layout } from '../components/Layout';
import { Users, Ticket, TrendingUp, Trash2, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Admin() {
    const { user, role, loading } = useAuth();
    const { addToast } = useToast();

    // Dashboard Stats
    const [stats, setStats] = useState({
        totalUsers: 0,
        proUsers: 0,
        activeCoupons: 0
    });

    // Coupons State
    const [coupons, setCoupons] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // New Coupon Form
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_percent: 0,
        target_tier: 'intermediate', // free, intermediate, complete
        max_uses: 100,
        expires_at: ''
    });

    useEffect(() => {
        if (role === 'admin') {
            fetchStats();
            fetchCoupons();
        }
    }, [role]);

    const fetchStats = async () => {
        try {
            // Count users
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // Count pro users (Coupons/New Logic)
            const { count: tierCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
                .in('plan_tier', ['intermediate', 'complete']);

            // Count pro users (Legacy Subscriptions)
            const now = new Date().toISOString();
            const { count: subCount } = await supabase.from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .gt('current_period_end', now);

            // Count active coupons
            const { count: couponCount } = await supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('active', true);

            setStats({
                totalUsers: userCount || 0,
                proUsers: (tierCount || 0) + (subCount || 0),
                activeCoupons: couponCount || 0
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
            addToast('Erro ao carregar cupons', 'error');
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase.from('coupons').insert([{
                code: newCoupon.code.toUpperCase(),
                discount_percent: parseInt(newCoupon.discount_percent),
                target_tier: newCoupon.target_tier,
                max_uses: parseInt(newCoupon.max_uses),
                expires_at: newCoupon.expires_at ? new Date(newCoupon.expires_at).toISOString() : null
            }]).select();

            if (error) throw error;

            addToast('Cupom criado com sucesso!', 'success');
            setNewCoupon({ code: '', discount_percent: 0, target_tier: 'intermediate', max_uses: 100, expires_at: '' });
            fetchCoupons();
            fetchStats();
        } catch (error) {
            console.error('Error creating coupon:', error);
            addToast('Erro ao criar cupom. Verifique se o código já existe.', 'error');
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
        try {
            const { error } = await supabase.from('coupons').delete().eq('id', id);
            if (error) throw error;
            addToast('Cupom removido.', 'success');
            fetchCoupons();
        } catch (error) {
            addToast('Erro ao remover cupom.', 'error');
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Carregando...</div>;

    if (role !== 'admin') {
        return <Navigate to="/" />;
    }

    return (
        <div className="container fade-in">
            <div className="page-header">
                <div>
                    <h1>Painel Admin</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Gerencie usuários e promoções</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <Card className="glass-card-hover">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(18, 194, 233, 0.1)', borderRadius: '12px', color: '#12c2e9' }}>
                            <Users size={24} />
                        </div>
                        <h3 style={{ margin: 0 }}>Total Usuários</h3>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.totalUsers}</p>
                </Card>

                <Card className="glass-card-hover">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '12px', color: '#FFD700' }}>
                            <TrendingUp size={24} />
                        </div>
                        <h3 style={{ margin: 0 }}>Assinantes PRO</h3>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.proUsers}</p>
                </Card>

                <Card className="glass-card-hover">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(246, 79, 89, 0.1)', borderRadius: '12px', color: '#f64f59' }}>
                            <Ticket size={24} />
                        </div>
                        <h3 style={{ margin: 0 }}>Cupons Ativos</h3>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.activeCoupons}</p>
                </Card>
            </div>

            {/* Coupons Management */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }} className="admin-grid">
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Criar Novo Cupom</h2>
                    <Card>
                        <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input
                                label="Código do Cupom"
                                value={newCoupon.code}
                                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                placeholder="EX: WELCOME2024"
                                required
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Desconto (%)"
                                    type="number"
                                    value={newCoupon.discount_percent}
                                    onChange={e => setNewCoupon({ ...newCoupon, discount_percent: e.target.value })}
                                />
                                <div className="input-group">
                                    <label>Plano Alvo</label>
                                    <select
                                        className="input-field"
                                        value={newCoupon.target_tier}
                                        onChange={e => setNewCoupon({ ...newCoupon, target_tier: e.target.value })}
                                    >
                                        <option value="free">Grátis (Apenas test)</option>
                                        <option value="intermediate">Intermediário</option>
                                        <option value="complete">Completo</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Max Usos"
                                    type="number"
                                    value={newCoupon.max_uses}
                                    onChange={e => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                                />
                                <Input
                                    label="Validade (Opcional)"
                                    type="date"
                                    value={newCoupon.expires_at}
                                    onChange={e => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                                />
                            </div>

                            <Button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                                <Plus size={18} /> Criar Cupom
                            </Button>
                        </form>
                    </Card>
                </div>

                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Cupons Existentes</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {coupons.map(coupon => (
                            <Card key={coupon.id} style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{coupon.code}</h4>
                                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                                            {coupon.target_tier}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Usos: {coupon.used_count} / {coupon.max_uses} • Exp: {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Nunca'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                    style={{ background: 'none', border: 'none', color: '#f64f59', cursor: 'pointer', padding: '0.5rem' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </Card>
                        ))}
                        {coupons.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Nenhum cupom encontrado.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

    );
}
