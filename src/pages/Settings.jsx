import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Switch } from '../components/Switch';
import { Modal } from '../components/Modal';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { User, Bell, Shield, Wallet, Moon, Sun, Monitor, Camera, Zap, Maximize, Heart } from 'lucide-react';
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
    const { profile, user, isPro, partnerProfile, fetchProfile } = useAuth();
    const { theme, changeTheme } = useTheme();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [partnerTagInput, setPartnerTagInput] = useState('');
    const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);
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

    const handleLinkPartner = async (e) => {
        e.preventDefault();
        if (!partnerTagInput) {
            alert('Por favor, informe um ID válido.');
            return;
        }
        setLoading(true);
        try {
            console.log("Enviando tag:", partnerTagInput);
            const { data, error } = await supabase.rpc('link_partner', { partner_tag: partnerTagInput.toLowerCase() });
            
            if (error) {
                console.error("Erro do supabase:", error);
                throw error;
            }

            addToast('Conta vinculada ao parceiro(a)!', 'success');
            setPartnerTagInput('');
            setIsCoupleModalOpen(false);
            await fetchProfile(user.id);
        } catch (err) {
            console.error("Catch:", err);
            const msg = err.message || 'Erro ao vincular conta';
            alert(msg); // Usando alert como fallback visual garantido
            addToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlinkPartner = async () => {
        if (!window.confirm('Deseja realmente desvincular as contas?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.rpc('unlink_partner');
            if (error) {
                console.error("Erro do supabase:", error);
                throw error;
            }
            addToast('Contas desvinculadas.', 'info');
            await fetchProfile(user.id);
        } catch (err) {
            console.error("Catch:", err);
            const msg = err.message || 'Erro ao desvincular conta';
            alert(msg);
            addToast(msg, 'error');
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
            const { data: allTransactions } = await supabase.from('transactions').select('*');
            const { data: allWallets } = await supabase.from('wallets').select('*');
            const { data: allGoals } = await supabase.from('goals').select('*');
            const { data: allBudgets } = await supabase.from('budgets').select('*');

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
        <div className="container fade-in" style={{ paddingBottom: '80px' }}>
            <header style={{ marginBottom: '3rem', paddingTop: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                    Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Configurações</span>
                </h1>
                <p style={{ opacity: 0.6 }}>Gerencie sua conta e preferências</p>
            </header>

            <div className="grid-responsive">

                {/* Plan Settings */}
                <Card className="glass-card fade-in stagger-1" style={{ border: isPro ? '1px solid #38ef7d' : '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="icon-container" style={{ background: isPro ? 'rgba(56, 239, 125, 0.1)' : undefined, color: isPro ? '#38ef7d' : undefined }}>
                            <Shield size={24} />
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
                        <div className="icon-container">
                            <User size={24} />
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

                {/* Couple Mode Settings */}
                <Card className="glass-card fade-in stagger-2">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="icon-container" style={{ background: 'rgba(246, 79, 89, 0.1)', color: '#f64f59' }}>
                            <Heart size={24} />
                        </div>
                        <div>
                            <h3>Modo Casal</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Seu ID: <strong style={{color: 'var(--text-main)'}}>{profile?.nickname}#{profile?.discriminator}</strong>
                            </p>
                        </div>
                    </div>

                    {partnerProfile ? (
                        <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <div className="flex-align-center gap-1 mb-1" style={{ marginBottom: '1rem' }}>
                                <div className="avatar-preview" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                                    {partnerProfile?.full_name?.[0] || partnerProfile?.nickname?.[0]?.toUpperCase() || 'P'}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, margin: 0 }}>{partnerProfile?.full_name || partnerProfile?.nickname}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                                        {partnerProfile?.nickname}#{partnerProfile?.discriminator}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                style={{ width: '100%', color: '#f64f59', border: '1px solid rgba(246, 79, 89, 0.2)', justifyContent: 'center' }}
                                onClick={handleUnlinkPartner}
                                disabled={loading}
                            >
                                Desfazer Vínculo
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                Compartilhe transações, limites e carteiras com seu(ua) parceiro(a). O Modo Casal sincroniza ambas as contas perfeitamente.
                            </p>
                            <Button type="button" className="btn-primary" onClick={() => setIsCoupleModalOpen(true)} style={{ background: 'linear-gradient(135deg, #f64f59, #f7797d)', border: 'none', color: '#fff', width: '100%', justifyContent: 'center' }}>
                                Vincular Parceiro(a)
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Appearance Settings */}
                <Card className="glass-card fade-in stagger-2">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="icon-container">
                            <Sun size={24} />
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
                            <div className="icon-container" style={{ background: 'rgba(18, 194, 233, 0.1)', color: '#12c2e9' }}>
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

                        <Link to="/wallets" style={{ textDecoration: 'none' }} className="hide-on-mobile">
                            <Button variant="ghost" className="btn-primary" style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}>
                                Gerenciar Carteiras
                            </Button>
                        </Link>
                        <Link to="/categories" style={{ textDecoration: 'none' }} className="hide-on-mobile">
                            <Button variant="ghost" className="btn-ghost" style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}>
                                Gerenciar Categorias
                            </Button>
                        </Link>
                        <p className="text-muted text-small">Organize suas contas, cartões e categorias.</p>
                    </Card>

                    <Card className="glass-card fade-in stagger-3">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="icon-container">
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

            <Modal isOpen={isCoupleModalOpen} onClose={() => setIsCoupleModalOpen(false)} title="Vincular Conta">
                <form onSubmit={handleLinkPartner}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                        Digite o ID da sua esposa, marido ou parceiro(a) para compartilhar finanças. 
                        O ID pode ser encontrado na tela de configurações da conta dele(a).
                    </p>
                    <Input
                        label="ID do Parceiro(a)"
                        placeholder="Ex: maria#1234"
                        value={partnerTagInput}
                        onChange={(e) => setPartnerTagInput(e.target.value)}
                        required
                    />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <Button type="button" variant="ghost" onClick={() => setIsCoupleModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="btn-primary" loading={loading} style={{ background: 'linear-gradient(135deg, #f64f59, #f7797d)', border: 'none', color: '#fff', flex: 1, justifyContent: 'center' }}>
                            Vincular
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
