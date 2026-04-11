import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
import { useDashboardAnimations } from '../hooks/useDashboardAnimations';
import { usePrivacy } from '../context/PrivacyContext';
import { CountUp } from '../components/CountUp';
import { PageHeader } from '../components/PageHeader';
import { PartnerFilter } from '../components/PartnerFilter';
import { UpcomingBills } from '../components/UpcomingBills';

const pageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.06,
            delayChildren: 0.05,
        },
    },
};

const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

const ThreeBackground = lazy(() => import('../components/ThreeBackground').then((module) => ({ default: module.ThreeBackground })));

export default function Dashboard() {
    const { user, profile, partnerProfile, incomingRequest, fetchProfile } = useAuth();
    const { isPrivacyMode } = usePrivacy();
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [newTxId, setNewTxId] = useState(null);
    const [showBackground, setShowBackground] = useState(false);

    const containerRef = useDashboardAnimations(loading, activeFilter);
    const formatCurrency = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    useEffect(() => {
        if (!user) return undefined;

        checkRecurring();
        fetchDashboardData();

        const handleUpdate = (event) => {
            const table = event?.detail?.table;

            if (!table || table === 'transactions') {
                fetchTransactionsData();
            }

            if (!table || table === 'goals') {
                fetchGoalsData();
            }

            if (!table || table === 'wallets') {
                fetchWalletsData();
            }
        };
        const handleInsert = (event) => {
            if (event.detail?.id) {
                setNewTxId(event.detail.id);
                setTimeout(() => setNewTxId(null), 2000);
            }

            fetchTransactionsData();
        };

        window.addEventListener('transaction-updated', handleUpdate);
        window.addEventListener('transaction-inserted', handleInsert);
        window.addEventListener('supabase-sync', handleUpdate);

        return () => {
            window.removeEventListener('transaction-updated', handleUpdate);
            window.removeEventListener('transaction-inserted', handleInsert);
            window.removeEventListener('supabase-sync', handleUpdate);
        };
    }, [user]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const evaluateBackground = () => {
            setShowBackground(window.innerWidth >= 1024 && !mediaQuery.matches);
        };
        const scheduleBackground = () => {
            if (window.innerWidth < 1024 || mediaQuery.matches) {
                setShowBackground(false);
                return;
            }

            if ('requestIdleCallback' in window) {
                const idleId = window.requestIdleCallback(() => {
                    evaluateBackground();
                }, { timeout: 1800 });

                return () => window.cancelIdleCallback(idleId);
            }

            const timeoutId = window.setTimeout(evaluateBackground, 1200);
            return () => window.clearTimeout(timeoutId);
        };

        const cleanupBackground = scheduleBackground();
        window.addEventListener('resize', evaluateBackground);
        mediaQuery.addEventListener?.('change', evaluateBackground);

        return () => {
            cleanupBackground?.();
            window.removeEventListener('resize', evaluateBackground);
            mediaQuery.removeEventListener?.('change', evaluateBackground);
        };
    }, []);

    const checkRecurring = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase.functions.invoke('process-recurring', {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });

            if (error) throw error;

            fetchTransactionsData();
        } catch (error) {
            console.error('Error processing recurring:', error);
        }
    };

    const fetchTransactionsData = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('id, description, amount, type, category, wallet_id, date, profile_id, expense_type')
                .order('date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const fetchGoalsData = async () => {
        try {
            const { data, error } = await supabase.from('goals').select('id, title, current_amount, target_amount, is_primary, profile_id');
            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error('Error fetching goals:', error);
        }
    };

    const fetchWalletsData = async () => {
        try {
            const { data, error } = await supabase.from('wallets').select('id, name, type, initial_balance, profile_id');
            if (error) throw error;
            setWallets(data || []);
        } catch (error) {
            console.error('Error fetching wallets:', error);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);

        try {
            const [transactionsResponse, goalsResponse, walletsResponse] = await Promise.all([
                supabase.from('transactions').select('id, description, amount, type, category, wallet_id, date, profile_id, expense_type').order('date', { ascending: false }),
                supabase.from('goals').select('id, title, current_amount, target_amount, is_primary, profile_id'),
                supabase.from('wallets').select('id, name, type, initial_balance, profile_id'),
            ]);

            if (transactionsResponse.error) throw transactionsResponse.error;
            if (goalsResponse.error) throw goalsResponse.error;
            if (walletsResponse.error) throw walletsResponse.error;

            setTransactions(transactionsResponse.data || []);
            setGoals(goalsResponse.data || []);
            setWallets(walletsResponse.data || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'me') return transaction.profile_id === user.id;
        if (activeFilter === 'partner') return transaction.profile_id === profile?.partner_id;
        return true;
    }), [transactions, activeFilter, profile?.partner_id, user.id]);

    const filteredGoals = useMemo(() => goals.filter((item) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'me') return item.profile_id === user.id;
        if (activeFilter === 'partner') return item.profile_id === profile?.partner_id;
        return true;
    }), [goals, activeFilter, profile?.partner_id, user.id]);

    const walletsWithBalance = useMemo(() => wallets
        .filter((item) => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'me') return item.profile_id === user.id;
            if (activeFilter === 'partner') return item.profile_id === profile?.partner_id;
            return true;
        })
        .map((wallet) => {
            let income = 0;
            let expense = 0;

            filteredTransactions.forEach((transaction) => {
                if (transaction.wallet_id !== wallet.id) return;
                const amount = Number(transaction.amount || 0);
                if (transaction.type === 'income') income += amount;
                if (transaction.type === 'expense') expense += amount;
            });

            return {
                ...wallet,
                current_balance: (parseFloat(wallet.initial_balance) || 0) + income - expense,
            };
        }), [wallets, filteredTransactions, activeFilter, profile?.partner_id, user.id]);

    const {
        balance,
        expenses,
        incomes,
        savings,
        recentTransactions,
        allTransactions,
        primaryGoal,
    } = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        let monthlyExpense = 0;
        let monthlyIncome = 0;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        filteredTransactions.forEach((transaction) => {
            const amount = parseFloat(transaction.amount || 0);
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

        return {
            balance: totalIncome - totalExpense,
            expenses: monthlyExpense,
            incomes: monthlyIncome,
            savings: filteredGoals.reduce((accumulator, item) => accumulator + (parseFloat(item.current_amount) || 0), 0),
            recentTransactions: filteredTransactions.slice(0, 5),
            allTransactions: filteredTransactions,
            primaryGoal: filteredGoals.find((item) => item.is_primary) || null,
        };
    }, [filteredGoals, filteredTransactions]);

    const firstName = profile?.full_name?.split(' ')[0] || 'Usu\u00E1rio';
    const monthlyNet = incomes - expenses;
    const savingsRate = incomes > 0 ? Math.max(((incomes - expenses) / incomes) * 100, 0) : 0;
    const topWallets = walletsWithBalance.slice().sort((a, b) => b.current_balance - a.current_balance);
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
            description: 'Conecta seus saldos e deixa o painel confiavel desde o comeco.',
            done: wallets.length > 0,
            to: '/wallets',
            cta: 'Criar carteira',
        },
        {
            id: 'transaction',
            title: 'Registrar primeira transacao',
            description: 'Uma unica movimentacao ja transforma o painel em algo util.',
            done: allTransactions.length > 0,
            to: '/transactions',
            cta: 'Registrar agora',
        },
        {
            id: 'goal',
            title: 'Definir uma meta principal',
            description: 'Ajuda o Persona a priorizar seus proximos passos com clareza.',
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
            description: 'Cadastre sua conta ou caixa principal para o saldo comecar a fazer sentido.',
            to: '/wallets',
            cta: 'Organizar carteiras',
        } : null,
        allTransactions.length === 0 ? {
            id: 'tx-start',
            title: 'O painel ainda esta vazio de movimentos',
            description: 'Registre entradas e saidas para desbloquear leitura real do mes.',
            to: '/transactions',
            cta: 'Adicionar transacao',
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
            title: 'Seu mes esta no negativo',
            description: 'Vale cortar uma categoria variavel agora antes de o saldo apertar mais.',
            to: '/planning?tab=analysis',
            cta: 'Abrir analise',
        } : null,
        primaryGoal && goalProgress < 25 && monthlyNet >= 0 ? {
            id: 'goal-boost',
            title: 'Sua meta ainda esta ganhando tracao',
            description: 'Ha espaco neste mes para um novo aporte e mais progresso visivel.',
            to: '/goals',
            cta: 'Fazer aporte',
        } : null,
        topWallet && Number(topWallet.current_balance) < 0 ? {
            id: 'wallet-attention',
            title: `Saldo negativo em ${topWallet.name}`,
            description: 'Vale revisar rapidamente as ultimas saidas dessa carteira.',
            to: '/wallets',
            cta: 'Ver carteiras',
        } : null,
    ].filter(Boolean);

    const priorityItems = useMemo(() => {
        const seen = new Set();
        const merged = [
            ...pendingChecklist.map((item) => ({
                id: `check-${item.id}`,
                eyebrow: item.done ? 'Concluido' : 'Proximo passo',
                title: item.title,
                description: item.description,
                cta: item.cta,
                to: item.to,
                done: item.done,
            })),
            ...inboxItems.map((item) => ({
                id: `inbox-${item.id}`,
                eyebrow: 'Radar do mes',
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
            label: 'Resultado do m\u00EAs',
            value: loading || isPrivacyMode ? '----' : formatCurrency(monthlyNet),
            meta: monthlyNet >= 0 ? 'Voc\u00EA est\u00E1 respirando no azul.' : 'O m\u00EAs pede ajuste fino.',
            tone: monthlyNet >= 0 ? 'success' : 'danger',
            icon: Sparkles,
            to: '/planning?tab=analysis',
        },
        {
            id: 'income',
            label: 'Entradas do m\u00EAs',
            value: loading || isPrivacyMode ? '----' : formatCurrency(incomes),
            meta: 'Tudo que entrou at\u00E9 agora.',
            tone: 'success',
            icon: ArrowDownLeft,
            to: '/transactions',
        },
        {
            id: 'expense',
            label: 'Sa\u00EDdas do m\u00EAs',
            value: loading || isPrivacyMode ? '----' : formatCurrency(expenses),
            meta: 'O que j\u00E1 consumiu o m\u00EAs.',
            tone: 'danger',
            icon: ArrowUpRight,
            to: '/planning?tab=analysis',
        },
        {
            id: 'savings',
            label: 'Metas acumuladas',
            value: loading || isPrivacyMode ? '----' : formatCurrency(savings),
            meta: incomes > 0 ? `Ritmo de poupan\u00E7a: ${savingsRate.toFixed(0)}%` : 'Crie entradas para medir sua folga.',
            tone: 'neutral',
            icon: PiggyBank,
            to: '/goals',
        },
    ];

    return (
        <>
            {showBackground && (
                <Suspense fallback={null}>
                    <ThreeBackground />
                </Suspense>
            )}
            <motion.div ref={containerRef} className="container dashboard-shell" style={{ paddingBottom: '80px', position: 'relative', zIndex: 1 }} variants={pageVariants} initial="hidden" animate="visible">
                <OnboardingTour />

                <AnimatePresence initial={false}>
                {incomingRequest && (
                    <motion.section
                        key="dashboard-invite"
                        className="dashboard-invite fade-in"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
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
                                <p>Conecte as financas do casal para enxergar saldos, metas e movimentos em um so lugar.</p>
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
                    </motion.section>
                )}
                </AnimatePresence>

                <motion.div variants={sectionVariants}>
                    <PageHeader
                        className="dashboard-header-centered"
                        title={<span>{'Ol\u00E1, '}<span style={{ fontWeight: 600 }}>{firstName}</span></span>}
                        subtitle={'Um panorama mais limpo para entender o m\u00EAs e agir sem perder tempo.'}
                    />
                </motion.div>

                <motion.div variants={sectionVariants}>
                    <PartnerFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
                </motion.div>

                <motion.section className="glass-card dashboard-balance-section dashboard-hero-card" variants={sectionVariants} initial="hidden" animate="visible">
                    <div className="dashboard-hero-copy">
                        <span className="dashboard-kicker">Resumo do momento</span>
                        <p className="dashboard-balance-label">Saldo total</p>
                        <div className="dashboard-balance-value">
                            {loading ? (
                                <Skeleton width="220px" height="72px" style={{ margin: 0 }} />
                            ) : (
                                isPrivacyMode ? '----' : <CountUp end={balance} prefix="R$ " duration={1.5} />
                            )}
                        </div>
                        <p className="dashboard-hero-description">
                            {loading
                                ? 'Atualizando seu retrato financeiro...'
                                : monthlyNet >= 0
                                    ? 'Voc\u00EA est\u00E1 fechando o m\u00EAs com espa\u00E7o para investir no que importa.'
                                    : 'O m\u00EAs est\u00E1 pressionado. Vale rever sa\u00EDdas agora para recuperar folga.'}
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
                                <motion.div key={stat.id} variants={itemVariants}>
                                    <Link to={stat.to} className="dashboard-stat-link">
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
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.section>

                <motion.div className="dashboard-main-grid" variants={sectionVariants}>
                    <div className="dashboard-main-column">
                        <motion.section className="glass-card dashboard-panel dashboard-priority-panel" variants={sectionVariants} initial="hidden" animate="visible">
                            <div className="dashboard-panel-head">
                                <div>
                                    <p className="dashboard-panel-kicker">Painel de acao</p>
                                    <h2 className="dashboard-panel-title">Seu radar do dia</h2>
                                    <p className="dashboard-panel-subtitle">
                                        {pendingChecklist.length > 0
                                            ? `${checklistItems.length - pendingChecklist.length} de ${checklistItems.length} fundamentos ja estao prontos.`
                                            : 'A base esta pronta. Agora o foco e manter consistencia e ajustar o mes.'}
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
                                        <motion.article key={item.id} className={`dashboard-priority-item${item.done ? ' is-done' : ''}`} variants={itemVariants}>
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
                                        </motion.article>
                                    ))}
                                </div>
                            ) : (
                                <div className="dashboard-empty-note">
                                    <Sparkles size={18} />
                                    <div>
                                        <strong>Painel em ordem</strong>
                                        <span>Seu proximo melhor passo e continuar registrando movimentos e reforcar a meta principal.</span>
                                    </div>
                                </div>
                            )}
                        </motion.section>

                        <motion.section className="glass-card dashboard-panel dashboard-transactions-panel" variants={sectionVariants} initial="hidden" animate="visible">
                            <div className="dashboard-panel-head">
                                <div>
                                    <p className="dashboard-panel-kicker">Atividade recente</p>
                                    <h2 className="dashboard-panel-title">{'\u00DAltimas movimenta\u00E7\u00F5es'}</h2>
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
                                    <p className="dashboard-empty-state">Sem movimentacoes recentes por aqui.</p>
                                ) : (
                                    recentTransactions.map((transaction) => (
                                        <motion.div
                                            key={transaction.id}
                                            className={`glass-card dashboard-tx-card ${newTxId === transaction.id ? 'animate-slide-in' : ''}`}
                                            variants={itemVariants}
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
                                                    ? '----'
                                                    : `${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}`}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.section>
                    </div>

                    <aside className="dashboard-side-column">
                        <motion.section className="glass-card dashboard-panel dashboard-focus-panel" variants={sectionVariants} initial="hidden" animate="visible">
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
                                        <span>{isPrivacyMode ? '----' : formatCurrency(primaryGoal.current_amount)}</span>
                                        <span>{goalProgress.toFixed(0)}%</span>
                                    </div>
                                    <div className="dashboard-progress-track">
                                        <div className="dashboard-progress-fill" style={{ width: `${goalProgress}%` }} />
                                    </div>
                                    <p className="dashboard-focus-copy">
                                        Faltam {isPrivacyMode ? '----' : formatCurrency(remainingGoalAmount)} para concluir esse objetivo.
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
                                        <span>Sem meta principal, o planejamento perde direcao e prioridade.</span>
                                    </div>
                                </div>
                            )}
                        </motion.section>

                        <motion.section className="glass-card dashboard-panel dashboard-wallet-panel" variants={sectionVariants} initial="hidden" animate="visible">
                            <div className="dashboard-panel-head">
                                <div>
                                    <p className="dashboard-panel-kicker">Onde o dinheiro esta</p>
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
                                                {isPrivacyMode ? '----' : formatCurrency(wallet.current_balance)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.section>

                        <div className="upcoming-widget-container">
                            <UpcomingBills />
                        </div>
                    </aside>
                </motion.div>
            </motion.div>
        </>
    );
}
