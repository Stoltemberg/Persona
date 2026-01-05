import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Plus, Trash2, Edit2, TrendingUp, Lightbulb, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Goals() {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [goalsToEdit, setGoalsToEdit] = useState(null); // If null, it's new mode
    const [selectedGoal, setSelectedGoal] = useState(null); // For deposit

    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [depositAmount, setDepositAmount] = useState('');

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

    const handleOpenEdit = (goal) => {
        setGoalsToEdit(goal);
        setTitle(goal.title);
        setTargetAmount(goal.target_amount);
        setCurrentAmount(goal.current_amount);
        setDeadline(goal.deadline || '');
        setIsModalOpen(true);
    };

    const handleOpenNew = () => {
        setGoalsToEdit(null);
        resetForm();
        setIsModalOpen(true);
    };

    const handleSaveGoal = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                title,
                target_amount: parseFloat(targetAmount),
                current_amount: parseFloat(currentAmount || 0),
                deadline: deadline || null,
                profile_id: user.id,
            };

            let error;
            if (goalsToEdit) {
                // Edit mode
                const { error: updateError } = await supabase
                    .from('goals')
                    .update(payload)
                    .eq('id', goalsToEdit.id);
                error = updateError;
            } else {
                // Create mode
                const { error: insertError } = await supabase
                    .from('goals')
                    .insert([payload]);
                error = insertError;
            }

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
        if (!confirm('Tem certeza? Isso não pode ser desfeito.')) return;
        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            setGoals(goals.filter(g => g.id !== id));
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const handleOpenDeposit = (goal) => {
        setSelectedGoal(goal);
        setDepositAmount('');
        setIsDepositModalOpen(true);
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const amount = parseFloat(depositAmount);
            if (!amount || amount <= 0) throw new Error("Valor inválido");

            const newAmount = parseFloat(selectedGoal.current_amount) + amount;

            const { error } = await supabase
                .from('goals')
                .update({ current_amount: newAmount })
                .eq('id', selectedGoal.id);

            if (error) throw error;

            await fetchGoals();
            setIsDepositModalOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setTargetAmount('');
        setCurrentAmount('');
        setDeadline('');
        setGoalsToEdit(null);
    };

    // --- Smart Advisor Logic ---
    const getAdvice = (goal) => {
        const remaining = goal.target_amount - goal.current_amount;
        if (remaining <= 0) return { text: "Meta atingida! Você é incrível! 🎉", color: '#00ebc7', icon: TrendingUp };

        const progress = (goal.current_amount / goal.target_amount) * 100;

        if (progress < 10) return {
            text: "O segredo é começar. Que tal guardar R$ 50,00 esta semana?",
            color: '#f64f59',
            icon: AlertTriangle
        };

        if (progress > 50 && progress < 80) return {
            text: "Passou da metade! Se apertar um pouquinho os gastos variáveis, chega lá antes do prazo.",
            color: '#12c2e9',
            icon: TrendingUp
        };

        if (progress >= 80) return {
            text: "Reta final! Falta muito pouco. Mantenha o foco!",
            color: '#00ebc7',
            icon: Lightbulb
        };

        return {
            text: "Consistência é a chave. Continue depositando mensalmente.",
            color: '#c471ed',
            icon: Lightbulb
        };
    };

    // --- Dynamic Tips ---
    const TIPS = [
        "Reduzindo apenas 15% dos seus gastos variáveis, você atinge suas metas muito mais rápido.",
        "O hábito de poupar importa mais que o valor. Comece com pouco, mas comece hoje.",
        "Pequenos gastos invisíveis são como furos em um barco. Cuidado com o 'só hoje'.",
        "Invista no seu conhecimento. A melhor taxa de juros vem de aprender algo novo.",
        "Uma meta sem plano é só um desejo. Que bom que você já tem o plano aqui!",
        "Antes de comprar, pergunte-se: 'Eu preciso disso ou eu quero isso agora?'",
        "Liberdade financeira é poder escolher como gastar seu tempo, não só seu dinheiro."
    ];

    const [currentTip, setCurrentTip] = useState(TIPS[0]);

    useEffect(() => {
        // Randomize tip on mount
        const randomIndex = Math.floor(Math.random() * TIPS.length);
        setCurrentTip(TIPS[randomIndex]);
    }, []);

    // ... existing imports/code ...

    return (
        <div className="container fade-in">
            {/* ... header ... */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-gradient">Metas Financeiras</h1>
                    <p>Acompanhe e realize seus sonhos</p>
                </div>
                <Button onClick={handleOpenNew} icon={Plus} className="btn-primary">
                    Nova Meta
                </Button>
            </header>

            {/* Smart Tips Section - Global */}
            <div className="glass-panel" style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'linear-gradient(to right, rgba(79, 41, 240, 0.1), rgba(196, 113, 237, 0.1))',
                borderLeft: '4px solid #c471ed',
                display: 'flex',
                gap: '1rem',
                alignItems: 'start'
            }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '50%' }}>
                    <Lightbulb size={24} color="#fff" />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'white' }}>Dica do Persona IA</h3>
                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>
                        {currentTip}
                    </p>
                </div>
            </div>

            {/* Goals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
                {loading ? (
                    <p>Carregando...</p>
                ) : goals.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: '1.1rem' }}>Sua lista de sonhos está vazia.</p>
                        <Button style={{ marginTop: '1rem' }} onClick={handleOpenNew}>Criar primeira meta</Button>
                    </div>
                ) : (
                    goals.map((goal, index) => {
                        const progress = (goal.current_amount / goal.target_amount) * 100;
                        const remaining = goal.target_amount - goal.current_amount;
                        const advice = getAdvice(goal);

                        const data = [
                            { name: 'Conquistado', value: parseFloat(goal.current_amount) },
                            { name: 'Restante', value: parseFloat(remaining > 0 ? remaining : 0) },
                        ];

                        return (
                            <Card key={goal.id} className="fade-in" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                animationDelay: `${index * 0.1}s`,
                                position: 'relative',
                                overflow: 'visible'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '0.2rem', color: 'white', fontWeight: 600, fontSize: '1.4rem' }}>{goal.title}</h3>
                                        {goal.deadline && (
                                            <p style={{ fontSize: '0.85rem' }}>Alvo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleOpenEdit(goal)} className="btn-ghost" style={{ padding: '0.5rem' }} title="Editar">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDeleteGoal(goal.id)} className="btn-ghost" style={{ padding: '0.5rem', color: '#f64f59' }} title="Excluir">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ height: '220px', width: '100%', margin: '0.5rem 0' }}>
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
                                                contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                itemStyle={{ color: 'white' }}
                                                formatter={(value) => `R$ ${value.toFixed(2)}`}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* Centered Percentage */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -40%)',
                                        textAlign: 'center',
                                        pointerEvents: 'none'
                                    }}>
                                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{progress.toFixed(0)}%</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                                        <span style={{ color: '#c471ed', fontWeight: 600 }}>R$ {goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        {' '} de {' '}
                                        <span style={{ fontWeight: 600 }}>R$ {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </p>
                                </div>

                                {/* Advisor Footer (Inside Card) */}
                                <div style={{
                                    padding: '0.8rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    borderLeft: `3px solid ${advice.color}`,
                                    marginBottom: '1rem'
                                }}>
                                    <advice.icon size={20} color={advice.color} style={{ minWidth: '20px' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
                                        "{advice.text}"
                                    </span>
                                </div>

                                <Button
                                    className="btn-primary"
                                    icon={TrendingUp}
                                    style={{ justifyContent: 'center', width: '100%' }}
                                    onClick={() => handleOpenDeposit(goal)}
                                >
                                    Adicionar Dinheiro
                                </Button>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={goalsToEdit ? "Editar Meta" : "Nova Meta"}>
                <form onSubmit={handleSaveGoal}>
                    <Input
                        label="Título"
                        placeholder="Ex: Reserva de Emergência"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <Input
                        label="Valor Alvo (R$)"
                        type="number"
                        step="0.01"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        required
                    />
                    <Input
                        label="Valor Atual (R$)"
                        type="number"
                        step="0.01"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                        note="Use o botão 'Adicionar Dinheiro' no card para atualizações futuras."
                    />
                    <Input
                        label="Prazo (Opcional)"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />
                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} loading={submitting}>
                        {goalsToEdit ? "Salvar Alterações" : "Criar Meta"}
                    </Button>
                </form>
            </Modal>

            {/* Deposit Modal */}
            <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Adicionar Economia">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#c471ed' }}>{selectedGoal?.title}</h3>
                    <p>Quanto você quer guardar hoje?</p>
                </div>
                <form onSubmit={handleDeposit}>
                    <Input
                        autoFocus
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        style={{ fontSize: '2rem', textAlign: 'center', padding: '1rem' }}
                        required
                    />
                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} loading={submitting}>
                        Confirmar Depósito
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
