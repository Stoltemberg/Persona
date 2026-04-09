import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell,
    CreditCard,
    Download,
    Heart,
    Lock,
    Monitor,
    Moon,
    Shield,
    Sun,
    User,
    Wallet,
} from 'lucide-react';
import { useAuth } from '../features/auth/useAuth';
import { useTheme } from '../app/providers/ThemeContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Switch } from '../components/Switch';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../app/providers/ToastContext';
import { exportDataToExcel } from '../lib/exportUtils';
import { UpgradeModal } from '../components/UpgradeModal';

const AVATAR_PRESETS = [
    'linear-gradient(135deg, #c471ed, #f64f59)',
    'linear-gradient(135deg, #12c2e9, #c471ed)',
    'linear-gradient(135deg, #f64f59, #f7797d)',
    'linear-gradient(135deg, #11998e, #38ef7d)',
    'linear-gradient(135deg, #FFD700, #FDB931)',
];

export default function Settings() {
    const {
        profile,
        user,
        isPro,
        planTier,
        partnerProfile,
        incomingRequest,
        outgoingRequest,
        fetchProfile,
    } = useAuth();
    const { theme, changeTheme } = useTheme();
    const { addToast, addConfirmationCard } = useToast();

    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [partnerTagInput, setPartnerTagInput] = useState('');
    const [linkError, setLinkError] = useState('');
    const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);
    const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
    const [notifications, setNotifications] = useState({
        budget: true,
        weekly: false,
    });

    useEffect(() => {
        setFullName(profile?.full_name || '');
    }, [profile?.full_name]);

    useEffect(() => {
        if (!user) return;

        supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => setSubscription(data));

        const savedAvatar = localStorage.getItem('user_avatar_gradient');
        if (savedAvatar) setSelectedAvatar(savedAvatar);
    }, [user]);

    const planLabel = useMemo(() => {
        if (planTier === 'complete') return 'Plano Completo';
        if (planTier === 'intermediate') return 'Plano Intermediario';
        return 'Plano Gratuito';
    }, [planTier]);

    const partnerStatus = useMemo(() => {
        if (partnerProfile) return 'Conectado';
        if (outgoingRequest) return 'Convite pendente';
        if (incomingRequest) return 'Convite recebido';
        return 'Disponivel';
    }, [incomingRequest, outgoingRequest, partnerProfile]);

    const handleUpdateProfile = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id);

            if (error) throw error;

            localStorage.setItem('user_avatar_gradient', selectedAvatar);
            addConfirmationCard('Perfil atualizado', 'Seu nome e estilo visual foram salvos.');
            await fetchProfile(user.id);
        } catch (error) {
            addToast('Erro ao atualizar perfil.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkPartner = async (event) => {
        event.preventDefault();
        setLinkError('');

        if (!partnerTagInput.trim()) {
            setLinkError('Informe um ID valido.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.rpc('link_partner', {
                partner_tag: partnerTagInput.trim(),
            });

            if (error) throw error;

            addConfirmationCard('Convite enviado', 'Agora e so aguardar a aprovacao do seu parceiro.');
            setPartnerTagInput('');
            setIsCoupleModalOpen(false);
            await fetchProfile(user.id);
        } catch (error) {
            setLinkError(error.message || 'Erro ao vincular conta.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlinkPartner = async () => {
        setLoading(true);

        try {
            const { error } = await supabase.rpc('unlink_partner');
            if (error) throw error;

            addConfirmationCard('Vinculo removido', 'As contas deixaram de compartilhar dados.');
            setIsUnlinkModalOpen(false);
            await fetchProfile(user.id);
        } catch (error) {
            addToast(error.message || 'Erro ao desvincular conta.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelInvite = async () => {
        setLoading(true);

        try {
            const { error } = await supabase.rpc('cancel_partner_request');
            if (error) throw error;

            addConfirmationCard('Convite cancelado', 'O pedido de conexao foi removido.');
            await fetchProfile(user.id);
        } catch (error) {
            addToast('Erro ao cancelar convite.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (planTier !== 'complete') {
            setShowUpgrade(true);
            return;
        }

        setLoading(true);

        try {
            addToast('Preparando relatorio.', 'info');

            const [
                { data: allTransactions, error: transactionsError },
                { data: allWallets, error: walletsError },
                { data: allGoals, error: goalsError },
                { data: allBudgets, error: budgetsError },
                { data: expenseCategories, error: categoriesError },
            ] = await Promise.all([
                supabase.from('transactions').select('*'),
                supabase.from('wallets').select('*'),
                supabase.from('goals').select('*'),
                supabase.from('budgets').select('*'),
                supabase.from('categories').select('*').eq('type', 'expense'),
            ]);

            if (transactionsError || walletsError || goalsError || budgetsError || categoriesError) {
                throw transactionsError || walletsError || goalsError || budgetsError || categoriesError;
            }

            await exportDataToExcel(
                profile?.full_name || 'Usuario',
                allTransactions || [],
                allWallets || [],
                allGoals || [],
                expenseCategories || [],
                allBudgets || [],
            );

            addConfirmationCard('Relatorio exportado', 'O arquivo foi baixado no seu dispositivo.');
        } catch (error) {
            addToast('Erro ao exportar dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container fade-in app-page-shell" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={<span>Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Configuracoes</span></span>}
                subtitle="Centralize plano, perfil, modo casal e preferencias em uma tela mais organizada."
            >
                <Button variant="ghost" icon={Download} onClick={handleExport} disabled={loading}>
                    Exportar dados
                </Button>
            </PageHeader>

            <div className="app-summary-grid">
                <Card hover={false} className={`app-summary-card ${isPro ? 'app-summary-card-success' : 'app-summary-card-neutral'}`}>
                    <div className="app-summary-topline">
                        <div className={`app-summary-icon ${isPro ? 'app-summary-icon-success' : 'app-summary-icon-neutral'}`}>
                            <Shield size={18} />
                        </div>
                        <span className="app-summary-label">Plano atual</span>
                    </div>
                    <strong className="app-summary-value">{planLabel}</strong>
                </Card>

                <Card hover={false} className="app-summary-card app-summary-card-neutral">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-neutral">
                            <Heart size={18} />
                        </div>
                        <span className="app-summary-label">Modo casal</span>
                    </div>
                    <strong className="app-summary-value">{partnerStatus}</strong>
                </Card>

                <Card hover={false} className="app-summary-card app-summary-card-neutral">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-neutral">
                            {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
                        </div>
                        <span className="app-summary-label">Aparencia</span>
                    </div>
                    <strong className="app-summary-value">
                        {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
                    </strong>
                </Card>
            </div>

            <div className="app-list-grid" style={{ alignItems: 'start' }}>
                <Card className="app-section-card">
                    <div className="app-section-header">
                        <div className="app-list-card-main">
                            <span className="app-inline-icon">
                                <Shield size={18} />
                            </span>
                            <div>
                                <strong>Plano e beneficios</strong>
                                <span>Veja o que esta ativo e quais recursos voce pode liberar.</span>
                            </div>
                        </div>
                    </div>

                    <div className="app-summary-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <Card hover={false} className="app-summary-card app-summary-card-neutral">
                            <span className="app-summary-label">Status</span>
                            <strong className="app-summary-value">{isPro ? 'Premium ativo' : 'Plano free'}</strong>
                        </Card>
                        <Card hover={false} className="app-summary-card app-summary-card-neutral">
                            <span className="app-summary-label">Renovacao</span>
                            <strong className="app-summary-value">
                                {subscription?.valid_until
                                    ? new Date(subscription.valid_until).toLocaleDateString('pt-BR')
                                    : subscription?.current_period_end
                                        ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
                                        : 'Sem data definida'}
                            </strong>
                        </Card>
                    </div>

                    <p className="text-muted" style={{ margin: 0 }}>
                        {isPro
                            ? 'Seu plano ja libera mais carteiras, insights e exportacoes avancadas.'
                            : 'Faca upgrade para desbloquear exportacao completa, modo casal e mais carteiras.'}
                    </p>

                    {!isPro && (
                        <Button className="btn-primary" onClick={() => setShowUpgrade(true)} style={{ justifyContent: 'center' }}>
                            Conhecer planos
                        </Button>
                    )}
                </Card>

                <Card className="app-section-card">
                    <div className="app-section-header">
                        <div className="app-list-card-main">
                            <span className="app-inline-icon">
                                <User size={18} />
                            </span>
                            <div>
                                <strong>Perfil</strong>
                                <span>Atualize nome, email e identidade visual da sua conta.</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '1rem' }}>
                        <div className="app-list-card-main" style={{ alignItems: 'flex-start' }}>
                            <div
                                aria-hidden="true"
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '18px',
                                    background: selectedAvatar,
                                    display: 'grid',
                                    placeItems: 'center',
                                    color: '#fff',
                                    fontWeight: 700,
                                    flexShrink: 0,
                                }}
                            >
                                {(fullName || user?.email || 'P')[0]?.toUpperCase()}
                            </div>

                            <div style={{ width: '100%' }}>
                                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Estilo do avatar</strong>
                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                    Escolha um visual simples para aparecer nos cards e areas compartilhadas.
                                </span>
                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    {AVATAR_PRESETS.map((gradient) => (
                                        <button
                                            key={gradient}
                                            type="button"
                                            aria-label="Selecionar estilo de avatar"
                                            onClick={() => setSelectedAvatar(gradient)}
                                            style={{
                                                width: '34px',
                                                height: '34px',
                                                borderRadius: '50%',
                                                border: selectedAvatar === gradient ? '2px solid var(--text-main)' : '1px solid var(--glass-border)',
                                                background: gradient,
                                                cursor: 'pointer',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Input label="Nome completo" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                        <Input label="Email" value={user?.email || ''} disabled note="O email atual e usado para login." />

                        <Button type="submit" className="btn-primary" loading={loading} style={{ justifyContent: 'center' }}>
                            Salvar perfil
                        </Button>
                    </form>
                </Card>

                <Card className="app-section-card">
                    <div className="app-section-header">
                        <div className="app-list-card-main">
                            <span className="app-inline-icon">
                                <Heart size={18} />
                            </span>
                            <div>
                                <strong>Modo casal</strong>
                                <span>Compartilhe carteiras, metas e movimentacoes com outra pessoa.</span>
                            </div>
                        </div>
                    </div>

                    <Card hover={false} className="app-summary-card app-summary-card-neutral">
                        <span className="app-summary-label">Seu ID</span>
                        <strong className="app-summary-value">
                            {profile?.nickname && profile?.discriminator ? `${profile.nickname}#${profile.discriminator}` : 'Gerando identificador'}
                        </strong>
                    </Card>

                    {partnerProfile ? (
                        <>
                            <div className="app-list-card-main" style={{ justifyContent: 'space-between' }}>
                                <div>
                                    <strong>{partnerProfile.full_name || partnerProfile.nickname}</strong>
                                    <span>{partnerProfile.nickname}#{partnerProfile.discriminator}</span>
                                </div>
                                <span className="dashboard-partner-chip" style={{ marginLeft: 0 }}>Conectado</span>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => setIsUnlinkModalOpen(true)}
                                disabled={loading}
                                style={{ justifyContent: 'center', color: '#f64f59' }}
                            >
                                Remover vinculo
                            </Button>
                        </>
                    ) : outgoingRequest ? (
                        <>
                            <p className="text-muted" style={{ margin: 0 }}>
                                Convite pendente enviado para <strong>{outgoingRequest.nickname}</strong>. Voce pode cancelar se precisar ajustar o destinatario.
                            </p>
                            <Button variant="ghost" onClick={handleCancelInvite} disabled={loading} style={{ justifyContent: 'center' }}>
                                Cancelar convite
                            </Button>
                        </>
                    ) : incomingRequest ? (
                        <>
                            <p className="text-muted" style={{ margin: 0 }}>
                                <strong>{incomingRequest.nickname}</strong> enviou um convite. A confirmacao acontece no dashboard principal.
                            </p>
                            <Link to="/" style={{ textDecoration: 'none' }}>
                                <Button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    Ir para o dashboard
                                </Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="text-muted" style={{ margin: 0 }}>
                                Use o modo casal para compartilhar a mesma visao financeira com limites, metas e movimentacoes sincronizadas.
                            </p>
                            <Button
                                className="btn-primary"
                                onClick={() => {
                                    if (planTier !== 'complete') {
                                        setShowUpgrade(true);
                                        return;
                                    }
                                    setIsCoupleModalOpen(true);
                                }}
                                style={{ justifyContent: 'center' }}
                            >
                                Conectar parceiro
                            </Button>
                        </>
                    )}
                </Card>

                <Card className="app-section-card">
                    <div className="app-section-header">
                        <div className="app-list-card-main">
                            <span className="app-inline-icon">
                                <Sun size={18} />
                            </span>
                            <div>
                                <strong>Aparencia</strong>
                                <span>Escolha o clima visual da interface e mantenha a leitura confortavel.</span>
                            </div>
                        </div>
                    </div>

                    <div className="app-chip-row">
                        {[
                            { id: 'light', icon: Sun, label: 'Claro' },
                            { id: 'dark', icon: Moon, label: 'Escuro' },
                            { id: 'system', icon: Monitor, label: 'Sistema' },
                        ].map(({ id, icon: Icon, label }) => (
                            <button
                                key={id}
                                type="button"
                                className={`app-filter-chip${theme === id ? ' is-active' : ''}`}
                                onClick={() => changeTheme(id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        ))}
                    </div>

                    <Card hover={false} className="app-summary-card app-summary-card-neutral">
                        <span className="app-summary-label">Tema selecionado</span>
                        <strong className="app-summary-value">
                            {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
                        </strong>
                    </Card>
                </Card>

                <Card className="app-section-card">
                    <div className="app-section-header">
                        <div className="app-list-card-main">
                            <span className="app-inline-icon">
                                <Wallet size={18} />
                            </span>
                            <div>
                                <strong>Financas e dados</strong>
                                <span>Atalhos rapidos para exportacao e organizacao da estrutura financeira.</span>
                            </div>
                        </div>
                    </div>

                    <div className="app-summary-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <Card hover={false} className="app-summary-card app-summary-card-neutral">
                            <span className="app-summary-label">Exportacao</span>
                            <strong className="app-summary-value">{planTier === 'complete' ? 'Liberada' : 'Plano completo'}</strong>
                        </Card>
                        <Card hover={false} className="app-summary-card app-summary-card-neutral">
                            <span className="app-summary-label">Atalhos</span>
                            <strong className="app-summary-value">Carteiras e categorias</strong>
                        </Card>
                    </div>

                    <Button onClick={handleExport} disabled={loading} className="btn-primary" style={{ justifyContent: 'center' }}>
                        {planTier !== 'complete' && <Lock size={16} />}
                        Exportar relatorio completo
                    </Button>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <Link to="/wallets" style={{ textDecoration: 'none' }}>
                            <Button variant="ghost" style={{ width: '100%', justifyContent: 'center' }} icon={Wallet}>
                                Abrir carteiras
                            </Button>
                        </Link>
                        <Link to="/categories" style={{ textDecoration: 'none' }}>
                            <Button variant="ghost" style={{ width: '100%', justifyContent: 'center' }} icon={CreditCard}>
                                Abrir categorias
                            </Button>
                        </Link>
                    </div>
                </Card>

                <Card className="app-section-card">
                    <div className="app-section-header">
                        <div className="app-list-card-main">
                            <span className="app-inline-icon">
                                <Bell size={18} />
                            </span>
                            <div>
                                <strong>Notificacoes</strong>
                                <span>Defina quais alertas voce quer acompanhar com mais frequencia.</span>
                            </div>
                        </div>
                    </div>

                    <div className="app-list-card-main" style={{ justifyContent: 'space-between' }}>
                        <div>
                            <strong>Alertas de orcamento</strong>
                            <span>Avisos quando categorias se aproximam do limite.</span>
                        </div>
                        <Switch
                            checked={notifications.budget}
                            onChange={(value) => setNotifications((prev) => ({ ...prev, budget: value }))}
                        />
                    </div>

                    <div className="app-list-card-main" style={{ justifyContent: 'space-between' }}>
                        <div>
                            <strong>Resumo semanal</strong>
                            <span>Visao rapida para revisar gastos e entradas mais importantes.</span>
                        </div>
                        <Switch
                            checked={notifications.weekly}
                            onChange={(value) => setNotifications((prev) => ({ ...prev, weekly: value }))}
                        />
                    </div>
                </Card>
            </div>

            <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

            <Modal isOpen={isCoupleModalOpen} onClose={() => setIsCoupleModalOpen(false)} title="Conectar parceiro">
                <form onSubmit={handleLinkPartner}>
                    <p className="text-muted" style={{ marginBottom: '1.25rem' }}>
                        Digite o ID da outra conta para enviar um convite e ativar o modo casal.
                    </p>
                    <Input
                        label="ID do parceiro"
                        placeholder="Ex: maria#1234"
                        value={partnerTagInput}
                        onChange={(event) => {
                            setPartnerTagInput(event.target.value);
                            setLinkError('');
                        }}
                        error={linkError}
                        required
                    />

                    <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <Button type="submit" className="btn-primary" loading={loading} style={{ justifyContent: 'center' }}>
                            Enviar convite
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsCoupleModalOpen(false)} style={{ justifyContent: 'center' }}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isUnlinkModalOpen} onClose={() => setIsUnlinkModalOpen(false)} title="Remover vinculo">
                <p className="text-muted" style={{ marginBottom: '1.25rem' }}>
                    Tem certeza que deseja encerrar o compartilhamento com {partnerProfile?.full_name || partnerProfile?.nickname}?
                </p>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <Button
                        type="button"
                        className="btn-primary"
                        onClick={handleUnlinkPartner}
                        loading={loading}
                        style={{ justifyContent: 'center' }}
                    >
                        Confirmar remocao
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsUnlinkModalOpen(false)}
                        disabled={loading}
                        style={{ justifyContent: 'center' }}
                    >
                        Manter vinculo
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
