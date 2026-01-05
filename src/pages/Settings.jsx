import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { User, Bell, Shield, Wallet, Moon, Sun, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useToast } from '../context/ToastContext';
import { exportDataToExcel } from '../lib/exportUtils';
import { UpgradeModal } from '../components/UpgradeModal';
import { Lock } from 'lucide-react';

export default function Settings() {
    const { profile, user, isPro } = useAuth();
    const { theme, changeTheme } = useTheme();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
        if (!user) return;
        supabase.from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => setSubscription(data));
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id);

            if (error) throw error;
            addToast('Perfil atualizado com sucesso!', 'success');
        } catch (error) {
            console.error(error);
            addToast('Erro ao atualizar perfil.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!isPro) {
            setShowUpgrade(true);
            return;
        }

        setLoading(true);
        try {
            addToast('Gerando relatório...', 'info');

            // Fetch fresh data
            const { data: allTransactions } = await supabase.from('transactions').select('*').eq('profile_id', user.id);
            const { data: allWallets } = await supabase.from('wallets').select('*').eq('profile_id', user.id);
            const { data: allGoals } = await supabase.from('goals').select('*').eq('profile_id', user.id);
            const { data: allBudgets } = await supabase.from('budgets').select('*').eq('profile_id', user.id);

            // Fetch categories correctly as per Budgets.jsx logic if possible, or just all expense categories
            const { data: expenseCategories } = await supabase.from('categories').select('*').eq('type', 'expense');



            await exportDataToExcel(
                profile?.full_name || 'Usuário',
                allTransactions || [],
                allWallets || [],
                allGoals || [],
                expenseCategories || [],
                allBudgets || []
            );

            addToast('Relatório baixado com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erro ao exportar dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <header style={{ marginBottom: '3rem' }}>
                <h1 className="text-gradient">Configurações</h1>
                <p>Gerencie sua conta e preferências</p>
            </header>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

                {/* Plan Settings */}
                <Card className="glass-card fade-in stagger-1" style={{ border: isPro ? '1px solid #38ef7d' : '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.8rem', background: isPro ? 'rgba(56, 239, 125, 0.1)' : 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                            <Shield size={24} color={isPro ? '#38ef7d' : 'white'} />
                        </div>
                        <div>
                            <h3>Meu Plano</h3>
                            <p style={{ fontSize: '0.85rem', color: isPro ? '#38ef7d' : 'var(--text-muted)' }}>
                                {isPro ? 'Membro Premium' : 'Plano Gratuito'}
                            </p>
                        </div>
                    </div>

                    {isPro ? (
                        <div style={{ padding: '1rem', background: 'rgba(56, 239, 125, 0.05)', borderRadius: '12px', border: '1px solid rgba(56, 239, 125, 0.2)' }}>
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Status: <strong style={{ color: '#38ef7d' }}>ATIVO</strong></p>
                            {subscription?.valid_until ? (
                                <p style={{ fontSize: '0.9rem' }}>Válido até: <strong>{new Date(subscription.valid_until).toLocaleDateString('pt-BR')}</strong></p>
                            ) : subscription?.current_period_end ? (
                                <p style={{ fontSize: '0.9rem' }}>Válido até: <strong>{new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</strong></p>
                            ) : (
                                <p style={{ fontSize: '0.9rem' }}>Válido até: <strong>Vitalício/Manual</strong></p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                Você está no plano gratuito. Faça upgrade para liberar todos os recursos.
                            </p>
                            <Button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowUpgrade(true)}>
                                Quero ser PRO
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Profile Settings */}
                <Card className="glass-card fade-in stagger-1">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                            <User size={24} color="white" />
                        </div>
                        <h3>Perfil</h3>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #c471ed, #f64f59)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    color: 'white'
                                }}>
                                    {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <Button type="button" variant="ghost" style={{ fontSize: '0.9rem' }}>Alterar Foto (Indisponível)</Button>
                                </div>
                            </div>

                            <Input
                                label="Nome Completo"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                            <Input
                                label="Email"
                                value={user?.email}
                                disabled
                                style={{ opacity: 0.7 }}
                            />

                            <Button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} loading={loading}>
                                Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Appearance Settings */}
                <Card className="glass-card fade-in stagger-2">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                            <Sun size={24} color="white" />
                        </div>
                        <h3>Aparência</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {[
                            { id: 'light', icon: Sun, label: 'Claro' },
                            { id: 'dark', icon: Moon, label: 'Escuro' },
                            { id: 'system', icon: Monitor, label: 'Sistema' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => changeTheme(t.id)}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: theme === t.id ? '2px solid var(--color-2)' : '1px solid var(--glass-border)',
                                    background: theme === t.id ? 'var(--glass-border-highlight)' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: 'var(--text-main)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <t.icon size={24} />
                                <span style={{ fontSize: '0.9rem' }}>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Other Settings Placeholders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <Card className="glass-card fade-in stagger-2">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(18, 194, 233, 0.1)', borderRadius: '12px', color: '#12c2e9' }}>
                                <Wallet size={24} />
                            </div>
                            <h3>Finanças</h3>
                        </div>

                        <Button
                            variant="ghost"
                            className="btn-primary"
                            style={{
                                width: '100%',
                                marginBottom: '1rem',
                                justifyContent: 'center',
                                background: !isPro
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'linear-gradient(135deg, #11998e, #38ef7d)',
                                border: !isPro ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                opacity: !isPro ? 0.7 : 1
                            }}
                            onClick={handleExport}
                            disabled={loading}
                        >
                            {!isPro && <Lock size={16} style={{ marginRight: '0.5rem' }} />}
                            Exportar Relatório (Excel)
                        </Button>

                        {!isPro && (
                            <Button
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    marginBottom: '1rem',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #FFD700, #FDB931)',
                                    color: '#000',
                                    fontWeight: 'bold'
                                }}
                                onClick={() => setShowUpgrade(true)}
                            >
                                Assinar Persona PRO 💎
                            </Button>
                        )}

                        <Link to="/wallets" style={{ textDecoration: 'none' }}>
                            <Button variant="ghost" className="btn-primary" style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}>
                                Gerenciar Carteiras
                            </Button>
                        </Link>
                        <Link to="/categories" style={{ textDecoration: 'none' }}>
                            <Button variant="ghost" className="btn-ghost" style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                Gerenciar Categorias
                            </Button>
                        </Link>
                        <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>Organize suas contas, cartões e categorias.</p>
                    </Card>

                    <Card className="glass-card fade-in stagger-3">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                                <Bell size={24} />
                            </div>
                            <h3>Notificações</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span>Alertas de Orçamento</span>
                            <input type="checkbox" defaultChecked />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Resumo Semanal</span>
                            <input type="checkbox" />
                        </div>
                    </Card>
                </div>
            </div>
            <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
        </div>
    );
}
