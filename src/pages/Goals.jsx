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

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#c471ed', '#f64f59'];

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Metas Financeiras</h1>
                <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                    Nova Meta
                </Button>
            </header>

            {/* Goals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {loading ? (
                    <p>Carregando...</p>
                ) : goals.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                        Nenhuma meta encontrada. Defina seu primeiro objetivo!
                    </div>
                ) : (
                    goals.map((goal) => {
                        const progress = (goal.current_amount / goal.target_amount) * 100;
                        const remaining = goal.target_amount - goal.current_amount;

                        const data = [
                            { name: 'Conquistado', value: parseFloat(goal.current_amount) },
                            { name: 'Restante', value: parseFloat(remaining > 0 ? remaining : 0) },
                        ];

                        return (
                            <Card key={goal.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '0.2rem' }}>{goal.title}</h3>
                                        {goal.deadline && (
                                            <p style={{ fontSize: '0.85rem' }}>Meta: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
                                        )}
                                    </div>
                                    <button onClick={() => handleDeleteGoal(goal.id)} className="btn-ghost" style={{ padding: '0.25rem', color: 'var(--accent)' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div style={{ height: '200px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell key="cell-0" fill={COLORS[1]} /> {/* Green for achieved */}
                                                <Cell key="cell-1" fill="rgba(255,255,255,0.1)" /> {/* Empty for remaining */}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                                                itemStyle={{ color: 'white' }}
                                                formatter={(value) => `R$ ${value.toFixed(2)}`}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <h2 style={{ color: 'var(--secondary)' }}>
                                        {progress.toFixed(0)}%
                                    </h2>
                                    <p style={{ fontSize: '0.9rem' }}>
                                        R$ {goal.current_amount} de R$ {goal.target_amount}
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
                        placeholder="Título (ex: Viagem, Carro Novo)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <Input
                        placeholder="Valor Alvo (R$)"
                        type="number"
                        step="0.01"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        required
                    />
                    <Input
                        placeholder="Valor Inicial (R$)"
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
