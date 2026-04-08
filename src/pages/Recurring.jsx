import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Edit2, Plus, Repeat, Trash2, TrendingUp, Wallet, X, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../context/ToastContext';

const getToday = () => new Date().toISOString().split('T')[0];

export default function Recurring() {
    const { user } = useAuth();
    const { addToast, addActionToast } = useToast();
    const [templates, setTemplates] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [nextDueDate, setNextDueDate] = useState(getToday());
    const [expenseType, setExpenseType] = useState('variable');
    const [filter, setFilter] = useState('all');
    const pendingDeleteTimers = useRef(new Map());

    useEffect(() => {
        if (!user) return;
        fetchTemplates();
        fetchWallets();
    }, [user]);

    useEffect(() => () => {
        pendingDeleteTimers.current.forEach((timer) => clearTimeout(timer));
        pendingDeleteTimers.current.clear();
    }, []);

    const activeTemplates = useMemo(() => templates.filter((item) => item.active), [templates]);
    const monthlyBurn = activeTemplates
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const monthlyIncome = activeTemplates
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const filteredTemplates = templates.filter((item) => filter === 'all' || item.type === filter);

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
            addToast('Erro ao carregar recorrencias.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchWallets = async () => {
        try {
            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setWallets(data || []);

            if (data && data.length > 0 && !selectedWalletId) {
                setSelectedWalletId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching wallets:', error);
        }
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
        setSelectedWalletId(wallets[0]?.id || '');
        setFrequency('monthly');
        setNextDueDate(getToday());
        setExpenseType('variable');
        setTemplateToEdit(null);
    };

    const handleOpenNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (template) => {
        setTemplateToEdit(template);
        setDescription(template.description);
        setAmount(String(template.amount));
        setType(template.type);
        setCategory(template.category);
        setSelectedWalletId(template.wallet_id || wallets[0]?.id || '');
        setFrequency(template.frequency);
        setNextDueDate(template.next_due_date?.split('T')[0] || getToday());
        setExpenseType(template.expense_type || 'variable');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            if (!selectedWalletId) {
                throw new Error('Selecione a carteira desta recorrencia.');
            }

            const payload = {
                description,
                amount: parseFloat(amount),
                type,
                category,
                wallet_id: selectedWalletId,
                frequency,
                next_due_date: new Date(nextDueDate).toISOString(),
                expense_type: type === 'expense' ? expenseType : null,
                profile_id: user.id,
                active: true,
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
            handleCloseModal();
            addToast(templateToEdit ? 'Recorrencia atualizada.' : 'Recorrencia criada.', 'success');
        } catch (error) {
            addToast(error.message || 'Erro ao salvar recorrencia.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        const template = templates.find((item) => item.id === id);
        if (!template) return;

        setTemplates((prev) => prev.filter((item) => item.id !== id));

        const timer = setTimeout(async () => {
            pendingDeleteTimers.current.delete(id);
            try {
                const { error } = await supabase.from('recurring_templates').delete().eq('id', id);
                if (error) throw error;
                addToast('Recorrencia excluida.', 'success');
            } catch (error) {
                setTemplates((prev) => [...prev, template].sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date)));
                addToast('Erro ao excluir recorrencia.', 'error');
            }
        }, 5000);

        pendingDeleteTimers.current.set(id, timer);

        addActionToast('Recorrencia removida.', 'Desfazer', () => {
            const pendingTimer = pendingDeleteTimers.current.get(id);
            if (pendingTimer) {
                clearTimeout(pendingTimer);
                pendingDeleteTimers.current.delete(id);
                setTemplates((prev) => [...prev, template].sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date)));
            }
        }, 'info');
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('recurring_templates')
                .update({ active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setTemplates((prev) => prev.map((item) => (item.id === id ? { ...item, active: !currentStatus } : item)));
            addToast(currentStatus ? 'Recorrencia pausada.' : 'Recorrencia ativada.', 'success');
        } catch (error) {
            addToast('Erro ao atualizar status.', 'error');
        }
    };

    return (
        <div className="container fade-in app-page-shell" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={<span>Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Recorrencias</span></span>}
                subtitle="Acompanhe entradas e saidas automaticas com o mesmo padrao visual das outras areas."
            >
                <Button onClick={handleOpenNew} icon={Plus} className="btn-primary">
                    Nova recorrencia
                </Button>
            </PageHeader>

            {loading ? (
                <div className="app-list-grid">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} width="100%" height="180px" borderRadius="20px" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="app-summary-grid">
                        <Card hover={false} className="app-summary-card app-summary-card-danger">
                            <div className="app-summary-topline">
                                <div className="app-summary-icon app-summary-icon-danger">
                                    <Zap size={18} />
                                </div>
                                <span className="app-summary-label">Custo mensal</span>
                            </div>
                            <strong className="app-summary-value">R$ {monthlyBurn.toFixed(2).replace('.', ',')}</strong>
                        </Card>
                        <Card hover={false} className="app-summary-card app-summary-card-success">
                            <div className="app-summary-topline">
                                <div className="app-summary-icon app-summary-icon-success">
                                    <TrendingUp size={18} />
                                </div>
                                <span className="app-summary-label">Receita mensal</span>
                            </div>
                            <strong className="app-summary-value">R$ {monthlyIncome.toFixed(2).replace('.', ',')}</strong>
                        </Card>
                        <Card hover={false} className="app-summary-card app-summary-card-neutral">
                            <div className="app-summary-topline">
                                <div className="app-summary-icon app-summary-icon-neutral">
                                    <Repeat size={18} />
                                </div>
                                <span className="app-summary-label">Recorrencias ativas</span>
                            </div>
                            <strong className="app-summary-value">{activeTemplates.length}</strong>
                        </Card>
                    </div>

                    <div className="app-chip-row">
                        <button type="button" className={`app-filter-chip${filter === 'all' ? ' is-active' : ''}`} onClick={() => setFilter('all')}>
                            Todos
                        </button>
                        <button type="button" className={`app-filter-chip${filter === 'expense' ? ' is-active danger' : ''}`} onClick={() => setFilter('expense')}>
                            Despesas
                        </button>
                        <button type="button" className={`app-filter-chip${filter === 'income' ? ' is-active success' : ''}`} onClick={() => setFilter('income')}>
                            Receitas
                        </button>
                    </div>

                    {filteredTemplates.length === 0 ? (
                        <EmptyState
                            icon={Repeat}
                            title="Nenhuma recorrencia encontrada"
                            description={filter === 'all' ? 'Configure pagamentos automaticos como aluguel, salario ou assinaturas.' : 'Nenhum item neste filtro.'}
                            actionText="Criar recorrencia"
                            onAction={handleOpenNew}
                        />
                    ) : (
                        <div className="app-list-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {filteredTemplates.map((template) => (
                                <Card key={template.id} hover className="app-section-card">
                                    <div className="app-section-header">
                                        <div className="app-list-card-main">
                                            <span className="app-inline-icon" style={{ color: template.type === 'income' ? '#12c2e9' : '#f64f59' }}>
                                                <Repeat size={18} />
                                            </span>
                                            <div>
                                                <strong>{template.description}</strong>
                                                <span>{template.category}</span>
                                            </div>
                                        </div>
                                        <div className="app-list-card-actions">
                                            <button
                                                onClick={() => toggleActive(template.id, template.active)}
                                                className="btn-ghost btn-icon"
                                                title={template.active ? 'Pausar' : 'Ativar'}
                                                style={{ color: template.active ? '#30d158' : 'var(--text-muted)' }}
                                            >
                                                {template.active ? <Check size={16} /> : <X size={16} />}
                                            </button>
                                            <button onClick={() => handleOpenEdit(template)} className="btn-ghost btn-icon" title="Editar">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(template.id)} className="btn-ghost btn-icon" style={{ color: '#f64f59' }} title="Excluir">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="app-summary-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <Card hover={false} className={`app-summary-card ${template.type === 'income' ? 'app-summary-card-success' : 'app-summary-card-danger'}`}>
                                            <span className="app-summary-label">Valor</span>
                                            <strong className="app-summary-value">R$ {parseFloat(template.amount).toFixed(2).replace('.', ',')}</strong>
                                        </Card>
                                        <Card hover={false} className="app-summary-card app-summary-card-neutral">
                                            <span className="app-summary-label">Proxima data</span>
                                            <strong className="app-summary-value">{new Date(template.next_due_date).toLocaleDateString('pt-BR')}</strong>
                                        </Card>
                                    </div>

                                    <div className="app-list-card-main" style={{ justifyContent: 'space-between' }}>
                                        <div>
                                            <strong>{wallets.find((wallet) => wallet.id === template.wallet_id)?.name || 'Sem carteira'}</strong>
                                            <span>{template.frequency === 'monthly' ? 'Mensal' : 'Semanal'}</span>
                                        </div>
                                        {!template.active && <span className="dashboard-partner-chip" style={{ marginLeft: 0 }}>Pausada</span>}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={templateToEdit ? 'Editar recorrencia' : 'Nova recorrencia'}>
                <form onSubmit={handleSave}>
                    <div className="app-chip-row" style={{ marginBottom: '1.5rem' }}>
                        <button
                            type="button"
                            className={`app-filter-chip${type === 'expense' ? ' is-active danger' : ''}`}
                            onClick={() => setType('expense')}
                        >
                            Despesa
                        </button>
                        <button
                            type="button"
                            className={`app-filter-chip${type === 'income' ? ' is-active success' : ''}`}
                            onClick={() => setType('income')}
                        >
                            Receita
                        </button>
                    </div>

                    <Input label="Descricao" value={description} onChange={(event) => setDescription(event.target.value)} required />
                    <Input label="Valor (R$)" type="number" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
                    <Input label="Categoria" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ex: Aluguel, Salario" required />

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label>Carteira</label>
                        <select value={selectedWalletId} onChange={(event) => setSelectedWalletId(event.target.value)} className="input-field" required>
                            {wallets.length === 0 ? (
                                <option value="">Cadastre uma carteira primeiro</option>
                            ) : (
                                wallets.map((wallet) => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label>Frequencia</label>
                        <select value={frequency} onChange={(event) => setFrequency(event.target.value)} className="input-field">
                            <option value="monthly">Mensal</option>
                            <option value="weekly">Semanal</option>
                        </select>
                    </div>

                    {type === 'expense' && (
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Tipo de gasto</label>
                            <select value={expenseType} onChange={(event) => setExpenseType(event.target.value)} className="input-field">
                                <option value="fixed">Fixo</option>
                                <option value="variable">Variavel</option>
                                <option value="lifestyle">Lazer</option>
                            </select>
                        </div>
                    )}

                    <Input label="Proximo vencimento" type="date" value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} required />

                    <Button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }} loading={submitting}>
                        {templateToEdit ? 'Salvar alteracoes' : 'Salvar recorrencia'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
