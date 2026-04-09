import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Save, Wallet } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { UpgradeModal } from '../components/UpgradeModal';
import { CategoryIcon } from '../utils/categoryIcons';

export default function Budgets({ isTab }) {
    const { user, planTier } = useAuth();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [tempLimit, setTempLimit] = useState('');
    const [showUpgrade, setShowUpgrade] = useState(false);

    useEffect(() => {
        if (!user) return undefined;

        fetchData();
        loadBudgets();

        const handleSync = () => fetchData();
        window.addEventListener('supabase-sync', handleSync);
        return () => window.removeEventListener('supabase-sync', handleSync);
    }, [user]);

    const fetchData = async () => {
        try {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

            const { data: categoriesData } = await supabase
                .from('categories')
                .select('*')
                .eq('type', 'expense');

            const { data: transactionsData } = await supabase
                .from('transactions')
                .select('*')
                .eq('type', 'expense')
                .gte('date', startOfMonth)
                .lte('date', endOfMonth);

            setCategories(categoriesData || []);
            setTransactions(transactionsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBudgets = () => {
        const saved = localStorage.getItem('persona_budgets');
        if (saved) setBudgets(JSON.parse(saved));
    };

    const saveBudget = (categoryId, limit) => {
        const nextBudgets = { ...budgets, [categoryId]: parseFloat(limit) || 0 };
        setBudgets(nextBudgets);
        localStorage.setItem('persona_budgets', JSON.stringify(nextBudgets));
        setEditingId(null);
    };

    const handleOpenEdit = (categoryId, currentLimit) => {
        let maxBudgets = 5;
        if (planTier === 'intermediate') maxBudgets = 10;
        if (planTier === 'complete') maxBudgets = Infinity;

        const activeBudgetsCount = Object.values(budgets).filter((value) => parseFloat(value) > 0).length;

        if (currentLimit === 0 && activeBudgetsCount >= maxBudgets) {
            setShowUpgrade(true);
            return;
        }

        setEditingId(categoryId);
        setTempLimit(currentLimit);
    };

    const getSpent = (categoryName) => (
        transactions
            .filter((transaction) => transaction.category === categoryName)
            .reduce((sum, transaction) => sum + transaction.amount, 0)
    );

    const formatCurrency = (value) => (
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    );

    if (loading) return <div className="container fade-in">Carregando orcamentos...</div>;

    const totalBudget = Object.values(budgets).reduce((sum, value) => sum + value, 0);
    const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const categoriesWithBudget = Object.values(budgets).filter((value) => Number(value) > 0).length;

    return (
        <div className={isTab ? 'fade-in app-page-shell' : 'container fade-in app-page-shell'} style={{ paddingBottom: '80px' }}>
            {!isTab && (
                <PageHeader
                    title={<span>Meus <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Orcamentos</span></span>}
                    subtitle="Defina limites claros e enxergue o que esta consumindo o seu mes."
                />
            )}

            <Card className="glass-card app-overview-card">
                <div className="app-section-header">
                    <div>
                        <h3>Panorama do mes</h3>
                        <p>Quanto ja saiu em relacao ao teto que voce definiu.</p>
                    </div>
                    <div className="app-summary-icon app-summary-icon-neutral">
                        <Wallet size={18} />
                    </div>
                </div>

                <div className="app-summary-grid">
                    <Card hover={false} className="app-summary-card app-summary-card-neutral">
                        <span className="app-summary-label">Total gasto</span>
                        <strong className="app-summary-value">{formatCurrency(totalSpent)}</strong>
                    </Card>
                    <Card hover={false} className="app-summary-card app-summary-card-neutral">
                        <span className="app-summary-label">Limite total</span>
                        <strong className="app-summary-value">{formatCurrency(totalBudget)}</strong>
                    </Card>
                    <Card hover={false} className="app-summary-card app-summary-card-neutral">
                        <span className="app-summary-label">Categorias com limite</span>
                        <strong className="app-summary-value">{categoriesWithBudget}</strong>
                    </Card>
                </div>

                <div className="app-progress-shell">
                    <div className="app-progress-track">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(totalProgress, 100)}%` }}
                            transition={{ duration: 1 }}
                            className={`app-progress-fill${totalProgress > 100 ? ' is-danger' : ''}`}
                        />
                    </div>
                    <p className="app-progress-label">{totalProgress.toFixed(1)}% utilizado</p>
                </div>
            </Card>

            <div className="app-list-grid">
                {categories.map((category) => {
                    const spent = getSpent(category.name);
                    const limit = budgets[category.id] || 0;
                    const progress = limit > 0 ? (spent / limit) * 100 : 0;
                    const isOver = progress > 100;

                    return (
                        <Card key={category.id} hover className="app-list-card app-budget-card">
                            <div className="app-section-header">
                                <div className="app-list-card-main">
                                    <span className="app-inline-icon" style={{ color: category.color || 'var(--text-main)' }}>
                                        <CategoryIcon icon={category.icon} size={18} />
                                    </span>
                                    <div>
                                        <strong>{category.name}</strong>
                                        <span>{limit === 0 ? 'Sem limite definido' : 'Limite configurado'}</span>
                                    </div>
                                </div>

                                {editingId === category.id ? (
                                    <Button onClick={() => saveBudget(category.id, tempLimit)} className="btn-primary">
                                        <Save size={14} /> Salvar
                                    </Button>
                                ) : (
                                    <Button variant="ghost" onClick={() => handleOpenEdit(category.id, limit)}>
                                        {limit === 0 ? 'Definir limite' : 'Editar'}
                                    </Button>
                                )}
                            </div>

                            {editingId === category.id ? (
                                <Input
                                    type="number"
                                    value={tempLimit}
                                    onChange={(event) => setTempLimit(event.target.value)}
                                    placeholder="0,00"
                                    autoFocus
                                />
                            ) : (
                                <>
                                    <div className="app-budget-values">
                                        <strong>{formatCurrency(spent)}</strong>
                                        <span>de {formatCurrency(limit)}</span>
                                    </div>

                                    <div className="app-progress-track">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(progress, 100)}%` }}
                                            className={`app-progress-fill${isOver ? ' is-danger' : ''}`}
                                            style={{ background: isOver ? undefined : (category.color || 'var(--color-brand)') }}
                                        />
                                    </div>

                                    <div className="app-budget-footer">
                                        <span className={isOver ? 'is-danger' : ''}>
                                            {isOver ? 'Limite excedido' : limit > 0 ? `${formatCurrency(Math.max(limit - spent, 0))} restantes` : 'Defina um teto para acompanhar'}
                                        </span>
                                        <span>{progress.toFixed(0)}%</span>
                                    </div>
                                </>
                            )}
                        </Card>
                    );
                })}
            </div>

            {categories.length === 0 && (
                <div className="app-empty-inline" style={{ padding: '2rem 0' }}>
                    Nenhuma categoria de despesa encontrada.
                </div>
            )}

            {totalProgress > 100 && (
                <div className="app-inline-warning">
                    <AlertCircle size={16} />
                    <span>Seu total de gastos ja passou do limite definido para este mes.</span>
                </div>
            )}

            <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
        </div>
    );
}
