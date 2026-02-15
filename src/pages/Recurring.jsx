import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Plus, Trash2, Edit2, Calendar, Check, X, Repeat, Zap, TrendingUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';

export default function Recurring() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [nextDueDate, setNextDueDate] = useState('');
    const [expenseType, setExpenseType] = useState('variable');
    const [filter, setFilter] = useState('all');

    // Metrics
    const activeTemplates = templates.filter(t => t.active);
    const monthlyBurn = activeTemplates.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const monthlyIncome = activeTemplates.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);

    const filteredTemplates = templates.filter(t => {
        if (filter === 'all') return true;
        return t.type === filter;
    });

    useEffect(() => {
        if (user) {
            fetchTemplates();
        }
    }, [user]);

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('recurring_templates')
                .select('*')
                .order('next_due_date', { ascending: true });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
            addToast('Erro ao carregar recorrências.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNew = () => {
        setTemplateToEdit(null);
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (tmpl) => {
        setTemplateToEdit(tmpl);
        setDescription(tmpl.description);
        setAmount(tmpl.amount);
        setType(tmpl.type);
        setCategory(tmpl.category);
        setFrequency(tmpl.frequency);
        setNextDueDate(tmpl.next_due_date.split('T')[0]); // YYYY-MM-DD
        setExpenseType(tmpl.expense_type || 'variable');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
        setFrequency('monthly');
        setNextDueDate(new Date().toISOString().split('T')[0]);
        setExpenseType('variable');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                description,
                amount: parseFloat(amount),
                type,
                category,
                frequency,
                next_due_date: new Date(nextDueDate).toISOString(),
                expense_type: type === 'expense' ? expenseType : null,
                profile_id: user.id,
                active: true
            };

            let error;
            if (templateToEdit) {
                const { error: updateError } = await supabase
                    .from('recurring_templates')
                    .update(payload)
                    .eq('id', templateToEdit.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('recurring_templates')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            await fetchTemplates();
            setIsModalOpen(false);
            addToast(templateToEdit ? 'Recorrência atualizada!' : 'Recorrência criada!', 'success');
        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja excluir esta recorrência?')) return;
        try {
            const { error } = await supabase.from('recurring_templates').delete().eq('id', id);
            if (error) throw error;
            setTemplates(templates.filter(t => t.id !== id));
            addToast('Recorrência excluída.', 'success');
        } catch (error) {
            addToast('Erro ao excluir.', 'error');
        }
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('recurring_templates')
                .update({ active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setTemplates(templates.map(t =>
                t.id === id ? { ...t, active: !currentStatus } : t
            ));
            addToast(currentStatus ? 'Recorrência pausada.' : 'Recorrência ativada.', 'success');
        } catch (error) {
            addToast('Erro ao atualizar status.', 'error');
        }
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={<span>Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Recorrências</span></span>}
                subtitle="Gerencie seus gastos e ganhos fixos"
            >
                {templates.length > 0 && (
                    <Button onClick={handleOpenNew} icon={Plus} className="btn-primary">
                        <span className="responsive-btn-text">Nova Recorrência</span>
                    </Button>
                )}
            </PageHeader>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} width="100%" height="90px" borderRadius="16px" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Metrics Cards - Responsive Grid */}
                    <div className="grid-responsive mb-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <Card className="glass-card glow-on-hover" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '10px', background: 'rgba(246, 79, 89, 0.15)', borderRadius: '10px', color: '#f64f59' }}>
                                    <Zap size={24} />
                                </div>
                                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Custo Mensal</h3>
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>R$ {monthlyBurn.toFixed(2).replace('.', ',')}</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Despesas recorrentes ativas</p>
                        </Card>

                        <Card className="glass-card glow-on-hover" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '10px', background: 'rgba(18, 194, 233, 0.15)', borderRadius: '10px', color: '#12c2e9' }}>
                                    <TrendingUp size={24} />
                                </div>
                                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Receita Mensal</h3>
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>R$ {monthlyIncome.toFixed(2).replace('.', ',')}</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ganhos recorrentes ativos</p>
                        </Card>
                    </div>

                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        <Button
                            variant={filter === 'all' ? 'primary' : 'ghost'}
                            onClick={() => setFilter('all')}
                            style={{ borderRadius: '50px', padding: '0.5rem 1.2rem' }}
                        >
                            Todos
                        </Button>
                        <Button
                            variant={filter === 'expense' ? 'primary' : 'ghost'}
                            onClick={() => setFilter('expense')}
                            style={{ borderRadius: '50px', padding: '0.5rem 1.2rem' }}
                        >
                            Despesas
                        </Button>
                        <Button
                            variant={filter === 'income' ? 'primary' : 'ghost'}
                            onClick={() => setFilter('income')}
                            style={{ borderRadius: '50px', padding: '0.5rem 1.2rem' }}
                        >
                            Receitas
                        </Button>
                    </div>

                    {filteredTemplates.length === 0 ? (
                        <EmptyState
                            icon={Repeat}
                            title="Nenhuma recorrência encontrada"
                            description={filter === 'all' ? "Configure pagamentos automáticos como aluguel, assinaturas ou salário." : "Nenhum item neste filtro."}
                            actionText="Criar Recorrência"
                            onAction={handleOpenNew}
                        />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {filteredTemplates.map((tmpl, index) => (
                                <Card key={tmpl.id} className="fade-in glass-card" style={{ animationDelay: `${index * 0.05}s`, opacity: tmpl.active ? 1 : 0.6, borderLeft: tmpl.active && tmpl.type === 'expense' ? '4px solid #f64f59' : (tmpl.active ? '4px solid #12c2e9' : '4px solid transparent') }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{
                                            padding: '0.8rem',
                                            borderRadius: '12px',
                                            background: tmpl.type === 'income' ? 'rgba(18, 194, 233, 0.1)' : 'rgba(246, 79, 89, 0.1)',
                                            color: tmpl.type === 'income' ? '#12c2e9' : '#f64f59'
                                        }}>
                                            <Repeat size={20} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => toggleActive(tmpl.id, tmpl.active)}
                                                className="btn-ghost"
                                                title={tmpl.active ? "Pausar" : "Ativar"}
                                                style={{ color: tmpl.active ? '#00ebc7' : 'var(--text-muted)' }}
                                            >
                                                {tmpl.active ? <Check size={18} /> : <X size={18} />}
                                            </button>
                                            <button onClick={() => handleOpenEdit(tmpl)} className="btn-ghost" title="Editar"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(tmpl.id)} className="btn-ghost" style={{ color: '#f64f59' }} title="Excluir"><Trash2 size={18} /></button>
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{tmpl.description}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{tmpl.category} • {tmpl.frequency === 'monthly' ? 'Mensal' : 'Semanal'}</p>

                                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Próxima</p>
                                            <p style={{ fontSize: '0.9rem' }}>{new Date(tmpl.next_due_date).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 600, color: tmpl.type === 'income' ? '#12c2e9' : '#f64f59' }}>
                                                R$ {parseFloat(tmpl.amount).toFixed(2).replace('.', ',')}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={templateToEdit ? "Editar Recorrência" : "Nova Recorrência"}>
                <form onSubmit={handleSave}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Button
                            type="button"
                            className={type === 'expense' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'expense' ? 'var(--color-3)' : undefined, color: type === 'expense' ? '#fff' : undefined }}
                            onClick={() => setType('expense')}
                        >
                            Despesa
                        </Button>
                        <Button
                            type="button"
                            className={type === 'income' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'income' ? 'var(--color-4)' : undefined, color: type === 'income' ? '#fff' : undefined }}
                            onClick={() => setType('income')}
                        >
                            Receita
                        </Button>
                    </div>

                    <Input
                        label="Descrição"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />

                    <Input
                        label="Valor (R$)"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />

                    <Input
                        label="Categoria"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Ex: Aluguel, Salário"
                        required
                    />

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Frequência</label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="input-field"
                        >
                            <option value="monthly">Mensal</option>
                            <option value="weekly">Semanal</option>
                        </select>
                    </div>

                    <Input
                        label="Próximo Vencimento"
                        type="date"
                        value={nextDueDate}
                        onChange={(e) => setNextDueDate(e.target.value)}
                        required
                    />

                    <Button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} loading={submitting}>
                        Salvar
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
