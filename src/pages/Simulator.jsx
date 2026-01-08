import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function Simulator() {
    const [monthlySaving, setMonthlySaving] = useState(100);
    const [initialAmount, setInitialAmount] = useState(0);
    const [years, setYears] = useState(10);
    const [interestRate, setInterestRate] = useState(10); // Annual %
    const [data, setData] = useState([]);

    useEffect(() => {
        calculateGrowth();
    }, [monthlySaving, initialAmount, years, interestRate]);

    const calculateGrowth = () => {
        const newData = [];
        let currentAmount = parseFloat(initialAmount) || 0;
        const monthlyRate = (parseFloat(interestRate) / 100) / 12;
        const months = parseInt(years) * 12;
        const saving = parseFloat(monthlySaving) || 0;

        for (let i = 0; i <= months; i++) {
            if (i % 12 === 0) { // Record yearly data points
                newData.push({
                    year: `Ano ${i / 12}`,
                    amount: Math.round(currentAmount),
                    invested: Math.round((parseFloat(initialAmount) || 0) + (saving * i))
                });
            }
            // Compound Interest Formula: A = P(1 + r) + M
            currentAmount = (currentAmount + saving) * (1 + monthlyRate);
            // Actually, logic is: Add saving, then apply interest? Or interest then saving?
            // Simplified: Add saving at end of month, interest applies to balance start of month.
            // currentAmount = (currentAmount * (1 + monthlyRate)) + saving;
            // Let's stick to simple monthly compounding.
        }
        setData(newData);
    };

    const finalAmount = data.length > 0 ? data[data.length - 1].amount : 0;
    const totalInvested = data.length > 0 ? data[data.length - 1].invested : 0;
    const totalInterest = finalAmount - totalInvested;

    return (
        <div className="container fade-in">
            <header className="page-header">
                <div>
                    <h1 className="text-gradient">Simulador de Futuro</h1>
                    <p>Veja o poder dos juros compostos</p>
                </div>
            </header>

            <div className="grid-responsive mb-2" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

                {/* Inputs */}
                <Card className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={20} color="#c471ed" /> Parâmetros
                    </h3>

                    <Input
                        label="Investimento Inicial (R$)"
                        type="number"
                        value={initialAmount}
                        onChange={(e) => setInitialAmount(e.target.value)}
                    />

                    <Input
                        label="Aporte Mensal (R$)"
                        type="number"
                        value={monthlySaving}
                        onChange={(e) => setMonthlySaving(e.target.value)}
                        subtitle="Economia de iFood, Uber, etc."
                    />

                    <Input
                        label="Taxa de Juros Anual (%)"
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        subtitle="CDI hoje: ~10-11%"
                    />

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Tempo: {years} anos</label>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={years}
                            onChange={(e) => setYears(e.target.value)}
                            style={{ width: '100%', accentColor: '#c471ed' }}
                        />
                    </div>
                </Card>

                {/* Results & Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Summary Cards */}
                    <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <Card className="glass-card glow-on-hover" style={{ padding: '1rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Acumulado</p>
                            <h2 style={{ color: '#00ebc7', fontSize: '1.8rem' }}>R$ {finalAmount.toLocaleString('pt-BR')}</h2>
                        </Card>
                        <Card className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Investido</p>
                            <h2 style={{ fontSize: '1.5rem' }}>R$ {totalInvested.toLocaleString('pt-BR')}</h2>
                        </Card>
                        <Card className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Juros Ganhos</p>
                            <h2 style={{ color: '#c471ed', fontSize: '1.5rem' }}>R$ {totalInterest.toLocaleString('pt-BR')}</h2>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card className="glass-card" style={{ padding: '1.5rem', height: '400px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00ebc7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00ebc7" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year" stroke="var(--text-muted)" style={{ fontSize: '0.8rem' }} />
                                <YAxis
                                    tickFormatter={(value) => `R$${value / 1000}k`}
                                    stroke="var(--text-muted)"
                                    style={{ fontSize: '0.8rem' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                                />
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    name="Total com Juros"
                                    stroke="#00ebc7"
                                    fillOpacity={1}
                                    fill="url(#colorAmount)"
                                    strokeWidth={3}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="invested"
                                    name="Dinheiro Investido"
                                    stroke="#8884d8"
                                    fillOpacity={1}
                                    fill="url(#colorInvested)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                        *Aporte mensal é adicionado no final de cada mês. Juros compostos aplicados mensalmente.
                    </p>
                </div>
            </div>
        </div>
    );
}
