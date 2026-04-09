import { useEffect, useMemo, useRef, useState } from 'react';
import { Edit2, Plus, Tag, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../context/ToastContext';
import { CategoryIcon, CATEGORY_ICON_OPTIONS, normalizeCategoryIcon } from '../utils/categoryIcons';

const DEFAULT_ICON = 'tag';

export default function Categories() {
    const { user } = useAuth();
    const { addToast, addActionToast } = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState(DEFAULT_ICON);
    const [color, setColor] = useState('#c471ed');
    const [type, setType] = useState('expense');
    const pendingDeleteTimers = useRef(new Map());

    useEffect(() => {
        if (user) fetchCategories();
    }, [user]);

    useEffect(() => () => {
        pendingDeleteTimers.current.forEach((timer) => clearTimeout(timer));
        pendingDeleteTimers.current.clear();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;

            setCategories((data || []).map((category) => ({
                ...category,
                icon: normalizeCategoryIcon(category.icon),
            })));
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const expenseCategories = useMemo(
        () => categories.filter((item) => item.type === 'expense'),
        [categories],
    );
    const incomeCategories = useMemo(
        () => categories.filter((item) => item.type === 'income'),
        [categories],
    );

    const resetForm = () => {
        setName('');
        setIcon(DEFAULT_ICON);
        setColor('#c471ed');
        setType('expense');
        setEditingCategory(null);
    };

    const handleOpenNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (category) => {
        setEditingCategory(category);
        setName(category.name);
        setIcon(normalizeCategoryIcon(category.icon));
        setColor(category.color || '#c471ed');
        setType(category.type);
        setIsModalOpen(true);
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                name,
                icon,
                color,
                type,
                profile_id: user.id,
            };

            let error;
            if (editingCategory) {
                const { error: updateError } = await supabase
                    .from('categories')
                    .update(payload)
                    .eq('id', editingCategory.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('categories')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            await fetchCategories();
            setIsModalOpen(false);
            resetForm();
            addToast(editingCategory ? 'Categoria atualizada.' : 'Categoria criada.', 'success');
        } catch (error) {
            addToast(error.message || 'Erro ao salvar categoria.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        const category = categories.find((item) => item.id === id);
        if (!category) return;

        setCategories((prev) => prev.filter((item) => item.id !== id));

        const timer = setTimeout(async () => {
            pendingDeleteTimers.current.delete(id);
            try {
                const { error } = await supabase.from('categories').delete().eq('id', id);
                if (error) throw error;
                addToast('Categoria excluida.', 'success');
            } catch (error) {
                setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
                addToast(`Erro ao excluir categoria: ${error.message}`, 'error');
            }
        }, 5000);

        pendingDeleteTimers.current.set(id, timer);

        addActionToast('Categoria removida.', 'Desfazer', () => {
            const pendingTimer = pendingDeleteTimers.current.get(id);
            if (pendingTimer) {
                clearTimeout(pendingTimer);
                pendingDeleteTimers.current.delete(id);
                setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
            }
        }, 'info');
    };

    const summaryCards = [
        {
            label: 'Total de categorias',
            value: categories.length,
            icon: Tag,
            tone: 'neutral',
        },
        {
            label: 'Despesas',
            value: expenseCategories.length,
            icon: TrendingDown,
            tone: 'danger',
        },
        {
            label: 'Receitas',
            value: incomeCategories.length,
            icon: TrendingUp,
            tone: 'success',
        },
    ];

    return (
        <div className="container fade-in app-page-shell" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={<span>Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Categorias</span></span>}
                subtitle="Troque emojis por uma linguagem visual mais limpa e consistente."
            >
                <Button onClick={handleOpenNew} icon={Plus} className="btn-primary">
                    Nova categoria
                </Button>
            </PageHeader>

            <div className="app-summary-grid">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.label} hover={false} className={`app-summary-card app-summary-card-${card.tone}`}>
                            <div className="app-summary-topline">
                                <div className={`app-summary-icon app-summary-icon-${card.tone}`}>
                                    <Icon size={18} />
                                </div>
                                <span className="app-summary-label">{card.label}</span>
                            </div>
                            <strong className="app-summary-value">{card.value}</strong>
                        </Card>
                    );
                })}
            </div>

            {loading ? (
                <div className="app-section-grid">
                    <Card className="glass-card app-section-card">
                        <p>Carregando categorias...</p>
                    </Card>
                </div>
            ) : (
                <div className="app-section-grid">
                    <section className="glass-card app-section-card">
                        <div className="app-section-header">
                            <div>
                                <h3>Despesas</h3>
                                <p>Padrao visual para gastos recorrentes e variaveis.</p>
                            </div>
                            <div className="app-summary-icon app-summary-icon-danger">
                                <TrendingDown size={18} />
                            </div>
                        </div>

                        <div className="app-stack-list">
                            {expenseCategories.length === 0 ? (
                                <div className="app-empty-inline">Nenhuma categoria de despesa ainda.</div>
                            ) : (
                                expenseCategories.map((category) => (
                                    <CategoryItem
                                        key={category.id}
                                        category={category}
                                        onEdit={() => handleOpenEdit(category)}
                                        onDelete={() => handleDelete(category.id)}
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    <section className="glass-card app-section-card">
                        <div className="app-section-header">
                            <div>
                                <h3>Receitas</h3>
                                <p>Entradas com os mesmos icones e o mesmo acabamento visual.</p>
                            </div>
                            <div className="app-summary-icon app-summary-icon-success">
                                <TrendingUp size={18} />
                            </div>
                        </div>

                        <div className="app-stack-list">
                            {incomeCategories.length === 0 ? (
                                <div className="app-empty-inline">Nenhuma categoria de receita ainda.</div>
                            ) : (
                                incomeCategories.map((category) => (
                                    <CategoryItem
                                        key={category.id}
                                        category={category}
                                        onEdit={() => handleOpenEdit(category)}
                                        onDelete={() => handleDelete(category.id)}
                                    />
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Editar categoria' : 'Nova categoria'}>
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

                    <Input label="Nome" value={name} onChange={(event) => setName(event.target.value)} required placeholder="Ex: Mercado" />

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label>Icone</label>
                        <div className="app-icon-grid">
                            {CATEGORY_ICON_OPTIONS.map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    className={`app-icon-option${icon === option.key ? ' is-active' : ''}`}
                                    onClick={() => setIcon(option.key)}
                                    aria-label={option.label}
                                    title={option.label}
                                >
                                    <option.Icon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label>Cor</label>
                        <div className="app-color-row">
                            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="app-color-input" />
                            <span>{color}</span>
                        </div>
                    </div>

                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} loading={submitting}>
                        Salvar categoria
                    </Button>
                </form>
            </Modal>
        </div>
    );
}

function CategoryItem({ category, onEdit, onDelete }) {
    return (
        <Card hover className="app-list-card" style={{ borderLeft: `4px solid ${category.color}` }}>
            <div className="app-list-card-main">
                <span className="app-inline-icon" style={{ color: category.color }}>
                    <CategoryIcon icon={category.icon} size={18} />
                </span>
                <div>
                    <strong>{category.name}</strong>
                    <span>{category.type === 'income' ? 'Receita' : 'Despesa'}</span>
                </div>
            </div>

            <div className="app-list-card-actions">
                <button onClick={onEdit} className="btn-ghost btn-icon" aria-label={`Editar ${category.name}`}>
                    <Edit2 size={16} />
                </button>
                <button onClick={onDelete} className="btn-ghost btn-icon" style={{ color: '#f64f59' }} aria-label={`Excluir ${category.name}`}>
                    <Trash2 size={16} />
                </button>
            </div>
        </Card>
    );
}
