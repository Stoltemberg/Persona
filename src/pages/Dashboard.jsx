import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { usePrivacy } from '../context/PrivacyContext';
import { CountUp } from '../components/CountUp';
import { Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

export default function Dashboard() {
    const { user, profile } = useAuth();
    const { isPrivacyMode } = usePrivacy();

    // State
    const [balance, setBalance] = useState(0);
    const [expenses, setExpenses] = useState(0); // Monthly expenses
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchData();
            window.addEventListener('transaction-updated', fetchData);
            return () => window.removeEventListener('transaction-updated', fetchData);
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('profile_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;

            let totalIncome = 0;
            let totalExpense = 0;
            let monthExpense = 0;
            const currentMonth = new Date().getMonth();

            data.forEach(tx => {
                const amount = parseFloat(tx.amount);
                const date = new Date(tx.date);

                if (tx.type === 'income') {
                    totalIncome += amount;
                } else {
                    totalExpense += amount;
                    if (date.getMonth() === currentMonth) {
                        monthExpense += amount;
                    }
                }
            });

            setBalance(totalIncome - totalExpense);
            setExpenses(monthExpense);
            setTransactions(data.slice(0, 10)); // Show last 10
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container fade-in">
            {/* Minimalist Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
                marginBottom: '4rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-secondary)',
                        fontWeight: '500'
                    }}>
                        Olá, {profile?.full_name?.split(' ')[0] || 'Gabriel'}
                    </h1>
                </div>

                {/* Minimal Add Button */}
                <Link to="/transactions" className="btn-icon-add" aria-label="Nova Transação">
                    <Plus size={20} />
                </Link>
            </header>

            {/* Huge Balance Section */}
            <section style={{ textAlign: 'center', marginBottom: '5rem' }}>
                <h2 style={{
                    fontSize: '4.5rem',
                    fontWeight: '700',
                    letterSpacing: '-3px',
                    lineHeight: '1',
                    marginBottom: '0.5rem',
                    color: 'var(--text-primary)'
                }}>
                    {loading ? <Skeleton width="200px" height="80px" /> : (
                        isPrivacyMode ? '****' : <CountUp end={balance} prefix="R$ " />
                    )}
                </h2>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Saldo disponível</p>

                {/* Subtle Trend Indicator */}
                {!loading && (
                    <div style={{
                        marginTop: '1.5rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '20px'
                    }}>
                        <TrendingDown size={16} className="text-red" />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                            Saídas: R$ {expenses.toFixed(2)}
                        </span>
                    </div>
                )}
            </section>

            {/* Apple Style List */}
            <section>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    padding: '0 0.5rem'
                }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Destaques</h3>
                </div>

                <div className="list-group">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="list-item">
                                <Skeleton width="100%" height="50px" />
                            </div>
                        ))
                    ) : transactions.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem' }}>Nada por aqui.</p>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="list-item">
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {/* Icon Indicator (Dot) */}
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: tx.type === 'income' ? 'var(--color-green)' : 'var(--text-primary)'
                                    }} />

                                    <div>
                                        <h4 style={{ fontSize: '1rem', margin: 0, fontWeight: '500' }}>{tx.description}</h4>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: tx.type === 'income' ? 'var(--color-green)' : 'var(--text-primary)'
                                    }}>
                                        {tx.type === 'income' ? '+' : '-'} R$ {parseFloat(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
