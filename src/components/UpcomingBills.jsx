import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Check, AlertCircle, Calendar, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import clsx from 'clsx';

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
        <section className="mb-14">
            <motion.h3 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary mb-6 flex items-center justify-center gap-2"
            >
                <Calendar size={14} /> Próximos Vencimentos
            </motion.h3>

            <motion.div 
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.08 }
                    }
                }}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-4"
            >
                {bills.map(bill => {
                    const dueDate = new Date(bill.next_due_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    dueDate.setHours(0, 0, 0, 0);

                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isUrgent = diffDays <= 3;

                    return (
                        <motion.div 
                            key={bill.id} 
                            variants={{
                                hidden: { opacity: 0, scale: 0.98, y: 10 },
                                show: { opacity: 1, scale: 1, y: 0 }
                            }}
                            className={clsx(
                                "glass p-5 rounded-3xl flex items-center justify-between transition-all duration-300 group hover:bg-white/[0.03]",
                                isUrgent ? "border-danger/20" : "border-glass-border"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
                                    isUrgent ? "bg-danger/10 text-danger" : "bg-white/5 text-text-muted group-hover:text-text-main"
                                )}>
                                    {isUrgent ? <AlertCircle size={22} /> : <Clock size={22} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-text-main group-hover:text-brand transition-colors">
                                        {bill.description}
                                    </h4>
                                    <p className={clsx(
                                        "text-[11px] font-medium uppercase tracking-wider",
                                        isUrgent ? "text-danger" : "text-text-muted"
                                    )}>
                                        {diffDays === 0 ? 'Vence hoje' : diffDays === 1 ? 'Vence amanhã' : `Vence em ${diffDays} dias`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <span className={clsx(
                                    "text-base font-display font-semibold",
                                    isUrgent ? "text-danger" : "text-text-main"
                                )}>
                                    {formatCurrency(bill.amount)}
                                </span>
                                <button
                                    onClick={() => handlePayBill(bill)}
                                    disabled={processingId === bill.id}
                                    className={clsx(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                        isUrgent 
                                            ? "bg-danger/10 text-danger hover:bg-danger hover:text-white" 
                                            : "bg-success/10 text-success hover:bg-success hover:text-white",
                                        processingId === bill.id && "opacity-50 cursor-not-allowed"
                                    )}
                                    title="Marcar como pago"
                                >
                                    {processingId === bill.id ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                    ) : (
                                        <Check size={18} />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
}
