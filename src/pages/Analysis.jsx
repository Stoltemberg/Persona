import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

export default function Analysis({ isTab }) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Date State (Native JS)
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedType, setSelectedType] = useState(null);

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
            { name: 'Fixo', value: totals.fixed, color: '#0a84ff', key: 'fixed' },     // Apple Blue
            { name: 'Variável', value: totals.variable, color: '#ff9f0a', key: 'variable' }, // Apple Orange
            { name: 'Lazer', value: totals.lifestyle, color: '#bf5af2', key: 'lifestyle' }  // Apple Purple
        ].filter(d => d.value > 0);
    };

    // --- Trend Data (Last 6 Months) ---
    const processTrendData = () => {
        const trend = [];
        const today = new Date();

        // Generate last 6 months keys
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            trend.push({
                monthStr: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
                monthIndex: d.getMonth(),
                year: d.getFullYear(),
                income: 0,
                expense: 0
            });
        }

        transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            const match = trend.find(t => t.monthIndex === txDate.getMonth() && t.year === txDate.getFullYear());
            if (match) {
                if (tx.type === 'income') match.income += parseFloat(tx.amount);
                else match.expense += parseFloat(tx.amount);
            }
        });

        return trend;
    };

    const trendData = processTrendData();

    const chartData = processChartData();
    const totalExpenses = chartData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className={isTab ? "fade-in" : "container fade-in"} style={{ paddingBottom: '80px' }}>
            {!isTab && (
                <PageHeader
                    title={<span>Análise <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Mensal</span></span>}
                    subtitle="Resumo financeiro completo"
                />
            )}

            {/* Month Selector */}
            <div className="glass-pill-nav">
                <button
                    onClick={() => changeMonth(-1)}
                    className="btn-ghost"
                    style={{
                        padding: '0.6rem',
                        borderRadius: '50%',
                        transition: 'all 0.2s'
                    }}
                >
                    <ChevronLeft size={20} />
                </button>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    lineHeight: 1.2
                }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Mês de Referência</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.02em' }}>
                        {formatMonth(currentDate)}
                    </span>
                </div>

                <button
                    onClick={() => changeMonth(1)}
                    className="btn-ghost"
                    style={{
                        padding: '0.6rem',
                        borderRadius: '50%',
                        transition: 'all 0.2s'
                    }}
                >
                    <ChevronRight size={20} />
                </button>
            </div>


            {/* Summary Cards */}
            <div className="grid-responsive mb-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                <Card className="glass-card stagger-1 flex-align-center gap-15" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--color-success)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-muted text-small">Entradas</p>
                        <h2 style={{ color: 'var(--color-success)' }}>R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                    </div>
                </Card>

                <Card className="glass-card stagger-2 flex-align-center gap-15" style={{ padding: '1.5rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--color-danger)' }}>
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-muted text-small">Saídas</p>
                        <h2 style={{ color: 'var(--color-danger)' }}>R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                    </div>
                </Card>

                <Card className="glass-card stagger-3 flex-align-center gap-15" style={{ padding: '1.5rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-muted text-small">Saldo Mensal</p>
                        <h2 style={{ color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h2>
                    </div>
                </Card>
            </div>


            {/* Charts & Breakdown */}
            <div className="grid-responsive">

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
                                        onClick={(data) => setSelectedType(prev => prev === data.key ? null : data.key)}
                                        style={{ cursor: 'pointer', filter: 'drop-shadow(0px 0px 10px rgba(255,255,255,0.1))' }}
                                        animationBegin={0}
                                        animationDuration={1500}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                stroke={selectedType === entry.key ? '#fff' : 'none'}
                                                strokeWidth={2}
                                                style={{ opacity: selectedType && selectedType !== entry.key ? 0.3 : 1, transition: 'all 0.3s', cursor: 'pointer' }}
                                            />
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
                <div className="flex-column gap-1">
                    {chartData.map((item, index) => (
                        <Card key={item.name} className={`glass-card fade-in stagger-${index + 1} flex-between`}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color }} />
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

            {/* Detailed Transaction List for Selected Type */}
            {selectedType && (
                <div className="fade-in mt-2" style={{ animationDuration: '0.4s' }}>
                    <div className="flex-between mb-1">
                        <h3>Detalhes: {selectedType === 'fixed' ? 'Gastos Fixos' : selectedType === 'variable' ? 'Gastos Variáveis' : 'Lazer'}</h3>
                        <button onClick={() => setSelectedType(null)} className="btn-ghost text-small">Fechar X</button>
                    </div>

                    <div className="grid-responsive gap-1" style={{ gridTemplateColumns: '1fr' }}>
                        {monthlyData
                            .filter(t => t.type === 'expense' && (t.expense_type === selectedType || (!t.expense_type && selectedType === 'variable')))
                            .sort((a, b) => b.amount - a.amount)
                            .map((tx, i) => (
                                <Card key={tx.id} className="glass-card flex-between" style={{ padding: '1rem' }}>
                                    <div>
                                        <div className="text-bold">{tx.description}</div>
                                        <div className="text-muted text-small">{tx.category} • {new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                                    </div>
                                    <div className="text-bold" style={{ color: '#f64f59' }}>
                                        - R$ {parseFloat(tx.amount).toFixed(2).replace('.', ',')}
                                    </div>
                                </Card>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
