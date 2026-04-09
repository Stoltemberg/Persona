import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';

export default function Simulator({ isTab }) {
    const [monthlySaving, setMonthlySaving] = useState(100);
    const [initialAmount, setInitialAmount] = useState(0);
    const [years, setYears] = useState(10);
    const [interestRate, setInterestRate] = useState(10);
    const [data, setData] = useState([]);

    const calculateGrowth = () => {
        const nextData = [];
        let currentAmount = parseFloat(initialAmount) || 0;
        const monthlyRate = (parseFloat(interestRate) / 100) / 12;
        const months = parseInt(years, 10) * 12;
        const saving = parseFloat(monthlySaving) || 0;

        for (let month = 0; month <= months; month += 1) {
            if (month % 12 === 0) {
                nextData.push({
                    year: `Ano ${month / 12}`,
                    amount: Math.round(currentAmount),
                    invested: Math.round((parseFloat(initialAmount) || 0) + (saving * month)),
                });
            }

            currentAmount = (currentAmount + saving) * (1 + monthlyRate);
        }

        setData(nextData);
    };

    useEffect(() => {
        calculateGrowth();
    }, [monthlySaving, initialAmount, years, interestRate]);

    const finalAmount = data.length > 0 ? data[data.length - 1].amount : 0;
    const totalInvested = data.length > 0 ? data[data.length - 1].invested : 0;
    const totalInterest = finalAmount - totalInvested;

    return (
        <div className={isTab ? 'fade-in app-page-shell' : 'container fade-in app-page-shell'} style={{ paddingBottom: '80px' }}>
            {!isTab && (
                <PageHeader
                    title={<span>Simulador de <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Futuro</span></span>}
                    subtitle="Visualize o efeito da consistencia e dos juros compostos ao longo do tempo."
                />
            )}

            <div className="app-two-column-grid">
                <section className="glass-card app-section-card">
                    <div className="app-section-header">
                        <div>
                            <h3>Parametros</h3>
                            <p>Ajuste os valores para testar cenarios sem poluir a tela.</p>
                        </div>
                        <div className="app-summary-icon app-summary-icon-neutral">
                            <DollarSign size={18} />
                        </div>
                    </div>

                    <Input
                        label="Investimento inicial (R$)"
                        type="number"
                        value={initialAmount}
                        onChange={(event) => setInitialAmount(event.target.value)}
                    />

                    <Input
                        label="Aporte mensal (R$)"
                        type="number"
                        value={monthlySaving}
                        onChange={(event) => setMonthlySaving(event.target.value)}
                        subtitle="Valor que voce consegue manter com regularidade."
                    />

                    <Input
                        label="Taxa anual (%)"
                        type="number"
                        value={interestRate}
                        onChange={(event) => setInterestRate(event.target.value)}
                        subtitle="Use uma taxa realista para o produto que voce imagina."
                    />

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Tempo: {years} anos</label>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={years}
                            onChange={(event) => setYears(event.target.value)}
                            style={{ width: '100%', accentColor: 'var(--color-brand)' }}
                        />
                    </div>
                </section>

                <div className="app-page-shell">
                    <div className="app-summary-grid">
                        <Card hover={false} className="app-summary-card app-summary-card-success">
                            <div className="app-summary-topline">
                                <div className="app-summary-icon app-summary-icon-success">
                                    <TrendingUp size={18} />
                                </div>
                                <span className="app-summary-label">Total acumulado</span>
                            </div>
                            <strong className="app-summary-value">R$ {finalAmount.toLocaleString('pt-BR')}</strong>
                        </Card>
                        <Card hover={false} className="app-summary-card app-summary-card-neutral">
                            <div className="app-summary-topline">
                                <div className="app-summary-icon app-summary-icon-neutral">
                                    <DollarSign size={18} />
                                </div>
                                <span className="app-summary-label">Total investido</span>
                            </div>
                            <strong className="app-summary-value">R$ {totalInvested.toLocaleString('pt-BR')}</strong>
                        </Card>
                        <Card hover={false} className="app-summary-card app-summary-card-neutral">
                            <div className="app-summary-topline">
                                <div className="app-summary-icon app-summary-icon-neutral">
                                    <Calendar size={18} />
                                </div>
                                <span className="app-summary-label">Juros gerados</span>
                            </div>
                            <strong className="app-summary-value">R$ {totalInterest.toLocaleString('pt-BR')}</strong>
                        </Card>
                    </div>

                    <Card className="glass-card app-section-card" style={{ minHeight: '420px' }}>
                        <div className="app-section-header">
                            <div>
                                <h3>Evolucao projetada</h3>
                                <p>Veja a distancia entre o capital aportado e o crescimento acumulado.</p>
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '320px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00ebc7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00ebc7" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.25} />
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
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <Area type="monotone" dataKey="amount" name="Total com juros" stroke="#00ebc7" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="invested" name="Total aportado" stroke="#8884d8" fillOpacity={1} fill="url(#colorInvested)" strokeWidth={2} strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
