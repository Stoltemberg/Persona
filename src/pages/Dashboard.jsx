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

export default function Dashboard() {
    const { user, profile, signOut } = useAuth();
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

    const fetchFinancialData = async () => {
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

        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container fade-in">
            <OnboardingTour />
            <header id="tour-welcome" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingTop: '0.5rem'
            }}>
                <div>
                    <h1 className="text-gradient">Dashboard</h1>
                    <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>Bem-vindo de volta, {profile?.full_name || user?.email}</p>
                </div>
            </header>

            {!loading && <InsightsCard transactions={allTransactions} />}

            <div className="cards-scroll-container fade-in">
                <Card className="stagger-1 card-min-width" hover>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(18, 194, 233, 0.15)', borderRadius: '14px', color: '#12c2e9' }}>
                            <Wallet size={28} />
                        </div>
                        <h3>Saldo Total</h3>
                    </div>
                    <h2 style={{ fontSize: '3rem', fontWeight: 800 }}>
                        {loading ? <Skeleton width="200px" height="60px" /> : `R$ ${balance.toFixed(2).replace('.', ',')}`}
                    </h2>
                    <p style={{ color: '#12c2e9', fontWeight: 500 }}>Atualizado agora</p>
                </Card>

                <Link to="/analysis" style={{ textDecoration: 'none', color: 'inherit' }} className="card-min-width">
                    <Card className="stagger-2" hover style={{ height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(246, 79, 89, 0.15)', borderRadius: '14px', color: '#f64f59' }}>
                                <TrendingUp size={28} />
                            </div>
                            <h3>Despesas (Mês)</h3>
                        </div>
                        <h2 style={{ fontSize: '3rem', fontWeight: 800 }}>
                            {loading ? <Skeleton width="180px" height="60px" /> : `R$ ${expenses.toFixed(2).replace('.', ',')}`}
                        </h2>
                        <p style={{ color: '#f64f59', fontWeight: 500 }}>Este mês &rarr;</p>
                    </Card>
                </Link>

                <Link to="/goals" style={{ textDecoration: 'none', color: 'inherit' }} className="card-min-width">
                    <Card id="tour-goals" className="stagger-3" hover style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '0.8rem', background: 'rgba(196, 113, 237, 0.15)', borderRadius: '14px', color: '#c471ed' }}>
                                    <PiggyBank size={28} />
                                </div>
                                <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {primaryGoal ? primaryGoal.title : 'Total Economizado'}
                                </h3>
                            </div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800 }}>
                                {loading ? <Skeleton width="180px" height="60px" /> : `R$ ${primaryGoal ? parseFloat(primaryGoal.current_amount).toFixed(2).replace('.', ',') : savings.toFixed(2).replace('.', ',')}`}
                            </h2>
                            {primaryGoal && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min((primaryGoal.current_amount / primaryGoal.target_amount) * 100, 100)}%`,
                                            height: '100%',
                                            background: '#c471ed'
                                        }} />
                                    </div>
                                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'rgba(255,255,255,0.5)' }}>
                                        Meta: R$ {parseFloat(primaryGoal.target_amount).toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                            )}
                        </div>
                        <p style={{ color: '#c471ed', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: primaryGoal ? '1rem' : 0 }}>
                            Ver Metas <span style={{ fontSize: '1.2rem' }}>&rarr;</span>
                        </p>
                    </Card>
                </Link>

                {/* Display Wallets */}
                <div id="tour-wallets" style={{ display: 'contents' }}>
                    {wallets.map((w, index) => (
                        <Card key={w.id} className="stagger-4 card-min-width" hover style={{ height: '100%', minWidth: '260px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '0.8rem', background: `${w.color}20`, borderRadius: '14px', color: w.color }}>
                                    <Wallet size={28} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem' }}>{w.name}</h3>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'capitalize' }}>{w.type?.replace('_', ' ') || 'Carteira'}</p>
                                </div>
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
                                {loading ? <Skeleton width="160px" height="50px" /> : `R$ ${w.current_balance.toFixed(2).replace('.', ',')}`}
                            </h2>
                            <p style={{ color: w.color, fontWeight: 500, fontSize: '0.9rem' }}>Saldo Atual</p>
                        </Card>
                    ))}
                </div>

            </div>

            <div className="fade-in" style={{ animationDelay: '0.4s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2rem' }}>Transações Recentes</h2>
                    <Link to="/transactions">
                        <Button variant="ghost">Ver Todas</Button>
                    </Link>
                </div>

                <div id="tour-transactions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <Skeleton key={i} width="100%" height="80px" borderRadius="20px" />
                        ))
                    ) : recentTransactions.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p style={{ fontSize: '1.1rem' }}>Nenhuma transação encontrada</p>
                            <Button style={{ marginTop: '1rem' }} onClick={() => window.location.href = '/transactions'}>
                                Adicionar primeira
                            </Button>
                        </div>
                    ) : (
                        recentTransactions.map((tx, index) => (
                            <Card key={tx.id} hover className="fade-in transaction-card" style={{
                                animationDelay: `${0.1 * index}s`,
                                padding: '0.75rem 1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '50%',
                                        background: tx.type === 'income' ? 'rgba(18, 194, 233, 0.1)' : 'rgba(246, 79, 89, 0.1)',
                                        color: tx.type === 'income' ? '#12c2e9' : '#f64f59',
                                        display: 'flex'
                                    }}>
                                        {tx.type === 'income' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                    </div>
                                    <div>
                                        <h4 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>{tx.description}</h4>
                                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{tx.category} • {new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h3 style={{
                                        color: tx.type === 'income' ? '#12c2e9' : '#f64f59',
                                        fontWeight: 700,
                                        fontSize: '1.25rem'
                                    }}>
                                        {tx.type === 'income' ? '+ ' : '- '}R$ {parseFloat(tx.amount).toFixed(2).replace('.', ',')}
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

