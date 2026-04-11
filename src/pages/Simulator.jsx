import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';

function SimulatorBackdrop() {
    const reducedMotion = useReducedMotion();

    return (
        <div
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(circle at 18% 14%, rgba(212, 175, 55, 0.11), transparent 24%), radial-gradient(circle at 82% 18%, rgba(0, 235, 199, 0.09), transparent 20%), radial-gradient(circle at 50% 88%, rgba(92, 132, 255, 0.08), transparent 26%)',
                }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    left: '-8%',
                    top: '8%',
                    width: '28vw',
                    height: '28vw',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.16) 0%, rgba(212, 175, 55, 0.02) 64%, transparent 72%)',
                    filter: 'blur(16px)',
                }}
                animate={reducedMotion ? {} : { x: [0, 26, 0], y: [0, -14, 0], scale: [1, 1.05, 1] }}
                transition={reducedMotion ? {} : { duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    right: '-10%',
                    bottom: '4%',
                    width: '30vw',
                    height: '30vw',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0, 235, 199, 0.12) 0%, rgba(0, 235, 199, 0.02) 64%, transparent 72%)',
                    filter: 'blur(18px)',
                }}
                animate={reducedMotion ? {} : { x: [0, -18, 0], y: [0, 18, 0], scale: [1, 1.04, 1] }}
                transition={reducedMotion ? {} : { duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
        </div>
    );
}

export default function Simulator({ isTab }) {
    const [monthlySaving, setMonthlySaving] = useState(100);
    const [initialAmount, setInitialAmount] = useState(0);
    const [years, setYears] = useState(10);
    const [interestRate, setInterestRate] = useState(10);
    const [data, setData] = useState([]);

    useEffect(() => {
        calculateGrowth();
    }, [monthlySaving, initialAmount, years, interestRate]);

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

    const finalAmount = data.length > 0 ? data[data.length - 1].amount : 0;
    const totalInvested = data.length > 0 ? data[data.length - 1].invested : 0;
    const totalInterest = finalAmount - totalInvested;

    return (
        <div
            className={isTab ? 'fade-in app-page-shell' : 'container fade-in app-page-shell'}
            style={{ paddingBottom: '96px', position: 'relative', isolation: 'isolate' }}
        >
            <SimulatorBackdrop />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {!isTab && (
                    <PageHeader
                        title={<span>Simulador de <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Futuro</span></span>}
                        subtitle="Projete um cenário com uma leitura mais editorial e menos carregada de chrome."
                    />
                )}

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.05fr) minmax(280px, 0.95fr)',
                        gap: '1rem',
                        padding: '1.35rem',
                        borderRadius: '28px',
                        border: '1px solid var(--glass-border)',
                        background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                        backdropFilter: 'blur(18px)',
                        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.16)',
                        marginBottom: '1rem',
                    }}
                >
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <span className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.72rem' }}>
                            Cenário guiado
                        </span>
                        <strong style={{ fontSize: 'clamp(1.55rem, 2.2vw, 2.2rem)', lineHeight: 1.05 }}>
                            Uma projeção mais calma para decidir com tempo.
                        </strong>
                        <p className="text-muted" style={{ margin: 0, maxWidth: '58ch', lineHeight: 1.65 }}>
                            Ajuste o aporte e a taxa para enxergar como o capital evolui sem perder de vista o que foi realmente investido.
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gap: '0.85rem',
                            padding: '1rem',
                            borderRadius: '22px',
                            background: 'rgba(0,0,0,0.14)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            alignContent: 'start',
                        }}
                    >
                        <span className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.7rem' }}>
                            Resultado estimado
                        </span>
                        <strong style={{ fontSize: 'clamp(1.7rem, 3vw, 2.35rem)', lineHeight: 1.05 }}>
                            R$ {finalAmount.toLocaleString('pt-BR')}
                        </strong>
                        <div className="app-summary-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                            <Card hover={false} className="app-summary-card app-summary-card-success" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <span className="app-summary-label">Juros</span>
                                <strong className="app-summary-value">{totalInterest.toLocaleString('pt-BR')}</strong>
                            </Card>
                            <Card hover={false} className="app-summary-card app-summary-card-neutral" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <span className="app-summary-label">Aportado</span>
                                <strong className="app-summary-value">{totalInvested.toLocaleString('pt-BR')}</strong>
                            </Card>
                            <Card hover={false} className="app-summary-card app-summary-card-neutral" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <span className="app-summary-label">Horizonte</span>
                                <strong className="app-summary-value">{years} anos</strong>
                            </Card>
                        </div>
                    </div>
                </motion.section>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(320px, 0.92fr) minmax(0, 1.08fr)',
                        gap: '1rem',
                        alignItems: 'start',
                    }}
                >
                    <Card
                        className="glass-card app-section-card"
                        style={{
                            padding: '1.35rem',
                            borderRadius: '28px',
                            background: 'rgba(255,255,255,0.04)',
                            position: 'sticky',
                            top: '92px',
                        }}
                    >
                        <div className="app-section-header">
                            <div>
                                <h3>Parametros</h3>
                                <p>Ajuste os valores para testar cenarios sem poluir a tela.</p>
                            </div>
                            <div className="app-summary-icon app-summary-icon-neutral">
                                <DollarSign size={18} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
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
                        </div>
                    </Card>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div className="app-summary-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                            <Card hover={false} className="app-summary-card app-summary-card-success" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <div className="app-summary-topline">
                                    <div className="app-summary-icon app-summary-icon-success">
                                        <TrendingUp size={18} />
                                    </div>
                                    <span className="app-summary-label">Total acumulado</span>
                                </div>
                                <strong className="app-summary-value">R$ {finalAmount.toLocaleString('pt-BR')}</strong>
                            </Card>
                            <Card hover={false} className="app-summary-card app-summary-card-neutral" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <div className="app-summary-topline">
                                    <div className="app-summary-icon app-summary-icon-neutral">
                                        <DollarSign size={18} />
                                    </div>
                                    <span className="app-summary-label">Total investido</span>
                                </div>
                                <strong className="app-summary-value">R$ {totalInvested.toLocaleString('pt-BR')}</strong>
                            </Card>
                            <Card hover={false} className="app-summary-card app-summary-card-neutral" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <div className="app-summary-topline">
                                    <div className="app-summary-icon app-summary-icon-neutral">
                                        <Calendar size={18} />
                                    </div>
                                    <span className="app-summary-label">Juros gerados</span>
                                </div>
                                <strong className="app-summary-value">R$ {totalInterest.toLocaleString('pt-BR')}</strong>
                            </Card>
                        </div>

                        <Card
                            className="glass-card app-section-card"
                            style={{
                                minHeight: '420px',
                                padding: '1.35rem',
                                borderRadius: '28px',
                                background: 'rgba(255,255,255,0.04)',
                            }}
                        >
                            <div className="app-section-header">
                                <div>
                                    <h3>Evolucao projetada</h3>
                                    <p>Veja a distancia entre o capital aportado e o crescimento acumulado.</p>
                                </div>
                            </div>

                            <div style={{ width: '100%', height: '330px' }}>
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
        </div>
    );
}
