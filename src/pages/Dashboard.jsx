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
        <div className="container">
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '3rem',
                paddingTop: '2rem'
            }}>
                <div>
                    <h1>Dashboard</h1>
                    <p>Bem-vindo de volta, {profile?.full_name || user?.email}</p>
                </div>
                <Button variant="ghost" onClick={signOut} icon={LogOut}>
                    Sair
                </Button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(18, 194, 233, 0.2)', borderRadius: '12px', color: 'var(--secondary)' }}>
                            <Wallet size={24} />
                        </div>
                        <h3>Saldo Total</h3>
                    </div>
                    <h2 style={{ fontSize: '2.5rem' }}>
                        R$ {loading ? '...' : balance.toFixed(2).replace('.', ',')}
                    </h2>
                    <p style={{ color: 'var(--secondary)' }}>Atualizado agora</p>
                </Card>

                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(246, 79, 89, 0.2)', borderRadius: '12px', color: 'var(--accent)' }}>
                            <TrendingUp size={24} />
                        </div>
                        <h3>Despesas (Mês)</h3>
                    </div>
                    <h2 style={{ fontSize: '2.5rem' }}>
                        R$ {loading ? '...' : expenses.toFixed(2).replace('.', ',')}
                    </h2>
                    <p style={{ color: 'var(--accent)' }}>Este mês</p>
                </Card>

                <Link to="/goals" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card className="glass-card-hover">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(196, 113, 237, 0.2)', borderRadius: '12px', color: 'var(--primary)' }}>
                                <PiggyBank size={24} />
                            </div>
                            <h3>Meta de Economia</h3>
                        </div>
                        <h2 style={{ fontSize: '2.5rem' }}>
                            R$ {loading ? '...' : savings.toFixed(2).replace('.', ',')}
                        </h2>
                        <p style={{ color: 'var(--primary)' }}>Ver Metas &rarr;</p>
                    </Card>
                </Link>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Transações Recentes</h2>
                    <Link to="/transactions">
                        <Button variant="ghost">Ver Todas</Button>
                    </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? (
                        <p>Carregando...</p>
                    ) : recentTransactions.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Nenhuma transação encontrada. Adicione a primeira!
                        </div>
                    ) : (
                        recentTransactions.map((tx) => (
                            <Card key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        padding: '0.75rem',
                                        borderRadius: '50%',
                                        background: tx.type === 'income' ? 'rgba(18, 194, 233, 0.2)' : 'rgba(246, 79, 89, 0.2)',
                                        color: tx.type === 'income' ? 'var(--secondary)' : 'var(--accent)'
                                    }}>
                                        {tx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div>
                                        <h4 style={{ marginBottom: '0.2rem' }}>{tx.description}</h4>
                                        <p style={{ fontSize: '0.85rem' }}>{tx.category} • {new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h3 style={{
                                        color: tx.type === 'income' ? 'var(--secondary)' : 'var(--text-main)',
                                        fontWeight: 600
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
