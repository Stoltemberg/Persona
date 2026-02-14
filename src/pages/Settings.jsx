import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Switch } from '../components/Switch';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { User, Bell, Shield, Wallet, Moon, Sun, Monitor, Camera, Zap, Maximize } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useToast } from '../context/ToastContext';
import { exportDataToExcel } from '../lib/exportUtils';
import { UpgradeModal } from '../components/UpgradeModal';
import { Lock } from 'lucide-react';

const AVATAR_PRESETS = [
    'linear-gradient(135deg, #c471ed, #f64f59)',
    'linear-gradient(135deg, #12c2e9, #c471ed)',
    'linear-gradient(135deg, #f64f59, #f7797d)',
    'linear-gradient(135deg, #11998e, #38ef7d)',
    'linear-gradient(135deg, #FFD700, #FDB931)'
];

export default function Settings() {
    const { profile, user, isPro } = useAuth();
    const { theme, changeTheme } = useTheme();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
    const [notifications, setNotifications] = useState({
        budget: true,
        weekly: false
    });

    useEffect(() => {
        if (!user) return;
        supabase.from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => setSubscription(data));

        // Load persisted avatar if any (mock implementation)
        const savedAvatar = localStorage.getItem('user_avatar_gradient');
        if (savedAvatar) setSelectedAvatar(savedAvatar);
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id);

            localStorage.setItem('user_avatar_gradient', selectedAvatar);

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
        <div className="fade-in" style={{ paddingBottom: '100px' }}>
            <header style={{ marginBottom: '5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-main)' }}>Configurações</h1>
                <p style={{ opacity: 0.6 }}>Gerencie sua conta e preferências</p>
            </header>

            <div className="grid-responsive">

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
                                <p style={{ fontSize: '0.9rem' }}>Ciclo: <strong>Mensal</strong></p>
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
                            <div className="flex-start gap-1">
                                <div className="avatar-preview" style={{ background: selectedAvatar }}>
                                    {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p className="text-small mb-05" style={{ fontWeight: 500 }}>Estilo do Avatar</p>
                                    <div className="flex-align-center gap-05" style={{ flexWrap: 'wrap' }}>
                                        {AVATAR_PRESETS.map((grad, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setSelectedAvatar(grad)}
                                                className={`avatar-option ${selectedAvatar === grad ? 'selected' : ''}`}
                                                style={{ background: grad }}
                                                aria-label={`Select avatar style ${i + 1}`}
                                            />
                                        ))}
                                    </div>
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

                    <div className="grid-2">
                        {[
                            { id: 'light', icon: Sun, label: 'Claro' },
                            { id: 'dark', icon: Moon, label: 'Escuro' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => changeTheme(t.id)}
                                className={`theme-btn ${theme === t.id ? 'active' : ''}`}
                            >
                                <t.icon size={24} />
                                <span className="text-small">{t.label}</span>
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
                            <Button variant="ghost" className="btn-ghost" style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}>
                                Gerenciar Categorias
                            </Button>
                        </Link>
                        <p className="text-muted text-small">Organize suas contas, cartões e categorias.</p>
                    </Card>

                    <Card className="glass-card fade-in stagger-3">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                                <Bell size={24} />
                            </div>
                            <h3>Notificações</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span>Alertas de Orçamento</span>
                            <Switch
                                checked={notifications.budget}
                                onChange={(val) => setNotifications(prev => ({ ...prev, budget: val }))}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Resumo Semanal</span>
                            <Switch
                                checked={notifications.weekly}
                                onChange={(val) => setNotifications(prev => ({ ...prev, weekly: val }))}
                            />
                        </div>
                    </Card>
                </div>
            </div>
            <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
        </div>
    );
}
