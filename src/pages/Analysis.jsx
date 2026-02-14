import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

export default function Analysis() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (user) fetchTransactions();
    }, [user, currentDate]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', start)
                .lte('date', end);

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const stats = transactions.reduce((acc, tx) => {
        const val = parseFloat(tx.amount);
        if (tx.type === 'income') acc.income += val;
        else acc.expense += val;
        return acc;
    }, { income: 0, expense: 0 });

    const chartData = [
        { name: 'Fixo', value: transactions.filter(t => t.type === 'expense' && t.expense_type === 'fixed').reduce((a, b) => a + parseFloat(b.amount), 0), color: '#FF3B30' },
        { name: 'Variável', value: transactions.filter(t => t.type === 'expense' && (t.expense_type === 'variable' || !t.expense_type)).reduce((a, b) => a + parseFloat(b.amount), 0), color: '#007AFF' },
        { name: 'Lazer', value: transactions.filter(t => t.type === 'expense' && t.expense_type === 'lifestyle').reduce((a, b) => a + parseFloat(b.amount), 0), color: '#34C759' }
    ].filter(d => d.value > 0);

    return (
        <div className="container fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Análise</h1>
            </header>

            {/* Month Selector - iOS Segmented Control Style */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '0.5rem',
                marginBottom: '2rem'
            }}>
                <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: 'var(--color-blue)' }}>
                    <ChevronLeft size={24} />
                </button>
                <span style={{ fontWeight: '600', fontSize: '1.1rem', textTransform: 'capitalize' }}>
                    {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: 'var(--color-blue)' }}>
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Simple Summary Text */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '3rem', textAlign: 'center' }}>
                <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Entradas</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-green)' }}>
                        {loading ? <Skeleton width="80px" height="24px" /> : `R$ ${stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Saídas</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-red)' }}>
                        {loading ? <Skeleton width="80px" height="24px" /> : `R$ ${stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </p>
                </div>
            </div>

            {/* Chart Section - Clean */}
            <div style={{ height: '300px', width: '100%', marginBottom: '2rem' }}>
                {loading ? <Skeleton width="100%" height="100%" /> : chartData.length > 0 ? (
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => `R$ ${value.toFixed(2)}`}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <p>Sem dados de despesas.</p>
                    </div>
                )}
            </div>

            {/* Breakdown List */}
            <div className="list-group">
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', marginLeft: '0.5rem' }}>Detalhamento</h3>
                {loading ? <Skeleton width="100%" height="50px" count={3} /> : chartData.map((item, index) => (
                    <div key={index} className="list-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }} />
                            <span style={{ fontWeight: '500' }}>{item.name}</span>
                        </div>
                        <span style={{ fontWeight: '600' }}>R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
