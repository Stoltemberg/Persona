import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

export default function Subscriptions() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchSubscriptions();
        }
    }, [user]);

    const fetchSubscriptions = async () => {
        try {
            // Fetch recurring expenses only
            const { data, error } = await supabase
                .from('recurring_templates')
                .select('*')
                .eq('type', 'expense')
                .order('next_due_date', { ascending: true });

            if (error) throw error;
            setSubscriptions(data || []);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            addToast('Erro ao carregar assinaturas.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Metrics
    const activeSubs = subscriptions.filter(s => s.active);
    const monthlyBurn = activeSubs.reduce((acc, sub) => acc + parseFloat(sub.amount), 0);
    const yearlyBurn = monthlyBurn * 12;

    const getDaysUntilDue = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateStr);
        due.setHours(0, 0, 0, 0);
        const diffTime = due - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '100px' }}>
            <header className="page-header" style={{ marginBottom: '5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 500 }}>Assinaturas</h1>
                    <p className="text-muted" style={{ opacity: 0.6 }}>Gerencie seus serviços e custos fixos</p>
                </div>
                <Link to="/recurring">
                    <Button variant="ghost">Gerenciar Recorrências</Button>
                </Link>
            </header>

            {/* Burn Rate Cards */}
            <div className="grid-responsive mb-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <Card className="glass-card glow-on-hover" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', background: 'rgba(246, 79, 89, 0.15)', borderRadius: '10px', color: '#f64f59' }}>
                            <Zap size={24} />
                        </div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Burn Rate Mensal</h3>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>R$ {monthlyBurn.toFixed(2).replace('.', ',')}</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Custo fixo mensal</p>
                </Card>

                <Card className="glass-card glow-on-hover" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', background: 'rgba(196, 113, 237, 0.15)', borderRadius: '10px', color: '#c471ed' }}>
                            <Calendar size={24} />
                        </div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Anual Projetado</h3>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>R$ {yearlyBurn.toFixed(2).replace('.', ',')}</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Se mantiver ativo</p>
                </Card>
            </div>

            {/* Subscriptions List */}
            <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>Próximas Renovações</h2>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Array(3).fill(0).map((_, i) => <Skeleton key={i} width="100%" height="80px" borderRadius="12px" />)}
                </div>
            ) : subscriptions.length === 0 ? (
                <EmptyState icon={CreditCard} title="Sem assinaturas" description="Adicione despesas recorrentes para ver aqui." />
            ) : (
                <div className="grid-responsive gap-1">
                    {activeSubs.map((sub, index) => {
                        const daysLeft = getDaysUntilDue(sub.next_due_date);
                        const isUrgent = daysLeft <= 3;

                        return (
                            <Card key={sub.id} className={`glass-card flex-between fade-in stagger-${index}`} style={{
                                padding: '1.2rem',
                                borderLeft: isUrgent ? '4px solid #f64f59' : '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '48px', height: '48px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem', fontWeight: 700,
                                        color: '#fff'
                                    }}>
                                        {sub.description.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{sub.description}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sub.category}</p>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>R$ {parseFloat(sub.amount).toFixed(2).replace('.', ',')}</h3>
                                    <p style={{
                                        fontSize: '0.85rem',
                                        color: isUrgent ? '#f64f59' : 'var(--text-muted)',
                                        fontWeight: isUrgent ? 600 : 400,
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem'
                                    }}>
                                        {isUrgent && <AlertCircle size={14} />}
                                        {daysLeft === 0 ? 'Vence Hoje' : daysLeft === 1 ? 'Vence Amanhã' : `Vence em ${daysLeft} dias`}
                                    </p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
