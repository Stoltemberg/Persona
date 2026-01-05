import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Analysis() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchTransactions();
    }, [user]);

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('type', 'expense'); // Only analyze expenses

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Process data for charts
    const processData = () => {
        const totals = {
            fixed: 0,
            variable: 0,
            lifestyle: 0
        };

        transactions.forEach(tx => {
            if (tx.expense_type === 'fixed') totals.fixed += parseFloat(tx.amount);
            else if (tx.expense_type === 'variable') totals.variable += parseFloat(tx.amount);
            else if (tx.expense_type === 'lifestyle') totals.lifestyle += parseFloat(tx.amount);
        });

        return [
            { name: 'Gasto Fixo', value: totals.fixed, color: '#f64f59' }, // Red-ish
            { name: 'Variável', value: totals.variable, color: '#12c2e9' }, // Blue-ish
            { name: 'Lazer', value: totals.lifestyle, color: '#c471ed' }   // Purple-ish
        ].filter(d => d.value > 0);
    };

    const chartData = processData();
    const totalExpenses = chartData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="container fade-in">
            <header style={{ marginBottom: '3rem' }}>
                <h1 className="text-gradient">Análise de Gastos</h1>
                <p>Entenda para onde seu dinheiro está indo</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Chart Area */}
                <Card className="glass-card fade-in stagger-1" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>Distribuição</h3>

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
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total</span>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            Sem dados suficientes
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
                </div>
            </div>
        </div>
    );
}
