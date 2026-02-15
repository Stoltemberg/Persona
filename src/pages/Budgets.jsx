import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PieChart, Wallet, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Budgets() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [tempLimit, setTempLimit] = useState('');

    useEffect(() => {
        if (user) {
            fetchData();
            loadBudgets();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

            // Fetch Categories
            const { data: cats } = await supabase
                .from('categories')
                .select('*')
                .eq('type', 'expense'); // Only expense categories for budgets

            // Fetch Transactions for this month
            const { data: txs } = await supabase
                .from('transactions')
                .select('*')
                .eq('profile_id', user.id)
                .eq('type', 'expense')
                .gte('date', startOfMonth)
                .lte('date', endOfMonth);

            setCategories(cats || []);
            setTransactions(txs || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBudgets = () => {
        const saved = localStorage.getItem('persona_budgets');
        if (saved) {
            setBudgets(JSON.parse(saved));
        }
    };

    const saveBudget = (categoryId, limit) => {
        const newBudgets = { ...budgets, [categoryId]: parseFloat(limit) };
        setBudgets(newBudgets);
        localStorage.setItem('persona_budgets', JSON.stringify(newBudgets));
        setEditingId(null);
    };

    const getSpent = (categoryName) => {
        return transactions
            .filter(t => t.category === categoryName)
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    if (loading) return <div className="container fade-in">Carregando orçamentos...</div>;

    const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
    const totalSpent = transactions.reduce((a, b) => a + b.amount, 0);
    const totalProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return (
        <div className={isTab ? "fade-in" : "container fade-in"} style={{ paddingBottom: '80px' }}>
            {!isTab && (
                <header className="flex-between mb-2 flex-wrap gap-1" style={{ marginBottom: '3rem', paddingTop: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                            Meus <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Orçamentos</span>
                        </h1>
                        <p className="text-muted" style={{ opacity: 0.6 }}>Defina limites e economize</p>
                    </div>
                </header>
            )}

            {/* Overview Card */}
            <Card className="glass-card mb-2" style={{ background: 'linear-gradient(135deg, rgba(18, 194, 233, 0.1), rgba(196, 113, 237, 0.1))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                    <div>
                        <p className="text-muted text-small uppercase">Total Gasto / Limite</p>
                        <h2 style={{ fontSize: '2rem' }}>
                            {formatCurrency(totalSpent)}
                            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}> / {formatCurrency(totalBudget)}</span>
                        </h2>
                    </div>
                    <div className="icon-box">
                        <Wallet size={24} color="var(--color-2)" />
                    </div>
                </div>

                <div className="progress-bar-container" style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(totalProgress, 100)}%` }}
                        transition={{ duration: 1 }}
                        style={{
                            height: '100%',
                            background: totalProgress > 100 ? '#f64f59' : 'linear-gradient(90deg, var(--color-4), var(--color-2))',
                            borderRadius: '6px'
                        }}
                    />
                </div>
                <p className="text-right text-small mt-1" style={{ color: totalProgress > 100 ? '#f64f59' : 'var(--text-muted)' }}>
                    {totalProgress.toFixed(1)}% utilizado
                </p>
            </Card>

            <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {categories.map(cat => {
                    const spent = getSpent(cat.name);
                    const limit = budgets[cat.id] || 0;
                    const progress = limit > 0 ? (spent / limit) * 100 : 0;
                    const isOver = progress > 100;

                    return (
                        <Card key={cat.id} className="glass-card hover-scale">
                            <div className="flex-between mb-1">
                                <div className="flex-align-center gap-1">
                                    <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                                    <h3 style={{ margin: 0 }}>{cat.name}</h3>
                                </div>
                                {editingId === cat.id ? (
                                    <Button onClick={() => saveBudget(cat.id, tempLimit)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                        <Save size={14} style={{ marginRight: '4px' }} /> Salvar
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => { setEditingId(cat.id); setTempLimit(limit); }}
                                        className="btn-ghost"
                                        style={{
                                            fontSize: '0.8rem',
                                            padding: '0.4rem 0.8rem',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--text-main)'
                                        }}
                                    >
                                        {limit === 0 ? 'Definir Limite' : 'Editar'}
                                    </Button>
                                )}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                {editingId === cat.id ? (
                                    <Input
                                        type="number"
                                        value={tempLimit}
                                        onChange={(e) => setTempLimit(e.target.value)}
                                        placeholder="0,00"
                                        autoFocus
                                        style={{ marginBottom: 0 }}
                                    />
                                ) : (
                                    <div className="flex-between" style={{ alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatCurrency(spent)}</span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>de {formatCurrency(limit)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(progress, 100)}%` }}
                                    style={{
                                        height: '100%',
                                        background: isOver ? '#f64f59' : cat.color || 'var(--text-main)',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>

                            <div className="flex-between mt-1 text-small">
                                <span style={{ color: isOver ? '#f64f59' : 'var(--text-muted)' }}>
                                    {isOver ? 'Limite excedido!' : `${(limit - spent) > 0 ? formatCurrency(limit - spent) + ' restantes' : ''}`}
                                </span>
                                <span style={{ fontWeight: 600, color: isOver ? '#f64f59' : 'var(--text-muted)' }}>{progress.toFixed(0)}%</span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {categories.length === 0 && (
                <div className="text-center text-muted" style={{ padding: '4rem' }}>
                    Nenhuma categoria de despesa encontrada.
                </div>
            )}
        </div>
    );
}
