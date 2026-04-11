import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Plus, Trash2, Edit2, TrendingUp, Lightbulb, AlertTriangle, Star } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../context/ToastContext';

const sortGoals = (items) => [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

export default function Goals({ isTab }) {
    const { user } = useAuth();
    const { addToast, addActionToast } = useToast();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [goalToEdit, setGoalToEdit] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const pendingDeleteTimers = useRef(new Map());

    useEffect(() => {
        if (user) fetchGoals();
    }, [user]);

    useEffect(() => () => {
        pendingDeleteTimers.current.forEach((timer) => clearTimeout(timer));
        pendingDeleteTimers.current.clear();
    }, []);

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

    const resetForm = () => {
        setTitle('');
        setTargetAmount('');
        setCurrentAmount('');
        setDeadline('');
        setGoalToEdit(null);
    };

    const handleOpenEdit = (goal) => {
        setGoalToEdit(goal);
        setTitle(goal.title);
        setTargetAmount(String(goal.target_amount));
        setCurrentAmount(String(goal.current_amount));
        setDeadline(goal.deadline || '');
        setIsModalOpen(true);
    };

    const handleOpenNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleCloseGoalModal = () => {
        setIsModalOpen(false);
        resetForm();
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
            if (goalToEdit) {
                const { error: updateError } = await supabase.from('goals').update(payload).eq('id', goalToEdit.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('goals').insert([payload]);
                error = insertError;
            }

            if (error) throw error;
            await fetchGoals();
            handleCloseGoalModal();
            addToast(goalToEdit ? 'Meta atualizada.' : 'Meta criada.', 'success');
        } catch (error) {
            addToast(error.message || 'Erro ao salvar meta.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const commitDeleteGoal = async (goal) => {
        try {
            const { error } = await supabase.from('goals').delete().eq('id', goal.id);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting goal:', error);
            setGoals((prev) => sortGoals([...prev, goal]));
            addToast('Não foi possível excluir a meta.', 'error');
        }
    };

    const handleDeleteGoal = (id) => {
        const goal = goals.find((item) => item.id === id);
        if (!goal) return;

        setGoals((prev) => prev.filter((item) => item.id !== id));

        const timer = setTimeout(() => {
            pendingDeleteTimers.current.delete(id);
            commitDeleteGoal(goal);
        }, 5000);

        pendingDeleteTimers.current.set(id, timer);

        addActionToast('Meta removida.', 'Desfazer', () => {
            const pendingTimer = pendingDeleteTimers.current.get(id);
            if (pendingTimer) {
                clearTimeout(pendingTimer);
                pendingDeleteTimers.current.delete(id);
                setGoals((prev) => sortGoals([...prev, goal]));
            }
        }, 'info');
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
            if (!amount || amount <= 0) throw new Error('Informe um valor válido para o aporte.');

            const newAmount = parseFloat(selectedGoal.current_amount) + amount;
            const { error } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', selectedGoal.id);

            if (error) throw error;
            await fetchGoals();
            setIsDepositModalOpen(false);
            addToast('Aporte registrado.', 'success');
        } catch (error) {
            addToast(error.message || 'Erro ao registrar aporte.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetPrimary = async (goalId) => {
        try {
            await supabase.from('goals').update({ is_primary: false }).eq('profile_id', user.id);
            const { error } = await supabase.from('goals').update({ is_primary: true }).eq('id', goalId);
            if (error) throw error;
            await fetchGoals();
            addToast('Meta principal atualizada.', 'success');
        } catch (error) {
            console.error('Error setting primary goal:', error);
            addToast('Erro ao definir principal. Tente novamente mais tarde.', 'error');
        }
    };

    const getAdvice = (goal) => {
        const remaining = goal.target_amount - goal.current_amount;
        if (remaining <= 0) return { text: 'Meta atingida. Você está pronta para comemorar.', color: '#00ebc7', icon: Star };

        const progress = (goal.current_amount / goal.target_amount) * 100;

        if (goal.deadline) {
            const today = new Date();
            const deadlineDate = new Date(goal.deadline);
            const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

            if (daysLeft < 0) return { text: 'O prazo passou, mas a meta continua viva. Replaneje e siga em frente.', color: '#f64f59', icon: AlertTriangle };
            if (daysLeft < 30 && progress < 80) return { text: 'Estamos na reta final. Tente reforçar o aporte deste mês.', color: '#f64f59', icon: TrendingUp };
        }

        if (progress < 15) return { text: 'O começo é a parte mais difícil. Um primeiro aporte pequeno já cria tração.', color: '#c471ed', icon: Lightbulb };
        if (progress < 50) return { text: `Ótimo ritmo. Faltam apenas R$ ${remaining.toLocaleString('pt-BR')} para completar.`, color: '#12c2e9', icon: TrendingUp };
        if (progress < 80) return { text: 'Você já passou da metade. Mantendo a consistência, essa meta fica logo logo no passado.', color: '#4f29f0', icon: TrendingUp };
        return { text: 'Quase lá. Falta pouco para transformar esse plano em conquista.', color: '#00ebc7', icon: Star };
    };

    const tips = [
        'Reduzindo uma fatia dos gastos variáveis, você acelera qualquer objetivo com menos esforço do que parece.',
        'O hábito de poupar importa mais do que começar grande. Consistência vence entusiasmo passageiro.',
        "Pequenos gastos invisíveis são como vazamentos. O 'só hoje' costuma custar mais do que parece.",
        'Uma meta sem plano é só um desejo. Aqui ela já virou acompanhamento de verdade.',
        'Liberdade financeira é ter mais escolha sobre como viver o seu tempo.',
        'Preço é o que você paga. Valor é o que permanece com você.',
        'O melhor investimento que você pode fazer é em si mesmo.',
        'Juros compostos funcionam para quem constrói paciência e regularidade.',
    ];

    const [currentTip, setCurrentTip] = useState(tips[0]);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * tips.length);
        setCurrentTip(tips[randomIndex]);
    }, []);

    const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target_amount || 0), 0);
    const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.current_amount || 0), 0);
    const primaryGoal = goals.find((goal) => goal.is_primary) || null;
    const completionRate = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    const currencyFormatter = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    return (
        <div className={isTab ? 'fade-in app-page-shell' : 'container fade-in app-page-shell'} style={{ paddingBottom: '80px' }}>
            {!isTab && (
                <PageHeader
                    title={<span>Metas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Financeiras</span></span>}
                    subtitle="Transforme objetivos em marcos visiveis, com leitura mais clara de progresso, foco e proximos aportes."
                >
                    <Button onClick={handleOpenNew} icon={Plus} className="btn-primary">Nova Meta</Button>
                </PageHeader>
            )}

            {isTab && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <Button onClick={handleOpenNew} icon={Plus} className="btn-primary">Nova Meta</Button>
                </div>
            )}

            <div className="app-summary-grid">
                <Card hover={false} className="app-summary-card app-summary-card-neutral">
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Metas ativas</p>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '1.8rem' }}>{goals.length}</h3>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Acompanhe cada objetivo sem perder o contexto.</p>
                </Card>
                <Card hover={false} className="app-summary-card app-summary-card-success">
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Total acumulado</p>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '1.8rem' }}>{currencyFormatter(totalSaved)}</h3>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>{completionRate.toFixed(0)}% do objetivo total já construído.</p>
                </Card>
                <Card hover={false} className="app-summary-card app-summary-card-neutral">
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Objetivo total</p>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '1.8rem' }}>{currencyFormatter(totalTarget)}</h3>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
                        {primaryGoal ? <>Foco atual: <span style={{ color: 'var(--text-main)' }}>{primaryGoal.title}</span></> : 'Defina uma meta principal para orientar seus aportes.'}
                    </p>
                </Card>
            </div>

            <div className="glass-card app-spotlight-card" style={{ marginBottom: '1.5rem' }}>
                <div className="app-spotlight-copy">
                    <span className="app-spotlight-kicker">Leitura editorial</span>
                    <h3>Deixe cada meta com um peso real na tela</h3>
                    <p>O objetivo aqui e enxergar progresso, prioridade e proximo aporte sem virar uma grade genérica de cards.</p>
                </div>
                <div className="app-spotlight-note">
                    <div className="app-summary-icon app-summary-icon-neutral">
                        <Lightbulb size={18} />
                    </div>
                    <div>
                        <strong>Dica do momento</strong>
                        <p>{currentTip}</p>
                    </div>
                </div>
            </div>

            <div className="goals-grid">
                {loading ? (
                    <p>Carregando...</p>
                ) : goals.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <EmptyState icon={TrendingUp} title="Nenhuma meta definida" description="Transforme seus sonhos em planos. Crie uma meta e comece a poupar hoje." actionText="Criar primeira meta" onAction={handleOpenNew} />
                    </div>
                ) : (
                    goals.map((goal, index) => {
                        const progress = (goal.current_amount / goal.target_amount) * 100;
                        const remaining = goal.target_amount - goal.current_amount;
                        const advice = getAdvice(goal);
                        const safeProgress = Number.isFinite(progress) ? Math.min(progress, 100) : 0;
                        const chartData = [
                            { name: 'Conquistado', value: parseFloat(goal.current_amount) },
                            { name: 'Restante', value: parseFloat(remaining > 0 ? remaining : 0) },
                        ];

                        return (
                            <Card key={goal.id} className="fade-in goal-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animationDelay: `${index * 0.1}s`, position: 'relative', overflow: 'visible' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '0.2rem', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.4rem' }}>{goal.title}</h3>
                                        {goal.deadline && <p style={{ fontSize: '0.85rem' }}>Alvo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Button onClick={() => handleOpenEdit(goal)} variant="ghost" style={{ padding: '0.5rem' }} title="Editar"><Edit2 size={18} /></Button>
                                        <Button onClick={() => handleSetPrimary(goal.id)} variant="ghost" style={{ padding: '0.5rem', color: goal.is_primary ? '#c471ed' : 'var(--text-muted)' }} title={goal.is_primary ? 'Principal' : 'Definir como principal'}><Star size={18} fill={goal.is_primary ? '#c471ed' : 'none'} /></Button>
                                        <Button onClick={() => handleDeleteGoal(goal.id)} variant="ghost" style={{ padding: '0.5rem', color: '#f64f59' }} title="Excluir"><Trash2 size={18} /></Button>
                                    </div>
                                </div>

                                <div style={{ height: '220px', width: '100%', margin: '0.5rem 0', position: 'relative' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                                                <Cell key="saved" fill="url(#goalGradient)" />
                                                <Cell key="remaining" className="fill-track" />
                                            </Pie>
                                            <defs>
                                                <linearGradient id="goalGradient" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#4f29f0" />
                                                    <stop offset="100%" stopColor="#c471ed" />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: 'var(--glass-shadow)' }} itemStyle={{ color: 'var(--text-main)' }} formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{safeProgress.toFixed(0)}%</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', marginBottom: '0.3rem' }}>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                                        <span style={{ color: '#c471ed', fontWeight: 600 }}>{currencyFormatter(goal.current_amount)}</span> de <span style={{ fontWeight: 600 }}>{currencyFormatter(goal.target_amount)}</span>
                                    </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    <span>Restam {currencyFormatter(Math.max(remaining, 0))}</span>
                                    <span>{safeProgress.toFixed(0)}% concluído</span>
                                </div>

                                <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <div style={{ width: `${safeProgress}%`, height: '100%', background: 'linear-gradient(90deg, #4f29f0, #c471ed)', borderRadius: '999px' }} />
                                </div>

                                <div className="surface-secondary" style={{ padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.8rem', borderLeft: `3px solid ${advice.color}`, marginBottom: '1rem' }}>
                                    <advice.icon size={20} color={advice.color} style={{ minWidth: '20px' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>"{advice.text}"</span>
                                </div>

                                <Button className="btn-primary" icon={TrendingUp} style={{ justifyContent: 'center', width: '100%' }} onClick={() => handleOpenDeposit(goal)}>
                                    Adicionar Dinheiro
                                </Button>
                            </Card>
                        );
                    })
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseGoalModal} title={goalToEdit ? 'Editar Meta' : 'Nova Meta'}>
                <form onSubmit={handleSaveGoal}>
                    <Input label="Título" placeholder="Ex: Reserva de Emergência" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    <Input label="Valor Alvo (R$)" type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
                    <Input label="Valor Atual (R$)" type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} note="Use o botão 'Adicionar Dinheiro' no card para atualizações futuras." />
                    <Input label="Prazo (Opcional)" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} loading={submitting}>
                        {goalToEdit ? 'Salvar Alterações' : 'Criar Meta'}
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Adicionar Economia">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#c471ed' }}>{selectedGoal?.title}</h3>
                    <p>Quanto você quer guardar hoje?</p>
                </div>
                <form onSubmit={handleDeposit}>
                    <Input autoFocus type="number" step="0.01" placeholder="0,00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} style={{ fontSize: '2rem', textAlign: 'center', padding: '1rem' }} required />
                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} loading={submitting}>
                        Confirmar Depósito
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
