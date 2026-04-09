import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../components/Card';

export function AnalysisCharts({ chartData, selectedType, onSelectType, totalExpenses, trendData }) {
    return (
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
                                    onClick={(data) => onSelectType((prev) => (prev === data.key ? null : data.key))}
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
    );
}
