import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const DEFAULT_ICON = '🏷️';

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
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNew = () => {
        setEditingCategory(null);
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (category) => {
        setEditingCategory(category);
        setName(category.name);
        setIcon(category.icon || DEFAULT_ICON);
        setColor(category.color || '#c471ed');
        setType(category.type);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setName('');
        setIcon(DEFAULT_ICON);
        setColor('#c471ed');
        setType('expense');
        setEditingCategory(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
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
                addToast('Categoria excluída.', 'success');
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

    const expenseCategories = categories.filter((item) => item.type === 'expense');
    const incomeCategories = categories.filter((item) => item.type === 'income');

    return (
        <div className="container fade-in" style={{ paddingBottom: '80px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', paddingTop: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                        Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Categorias</span>
                    </h1>
                    <p style={{ opacity: 0.6 }}>Personalize como você organiza seu dinheiro</p>
                </div>
                <Button onClick={handleOpenNew} icon={Plus}>Nova Categoria</Button>
            </header>

            {loading ? (
                <p>Carregando categorias...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f64f59' }}>
                            <TrendingDown size={20} />
                            <h3>Despesas</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {expenseCategories.length === 0 && <p style={{ opacity: 0.5 }}>Nenhuma categoria.</p>}
                            {expenseCategories.map((category) => (
                                <CategoryItem key={category.id} category={category} onEdit={() => handleOpenEdit(category)} onDelete={() => handleDelete(category.id)} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#12c2e9' }}>
                            <TrendingUp size={20} />
                            <h3>Receitas</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {incomeCategories.length === 0 && <p style={{ opacity: 0.5 }}>Nenhuma categoria.</p>}
                            {incomeCategories.map((category) => (
                                <CategoryItem key={category.id} category={category} onEdit={() => handleOpenEdit(category)} onDelete={() => handleDelete(category.id)} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}>
                <form onSubmit={handleSave}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Button
                            type="button"
                            className={type === 'expense' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'expense' ? '#f64f59' : undefined, color: type === 'expense' ? '#fff' : undefined }}
                            onClick={() => setType('expense')}
                        >
                            Despesa
                        </Button>
                        <Button
                            type="button"
                            className={type === 'income' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'income' ? '#12c2e9' : undefined, color: type === 'income' ? '#fff' : undefined }}
                            onClick={() => setType('income')}
                        >
                            Receita
                        </Button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Mercado" />
                        </div>
                        <div style={{ width: '80px' }}>
                            <Input label="Ícone" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder={DEFAULT_ICON} style={{ textAlign: 'center' }} />
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Cor</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '50px', height: '50px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{color}</span>
                        </div>
                    </div>

                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} loading={submitting}>
                        Salvar
                    </Button>
                </form>
            </Modal>
        </div>
    );
}

function CategoryItem({ category, onEdit, onDelete }) {
    return (
        <Card hover style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderLeft: `4px solid ${category.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{category.icon || DEFAULT_ICON}</span>
                <span style={{ fontWeight: 600 }}>{category.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={onEdit} className="btn-ghost" style={{ padding: '0.5rem' }} aria-label={`Editar ${category.name}`}><Edit2 size={16} /></button>
                <button onClick={onDelete} className="btn-ghost" style={{ padding: '0.5rem', color: '#f64f59' }} aria-label={`Excluir ${category.name}`}><Trash2 size={16} /></button>
            </div>
        </Card>
    );
}
