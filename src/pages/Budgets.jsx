import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export default function Budgets() {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [monthlySpent, setMonthlySpent] = useState({});
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [budgetAmount, setBudgetAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Expense Categories
            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .eq('type', 'expense');

            setCategories(catData || []);

            // 2. Fetch User Budgets
            const { data: budgetData } = await supabase
                .from('budgets')
                .select('*')
                .eq('profile_id', user.id);

            setBudgets(budgetData || []);

            // 3. Calculate Monthly Spent per Category
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

            const { data: txData } = await supabase
                .from('transactions')
                .select('*')
                .eq('type', 'expense')
                .gte('date', startOfMonth)
                .lte('date', endOfMonth);

            const spentMap = {};
            if (txData) {
                txData.forEach(tx => {
                    // Match transaction category name to category object?
                    // Ideally transactions should link to category_id, but current schema uses text 'category'.
                    // We will match by Name for now.
                    if (!spentMap[tx.category]) spentMap[tx.category] = 0;
                    spentMap[tx.category] += parseFloat(tx.amount);
                });
            }
            setMonthlySpent(spentMap);

        } catch (error) {
            console.error('Error fetching budget data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category) => {
        setSelectedCategory(category);
        // Find existing budget
        const existing = budgets.find(b => b.category_id === category.id);
        setBudgetAmount(existing ? existing.amount : '');
        setIsModalOpen(true);
    };

    const handleSaveBudget = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Check if exists
            const existing = budgets.find(b => b.category_id === selectedCategory.id);

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('budgets')
                    .update({ amount: parseFloat(budgetAmount) })
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('budgets')
                    .insert([{
                        category_id: selectedCategory.id,
                        amount: parseFloat(budgetAmount),
                        profile_id: user.id
                    }]);
                if (error) throw error;
            }

            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container fade-in">
            <header style={{ marginBottom: '3rem' }}>
                <h1 className="text-gradient">Orçamentos</h1>
                <p>Defina limites para suas despesas mensais</p>
            </header>

            {loading ? <p>Carregando...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {categories.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                            <p>Nenhuma categoria de despesa encontrada.</p>
                            <Button variant="ghost" className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => window.location.href = '/categories'}>
                                Criar Categorias
                            </Button>
                        </div>
                    ) : (
                        categories.map((cat, index) => {
                            const budget = budgets.find(b => b.category_id === cat.id);
                            const limit = budget ? parseFloat(budget.amount) : 0;
                            const spent = monthlySpent[cat.name] || 0;
                            const progress = limit > 0 ? (spent / limit) * 100 : 0;
                            const isOver = spent > limit && limit > 0;

                            return (
                                <Card key={cat.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                background: `${cat.color}20`,
                                                padding: '0.8rem',
                                                borderRadius: '12px',
                                                lineHeight: 1
                                            }}>
                                                {cat.icon}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{cat.name}</h3>
                                                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                                    {limit > 0 ? `Meta: R$ ${limit.toLocaleString('pt-BR')}` : 'Sem meta definida'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" className="btn-ghost" onClick={() => handleOpenModal(cat)}>
                                            Definir
                                        </Button>
                                    </div>

                                    {limit > 0 && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <span style={{ color: isOver ? '#f64f59' : 'inherit' }}>
                                                    R$ {spent.toLocaleString('pt-BR')}
                                                </span>
                                                <span>
                                                    {Math.min(progress, 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div style={{
                                                height: '8px',
                                                background: 'rgba(255,255,255,0.1)',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(progress, 100)}%`,
                                                    height: '100%',
                                                    background: isOver ? '#f64f59' : cat.color,
                                                    transition: 'width 1s ease-in-out'
                                                }} />
                                            </div>
                                            {isOver && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.8rem', color: '#f64f59', fontSize: '0.85rem' }}>
                                                    <AlertCircle size={16} />
                                                    <span>Você excedeu o orçamento!</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Orçamento: ${selectedCategory?.name}`}>
                <form onSubmit={handleSaveBudget}>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                        Defina o valor máximo que deseja gastar nesta categoria por mês.
                    </p>
                    <Input
                        label="Limite Mensal (R$)"
                        type="number"
                        step="0.01"
                        value={budgetAmount}
                        onChange={(e) => setBudgetAmount(e.target.value)}
                        placeholder="Ex: 500,00"
                        required
                    />
                    <Button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} loading={submitting}>
                        Salvar Orçamento
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
