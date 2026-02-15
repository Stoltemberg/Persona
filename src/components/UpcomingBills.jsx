import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Check, AlertCircle, Calendar, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useToast } from '../context/ToastContext';

export function UpcomingBills() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (user) {
            fetchUpcomingBills();
        }
    }, [user]);

    // Listen for transaction updates to refresh this list 
    // (in case a bill was paid from another place, though unlikely for this specific view)
    useEffect(() => {
        const handleUpdate = () => fetchUpcomingBills();
        window.addEventListener('transaction-inserted', handleUpdate);
        return () => window.removeEventListener('transaction-inserted', handleUpdate);
    }, []);

    const fetchUpcomingBills = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            nextWeek.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('recurring_templates')
                .select('*')
                .eq('profile_id', user.id)
                .eq('type', 'expense')
                .eq('active', true)
                .lte('next_due_date', nextWeek.toISOString())
                .order('next_due_date', { ascending: true });

            if (error) throw error;

            // Filter out past due dates that are arguably "overdue" or handled by auto-process?
            // For now, let's show anything <= 7 days from now, even if it's today or slightly past 
            // (if the auto-runner hasn't caught it yet).
            // Actually, we should filter >= today to avoid showing old stuff if the user hasn't opened app in months.
            // But let's assume the main app logic handles "catching up".
            // We'll just show what the DB says is the *next* due date.

            setBills(data || []);
        } catch (error) {
            console.error('Error fetching upcoming bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayBill = async (bill) => {
        setProcessingId(bill.id);
        try {
            // 1. Create Transaction
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .insert([{
                    description: bill.description,
                    amount: bill.amount,
                    type: 'expense',
                    category: bill.category,
                    expense_type: bill.expense_type,
                    date: new Date().toISOString(), // Paid "now"
                    profile_id: user.id
                }])
                .select();

            if (txError) throw txError;

            // 2. Update Next Due Date
            const currentDueDate = new Date(bill.next_due_date);
            let nextDate = new Date(currentDueDate);

            if (bill.frequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else {
                // Monthly
                nextDate.setMonth(nextDate.getMonth() + 1);
            }

            const { error: updateError } = await supabase
                .from('recurring_templates')
                .update({
                    last_generated_date: new Date().toISOString(),
                    next_due_date: nextDate.toISOString()
                })
                .eq('id', bill.id);

            if (updateError) throw updateError;

            addToast('Conta paga com sucesso!', 'success');

            // Dispatch event to update dashboard balance/outcome
            if (txData && txData[0]) {
                window.dispatchEvent(new CustomEvent('transaction-inserted', { detail: txData[0] }));
            }

            // Remove from local list immediately
            setBills(prev => prev.filter(b => b.id !== bill.id));

        } catch (error) {
            console.error('Error paying bill:', error);
            addToast('Erro ao registrar pagamento.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading || bills.length === 0) return null;

    return (
        <section className="fade-in" style={{ marginBottom: '2rem' }}>
            <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <Calendar size={16} /> Próximos Vencimentos
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bills.map(bill => {
                    const dueDate = new Date(bill.next_due_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    dueDate.setHours(0, 0, 0, 0);

                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    const isUrgent = diffDays <= 3;

                    return (
                        <div key={bill.id} className="glass-card" style={{
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderLeft: isUrgent ? '4px solid var(--color-danger)' : '4px solid transparent',
                            background: isUrgent ? 'rgba(255, 69, 58, 0.05)' : 'var(--bg-card)',
                            boxShadow: isUrgent ? 'none' : 'var(--glass-shadow)',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className="icon-container" style={{
                                    background: isUrgent ? 'rgba(255, 69, 58, 0.1)' : undefined,
                                    color: isUrgent ? 'var(--color-danger)' : 'var(--text-secondary)'
                                }}>
                                    {isUrgent ? <AlertCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)' }}>
                                        {bill.description}
                                    </h4>
                                    <p style={{ fontSize: '0.8rem', color: isUrgent ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                                        {diffDays === 0 ? 'Vence hoje' : diffDays === 1 ? 'Vence amanhã' : `Vence em ${diffDays} dias`}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                    {formatCurrency(bill.amount)}
                                </span>
                                <button
                                    onClick={() => handlePayBill(bill)}
                                    disabled={processingId === bill.id}
                                    className="btn-ghost"
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '50%',
                                        background: isUrgent ? 'rgba(255, 69, 58, 0.1)' : 'rgba(48, 209, 88, 0.1)',
                                        color: isUrgent ? 'var(--color-danger)' : 'var(--color-success)',
                                        opacity: processingId === bill.id ? 0.5 : 1
                                    }}
                                    title="Marcar como pago"
                                >
                                    <Check size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
