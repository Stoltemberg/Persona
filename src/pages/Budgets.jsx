import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Save, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { UpgradeModal } from '../components/UpgradeModal';
import { CategoryIcon } from '../utils/categoryIcons';

function BudgetsBackdrop() {
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
                        'radial-gradient(circle at 14% 16%, rgba(212, 175, 55, 0.12), transparent 24%), radial-gradient(circle at 82% 12%, rgba(92, 132, 255, 0.09), transparent 22%), radial-gradient(circle at 50% 88%, rgba(0, 235, 199, 0.07), transparent 24%)',
                }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    left: '-10%',
                    top: '12%',
                    width: '28vw',
                    height: '28vw',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.16) 0%, rgba(212, 175, 55, 0.02) 64%, transparent 72%)',
                    filter: 'blur(16px)',
                }}
                animate={reducedMotion ? {} : { x: [0, 22, 0], y: [0, -10, 0], scale: [1, 1.05, 1] }}
                transition={reducedMotion ? {} : { duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    right: '-8%',
                    bottom: '6%',
                    width: '30vw',
                    height: '30vw',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(92, 132, 255, 0.12) 0%, rgba(92, 132, 255, 0.02) 64%, transparent 72%)',
                    filter: 'blur(18px)',
                }}
                animate={reducedMotion ? {} : { x: [0, -18, 0], y: [0, 18, 0], scale: [1, 1.04, 1] }}
                transition={reducedMotion ? {} : { duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
        </div>
    );
}

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

    if (loading) {
        return (
            <div className="container fade-in app-page-shell" style={{ paddingBottom: '96px', position: 'relative', isolation: 'isolate' }}>
                <BudgetsBackdrop />
                <div style={{ position: 'relative', zIndex: 1 }}>Carregando orcamentos...</div>
            </div>
        );
    }

    const totalBudget = Object.values(budgets).reduce((sum, value) => sum + value, 0);
    const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const categoriesWithBudget = Object.values(budgets).filter((value) => Number(value) > 0).length;

    return (
        <div
            className={isTab ? 'fade-in app-page-shell' : 'container fade-in app-page-shell'}
            style={{ paddingBottom: '96px', position: 'relative', isolation: 'isolate' }}
        >
            <BudgetsBackdrop />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {!isTab && (
                    <PageHeader
                        title={<span>Meus <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Orcamentos</span></span>}
                        subtitle="Uma tela mais limpa para definir limites e observar a pressao sobre cada categoria."
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
                            Panorama do mes
                        </span>
                        <strong style={{ fontSize: 'clamp(1.55rem, 2.2vw, 2.15rem)', lineHeight: 1.05 }}>
                            Limites mais claros, com menos ruído visual.
                        </strong>
                        <p className="text-muted" style={{ margin: 0, maxWidth: '58ch', lineHeight: 1.65 }}>
                            Veja quanto saiu em relação ao teto definido e mantenha as categorias mais sensíveis sob controle.
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
                        <div className="app-section-header" style={{ marginBottom: 0 }}>
                            <div>
                                <h3 style={{ marginBottom: '0.25rem' }}>Utilizacao do mes</h3>
                                <p style={{ marginBottom: 0 }}>Acompanhe o peso real do teto configurado.</p>
                            </div>
                            <div className="app-summary-icon app-summary-icon-neutral">
                                <Wallet size={18} />
                            </div>
                        </div>

                        <div className="app-progress-shell" style={{ marginTop: 0 }}>
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

                        <div className="app-chip-row" style={{ justifyContent: 'flex-start' }}>
                            <span className="app-filter-chip is-active" style={{ pointerEvents: 'none' }}>{categoriesWithBudget} com limite</span>
                            <span className="app-filter-chip" style={{ pointerEvents: 'none' }}>{formatCurrency(totalSpent)} gasto</span>
                        </div>
                    </div>
                </motion.section>

                <div className="app-summary-grid" style={{ marginBottom: '1rem' }}>
                    <Card hover={false} className="app-summary-card app-summary-card-neutral" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="app-summary-label">Total gasto</span>
                        <strong className="app-summary-value">{formatCurrency(totalSpent)}</strong>
                    </Card>
                    <Card hover={false} className="app-summary-card app-summary-card-neutral" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="app-summary-label">Limite total</span>
                        <strong className="app-summary-value">{formatCurrency(totalBudget)}</strong>
                    </Card>
                    <Card hover={false} className="app-summary-card app-summary-card-neutral" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="app-summary-label">Categorias com limite</span>
                        <strong className="app-summary-value">{categoriesWithBudget}</strong>
                    </Card>
                </div>

                <div className="app-list-grid" style={{ gap: '1rem' }}>
                    {categories.map((category) => {
                        const spent = getSpent(category.name);
                        const limit = budgets[category.id] || 0;
                        const progress = limit > 0 ? (spent / limit) * 100 : 0;
                        const isOver = progress > 100;

                        return (
                            <Card
                                key={category.id}
                                hover
                                className="app-list-card app-budget-card"
                                style={{
                                    padding: '1.25rem',
                                    borderRadius: '26px',
                                    background: 'rgba(255,255,255,0.04)',
                                }}
                            >
                                <div className="app-section-header" style={{ alignItems: 'flex-start' }}>
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
                                    <div style={{ marginTop: '1rem' }}>
                                        <Input
                                            type="number"
                                            value={tempLimit}
                                            onChange={(event) => setTempLimit(event.target.value)}
                                            placeholder="0,00"
                                            autoFocus
                                        />
                                    </div>
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
        </div>
    );
}
