import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LogOut, Wallet, TrendingUp, PiggyBank, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user, profile, signOut } = useAuth();
    const [balance, setBalance] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [savings, setSavings] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchFinancialData();
        }
    }, [user]);

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

            setBalance(totalIncome - totalExpense);
            setExpenses(monthlyExpense);
            setSavings(0); // Future feature

            // Set the first 5 for the recent list
            setRecentTransactions(data.slice(0, 5));

        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container fade-in">
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4rem',
                paddingTop: '0.5rem'
            }}>
                <div>
                    <h1 className="text-gradient">Dashboard</h1>
                    <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>Bem-vindo de volta, {profile?.full_name || user?.email}</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                <Card className="stagger-1" hover>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(18, 194, 233, 0.15)', borderRadius: '14px', color: '#12c2e9' }}>
                            <Wallet size={28} />
                        </div>
                        <h3>Saldo Total</h3>
                    </div>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: 800 }}>
                        R$ {loading ? '...' : balance.toFixed(2).replace('.', ',')}
                    </h2>
                    <p style={{ color: '#12c2e9', fontWeight: 500 }}>Atualizado agora</p>
                </Card>

                <Card className="stagger-2" hover>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(246, 79, 89, 0.15)', borderRadius: '14px', color: '#f64f59' }}>
                            <TrendingUp size={28} />
                        </div>
                        <h3>Despesas (Mês)</h3>
                    </div>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: 800 }}>
                        R$ {loading ? '...' : expenses.toFixed(2).replace('.', ',')}
                    </h2>
                    <p style={{ color: '#f64f59', fontWeight: 500 }}>Este mês</p>
                </Card>

                <Link to="/goals" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card className="stagger-3" hover style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '0.8rem', background: 'rgba(196, 113, 237, 0.15)', borderRadius: '14px', color: '#c471ed' }}>
                                    <PiggyBank size={28} />
                                </div>
                                <h3>Meta de Economia</h3>
                            </div>
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 800 }}>
                                R$ {loading ? '...' : savings.toFixed(2).replace('.', ',')}
                            </h2>
                        </div>
                        <p style={{ color: '#c471ed', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Ver Metas <span style={{ fontSize: '1.2rem' }}>&rarr;</span>
                        </p>
                    </Card>
                </Link>
            </div>

            <div className="fade-in" style={{ animationDelay: '0.4s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2rem' }}>Transações Recentes</h2>
                    <Link to="/transactions">
                        <Button variant="ghost">Ver Todas</Button>
                    </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? (
                        <p>Carregando...</p>
                    ) : recentTransactions.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p style={{ fontSize: '1.1rem' }}>Nenhuma transação encontrada</p>
                            <Button style={{ marginTop: '1rem' }} onClick={() => window.location.href = '/transactions'}>
                                Adicionar primeira
                            </Button>
                        </div>
                    ) : (
                        recentTransactions.map((tx, index) => (
                            <Card key={tx.id} hover style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1.25rem 2rem',
                                animationDelay: `${0.1 * index}s`
                            }} className="fade-in">
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
                                        color: tx.type === 'income' ? '#12c2e9' : 'white',
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
        </div>
    );
}
