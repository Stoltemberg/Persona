import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Check, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/useAuth';
import { formatCurrency } from '../utils/format';
import { useToast } from '../app/providers/ToastContext';
import { Card } from './Card';

export function UpcomingBills() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [bills, setBills] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (user) {
            fetchUpcomingBills();
            fetchWallets();

            const handleSync = (event) => {
                const table = event?.detail?.table;

                if (!table || table === 'recurring_templates' || table === 'transactions') {
                    fetchUpcomingBills();
                }

                if (!table || table === 'wallets') {
                    fetchWallets();
                }
            };

            window.addEventListener('supabase-sync', handleSync);
            return () => window.removeEventListener('supabase-sync', handleSync);
        }
    }, [user]);

    const fetchUpcomingBills = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            nextWeek.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('recurring_templates')
                .select('id, description, amount, category, wallet_id, expense_type, next_due_date, frequency, type')
                .eq('type', 'expense')
                .eq('active', true)
                .lte('next_due_date', nextWeek.toISOString())
                .order('next_due_date', { ascending: true });

            if (error?.code === '42703') {
                const fallbackResponse = await supabase
                    .from('recurring_templates')
                    .select('id, description, amount, category, expense_type, next_due_date, frequency, type')
                    .eq('type', 'expense')
                    .eq('active', true)
                    .lte('next_due_date', nextWeek.toISOString())
                    .order('next_due_date', { ascending: true });

                if (fallbackResponse.error) throw fallbackResponse.error;

                setBills((fallbackResponse.data || []).map((bill) => ({ ...bill, wallet_id: null })));
                return;
            }

            if (error) throw error;
            setBills(data || []);
        } catch (error) {
            console.error('Error fetching upcoming bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWallets = async () => {
        const { data, error } = await supabase.from('wallets').select('id, name');
        if (error) {
            console.error('Error fetching wallets:', error);
            return;
        }

        setWallets(data || []);
    };

    const handlePayBill = async (bill) => {
        setProcessingId(bill.id);

        try {
            if (!bill.wallet_id) {
                throw new Error('Edite esta recorrencia e selecione uma carteira antes de marcar como paga.');
            }

            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .insert([{
                    description: bill.description,
                    amount: bill.amount,
                    type: 'expense',
                    category: bill.category,
                    wallet_id: bill.wallet_id,
                    expense_type: bill.expense_type,
                    date: new Date().toISOString(),
                    profile_id: user.id,
                }])
                .select();

            if (txError) throw txError;

            const currentDueDate = new Date(bill.next_due_date);
            const nextDate = new Date(currentDueDate);

            if (bill.frequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }

            const { error: updateError } = await supabase
                .from('recurring_templates')
                .update({
                    last_generated_date: new Date().toISOString(),
                    next_due_date: nextDate.toISOString(),
                })
                .eq('id', bill.id);

            if (updateError) throw updateError;

            addToast('Conta registrada como paga.', 'success');

            if (txData?.[0]) {
                window.dispatchEvent(new CustomEvent('transaction-inserted', { detail: txData[0] }));
            }

            setBills((prev) => prev.filter((item) => item.id !== bill.id));
        } catch (error) {
            console.error('Error paying bill:', error);
            addToast('Erro ao registrar pagamento.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading || bills.length === 0) return null;

    return (
        <section className="dashboard-panel upcoming-widget-container">
            <div className="dashboard-panel-head">
                <div>
                    <span className="dashboard-panel-kicker">
                        <Calendar size={14} />
                        Proximos vencimentos
                    </span>
                    <h3 className="dashboard-panel-title">Contas dos proximos 7 dias</h3>
                    <p className="dashboard-panel-subtitle">Priorize o que vence primeiro e registre o pagamento sem sair do dashboard.</p>
                </div>
            </div>

            <div className="app-stack-list">
                {bills.map((bill) => {
                    const dueDate = new Date(bill.next_due_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    dueDate.setHours(0, 0, 0, 0);

                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isUrgent = diffDays <= 3;
                    const walletName = wallets.find((wallet) => wallet.id === bill.wallet_id)?.name || 'Carteira nao definida';

                    return (
                        <Card key={bill.id} hover={false} className={`app-list-card upcoming-bill-card${isUrgent ? ' is-urgent' : ''}`}>
                            <div className="app-list-card-main">
                                <span className={`app-inline-icon ${isUrgent ? 'upcoming-bill-icon-danger' : 'upcoming-bill-icon-neutral'}`}>
                                    {isUrgent ? <AlertCircle size={18} /> : <Clock size={18} />}
                                </span>
                                <div>
                                    <strong>{bill.description}</strong>
                                    <span>
                                        {diffDays === 0 ? 'Vence hoje' : diffDays === 1 ? 'Vence amanha' : `Vence em ${diffDays} dias`}
                                    </span>
                                    <span style={{ display: 'block', marginTop: '0.2rem' }}>{walletName}</span>
                                </div>
                            </div>

                            <div className="upcoming-bill-actions">
                                <strong className="upcoming-bill-amount">{formatCurrency(bill.amount)}</strong>
                                <button
                                    type="button"
                                    onClick={() => handlePayBill(bill)}
                                    disabled={processingId === bill.id}
                                    className="btn-ghost btn-icon upcoming-bill-pay"
                                    title="Marcar como pago"
                                >
                                    <Check size={18} />
                                </button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}
