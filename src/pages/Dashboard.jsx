import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { OnboardingTour } from '../components/OnboardingTour';
import { Skeleton } from '../components/Skeleton';
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';

import { usePrivacy } from '../context/PrivacyContext';
import { CountUp } from '../components/CountUp';
import { PageHeader } from '../components/PageHeader';
import { UpcomingBills } from '../components/UpcomingBills';

const listVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
};

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
            window.addEventListener('supabase-sync', handleUpdate);

            return () => {
                window.removeEventListener('transaction-updated', handleUpdate);
                window.removeEventListener('transaction-inserted', handleInsert);
                window.removeEventListener('supabase-sync', handleUpdate);
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
                ;

            let totalSavings = 0;
            let goal = null;

            if (goalsData) {
                totalSavings = goalsData.reduce((acc, curr) => acc + (parseFloat(curr.current_amount) || 0), 0);
                goal = goalsData.find(g => g.is_primary) || null;
            }

            const { data: walletsData } = await supabase
                .from('wallets')
                .select('*')
                ;

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
        <div className="container fade-in" style={{ paddingBottom: '100px' }}>
            <OnboardingTour />

            <PageHeader
                className="dashboard-header-centered"
                title={<span>Olá, <span style={{ fontWeight: 600 }}>{profile?.full_name?.split(' ')[0] || 'Usuário'}</span></span>}
            />

            <div className="bento-grid">
                {/* Main Content Spine (2/3) */}
                <div className="bento-main" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Hero Balance Section */}
                    <section className="dashboard-balance-section">
                        <p className="dashboard-balance-label">Saldo Total</p>
                        <div className="dashboard-balance-value">
                            {loading ? <Skeleton width="200px" height="72px" style={{ margin: '0 auto' }} /> : (
                                isPrivacyMode ? '••••' : <CountUp end={balance} prefix="R$ " duration={1.5} />
                            )}
                        </div>
                    </section>

                    {/* Recent Transactions Section */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
                        <div className="dashboard-section-header" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="dashboard-section-title">Últimas movimentações</h3>
                        </div>

                        <motion.div 
                            className="dashboard-tx-list"
                            variants={listVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {loading ? (
                                Array(5).fill(0).map((_, i) => <Skeleton key={i} height="72px" style={{ marginBottom: '0.75rem', borderRadius: '16px' }} />)
                            ) : recentTransactions.length === 0 ? (
                                <div className="text-muted" style={{ textAlign: 'center', padding: '3rem 0', opacity: 0.5 }}>Sem movimentações recentes</div>
                            ) : (
                                recentTransactions.map((tx) => (
                                    <motion.div 
                                        key={tx.id} 
                                        variants={itemVariants} 
                                        className={clsx("glass-card dashboard-tx-card", newTxId === tx.id && "animate-pulse")}
                                        style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '16px' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="dashboard-tx-icon" style={{ 
                                                background: tx.type === 'income' ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 69, 58, 0.08)',
                                                color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                                                width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {tx.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{tx.description}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                                            </div>
                                        </div>
                                        <div style={{ 
                                            fontWeight: 600, 
                                            color: tx.type === 'income' ? 'var(--color-success)' : 'var(--text-main)'
                                        }}>
                                            {isPrivacyMode ? '••••' : (tx.type === 'income' ? '+' : '-') + ` R$ ${parseFloat(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>

                        {!loading && recentTransactions.length > 0 && (
                            <div className="dashboard-footer-action" style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <Link to="/transactions" style={{ textDecoration: 'none', color: 'var(--color-brand)', fontSize: '0.85rem', fontWeight: 500 }}>
                                    Ver todas transações
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Widgets (1/3) */}
                <div className="bento-sidebar">
                    {/* Quick Stats Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                        <Link to="/planning" style={{ textDecoration: 'none' }}>
                            <div className="glass-card zoom-on-hover" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(255, 69, 58, 0.08)', color: 'var(--color-danger)', padding: '10px', borderRadius: '12px' }}>
                                    <ArrowUpRight size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saídas (Mês)</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-danger)' }}>
                                        {loading ? '...' : (isPrivacyMode ? '••••' : `R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link to="/planning" style={{ textDecoration: 'none' }}>
                            <div className="glass-card zoom-on-hover" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(52, 199, 89, 0.08)', color: 'var(--color-success)', padding: '10px', borderRadius: '12px' }}>
                                    <PiggyBank size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Economias</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-success)' }}>
                                        {loading ? '...' : (isPrivacyMode ? '••••' : `R$ ${savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Upcoming Bills Widget */}
                    <UpcomingBills />
                </div>
            </div>
        </div>
    );
}
