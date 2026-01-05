import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function Analysis() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Date State (Native JS)
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (user) fetchTransactions();
    }, [user]);

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*');
            // Fetch all (income + expense) for balance calc

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Date Helpers ---
    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const formatMonth = (date) => {
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    };

    // --- Filtering & Stats ---
    const getMonthlyTransactions = () => {
        return transactions.filter(tx => {
            const txDate = new Date(tx.date); // Assumes YYYY-MM-DD or ISO
            // Adjust for timezone differences if necessary, but simple comparison usually works for local apps
            // Better: compare Month and Year indices
            return txDate.getMonth() === currentDate.getMonth() &&
                txDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const monthlyData = getMonthlyTransactions();

    const stats = monthlyData.reduce((acc, tx) => {
        const val = parseFloat(tx.amount);
        if (tx.type === 'income') {
            acc.income += val;
        } else {
            acc.expense += val;
        }
        return acc;
    }, { income: 0, expense: 0 });

    const balance = stats.income - stats.expense;

    // --- Chart Data (Expenses Only) ---
    const processChartData = () => {
        const totals = { fixed: 0, variable: 0, lifestyle: 0 };

        monthlyData.filter(t => t.type === 'expense').forEach(tx => {
            const val = parseFloat(tx.amount);
            if (tx.expense_type === 'fixed') totals.fixed += val;
            else if (tx.expense_type === 'variable') totals.variable += val;
            else if (tx.expense_type === 'lifestyle') totals.lifestyle += val;
            // Fallback if null? usually variable
            else totals.variable += val;
        });

        return [
            { name: 'Fixo', value: totals.fixed, color: '#f64f59' },
            { name: 'Variável', value: totals.variable, color: '#12c2e9' },
            { name: 'Lazer', value: totals.lifestyle, color: '#c471ed' }
        ].filter(d => d.value > 0);
    };

    const chartData = processChartData();
    const totalExpenses = chartData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="container fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-gradient">Análise Mensal</h1>
                    <p>Resumo financeiro completo</p>
                </div>

                {/* Month Selector */}
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '12px', gap: '1rem', margin: '0 0' /* Changed from 0 auto if needed or let flex handle it */, flex: 1, maxWidth: '400px' }}>
                    <button
                        onClick={() => changeMonth(-1)}
                        className="btn-ghost"
                        style={{ padding: '0.5rem' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', textTransform: 'capitalize', minWidth: '140px', textAlign: 'center' }}>
                        {formatMonth(currentDate)}
                    </div>
                    <button
                        onClick={() => changeMonth(1)}
                        className="btn-ghost"
                        style={{ padding: '0.5rem' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <Card className="glass-card stagger-1" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(18, 194, 233, 0.15)', borderRadius: '50%', color: '#12c2e9' }}>
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Entradas</p>
                        <h2 style={{ color: '#12c2e9' }}>R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                    </div>
                </Card>

                <Card className="glass-card stagger-2" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(246, 79, 89, 0.15)', borderRadius: '50%', color: '#f64f59' }}>
                        <TrendingDown size={28} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Saídas</p>
                        <h2 style={{ color: '#f64f59' }}>R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                    </div>
                </Card>

                <Card className="glass-card stagger-3" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(196, 113, 237, 0.15)', borderRadius: '50%', color: '#c471ed' }}>
                        <Wallet size={28} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Saldo Mensal</p>
                        <h2 style={{ color: balance >= 0 ? '#00ebc7' : '#f64f59' }}>
                            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h2>
                    </div>
                </Card>
            </div>

            {/* Charts & Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Chart Area */}
                <Card className="glass-card fade-in stagger-1" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>Distribuição de Gastos</h3>

                    {chartData.length > 0 ? (
                        <div style={{ width: '100%', height: '300px', position: 'relative' }}>
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
                                        contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: 'white' }}
                                        formatter={(value) => `R$ ${value.toFixed(2)}`}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -60%)',
                                textAlign: 'center'
                            }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Despesas</span>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                                <Wallet size={32} opacity={0.5} />
                            </div>
                            <p>Sem despesas neste mês</p>
                        </div>
                    )}
                </Card>

                {/* Breakdown List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {chartData.map((item, index) => (
                        <Card key={item.name} className={`glass-card fade-in stagger-${index + 1}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                                <div>
                                    <h4 style={{ fontSize: '1.1rem' }}>{item.name}</h4>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {((item.value / totalExpenses) * 100).toFixed(1)}% do total
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>
                                R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </Card>
                    ))}

                    {chartData.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p>Nenhum dado para categorizar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
