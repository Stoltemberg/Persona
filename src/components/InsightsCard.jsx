import { Card } from './Card';
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

export function InsightsCard({ transactions }) {
    if (!transactions || transactions.length === 0) return null;

    const getInsight = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const thisMonthTx = transactions.filter(tx => {
            const d = new Date(tx.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const lastMonthTx = transactions.filter(tx => {
            const d = new Date(tx.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        const thisMonthExpense = thisMonthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
        const lastMonthExpense = lastMonthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);

        // 1. Spending Comparison
        if (lastMonthExpense > 0) {
            const diff = thisMonthExpense - lastMonthExpense;
            const pct = (diff / lastMonthExpense) * 100;

            if (pct > 20) {
                return {
                    type: 'warning',
                    icon: AlertCircle,
                    color: '#f64f59',
                    title: 'Gastos Elevados',
                    message: `Você gastou ${pct.toFixed(0)}% a mais que no mês passado. Cuidado com o orçamento!`
                };
            }
            if (pct < -10) {
                return {
                    type: 'success',
                    icon: CheckCircle,
                    color: '#00ebc7',
                    title: 'Boa Economia!',
                    message: `Seus gastos reduziram ${Math.abs(pct).toFixed(0)}% em relação ao mês anterior. Continue assim!`
                };
            }
        }

        // 2. High Category
        const catMap = {};
        thisMonthTx.filter(t => t.type === 'expense').forEach(t => {
            if (!catMap[t.category]) catMap[t.category] = 0;
            catMap[t.category] += parseFloat(t.amount);
        });

        const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
        if (sortedCats.length > 0) {
            const topCat = sortedCats[0];
            const total = thisMonthExpense;
            const catPct = (topCat[1] / total) * 100;

            if (catPct > 40) {
                return {
                    type: 'info',
                    icon: Lightbulb,
                    color: '#c471ed',
                    title: 'Dica de Orçamento',
                    message: `"${topCat[0]}" representa ${catPct.toFixed(0)}% das suas despesas este mês. Tente reduzir este valor.`
                };
            }
        }

        return {
            type: 'neutral',
            icon: Lightbulb,
            color: '#12c2e9',
            title: 'Dica Financeira',
            message: 'Mantenha seus registros atualizados para receber insights mais precisos.'
        };
    };

    const insight = getInsight();

    return (
        <Card className="fade-in stagger-2" style={{
            marginBottom: '2rem',
            borderLeft: `4px solid ${insight.color}`,
            background: `linear-gradient(90deg, ${insight.color}10, transparent)`
        }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                    padding: '0.6rem',
                    borderRadius: '12px',
                    background: `${insight.color}20`,
                    color: insight.color,
                    marginTop: '0.2rem'
                }}>
                    <insight.icon size={24} />
                </div>
                <div>
                    <h3 style={{ color: insight.color, marginBottom: '0.3rem', fontSize: '1.1rem' }}>{insight.title}</h3>
                    <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>{insight.message}</p>
                </div>
            </div>
        </Card>
    );
}
