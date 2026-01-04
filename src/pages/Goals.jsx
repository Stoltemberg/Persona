import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Plus, Target, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Goals() {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [deadline, setDeadline] = useState('');

    useEffect(() => {
        if (user) fetchGoals();
    }, [user]);

    const fetchGoals = async () => {
        try {
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { error } = await supabase.from('goals').insert([
                {
                    title,
                    target_amount: parseFloat(targetAmount),
                    current_amount: parseFloat(currentAmount || 0),
                    deadline: deadline || null,
                    profile_id: user.id,
                },
            ]);

            if (error) throw error;

            await fetchGoals();
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteGoal = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            setGoals(goals.filter(g => g.id !== id));
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const resetForm = () => {
        setTitle('');
        setTargetAmount('');
        setCurrentAmount('');
        setDeadline('');
    };

    // Matches new CSS variables
    const COLORS = ['#00ebc7', 'rgba(255,255,255,0.05)'];

    return (
        <div className="container fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1 className="text-gradient">Metas Financeiras</h1>
                <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                    Nova Meta
                </Button>
            </header>

            {/* Goals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {loading ? (
                    <p>Carregando...</p>
                ) : goals.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                        Nenhuma meta encontrada. Defina seu primeiro objetivo!
                    </div>
                ) : (
                    goals.map((goal, index) => {
                        const progress = (goal.current_amount / goal.target_amount) * 100;
                        const remaining = goal.target_amount - goal.current_amount;

                        const data = [
                            { name: 'Conquistado', value: parseFloat(goal.current_amount) },
                            { name: 'Restante', value: parseFloat(remaining > 0 ? remaining : 0) },
                        ];

                        return (
                            <Card key={goal.id} hover className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animationDelay: `${index * 0.1}s` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '0.2rem', color: 'white', fontWeight: 600 }}>{goal.title}</h3>
                                        {goal.deadline && (
                                            <p style={{ fontSize: '0.85rem' }}>Meta: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
                                        )}
                                    </div>
                                    <button onClick={() => handleDeleteGoal(goal.id)} className="btn-ghost" style={{ padding: '0.5rem', color: '#f64f59' }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                <div style={{ height: '220px', width: '100%', margin: '1rem 0' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={85}
                                                startAngle={90}
                                                endAngle={-270}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell key="cell-0" fill="url(#colorGradient)" />
                                                <Cell key="cell-1" fill="rgba(255,255,255,0.05)" />
                                            </Pie>
                                            <defs>
                                                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#4f29f0" />
                                                    <stop offset="100%" stopColor="#c471ed" />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                                                itemStyle={{ color: 'white' }}
                                                formatter={(value) => `R$ ${value.toFixed(2)}`}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <h2 style={{
                                        fontSize: '3rem',
                                        fontWeight: 800,
                                        background: 'linear-gradient(135deg, #c471ed 0%, #f64f59 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {progress.toFixed(0)}%
                                    </h2>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                                        R$ {goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Add Goal Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Meta">
                <form onSubmit={handleAddGoal}>
                    <Input
                        label="Título"
                        placeholder="Ex: Viagem, Carro Novo"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <Input
                        label="Valor Alvo"
                        placeholder="R$ 0,00"
                        type="number"
                        step="0.01"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        required
                    />
                    <Input
                        label="Valor Inicial"
                        placeholder="R$ 0,00"
                        type="number"
                        step="0.01"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                    />
                    <Input
                        label="Prazo (Opcional)"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />

                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} loading={submitting}>
                        Salvar Meta
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
