import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { OnboardingTour } from '../components/OnboardingTour';
import { Skeleton } from '../components/Skeleton';
import { InsightsCard } from '../components/InsightsCard';
import { LogOut, Wallet, TrendingUp, PiggyBank, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
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
    const [allTransactions, setAllTransactions] = useState([]); // For Insights
    const [wallets, setWallets] = useState([]);
    const [primaryGoal, setPrimaryGoal] = useState(null);
    const [loading, setLoading] = useState(true);

    const [newTxId, setNewTxId] = useState(null);

    useEffect(() => {
        if (user) {
            checkRecurring();
            fetchFinancialData();

            // Listen for global updates (e.g. from FAB)
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
            // Fetch active templates due today or before
            const { data: templates } = await supabase
                .from('recurring_templates')
                .select('*')
                .eq('active', true)
                .lte('next_due_date', now.toISOString());

            if (templates && templates.length > 0) {
                console.log(`Processing ${templates.length} recurring transactions...`);

                for (const tmpl of templates) {
                    // 1. Create Transaction
                    const { error: txError } = await supabase.from('transactions').insert([{
                        description: tmpl.description,
                        amount: tmpl.amount,
                        type: tmpl.type,
                        category: tmpl.category,
                        expense_type: tmpl.expense_type,
                        date: new Date().toISOString(), // Created today
                        profile_id: user.id
                    }]);

                    if (!txError) {
                        // 2. Update Next Due Date
                        const nextDate = new Date(tmpl.next_due_date);
                        // Simple monthly logic
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
                // Refresh data after processing
                fetchFinancialData();
            }
        } catch (error) {
            console.error('Error processing recurring:', error);
        }
    };

    const fetchFinancialData = async (newTransactionId = null) => {
        try {
            // Fetch all transactions for the user
            // We need more fields now for the list
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('profile_id', user.id)
                .order('date', { ascending: false }); // Latest first

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
                    // Check if it's this month's expense
                    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                        monthlyExpense += amount;
                    }
                }
            });

            // Fetch Goals for Savings Card
            const { data: goalsData } = await supabase
                .from('goals')
                .select('*')
                .eq('profile_id', user.id);

            let totalSavings = 0;
            let primaryGoal = null;

            if (goalsData) {
                totalSavings = goalsData.reduce((acc, curr) => acc + (parseFloat(curr.current_amount) || 0), 0);
                primaryGoal = goalsData.find(g => g.is_primary) || null;
            }

            // Fetch Wallets
            const { data: walletsData } = await supabase
                .from('wallets')
                .select('*')
                .eq('profile_id', user.id);

            let walletsWithBalance = [];
            if (walletsData) {
                walletsWithBalance = walletsData.map(w => {
                    const walletTxs = data.filter(tx => tx.wallet_id === w.id);
                    // If transactions don't have wallet_id (legacy), we shouldn't assume they belong to a specific wallet 
                    // unless we want a default. For now, strict matching.
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
            // We can store primaryGoal in a state if we want to display it specifically,
            // or just use totalSavings for now as the base requirement.
            // Let's add a state for it to use in the UI.
            setPrimaryGoal(primaryGoal);
            setWallets(walletsWithBalance);

            setPrimaryGoal(primaryGoal);
            setWallets(walletsWithBalance);

            // Set the first 5 for the recent list
            setRecentTransactions(data.slice(0, 5));
            setAllTransactions(data);

            // Handle New Transaction Animation
            if (newTransactionId) {
                // Ensure the new transaction is in the recent list (it should be as we sort by date desc)
                // We add the animation class conditionally in the render
                setNewTxId(newTransactionId);
                setTimeout(() => setNewTxId(null), 2000); // Remove class after animation
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
                title={<span>Olá, <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{profile?.full_name?.split(' ')[0] || 'Usuário'}</span></span>}
            />

            {/* Hero Balance Section - The Core Focus */}
            <section style={{ marginBottom: '5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.65, marginBottom: '0.5rem' }}>
                    Saldo Total
                </p>
                <div style={{
                    fontSize: '3.5rem',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    lineHeight: 1.1,
                    minHeight: '80px',
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    transition: 'opacity 0.3s ease'
                }}>
                    {loading ? <Skeleton width="200px" height="80px" style={{ margin: '0 auto' }} /> : (
                        isPrivacyMode ? '****' : <CountUp end={balance} prefix="R$ " duration={1.5} />
                    )}
                </div>
            </section>

            {/* Quick Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5rem',
                marginBottom: '5rem'
            }}>
                <Link to="/analysis" style={{ textDecoration: 'none' }}>
                    <div className="glass-card zoom-on-hover" style={{ padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ marginBottom: '0.5rem', opacity: 0.6, fontSize: '0.85rem' }}>Saídas (Mês)</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-danger)' }}>
                            {loading ? '...' : (isPrivacyMode ? '****' : `R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
                        </div>
                    </div>
                </Link>

                <Link to="/goals" style={{ textDecoration: 'none' }}>
                    <div className="glass-card zoom-on-hover" style={{ padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ marginBottom: '0.5rem', opacity: 0.6, fontSize: '0.85rem' }}>Economias</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-success)' }}>
                            {loading ? '...' : (isPrivacyMode ? '****' : `R$ ${savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Upcoming Bills Widget */}
            <UpcomingBills />

            {/* Recent Transactions - Simplified List */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Últimas movimentações</h3>
                    <Link to="/transactions" style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-main)', opacity: 0.7, textDecoration: 'none' }}>Ver tudo</Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <Skeleton key={i} width="100%" height="70px" style={{ borderRadius: '12px' }} />
                        ))
                    ) : recentTransactions.length === 0 ? (
                        <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>Sem movimentações recentes</p>
                    ) : (
                        recentTransactions.map((tx, index) => (
                            <div key={tx.id} className={`glass-card ${newTxId === tx.id ? 'animate-slide-in' : ''}`} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem 1.25rem',
                                marginBottom: index === recentTransactions.length - 1 ? 0 : '0.5rem',
                                animationDelay: `${index * 0.05}s`,
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{tx.description}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                                </div>
                                <div style={{ fontWeight: 600, color: tx.type === 'income' ? 'var(--color-success)' : 'var(--text-main)' }}>
                                    {isPrivacyMode ? '****' : (tx.type === 'income' ? '+' : '-') + ` R$ ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}`}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

