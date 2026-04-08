import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { PartnerFilter } from '../components/PartnerFilter';

export default function Analysis({ isTab }) {
    const { user, profile } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState(searchParams.get('scope') || 'all');
    const [selectedType, setSelectedType] = useState(null);

    const initialMonth = searchParams.get('month');
    const [currentDate, setCurrentDate] = useState(() => {
        if (!initialMonth) return new Date();
        const [year, month] = initialMonth.split('-').map(Number);
        if (!year || !month) return new Date();
        return new Date(year, month - 1, 1);
    });

    useEffect(() => {
        if (user) fetchTransactions();
    }, [user]);

    useEffect(() => {
        const nextParams = new URLSearchParams();
        if (tabParam) nextParams.set('tab', tabParam);
        nextParams.set('month', `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`);
        if (activeFilter !== 'all') nextParams.set('scope', activeFilter);
        setSearchParams(nextParams, { replace: true });
    }, [activeFilter, currentDate, setSearchParams, tabParam]);

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase.from('transactions').select('*');
            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatMonth = (date) => date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const changeMonth = (offset) => {
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + offset);
        setCurrentDate(nextDate);
    };

    const monthlyTransactions = useMemo(() => (
        transactions.filter((transaction) => {
            if (activeFilter === 'me' && transaction.profile_id !== user.id) return false;
            if (activeFilter === 'partner' && transaction.profile_id !== profile?.partner_id) return false;

            const transactionDate = new Date(transaction.date);
            return transactionDate.getMonth() === currentDate.getMonth()
                && transactionDate.getFullYear() === currentDate.getFullYear();
        })
    ), [transactions, activeFilter, user?.id, profile?.partner_id, currentDate]);

    const stats = monthlyTransactions.reduce((accumulator, transaction) => {
        const value = parseFloat(transaction.amount);
        if (transaction.type === 'income') accumulator.income += value;
        else accumulator.expense += value;
        return accumulator;
    }, { income: 0, expense: 0 });

    const balance = stats.income - stats.expense;

    const chartData = useMemo(() => {
        const totals = { fixed: 0, variable: 0, lifestyle: 0 };

        monthlyTransactions
            .filter((transaction) => transaction.type === 'expense')
            .forEach((transaction) => {
                const value = parseFloat(transaction.amount);
                if (transaction.expense_type === 'fixed') totals.fixed += value;
                else if (transaction.expense_type === 'lifestyle') totals.lifestyle += value;
                else totals.variable += value;
            });

        return [
            { name: 'Fixo', value: totals.fixed, color: '#5A445D', key: 'fixed' },
            { name: 'Variavel', value: totals.variable, color: '#D4AF37', key: 'variable' },
            { name: 'Lazer', value: totals.lifestyle, color: '#3E5A74', key: 'lifestyle' },
        ].filter((item) => item.value > 0);
    }, [monthlyTransactions]);

    const trendData = useMemo(() => {
        const trend = [];
        const today = new Date();

        for (let index = 5; index >= 0; index -= 1) {
            const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
            trend.push({
                monthStr: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
                monthIndex: date.getMonth(),
                year: date.getFullYear(),
                income: 0,
                expense: 0,
            });
        }

        transactions.forEach((transaction) => {
            if (activeFilter === 'me' && transaction.profile_id !== user.id) return;
            if (activeFilter === 'partner' && transaction.profile_id !== profile?.partner_id) return;

            const transactionDate = new Date(transaction.date);
            const match = trend.find((item) => item.monthIndex === transactionDate.getMonth() && item.year === transactionDate.getFullYear());
            if (!match) return;

            if (transaction.type === 'income') match.income += parseFloat(transaction.amount);
            else match.expense += parseFloat(transaction.amount);
        });

        return trend;
    }, [transactions, activeFilter, user?.id, profile?.partner_id]);

    const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className={isTab ? 'fade-in app-page-shell' : 'container fade-in app-page-shell'} style={{ paddingBottom: '80px' }}>
            {!isTab && (
                <PageHeader
                    title={<span>Analise <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Mensal</span></span>}
                    subtitle="Resumo claro do comportamento financeiro e do resultado do mes."
                />
            )}

            <PartnerFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            <div className="glass-card planning-month-switcher">
                <button type="button" className="btn-ghost btn-icon" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
                    <ChevronLeft size={18} />
                </button>
                <div className="planning-month-copy">
                    <span>Mes de referencia</span>
                    <strong>{formatMonth(currentDate)}</strong>
                </div>
                <button type="button" className="btn-ghost btn-icon" onClick={() => changeMonth(1)} aria-label="Proximo mes">
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="app-summary-grid">
                <Card hover={false} className="app-summary-card app-summary-card-success">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-success">
                            <TrendingUp size={18} />
                        </div>
                        <span className="app-summary-label">Entradas</span>
                    </div>
                    <strong className="app-summary-value">R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </Card>
                <Card hover={false} className="app-summary-card app-summary-card-danger">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-danger">
                            <TrendingDown size={18} />
                        </div>
                        <span className="app-summary-label">Saidas</span>
                    </div>
                    <strong className="app-summary-value">R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </Card>
                <Card hover={false} className="app-summary-card app-summary-card-neutral">
                    <div className="app-summary-topline">
                        <div className="app-summary-icon app-summary-icon-neutral">
                            <Wallet size={18} />
                        </div>
                        <span className="app-summary-label">Saldo mensal</span>
                    </div>
                    <strong className="app-summary-value">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </Card>
            </div>

            <div className="app-two-column-grid">
                <Card className="glass-card app-section-card" style={{ minHeight: '400px' }}>
                    <div className="app-section-header">
                        <div>
                            <h3>Distribuicao de gastos</h3>
                            <p>Toque em um segmento para abrir o detalhamento daquele tipo.</p>
                        </div>
                    </div>

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
                                        onClick={(data) => setSelectedType((prev) => (prev === data.key ? null : data.key))}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {chartData.map((entry) => (
                                            <Cell
                                                key={entry.key}
                                                fill={entry.color}
                                                stroke={selectedType === entry.key ? '#fff' : 'none'}
                                                strokeWidth={2}
                                                style={{ opacity: selectedType && selectedType !== entry.key ? 0.3 : 1, transition: 'all 0.3s' }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                                        itemStyle={{ color: 'var(--text-main)' }}
                                        formatter={(value) => `R$ ${value.toFixed(2)}`}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="analysis-chart-center">
                                <span>Despesas</span>
                                <strong>R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</strong>
                            </div>
                        </div>
                    ) : (
                        <div className="app-empty-inline">Sem despesas registradas neste mes.</div>
                    )}
                </Card>

                <Card className="glass-card app-section-card" style={{ minHeight: '400px' }}>
                    <div className="app-section-header">
                        <div>
                            <h3>Tendencia dos ultimos 6 meses</h3>
                            <p>Compare entradas e saidas para entender o ritmo recente.</p>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="analysisIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#30d158" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#30d158" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="analysisExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="monthStr" stroke="var(--text-muted)" />
                                <YAxis stroke="var(--text-muted)" />
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                                />
                                <Area type="monotone" dataKey="income" stroke="#30d158" fillOpacity={1} fill="url(#analysisIncome)" strokeWidth={2.5} />
                                <Area type="monotone" dataKey="expense" stroke="#ff6b6b" fillOpacity={1} fill="url(#analysisExpense)" strokeWidth={2.5} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {selectedType && (
                <Card className="glass-card app-section-card">
                    <div className="app-section-header">
                        <div>
                            <h3>Detalhes</h3>
                            <p>{selectedType === 'fixed' ? 'Gastos fixos' : selectedType === 'variable' ? 'Gastos variaveis' : 'Lazer'}</p>
                        </div>
                        <button type="button" className="btn-ghost" onClick={() => setSelectedType(null)}>
                            Fechar
                        </button>
                    </div>

                    <div className="app-stack-list">
                        {monthlyTransactions
                            .filter((transaction) => transaction.type === 'expense' && (transaction.expense_type === selectedType || (!transaction.expense_type && selectedType === 'variable')))
                            .sort((a, b) => b.amount - a.amount)
                            .map((transaction) => (
                                <Card key={transaction.id} hover={false} className="app-list-card">
                                    <div className="app-list-card-main">
                                        <div>
                                            <strong>{transaction.description}</strong>
                                            <span>{transaction.category} · {new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <strong style={{ color: '#f64f59' }}>
                                        - R$ {parseFloat(transaction.amount).toFixed(2).replace('.', ',')}
                                    </strong>
                                </Card>
                            ))}
                    </div>
                </Card>
            )}

            {loading && <div className="app-empty-inline">Carregando analise...</div>}
        </div>
    );
}
