import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function Transactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (user) fetchTransactions();
    }, [user]);

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { error } = await supabase.from('transactions').insert([
                {
                    description,
                    amount: parseFloat(amount),
                    type,
                    category,
                    date: new Date().toISOString(),
                    profile_id: user.id,
                },
            ]);

            if (error) throw error;

            await fetchTransactions();
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Transações</h1>
                <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                    Nova Transação
                </Button>
            </header>

            {/* Transaction List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <p>Carregando...</p>
                ) : transactions.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhuma transação encontrada. Adicione a primeira!
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <Card key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    padding: '0.75rem',
                                    borderRadius: '50%',
                                    background: tx.type === 'income' ? 'rgba(18, 194, 233, 0.2)' : 'rgba(246, 79, 89, 0.2)',
                                    color: tx.type === 'income' ? 'var(--secondary)' : 'var(--accent)'
                                }}>
                                    {tx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div>
                                    <h4 style={{ marginBottom: '0.2rem' }}>{tx.description}</h4>
                                    <p style={{ fontSize: '0.85rem' }}>{tx.category} • {new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h3 style={{
                                    color: tx.type === 'income' ? 'var(--secondary)' : 'var(--text-main)',
                                    fontWeight: 600
                                }}>
                                    {tx.type === 'income' ? '+ ' : '- '}R$ {parseFloat(tx.amount).toFixed(2).replace('.', ',')}
                                </h3>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Add Transaction Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Transação">
                <form onSubmit={handleAddTransaction}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <Button
                            type="button"
                            className={type === 'expense' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'expense' ? 'var(--accent)' : undefined }}
                            onClick={() => setType('expense')}
                        >
                            Despesa
                        </Button>
                        <Button
                            type="button"
                            className={type === 'income' ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, justifyContent: 'center', background: type === 'income' ? 'var(--secondary)' : undefined }}
                            onClick={() => setType('income')}
                        >
                            Receita
                        </Button>
                    </div>

                    <Input
                        placeholder="Valor"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                    <Input
                        placeholder="Descrição (ex: Supermercado)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                    <Input
                        placeholder="Categoria (ex: Alimentação, Transporte)"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />

                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} loading={submitting}>
                        Salvar
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
