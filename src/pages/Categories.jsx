import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Plus, Trash2, Edit2, Wallet, TrendingUp, TrendingDown, Tag } from 'lucide-react';

export default function Categories() {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form
    const [editingCategory, setEditingCategory] = useState(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🏷️'); // Default emoji
    const [color, setColor] = useState('#c471ed');
    const [type, setType] = useState('expense');

    useEffect(() => {
        if (user) fetchCategories();
    }, [user]);

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

    const handleOpenEdit = (cat) => {
        setEditingCategory(cat);
        setName(cat.name);
        setIcon(cat.icon || '🏷️');
        setColor(cat.color || '#c471ed');
        setType(cat.type);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setName('');
        setIcon('🏷️');
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
                profile_id: user.id
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
        } catch (error) {
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza? Isso pode afetar transações antigas.')) return;
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            setCategories(categories.filter(c => c.id !== id));
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Expense Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f64f59' }}>
                        <TrendingDown size={20} />
                        <h3>Despesas</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {expenseCategories.length === 0 && <p style={{ opacity: 0.5 }}>Nenhuma categoria.</p>}
                        {expenseCategories.map(cat => (
                            <CategoryItem key={cat.id} cat={cat} onEdit={() => handleOpenEdit(cat)} onDelete={() => handleDelete(cat.id)} />
                        ))}
                    </div>
                </div>

                {/* Income Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#12c2e9' }}>
                        <TrendingUp size={20} />
                        <h3>Receitas</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {incomeCategories.length === 0 && <p style={{ opacity: 0.5 }}>Nenhuma categoria.</p>}
                        {incomeCategories.map(cat => (
                            <CategoryItem key={cat.id} cat={cat} onEdit={() => handleOpenEdit(cat)} onDelete={() => handleDelete(cat.id)} />
                        ))}
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? "Editar Categoria" : "Nova Categoria"}>
                <form onSubmit={handleSave}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Button type="button"
                            className={type === 'expense' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'expense' ? '#f64f59' : undefined, color: type === 'expense' ? '#fff' : undefined }}
                            onClick={() => setType('expense')}>
                            Despesa
                        </Button>
                        <Button type="button"
                            className={type === 'income' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'income' ? '#12c2e9' : undefined, color: type === 'income' ? '#fff' : undefined }}
                            onClick={() => setType('income')}>
                            Receita
                        </Button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <Input label="Nome" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Mercado" />
                        </div>
                        <div style={{ width: '80px' }}>
                            <Input label="Ícone" value={icon} onChange={e => setIcon(e.target.value)} placeholder="🏷️" style={{ textAlign: 'center' }} />
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Cor</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '50px', height: '50px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
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

function CategoryItem({ cat, onEdit, onDelete }) {
    return (
        <Card hover style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderLeft: `4px solid ${cat.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{cat.icon || '🏷️'}</span>
                <span style={{ fontWeight: 600 }}>{cat.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={onEdit} className="btn-ghost" style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                <button onClick={onDelete} className="btn-ghost" style={{ padding: '0.5rem', color: '#f64f59' }}><Trash2 size={16} /></button>
            </div>
        </Card>
    );
}
