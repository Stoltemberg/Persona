import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    CircleDashed,
    PiggyBank,
    ShieldCheck,
    Sparkles,
    Target,
    Wallet,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { OnboardingTour } from '../components/OnboardingTour';
import { Skeleton } from '../components/Skeleton';
import { ThreeBackground } from '../components/ThreeBackground';
import { useDashboardAnimations } from '../hooks/useDashboardAnimations';
import { usePrivacy } from '../context/PrivacyContext';
import { CountUp } from '../components/CountUp';
import { PageHeader } from '../components/PageHeader';
import { PartnerFilter } from '../components/PartnerFilter';
import { UpcomingBills } from '../components/UpcomingBills';

export default function Dashboard() {
    const { user, profile, partnerProfile, incomingRequest, fetchProfile } = useAuth();
    const { isPrivacyMode } = usePrivacy();
    const [balance, setBalance] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [incomes, setIncomes] = useState(0);
    const [savings, setSavings] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [primaryGoal, setPrimaryGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [newTxId, setNewTxId] = useState(null);

    const containerRef = useDashboardAnimations(loading, activeFilter);
    const formatCurrency = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    useEffect(() => {
        if (!user) return undefined;

        checkRecurring();
        fetchFinancialData();

        const handleUpdate = () => fetchFinancialData();
        const handleInsert = (event) => fetchFinancialData(event.detail?.id);

        window.addEventListener('transaction-updated', handleUpdate);
        window.addEventListener('transaction-inserted', handleInsert);
        window.addEventListener('supabase-sync', handleUpdate);

        return () => {
            window.removeEventListener('transaction-updated', handleUpdate);
            window.removeEventListener('transaction-inserted', handleInsert);
            window.removeEventListener('supabase-sync', handleUpdate);
        };
    }, [user, activeFilter]);

    const checkRecurring = async () => {
        try {
            const now = new Date();
            const { data: templates } = await supabase
                .from('recurring_templates')
                .select('*')
                .eq('active', true)
                .lte('next_due_date', now.toISOString());

            if (!templates?.length) return;

            for (const template of templates) {
                if (!template.wallet_id) {
                    console.warn('Recurring template skipped because it has no wallet_id:', template.id);
                    continue;
                }

                const { error: txError } = await supabase.from('transactions').insert([{
                    description: template.description,
                    amount: template.amount,
                    type: template.type,
                    category: template.category,
                    wallet_id: template.wallet_id,
                    expense_type: template.expense_type,
                    date: new Date().toISOString(),
                    profile_id: user.id,
                }]);

                if (txError) continue;

                const nextDate = new Date(template.next_due_date);
                if (template.frequency === 'monthly') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } else if (template.frequency === 'weekly') {
                    nextDate.setDate(nextDate.getDate() + 7);
                }

                await supabase
                    .from('recurring_templates')
                    .update({
                        last_generated_date: new Date().toISOString(),
                        next_due_date: nextDate.toISOString(),
                    })
                    .eq('id', template.id);
            }

            fetchFinancialData();
        } catch (error) {
            console.error('Error processing recurring:', error);
        }
    };

    const fetchFinancialData = async (newTransactionId = null) => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            const filteredData = (data || []).filter((transaction) => {
                if (activeFilter === 'all') return true;
                if (activeFilter === 'me') return transaction.profile_id === user.id;
                if (activeFilter === 'partner') return transaction.profile_id === profile?.partner_id;
                return true;
            });

            let totalIncome = 0;
            let totalExpense = 0;
            let monthlyExpense = 0;
            let monthlyIncome = 0;

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            filteredData.forEach((transaction) => {
                const amount = parseFloat(transaction.amount);
                const transactionDate = new Date(transaction.date);

                if (transaction.type === 'income') {
                    totalIncome += amount;
                    if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                        monthlyIncome += amount;
                    }
                } else {
                    totalExpense += amount;
                    if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                        monthlyExpense += amount;
                    }
                }
            });

            const { data: goalsData } = await supabase.from('goals').select('*');

            let totalSavings = 0;
            let goal = null;

            if (goalsData) {
                const filteredGoals = goalsData.filter((item) => {
                    if (activeFilter === 'all') return true;
                    if (activeFilter === 'me') return item.profile_id === user.id;
                    if (activeFilter === 'partner') return item.profile_id === profile?.partner_id;
                    return true;
                });

                totalSavings = filteredGoals.reduce((accumulator, item) => accumulator + (parseFloat(item.current_amount) || 0), 0);
                goal = filteredGoals.find((item) => item.is_primary) || null;
            }

            const { data: walletsData } = await supabase.from('wallets').select('*');

            const walletsWithBalance = (walletsData || [])
                .filter((item) => {
                    if (activeFilter === 'all') return true;
                    if (activeFilter === 'me') return item.profile_id === user.id;
                    if (activeFilter === 'partner') return item.profile_id === profile?.partner_id;
                    return true;
                })
                .map((wallet) => {
                    const walletTransactions = filteredData.filter((transaction) => transaction.wallet_id === wallet.id);
                    const walletIncome = walletTransactions
                        .filter((transaction) => transaction.type === 'income')
                        .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);
                    const walletExpense = walletTransactions
                        .filter((transaction) => transaction.type === 'expense')
                        .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

                    return {
                        ...wallet,
                        current_balance: (parseFloat(wallet.initial_balance) || 0) + walletIncome - walletExpense,
                    };
                });

            setBalance(totalIncome - totalExpense);
            setExpenses(monthlyExpense);
            setIncomes(monthlyIncome);
            setSavings(totalSavings);
            setPrimaryGoal(goal);
            setWallets(walletsWithBalance);
            setRecentTransactions(filteredData.slice(0, 5));
            setAllTransactions(filteredData);

            if (newTransactionId) {
                setNewTxId(newTransactionId);
                setTimeout(() => setNewTxId(null), 2000);
            }
        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';
    const monthlyNet = incomes - expenses;
    const savingsRate = incomes > 0 ? Math.max(((incomes - expenses) / incomes) * 100, 0) : 0;
    const topWallets = wallets.slice().sort((a, b) => b.current_balance - a.current_balance);
    const topWallet = topWallets[0] || null;
    const goalProgress = primaryGoal && Number(primaryGoal.target_amount) > 0
        ? Math.min((Number(primaryGoal.current_amount || 0) / Number(primaryGoal.target_amount || 0)) * 100, 100)
        : 0;
    const remainingGoalAmount = primaryGoal
        ? Math.max(Number(primaryGoal.target_amount || 0) - Number(primaryGoal.current_amount || 0), 0)
        : 0;

    const checklistItems = [
        {
            id: 'wallet',
            title: 'Criar primeira carteira',
            description: 'Conecta seus saldos e deixa o painel confiável desde o começo.',
            done: wallets.length > 0,
            to: '/wallets',
            cta: 'Criar carteira',
        },
        {
            id: 'transaction',
            title: 'Registrar primeira transação',
            description: 'Uma única movimentação já transforma o painel em algo útil.',
            done: allTransactions.length > 0,
            to: '/transactions',
            cta: 'Registrar agora',
        },
        {
            id: 'goal',
            title: 'Definir uma meta principal',
            description: 'Ajuda o Persona a priorizar seus próximos passos com clareza.',
            done: Boolean(primaryGoal),
            to: '/goals',
            cta: 'Criar meta',
        },
    ];

    const pendingChecklist = checklistItems.filter((item) => !item.done);
    const inboxItems = [
        wallets.length === 0 ? {
            id: 'wallet-start',
            title: 'Sem carteira principal ainda',
            description: 'Cadastre sua conta ou caixa principal para o saldo começar a fazer sentido.',
            to: '/wallets',
            cta: 'Organizar carteiras',
        } : null,
        allTransactions.length === 0 ? {
            id: 'tx-start',
            title: 'O painel ainda está vazio de movimentos',
            description: 'Registre entradas e saídas para desbloquear leitura real do mês.',
            to: '/transactions',
            cta: 'Adicionar transação',
        } : null,
        !primaryGoal && allTransactions.length > 0 ? {
            id: 'goal-focus',
            title: 'Escolha um foco financeiro',
            description: 'Uma meta principal deixa o planejamento mais objetivo e menos difuso.',
            to: '/goals',
            cta: 'Definir meta',
        } : null,
        monthlyNet < 0 ? {
            id: 'monthly-net',
            title: 'Seu mês está no negativo',
            description: 'Vale cortar uma categoria variável agora antes de o saldo apertar mais.',
            to: '/planning?tab=analysis',
            cta: 'Abrir análise',
        } : null,
        primaryGoal && goalProgress < 25 && monthlyNet >= 0 ? {
            id: 'goal-boost',
            title: 'Sua meta ainda está ganhando tração',
            description: 'Há espaço neste mês para um novo aporte e mais progresso visível.',
            to: '/goals',
            cta: 'Fazer aporte',
        } : null,
        topWallet && Number(topWallet.current_balance) < 0 ? {
            id: 'wallet-attention',
            title: `Saldo negativo em ${topWallet.name}`,
            description: 'Vale revisar rapidamente as últimas saídas dessa carteira.',
            to: '/wallets',
            cta: 'Ver carteiras',
        } : null,
    ].filter(Boolean);

    const priorityItems = useMemo(() => {
        const seen = new Set();
        const merged = [
            ...pendingChecklist.map((item) => ({
                id: `check-${item.id}`,
                eyebrow: item.done ? 'Concluído' : 'Próximo passo',
                title: item.title,
                description: item.description,
                cta: item.cta,
                to: item.to,
                done: item.done,
            })),
            ...inboxItems.map((item) => ({
                id: `inbox-${item.id}`,
                eyebrow: 'Radar do mês',
                title: item.title,
                description: item.description,
                cta: item.cta,
                to: item.to,
                done: false,
            })),
        ];

        return merged.filter((item) => {
            const key = `${item.title}-${item.to}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 4);
    }, [pendingChecklist, inboxItems]);

    const heroStats = [
        {
            id: 'monthly-net',
            label: 'Resultado do mês',
            value: loading || isPrivacyMode ? '••••' : formatCurrency(monthlyNet),
            meta: monthlyNet >= 0 ? 'Você está respirando no azul.' : 'O mês pede ajuste fino.',
            tone: monthlyNet >= 0 ? 'success' : 'danger',
            icon: Sparkles,
            to: '/planning?tab=analysis',
        },
        {
            id: 'income',
            label: 'Entradas do mês',
            value: loading || isPrivacyMode ? '••••' : formatCurrency(incomes),
            meta: 'Tudo que entrou até agora.',
            tone: 'success',
            icon: ArrowDownLeft,
            to: '/transactions',
        },
        {
            id: 'expense',
            label: 'Saídas do mês',
            value: loading || isPrivacyMode ? '••••' : formatCurrency(expenses),
            meta: 'O que já consumiu o mês.',
            tone: 'danger',
            icon: ArrowUpRight,
            to: '/planning?tab=analysis',
        },
        {
            id: 'savings',
            label: 'Metas acumuladas',
            value: loading || isPrivacyMode ? '••••' : formatCurrency(savings),
            meta: incomes > 0 ? `Ritmo de poupança: ${savingsRate.toFixed(0)}%` : 'Crie entradas para medir sua folga.',
            tone: 'neutral',
            icon: PiggyBank,
            to: '/goals',
        },
    ];

    return (
        <>
            <ThreeBackground />
            <div ref={containerRef} className="container dashboard-shell" style={{ paddingBottom: '80px', position: 'relative', zIndex: 1 }}>
                <OnboardingTour />

                {incomingRequest && (
                    <section className="dashboard-invite fade-in">
                        <div className="glass-card dashboard-invite-card">
                            <div className="avatar-preview dashboard-invite-avatar">
                                {incomingRequest.avatar_url ? (
                                    <img src={incomingRequest.avatar_url} alt="Avatar do convite" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    (incomingRequest.nickname || incomingRequest.full_name || 'U')[0].toUpperCase()
                                )}
                            </div>
                            <div className="dashboard-invite-copy">
                                <h3>{incomingRequest.nickname} enviou um convite</h3>
                                <p>Conecte as finanças do casal para enxergar saldos, metas e movimentos em um só lugar.</p>
                            </div>
                            <div className="dashboard-invite-actions">
                                <Button
                                    variant="ghost"
                                    onClick={async () => {
                                        try {
                                            await supabase.rpc('reject_partner_request');
                                            fetchProfile(user.id);
                                        } catch (error) {
                                            console.error(error);
                                        }
                                    }}
                                >
                                    Recusar
                                </Button>
                                <Button
                                    className="btn-primary"
                                    onClick={async () => {
                                        try {
                                            await supabase.rpc('accept_partner_request');
                                            fetchProfile(user.id);
                                        } catch (error) {
                                            console.error(error);
                                        }
                                    }}
                                >
                                    Aceitar
                                </Button>
                            </div>
                        </div>
                    </section>
                )}

                <PageHeader
                    className="dashboard-header-centered"
                    title={<span>Olá, <span style={{ fontWeight: 600 }}>{firstName}</span></span>}
                    subtitle="Um panorama mais limpo para entender o mês e agir sem perder tempo."
                />

                <PartnerFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />

                <section className="glass-card dashboard-balance-section dashboard-hero-card">
                    <div className="dashboard-hero-copy">
                        <span className="dashboard-kicker">Resumo do momento</span>
                        <p className="dashboard-balance-label">Saldo total</p>
                        <div className="dashboard-balance-value">
                            {loading ? (
                                <Skeleton width="220px" height="72px" style={{ margin: 0 }} />
                            ) : (
                                isPrivacyMode ? '••••' : <CountUp end={balance} prefix="R$ " duration={1.5} />
                            )}
                        </div>
                        <p className="dashboard-hero-description">
                            {loading
                                ? 'Atualizando seu retrato financeiro...'
                                : monthlyNet >= 0
                                    ? 'Você está fechando o mês com espaço para investir no que importa.'
                                    : 'O mês está pressionado. Vale rever saídas agora para recuperar folga.'}
                        </p>

                        <div className="dashboard-hero-actions">
                            <Link to="/transactions" style={{ textDecoration: 'none' }}>
                                <Button className="btn-primary">Registrar movimento</Button>
                            </Link>
                            <Link to="/planning?tab=analysis" style={{ textDecoration: 'none' }}>
                                <Button variant="ghost">Abrir planejamento</Button>
                            </Link>
                        </div>
                    </div>

                    <div className="dashboard-hero-stats">
                        {heroStats.map((stat) => {
                            const Icon = stat.icon;

                            return (
                                <Link key={stat.id} to={stat.to} className="dashboard-stat-link">
                                    <div className={`dashboard-stat-card dashboard-stat-card-${stat.tone}`}>
                                        <div className="dashboard-stat-row">
                                            <div className={`dashboard-stat-icon dashboard-stat-icon-${stat.tone}`}>
                                                <Icon size={16} />
                                            </div>
                                            <span className="dashboard-stat-label">{stat.label}</span>
                                        </div>
                                        <div className="dashboard-stat-value">{stat.value}</div>
                                        <div className="dashboard-stat-meta">{stat.meta}</div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <div className="dashboard-main-grid">
                    <div className="dashboard-main-column">
                        <section className="glass-card dashboard-panel dashboard-priority-panel">
                            <div className="dashboard-panel-head">
                                <div>
                                    <p className="dashboard-panel-kicker">Painel de ação</p>
                                    <h2 className="dashboard-panel-title">Seu radar do dia</h2>
                                    <p className="dashboard-panel-subtitle">
                                        {pendingChecklist.length > 0
                                            ? `${checklistItems.length - pendingChecklist.length} de ${checklistItems.length} fundamentos já estão prontos.`
                                            : 'A base está pronta. Agora o foco é manter consistência e ajustar o mês.'}
                                    </p>
                                </div>
                                <div className="dashboard-pill-badge">
                                    <ShieldCheck size={14} />
                                    <span>{checklistItems.length - pendingChecklist.length}/{checklistItems.length}</span>
                                </div>
                            </div>

                            {priorityItems.length > 0 ? (
                                <div className="dashboard-priority-list">
                                    {priorityItems.map((item) => (
                                        <article key={item.id} className={`dashboard-priority-item${item.done ? ' is-done' : ''}`}>
                                            <div className="dashboard-priority-copy">
                                                <div className="dashboard-priority-topline">
                                                    <span className="dashboard-priority-badge">{item.eyebrow}</span>
                                                    {item.done ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
                                                </div>
                                                <h3>{item.title}</h3>
                                                <p>{item.description}</p>
                                            </div>
                                            {!item.done && (
                                                <Link to={item.to} style={{ textDecoration: 'none' }}>
                                                    <Button variant="ghost">{item.cta}</Button>
                                                </Link>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="dashboard-empty-note">
                                    <Sparkles size={18} />
                                    <div>
                                        <strong>Painel em ordem</strong>
                                        <span>Seu próximo melhor passo é continuar registrando movimentos e reforçar a meta principal.</span>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="glass-card dashboard-panel dashboard-transactions-panel">
                            <div className="dashboard-panel-head">
                                <div>
                                    <p className="dashboard-panel-kicker">Atividade recente</p>
                                    <h2 className="dashboard-panel-title">Últimas movimentações</h2>
                                </div>
                                <Link to="/transactions" className="dashboard-section-link">
                                    Ver tudo
                                </Link>
                            </div>

                            <div className="dashboard-tx-list">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <Skeleton key={index} width="100%" height="72px" style={{ borderRadius: '18px' }} />
                                    ))
                                ) : recentTransactions.length === 0 ? (
                                    <p className="dashboard-empty-state">Sem movimentações recentes por aqui.</p>
                                ) : (
                                    recentTransactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className={`glass-card dashboard-tx-card ${newTxId === transaction.id ? 'animate-slide-in' : ''}`}
                                            style={{ opacity: 0 }}
                                        >
                                            <div className="dashboard-tx-left">
                                                <div
                                                    className={`dashboard-tx-icon dashboard-tx-icon-${transaction.type === 'income' ? 'income' : 'expense'}`}
                                                >
                                                    {transaction.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                </div>
                                                <div>
                                                    <div className="dashboard-tx-desc">
                                                        {transaction.description}
                                                        {transaction.profile_id === profile?.partner_id && (
                                                            <span className="dashboard-partner-chip">
                                                                {partnerProfile?.avatar_url ? (
                                                                    <img src={partnerProfile.avatar_url} alt="Parceiro" style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div className="dashboard-partner-fallback">
                                                                        {(partnerProfile?.nickname || partnerProfile?.full_name || 'P')[0].toUpperCase()}
                                                                    </div>
                                                                )}
                                                                {partnerProfile?.nickname || partnerProfile?.full_name?.split(' ')[0] || 'Parceiro'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="dashboard-tx-date">
                                                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`dashboard-tx-amount dashboard-tx-amount-${transaction.type}`}>
                                                {isPrivacyMode
                                                    ? '••••'
                                                    : `${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}`}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <aside className="dashboard-side-column">
                        <section className="glass-card dashboard-panel dashboard-focus-panel">
                            <div className="dashboard-panel-head">
                                <div>
                                    <p className="dashboard-panel-kicker">Meta principal</p>
                                    <h2 className="dashboard-panel-title">Foco financeiro</h2>
                                </div>
                                <div className="dashboard-panel-icon">
                                    <Target size={16} />
                                </div>
                            </div>

                            {primaryGoal ? (
                                <>
                                    <div className="dashboard-focus-title">{primaryGoal.title}</div>
                                    <div className="dashboard-focus-progress">
                                        <span>{isPrivacyMode ? '••••' : formatCurrency(primaryGoal.current_amount)}</span>
                                        <span>{goalProgress.toFixed(0)}%</span>
                                    </div>
                                    <div className="dashboard-progress-track">
                                        <div className="dashboard-progress-fill" style={{ width: `${goalProgress}%` }} />
                                    </div>
                                    <p className="dashboard-focus-copy">
                                        Faltam {isPrivacyMode ? '••••' : formatCurrency(remainingGoalAmount)} para concluir esse objetivo.
                                    </p>
                                    <Link to="/goals" style={{ textDecoration: 'none' }}>
                                        <Button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                            Ver meta
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <div className="dashboard-empty-note">
                                    <Target size={18} />
                                    <div>
                                        <strong>Escolha um foco</strong>
                                        <span>Sem meta principal, o planejamento perde direção e prioridade.</span>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="glass-card dashboard-panel dashboard-wallet-panel">
                            <div className="dashboard-panel-head">
                                <div>
                                    <p className="dashboard-panel-kicker">Onde o dinheiro está</p>
                                    <h2 className="dashboard-panel-title">Carteiras em destaque</h2>
                                </div>
                                <div className="dashboard-panel-icon">
                                    <Wallet size={16} />
                                </div>
                            </div>

                            {topWallets.length === 0 ? (
                                <div className="dashboard-empty-note">
                                    <Wallet size={18} />
                                    <div>
                                        <strong>Nenhuma carteira ainda</strong>
                                        <span>Cadastre a primeira para o painel refletir saldos reais.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="dashboard-wallet-list">
                                    {topWallets.slice(0, 3).map((wallet) => (
                                        <div key={wallet.id} className="dashboard-wallet-row">
                                            <div>
                                                <strong>{wallet.name}</strong>
                                                <span>{wallet.type?.replace('_', ' ') || 'carteira'}</span>
                                            </div>
                                            <div className={`dashboard-wallet-amount${Number(wallet.current_balance || 0) < 0 ? ' is-negative' : ''}`}>
                                                {isPrivacyMode ? '••••' : formatCurrency(wallet.current_balance)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <div className="upcoming-widget-container">
                            <UpcomingBills />
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}
