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

    useEffect(() => {
        if (user) {
            checkRecurring();
            fetchFinancialData();

            // Listen for global updates (e.g. from FAB)
            const handleUpdate = () => fetchFinancialData();
            window.addEventListener('transaction-updated', handleUpdate);
            return () => window.removeEventListener('transaction-updated', handleUpdate);
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

    const fetchFinancialData = async () => {
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

            // Fetch Goals
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
            setPrimaryGoal(primaryGoal);
            setWallets(walletsWithBalance);

            setRecentTransactions(data.slice(0, 5));
            setAllTransactions(data);

        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <OnboardingTour />
            <header id="tour-welcome" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingTop: '0.5rem'
            }}>
                <div>
                    <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Dashboard</h1>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Visão geral</p>
                </div>
            </header>

            {!loading && <InsightsCard transactions={allTransactions} />}

            {/* Main Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                {/* Balance Card */}
                <Card className="glass-card-hover" style={{ height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', background: 'rgba(10, 132, 255, 0.1)', borderRadius: '10px', color: 'var(--color-blue)' }}>
                            <Wallet size={20} />
                        </div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Saldo Total</h3>
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
                        {loading ? <Skeleton width="150px" height="40px" /> : (
                            isPrivacyMode ? '****' : <CountUp end={balance} prefix="R$ " />
                        )}
                    </h2>
                    <p style={{ color: 'var(--color-blue)', fontSize: '13px', fontWeight: 500, marginTop: '8px' }}>Disponível</p>
                </Card>

                {/* Expenses Card */}
                <Link to="/analysis" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card className="glass-card-hover" style={{ height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ padding: '8px', background: 'rgba(255, 69, 58, 0.1)', borderRadius: '10px', color: 'var(--color-red)' }}>
                                <TrendingUp size={20} />
                            </div>
                            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Despesas (Mês)</h3>
                        </div>
                        <h2 style={{ fontSize: '32px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
                            {loading ? <Skeleton width="150px" height="40px" /> : (
                                isPrivacyMode ? '****' : <CountUp end={expenses} prefix="R$ " />
                            )}
                        </h2>
                        <p style={{ color: 'var(--color-red)', fontSize: '13px', fontWeight: 500, marginTop: '8px' }}>Ver detalhes &rarr;</p>
                    </Card>
                </Link>

                {/* Goals Card */}
                <Link to="/goals" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card id="tour-goals" className="glass-card-hover" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ padding: '8px', background: 'rgba(191, 90, 242, 0.1)', borderRadius: '10px', color: 'var(--color-purple)' }}>
                                    <PiggyBank size={20} />
                                </div>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {primaryGoal ? primaryGoal.title : 'Economias'}
                                </h3>
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
                                {loading ? <Skeleton width="150px" height="40px" /> : (
                                    isPrivacyMode ? '****' : <CountUp end={primaryGoal ? primaryGoal.current_amount : savings} prefix="R$ " />
                                )}
                            </h2>
                            {primaryGoal && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--system-gray5)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min((primaryGoal.current_amount / primaryGoal.target_amount) * 100, 100)}%`,
                                            height: '100%',
                                            background: 'var(--color-purple)',
                                            borderRadius: '3px',
                                            transition: 'width 1s ease-out'
                                        }} />
                                    </div>
                                    <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-tertiary)' }}>
                                        Meta: R$ {parseFloat(primaryGoal.target_amount).toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Wallets Section */}
            {wallets.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Carteiras</h3>
                    <div className="cards-scroll-container" style={{
                        display: 'flex',
                        gap: '16px',
                        overflowX: 'auto',
                        paddingBottom: '16px',
                        scrollSnapType: 'x mandatory'
                    }}>
                        {wallets.map((w) => (
                            <Card key={w.id} className="glass-card-hover" style={{ minWidth: '240px', scrollSnapAlign: 'start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ padding: '8px', background: `${w.color}20`, borderRadius: '10px', color: w.color }}>
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '15px', margin: 0 }}>{w.name}</h4>
                                        <p style={{ fontSize: '12px', opacity: 0.6, margin: 0, textTransform: 'capitalize' }}>{w.type?.replace('_', ' ') || 'Carteira'}</p>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: 700 }}>
                                    {isPrivacyMode ? '****' : <CountUp end={w.current_balance} prefix="R$ " />}
                                </h3>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ animation: 'fadeIn 0.5s ease-out 0.2s backwards' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', margin: 0 }}>Transações Recentes</h2>
                    <Link to="/transactions" style={{ fontSize: '14px', color: 'var(--color-blue)', fontWeight: 500 }}>
                        Ver todas
                    </Link>
                </div>

                <div id="tour-transactions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <Skeleton key={i} width="100%" height="70px" borderRadius="16px" />
                        ))
                    ) : recentTransactions.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <p style={{ fontSize: '15px' }}>Nenhuma transação encontrada</p>
                            <Button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => window.location.href = '/transactions'}>
                                Adicionar
                            </Button>
                        </div>
                    ) : (
                        recentTransactions.map((tx) => (
                            <Card key={tx.id} className="transaction-card glass-card-hover" style={{
                                padding: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderRadius: '16px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-secondary)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        padding: '10px',
                                        borderRadius: '50%',
                                        background: tx.type === 'income' ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255, 69, 58, 0.1)',
                                        color: tx.type === 'income' ? 'var(--color-green)' : 'var(--color-red)',
                                        display: 'flex'
                                    }}>
                                        {tx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{tx.description}</h4>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {tx.category} • {new Date(tx.date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h3 style={{
                                        color: tx.type === 'income' ? 'var(--color-green)' : 'var(--text-main)',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        margin: 0
                                    }}>
                                        {isPrivacyMode ? '****' : (tx.type === 'income' ? '+ ' : '- ') + `R$ ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}`}
                                    </h3>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div >
    );
}
