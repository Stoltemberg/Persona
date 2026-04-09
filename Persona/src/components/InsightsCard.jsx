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
        const catDetails = {}; // Store expense types for analysis

        thisMonthTx.filter(t => t.type === 'expense').forEach(t => {
            if (!catMap[t.category]) {
                catMap[t.category] = 0;
                catDetails[t.category] = { fixed: 0, variable: 0, total: 0 };
            }
            const amount = parseFloat(t.amount);
            catMap[t.category] += amount;
            catDetails[t.category].total += amount;

            // Count expense types
            if (t.expense_type === 'fixed') catDetails[t.category].fixed += amount;
            else catDetails[t.category].variable += amount; // Treat null/lifestyle as variable for this purpose
        });

        const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

        // Find the first "cuttable" category
        // We look for a category that is NOT predominantly fixed (> 80% fixed)
        // and represents a meaningful chunk of expenses (> 10%)
        let targetCategory = null;
        const totalExpenses = thisMonthExpense;

        for (const [catName, catTotal] of sortedCats) {
            const details = catDetails[catName];
            const fixedRatio = details.fixed / details.total;
            const expenseShare = catTotal / totalExpenses;

            // Debug log just in case (removed for prod)
            // console.log(`${catName}: Fixed ${fixedRatio.toFixed(2)}, Share ${expenseShare.toFixed(2)}`);

            // Criteria:
            // 1. Not > 80% fixed costs
            // 2. Represents at least 15% of total expenses (don't nitpick small stuff)
            if (fixedRatio < 0.8 && expenseShare > 0.15) {
                targetCategory = { name: catName, total: catTotal, pct: expenseShare * 100 };
                break;
            }
        }

        if (targetCategory) {
            return {
                type: 'info',
                icon: Lightbulb,
                color: '#c471ed',
                title: 'Dica de Orçamento',
                message: `"${targetCategory.name}" e seus gastos variáveis representam ${targetCategory.pct.toFixed(0)}% das despesas. Que tal economizar aqui?`
            };
        } else if (sortedCats.length > 0 && thisMonthExpense > 0) {
            // Fallback if all big categories are fixed:
            // Check if ANY variable spending exists overall
            const totalVariable = thisMonthTx
                .filter(t => t.type === 'expense' && t.expense_type !== 'fixed')
                .reduce((acc, t) => acc + parseFloat(t.amount), 0);

            if (totalVariable > (thisMonthExpense * 0.2)) {
                return {
                    type: 'neutral',
                    icon: TrendingDown,
                    color: '#12c2e9',
                    title: 'Pequenos Cortes',
                    message: 'Seus maiores gastos são fixos. Tente rever pequenos gastos variáveis do dia a dia para economizar.'
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
