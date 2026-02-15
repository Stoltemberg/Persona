import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { OnboardingTour } from '../components/OnboardingTour';
import { Skeleton } from '../components/Skeleton';
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';

import { usePrivacy } from '../context/PrivacyContext';
import { CountUp } from '../components/CountUp';
import { PageHeader } from '../components/PageHeader';
import { UpcomingBills } from '../components/UpcomingBills';

export default function Dashboard() {
    const { user, profile, signOut } = useAuth();
    const { isPrivacyMode } = usePrivacy();
    const [balance, setBalance] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [savings, setSavings] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [primaryGoal, setPrimaryGoal] = useState(null);
    const [loading, setLoading] = useState(true);

    const [newTxId, setNewTxId] = useState(null);

    useEffect(() => {
        if (user) {
            checkRecurring();
            fetchFinancialData();

            const handleUpdate = () => fetchFinancialData();
            const handleInsert = (e) => fetchFinancialData(e.detail?.id);

            window.addEventListener('transaction-updated', handleUpdate);
            window.addEventListener('transaction-inserted', handleInsert);

            return () => {
                window.removeEventListener('transaction-updated', handleUpdate);
                window.removeEventListener('transaction-inserted', handleInsert);
            };
        }
    }, [user]);

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
                .eq('profile_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;

            let totalIncome = 0;
            let totalExpense = 0;
            let monthlyExpense = 0;

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            data.forEach(tx => {
                const amount = parseFloat(tx.amount);
                const date = new Date(tx.date);

                if (tx.type === 'income') {
                    totalIncome += amount;
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
                .eq('profile_id', user.id);

            let totalSavings = 0;
            let goal = null;

            if (goalsData) {
                totalSavings = goalsData.reduce((acc, curr) => acc + (parseFloat(curr.current_amount) || 0), 0);
                goal = goalsData.find(g => g.is_primary) || null;
            }

            const { data: walletsData } = await supabase
                .from('wallets')
                .select('*')
                .eq('profile_id', user.id);

            let walletsWithBalance = [];
            if (walletsData) {
                walletsWithBalance = walletsData.map(w => {
                    const walletTxs = data.filter(tx => tx.wallet_id === w.id);
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
            setSavings(totalSavings);
            setPrimaryGoal(goal);
            setWallets(walletsWithBalance);
            setRecentTransactions(data.slice(0, 5));
            setAllTransactions(data);

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

    return (
        <div className="container fade-in" style={{ paddingBottom: '80px' }}>
            <OnboardingTour />

            <PageHeader
                title={<span>Olá, <span style={{ fontWeight: 600 }}>{profile?.full_name?.split(' ')[0] || 'Usuário'}</span></span>}
            />

            {/* Hero Balance Section */}
            <section className="dashboard-balance-section">
                <p className="dashboard-balance-label">Saldo Total</p>
                <div className="dashboard-balance-value">
                    {loading ? <Skeleton width="200px" height="72px" style={{ margin: '0 auto' }} /> : (
                        isPrivacyMode ? '••••' : <CountUp end={balance} prefix="R$ " duration={1.5} />
                    )}
                </div>
            </section>

            {/* Quick Stats Grid */}
            <div className="dashboard-stats-grid">
                <Link to="/planning" style={{ textDecoration: 'none' }}>
                    <div className="glass-card dashboard-stat-card zoom-on-hover">
                        <div className="dashboard-stat-icon" style={{ background: 'rgba(255, 69, 58, 0.08)', color: 'var(--color-danger)' }}>
                            <ArrowUpRight size={16} />
                        </div>
                        <div>
                            <div className="dashboard-stat-label">Saídas (Mês)</div>
                            <div className="dashboard-stat-value" style={{ color: 'var(--color-danger)' }}>
                                {loading ? '...' : (isPrivacyMode ? '••••' : `R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to="/planning" style={{ textDecoration: 'none' }}>
                    <div className="glass-card dashboard-stat-card zoom-on-hover">
                        <div className="dashboard-stat-icon" style={{ background: 'rgba(52, 199, 89, 0.08)', color: 'var(--color-success)' }}>
                            <PiggyBank size={16} />
                        </div>
                        <div>
                            <div className="dashboard-stat-label">Economias</div>
                            <div className="dashboard-stat-value" style={{ color: 'var(--color-success)' }}>
                                {loading ? '...' : (isPrivacyMode ? '••••' : `R$ ${savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Upcoming Bills Widget */}
            <UpcomingBills />

            {/* Recent Transactions */}
            <div>
                <div className="dashboard-section-header">
                    <h3 className="dashboard-section-title">Últimas movimentações</h3>
                    <Link to="/transactions" className="dashboard-section-link">Ver tudo</Link>
                </div>

                <div className="dashboard-tx-list">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <Skeleton key={i} width="100%" height="64px" style={{ borderRadius: '16px' }} />
                        ))
                    ) : recentTransactions.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Sem movimentações recentes</p>
                    ) : (
                        recentTransactions.map((tx, index) => (
                            <div key={tx.id} className={`glass-card dashboard-tx-card ${newTxId === tx.id ? 'animate-slide-in' : ''}`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="dashboard-tx-left">
                                    <div className="dashboard-tx-icon" style={{
                                        background: tx.type === 'income' ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 69, 58, 0.08)',
                                        color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'
                                    }}>
                                        {tx.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                    </div>
                                    <div>
                                        <div className="dashboard-tx-desc">{tx.description}</div>
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
            </div>
        </div>
    );
}
