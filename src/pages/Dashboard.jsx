/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { OnboardingTour } from '../components/OnboardingTour';
import { Skeleton } from '../components/Skeleton';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet, Target, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThreeBackground } from '../components/ThreeBackground';
import { useDashboardAnimations } from '../hooks/useDashboardAnimations';

import { usePrivacy } from '../context/PrivacyContext';
import { CountUp } from '../components/CountUp';
import { PageHeader } from '../components/PageHeader';
import { PartnerFilter } from '../components/PartnerFilter';
import { UpcomingBills } from '../components/UpcomingBills';

export default function Dashboard() {
    const { user, profile, partnerProfile, incomingRequest, fetchProfile, signOut } = useAuth();
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
        if (user) {
            checkRecurring();
            fetchFinancialData();

            const handleUpdate = () => fetchFinancialData();
            const handleInsert = (e) => fetchFinancialData(e.detail?.id);

            window.addEventListener('transaction-updated', handleUpdate);
            window.addEventListener('transaction-inserted', handleInsert);
            window.addEventListener('supabase-sync', handleUpdate);

            return () => {
                window.removeEventListener('transaction-updated', handleUpdate);
                window.removeEventListener('transaction-inserted', handleInsert);
                window.removeEventListener('supabase-sync', handleUpdate);
            };
        }
    }, [user, activeFilter]);

    const checkRecurring = async () => {
        try {
            const now = new Date();
            const { data: templates } = await supabase
                .from('recurring_templates')
                .select('*')
                .eq('active', true)
                .lte('next_due_date', now.toISOString());

            if (templates && templates.length > 0) {
                for (const tmpl of templates) {
                    const { error: txError } = await supabase.from('transactions').insert([{
                        description: tmpl.description,
                        amount: tmpl.amount,
                        type: tmpl.type,
                        category: tmpl.category,
                        expense_type: tmpl.expense_type,
                        date: new Date().toISOString(),
                        profile_id: user.id
                    }]);

                    if (!txError) {
                        const nextDate = new Date(tmpl.next_due_date);
                        if (tmpl.frequency === 'monthly') {
                            nextDate.setMonth(nextDate.getMonth() + 1);
                        } else if (tmpl.frequency === 'weekly') {
                            nextDate.setDate(nextDate.getDate() + 7);
                        }

                        await supabase.from('recurring_templates').update({
                            last_generated_date: new Date().toISOString(),
                            next_due_date: nextDate.toISOString()
                        }).eq('id', tmpl.id);
                    }
                }
                fetchFinancialData();
            }
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

            // Filter transactions based on activeFilter
            const filteredData = data.filter(tx => {
                if (activeFilter === 'all') return true;
                if (activeFilter === 'me') return tx.profile_id === user.id;
                if (activeFilter === 'partner') return tx.profile_id === profile?.partner_id;
                return true;
            });

            let totalIncome = 0;
            let totalExpense = 0;
            let monthlyExpense = 0;
            let monthlyIncome = 0;

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            filteredData.forEach(tx => {
                const amount = parseFloat(tx.amount);
                const date = new Date(tx.date);

                if (tx.type === 'income') {
                    totalIncome += amount;
                    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                        monthlyIncome += amount;
                    }
                } else {
                    totalExpense += amount;
                    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                        monthlyExpense += amount;
                    }
                }
            });

            const { data: goalsData } = await supabase
                .from('goals')
                .select('*')
                ;

            let totalSavings = 0;
            let goal = null;

            if (goalsData) {
                const filteredGoals = goalsData.filter(g => {
                    if (activeFilter === 'all') return true;
                    if (activeFilter === 'me') return g.profile_id === user.id;
                    if (activeFilter === 'partner') return g.profile_id === profile?.partner_id;
                    return true;
                });

                totalSavings = filteredGoals.reduce((acc, curr) => acc + (parseFloat(curr.current_amount) || 0), 0);
                goal = filteredGoals.find(g => g.is_primary) || null;
            }

            const { data: walletsData } = await supabase
                .from('wallets')
                .select('*')
                ;

            let walletsWithBalance = [];
            if (walletsData) {
                walletsWithBalance = walletsData
                    .filter(w => {
                        if (activeFilter === 'all') return true;
                        if (activeFilter === 'me') return w.profile_id === user.id;
                        if (activeFilter === 'partner') return w.profile_id === profile?.partner_id;
                        return true;
                    })
                    .map(w => {
                        const walletTxs = filteredData.filter(tx => tx.wallet_id === w.id);
                        const income = walletTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
                        const expense = walletTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
                        return {
                            ...w,
                            current_balance: (parseFloat(w.initial_balance) || 0) + income - expense
                        };
                    });
            }

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
    const topWallet = wallets.slice().sort((a, b) => b.current_balance - a.current_balance)[0] || null;
    const goalProgress = primaryGoal && Number(primaryGoal.target_amount) > 0
        ? Math.min((Number(primaryGoal.current_amount || 0) / Number(primaryGoal.target_amount || 0)) * 100, 100)
        : 0;

    return (
        <>
            <ThreeBackground />
            <div ref={containerRef} className="container" style={{ paddingBottom: '80px', position: 'relative', zIndex: 1 }}>
                <OnboardingTour />

            {incomingRequest && (
                <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }} className="fade-in">
                    <Card style={{ background: 'linear-gradient(135deg, rgba(246,79,89,0.1), rgba(18,194,233,0.1))', border: '1px solid rgba(246,79,89,0.3)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
                            <div className="avatar-preview" style={{ width: '48px', height: '48px', fontSize: '1.2rem', margin: '0 auto', background: 'var(--bg-elevated)', border: '2px solid rgba(246,79,89,0.5)' }}>
                                {incomingRequest.avatar_url ? (
                                    <img src={incomingRequest.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    (incomingRequest.nickname || incomingRequest.full_name || 'U')[0].toUpperCase()
                                )}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{incomingRequest.nickname} enviou um convite!</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Para compartilhar finanças no Modo Casal.</p>
                            </div>
                            <div style={{ display: 'flex', width: '100%', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <Button
                                    style={{ flex: 1, justifyContent: 'center', background: 'var(--glass-border)', color: 'var(--text-main)' }}
                                    onClick={async () => {
                                        try {
                                            await supabase.rpc('reject_partner_request');
                                            fetchProfile(user.id);
                                        } catch (e) { console.error(e) }
                                    }}
                                >Recusar</Button>
                                <Button
                                    className="btn-primary"
                                    style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #f64f59, #f7797d)', color: 'white', border: 'none' }}
                                    onClick={async () => {
                                        try {
                                            await supabase.rpc('accept_partner_request');
                                            fetchProfile(user.id);
                                        } catch (e) { console.error(e) }
                                    }}
                                >Aceitar</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <PageHeader
                className="dashboard-header-centered"
                title={<span>Olá, <span style={{ fontWeight: 600 }}>{firstName}</span></span>}
                subtitle="Aqui está um retrato rápido do seu momento financeiro."
            />

            <PartnerFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            {/* Hero Balance Section */}
            <section className="dashboard-balance-section">
                <p className="dashboard-balance-label">Saldo Total</p>
                <div className="dashboard-balance-value">
                    {loading ? <Skeleton width="200px" height="72px" style={{ margin: '0 auto' }} /> : (
                        isPrivacyMode ? '••••' : <CountUp end={balance} prefix="R$ " duration={1.5} />
                    )}
                </div>
                <p style={{ marginTop: '0.9rem', color: 'var(--text-secondary)', maxWidth: '520px', marginInline: 'auto', lineHeight: 1.6 }}>
                    {loading ? 'Atualizando panorama...' : monthlyNet >= 0
                        ? 'Você está fechando o mês com respiro positivo. Aproveite esse espaço para fortalecer a reserva.'
                        : 'Seu mês está pressionado. Vale revisar saídas recentes e priorizar o essencial nesta semana.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1rem 1.1rem', textAlign: 'left' }}>
                        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Resultado do mês</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: monthlyNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {loading || isPrivacyMode ? '••••' : formatCurrency(monthlyNet)}
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '1rem 1.1rem', textAlign: 'left' }}>
                        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Ritmo de poupança</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {loading ? '...' : `${savingsRate.toFixed(0)}%`}
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '1rem 1.1rem', textAlign: 'left' }}>
                        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Carteira líder</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {loading ? '...' : topWallet ? topWallet.name : 'Sem carteiras'}
                        </div>
                        {topWallet && (
                            <div style={{ marginTop: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                {isPrivacyMode ? '••••' : formatCurrency(topWallet.current_balance)}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Quick Stats Grid */}
            <div className="dashboard-stats-grid">
                <Link to="/planning" style={{ textDecoration: 'none' }}>
                    <div className="glass-card dashboard-stat-card zoom-on-hover">
                        <div className="dashboard-stat-icon" style={{ background: 'rgba(255, 69, 58, 0.08)', color: 'var(--color-danger)' }}>
                            <ArrowUpRight size={15} />
                        </div>
                        <div>
                            <div className="dashboard-stat-label">Saídas do mês</div>
                            <div className="dashboard-stat-value" style={{ color: 'var(--color-danger)' }}>
                                {loading ? '...' : (isPrivacyMode ? '••••' : `R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to="/transactions" style={{ textDecoration: 'none' }}>
                    <div className="glass-card dashboard-stat-card zoom-on-hover">
                        <div className="dashboard-stat-icon" style={{ background: 'rgba(52, 199, 89, 0.08)', color: 'var(--color-success)' }}>
                            <ArrowDownLeft size={15} />
                        </div>
                        <div>
                            <div className="dashboard-stat-label">Entradas do mês</div>
                            <div className="dashboard-stat-value" style={{ color: 'var(--color-success)' }}>
                                {loading ? '...' : (isPrivacyMode ? '••••' : `R$ ${incomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to="/goals" style={{ textDecoration: 'none' }}>
                    <div className="glass-card dashboard-stat-card zoom-on-hover">
                        <div className="dashboard-stat-icon" style={{ background: 'rgba(79, 41, 240, 0.12)', color: '#8b6cff' }}>
                            <PiggyBank size={15} />
                        </div>
                        <div>
                            <div className="dashboard-stat-label">Total em metas</div>
                            <div className="dashboard-stat-value" style={{ color: 'var(--text-main)' }}>
                                {loading ? '...' : (isPrivacyMode ? '••••' : formatCurrency(savings))}
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                        <div className="dashboard-stat-icon" style={{ background: 'rgba(79, 41, 240, 0.12)', color: '#8b6cff' }}>
                            <Target size={15} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Meta em foco</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                {primaryGoal ? primaryGoal.title : 'Defina uma meta principal para orientar seus aportes.'}
                            </div>
                        </div>
                    </div>
                    {primaryGoal ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.55rem' }}>
                                <span>{isPrivacyMode ? '••••' : formatCurrency(primaryGoal.current_amount)}</span>
                                <span>{goalProgress.toFixed(0)}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '0.75rem' }}>
                                <div style={{ width: `${goalProgress}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #4f29f0, #c471ed)' }} />
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                Faltam {isPrivacyMode ? '••••' : formatCurrency(Number(primaryGoal.target_amount || 0) - Number(primaryGoal.current_amount || 0))} para chegar ao objetivo.
                            </p>
                        </>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Quando você define um foco principal, o app fica mais útil para priorizar aportes e acompanhar progresso.
                        </p>
                    )}
                </div>

                <div className="glass-card" style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                        <div className="dashboard-stat-icon" style={{ background: 'rgba(18, 194, 233, 0.12)', color: '#12c2e9' }}>
                            <Wallet size={15} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Carteiras em destaque</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Veja onde seu dinheiro está mais concentrado.</div>
                        </div>
                    </div>
                    {wallets.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Cadastre uma carteira para acompanhar saldos com mais precisão.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                            {wallets.slice().sort((a, b) => b.current_balance - a.current_balance).slice(0, 3).map((wallet) => (
                                <div key={wallet.id} className="surface-secondary" style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{wallet.name}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'capitalize' }}>{wallet.type?.replace('_', ' ') || 'carteira'}</div>
                                    </div>
                                    <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                                        {isPrivacyMode ? '••••' : formatCurrency(wallet.current_balance)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="glass-card" style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                        <div className="dashboard-stat-icon" style={{ background: 'rgba(0, 235, 199, 0.12)', color: '#00bfa5' }}>
                            <Sparkles size={15} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Próximo melhor passo</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Uma ação simples para destravar progresso agora.</div>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.9rem' }}>
                        {wallets.length === 0
                            ? 'Comece cadastrando sua primeira carteira. Isso deixa os saldos, metas e análises muito mais confiáveis.'
                            : !primaryGoal
                                ? 'Escolha uma meta principal para transformar o dashboard em um painel de prioridade real.'
                                : monthlyNet < 0
                                    ? 'Seu foco agora é reduzir saídas deste mês. Abra o planejamento e corte uma categoria variável.'
                                    : 'Você abriu espaço no mês. Aproveite para fazer um novo aporte na meta em foco.'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                        <Link to={wallets.length === 0 ? '/wallets' : !primaryGoal ? '/goals' : monthlyNet < 0 ? '/planning' : '/goals'}>
                            <Button className="btn-primary">
                                {wallets.length === 0 ? 'Criar carteira' : !primaryGoal ? 'Definir meta' : monthlyNet < 0 ? 'Rever planejamento' : 'Aportar na meta'}
                            </Button>
                        </Link>
                        <Link to="/transactions">
                            <Button variant="ghost">Ver transações</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Upcoming Bills Widget */}
            <UpcomingBills />

            {/* Recent Transactions */}
            <div>
                <div className="dashboard-section-header">
                    <h3 className="dashboard-section-title">Últimas movimentações</h3>
                </div>

                <div className="dashboard-tx-list">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <Skeleton key={i} width="100%" height="64px" style={{ borderRadius: '4px', marginBottom: '8px' }} />
                            ))
                        ) : recentTransactions.length === 0 ? (
                            <p key="empty" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Sem movimentações recentes</p>
                        ) : (
                            recentTransactions.map(tx => (
                                <div
                                    key={tx.id}
                                    className={`glass-card dashboard-tx-card ${newTxId === tx.id ? 'animate-slide-in' : ''}`}
                                    style={{ opacity: 0 }} // Previne Flash of Unstyled Content antes do Anime.js atuar
                                >
                                    <div className="dashboard-tx-left">
                                        <div className="dashboard-tx-icon" style={{
                                            background: tx.type === 'income' ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 69, 58, 0.08)',
                                            color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'
                                        }}>
                                            {tx.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                        </div>
                                        <div>
                                            <div className="dashboard-tx-desc" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {tx.description}
                                                {tx.profile_id === profile?.partner_id && (
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        padding: '0.15rem 0.4rem',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        color: 'var(--text-main)',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        fontWeight: 500,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        textTransform: 'none'
                                                    }}>
                                                        {partnerProfile?.avatar_url ? (
                                                            <img src={partnerProfile.avatar_url} alt="Partner" style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(246, 79, 89, 0.2)', color: '#f64f59', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700 }}>
                                                                {(partnerProfile?.nickname || partnerProfile?.full_name || 'P')[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                        {partnerProfile?.nickname || partnerProfile?.full_name?.split(' ')[0] || 'Parceiro'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="dashboard-tx-date">{new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                                        </div>
                                    </div>
                                    <div className="dashboard-tx-amount" style={{
                                        color: tx.type === 'income' ? 'var(--color-success)' : 'var(--text-main)'
                                    }}>
                                        {isPrivacyMode ? '••••' : (tx.type === 'income' ? '+' : '-') + ` R$ ${parseFloat(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </div>
                                </div>
                            ))
                        )}
                </div>

                {recentTransactions.length > 0 && !loading && (
                    <div className="dashboard-footer-action" style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', width: '100%' }}>
                        <Link to="/transactions" className="dashboard-section-link">
                            Ver tudo
                        </Link>
                    </div>
                )}
            </div>
            </div>
        </>
    );
}


