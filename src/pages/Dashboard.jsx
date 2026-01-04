import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LogOut, Wallet, TrendingUp, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user, profile, signOut } = useAuth();
    const [balance, setBalance] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [savings, setSavings] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchFinancialData();
        }
    }, [user]);

    const fetchFinancialData = async () => {
        try {
            // Fetch all transactions for the user
            const { data, error } = await supabase
                .from('transactions')
                .select('amount, type, date')
                .eq('profile_id', user.id); // For MVP, only showing personal data

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
            // Savings logic can be added later, for now 0 or static
            setSavings(0);

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

                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Suas transações recentes aparecerão aqui.
                    </p>
                </div>
            </div>
        </div>
    );
}
