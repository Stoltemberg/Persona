import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { OnboardingTour } from '../components/OnboardingTour';
import { Skeleton } from '../components/Skeleton';
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';

import { usePrivacy } from '../context/PrivacyContext';
import { CountUp } from '../components/CountUp';
import { PageHeader } from '../components/PageHeader';
import { UpcomingBills } from '../components/UpcomingBills';

const listVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
};

export default function Dashboard() {
    const { user, profile, signOut } = useAuth();
    const { isPrivacyMode } = usePrivacy();
    const [balance, setBalance] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [savings, setSavings] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [primaryGoal, setPrimaryGoal] = useState(null);
    const [loading, setLoading] = useState(true);

    const [newTxId, setNewTxId] = useState(null);

    useEffect(() => {
        if (user) {
            checkRecurring();
            fetchFinancialData();

            const handleUpdate = () => fetchFinancialData();
            const handleInsert = (e) => fetchFinancialData(e.detail?.id);

            window.addEventListener('transaction-updated', handleUpdate);
            window.addEventListener('transaction-inserted', handleInsert);
            window.addEventListener('supabase-sync', handleUpdate);

            return () => {
                window.removeEventListener('transaction-updated', handleUpdate);
                window.removeEventListener('transaction-inserted', handleInsert);
                window.removeEventListener('supabase-sync', handleUpdate);
            };
        }
    }, [user]);

    const checkRecurring = async () => {
        try {
            const now = new Date();
            const { data: templates } = await supabase
                .from('recurring_templates')
                .select('*')
                .eq('active', true)
                .lte('next_due_date', now.toISOString());

            if (templates && templates.length > 0) {
                for (const tmpl of templates) {
                    const { error: txError } = await supabase.from('transactions').insert([{
                        description: tmpl.description,
                        amount: tmpl.amount,
                        type: tmpl.type,
                        category: tmpl.category,
                        expense_type: tmpl.expense_type,
                        date: new Date().toISOString(),
                        profile_id: user.id
                    }]);

                    if (!txError) {
                        const nextDate = new Date(tmpl.next_due_date);
                        if (tmpl.frequency === 'monthly') {
                            nextDate.setMonth(nextDate.getMonth() + 1);
                        } else if (tmpl.frequency === 'weekly') {
                            nextDate.setDate(nextDate.getDate() + 7);
                        }

                        await supabase.from('recurring_templates').update({
                            last_generated_date: new Date().toISOString(),
                            next_due_date: nextDate.toISOString()
                        }).eq('id', tmpl.id);
                    }
                }
                fetchFinancialData();
            }
        } catch (error) {
            console.error('Error processing recurring:', error);
        }
    };

    const fetchFinancialData = async (newTransactionId = null) => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')

                .order('date', { ascending: false });

            if (error) throw error;

            let totalIncome = 0;
            let totalExpense = 0;
            let monthlyExpense = 0;

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            data.forEach(tx => {
                const amount = parseFloat(tx.amount);
                const date = new Date(tx.date);

                if (tx.type === 'income') {
                    totalIncome += amount;
                } else {
                    totalExpense += amount;
                    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                        monthlyExpense += amount;
                    }
                }
            });

            const { data: goalsData } = await supabase
                .from('goals')
                .select('*')
                ;

            let totalSavings = 0;
            let goal = null;

            if (goalsData) {
                totalSavings = goalsData.reduce((acc, curr) => acc + (parseFloat(curr.current_amount) || 0), 0);
                goal = goalsData.find(g => g.is_primary) || null;
            }

            const { data: walletsData } = await supabase
                .from('wallets')
                .select('*')
                ;

            let walletsWithBalance = [];
            if (walletsData) {
                walletsWithBalance = walletsData.map(w => {
                    const walletTxs = data.filter(tx => tx.wallet_id === w.id);
                    const income = walletTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
                    const expense = walletTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
                    return {
                        ...w,
                        current_balance: (parseFloat(w.initial_balance) || 0) + income - expense
                    };
                });
            }

            setBalance(totalIncome - totalExpense);
            setExpenses(monthlyExpense);
            setSavings(totalSavings);
            setPrimaryGoal(goal);
            setWallets(walletsWithBalance);
            setRecentTransactions(data.slice(0, 5));
            setAllTransactions(data);

            if (newTransactionId) {
                setNewTxId(newTransactionId);
                setTimeout(() => setNewTxId(null), 2000);
            }

        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <OnboardingTour />

            <PageHeader
                className="dashboard-header-centered"
                title={<span>Olá, <span style={{ fontWeight: 600 }}>{profile?.full_name?.split(' ')[0] || 'Usuário'}</span></span>}
            />

            {/* Hero Balance Section */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-14 text-center"
            >
                <p className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary mb-3">Saldo Total</p>
                <div className="text-5xl md:text-6xl font-display font-semibold tracking-tight leading-tight min-h-[80px] flex items-center justify-center">
                    {loading ? (
                        <div className="w-52 h-16 bg-white/5 animate-pulse rounded-2xl mx-auto" />
                    ) : (
                        isPrivacyMode ? (
                            <span className="blur-md select-none">R$ 10.000,00</span>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            >
                                <CountUp end={balance} prefix="R$ " duration={2} />
                            </motion.div>
                        )
                    )}
                </div>
            </motion.section>

            {/* Asymmetric Bento Grid for Stats */}
            <motion.div 
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-14 w-full"
            >
                {/* Large Stats Card (Expenses) - Col 1-7 */}
                <motion.div variants={itemVariants} className="md:col-span-7">
                    <Link to="/planning" className="block h-full group">
                        <div className="glass h-full p-8 rounded-3xl relative overflow-hidden transition-all duration-500 hover:border-brand/40 hover:bg-white/[0.03]">
                            {/* Decorative Background Gradient */}
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-danger/10 blur-[60px] rounded-full group-hover:bg-danger/20 transition-colors" />
                            
                            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                                        <ArrowUpRight size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-text-secondary tracking-wide uppercase">Saídas Mensais</span>
                                </div>
                                
                                <div>
                                    <div className="text-3xl font-display font-semibold text-danger mb-1">
                                        {loading ? '...' : (isPrivacyMode ? '••••' : `R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
                                    </div>
                                    <p className="text-xs text-text-muted">Previsto para este mês</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Smaller Stats Card (Savings) - Col 8-12 */}
                <motion.div variants={itemVariants} className="md:col-span-5">
                    <Link to="/planning" className="block h-full group">
                        <div className="glass h-full p-8 rounded-3xl relative overflow-hidden transition-all duration-500 hover:border-success/40 hover:bg-white/[0.03]">
                            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-success/10 blur-[50px] rounded-full group-hover:bg-success/20 transition-colors" />
                            
                            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                                        <PiggyBank size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-text-secondary tracking-wide uppercase">Economias</span>
                                </div>
                                
                                <div>
                                    <div className="text-2xl font-display font-semibold text-success mb-1">
                                        {loading ? '...' : (isPrivacyMode ? '••••' : `R$ ${savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
                                    </div>
                                    <p className="text-xs text-text-muted">Total acumulado</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </motion.div>

            {/* Upcoming Bills Widget */}
            <UpcomingBills />

            {/* Recent Transactions */}
            <div>
                <div className="dashboard-section-header">
                    <h3 className="dashboard-section-title">Últimas movimentações</h3>
                </div>

                <motion.div
                    className="flex flex-col gap-3"
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                >
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="w-full h-20 bg-white/5 animate-pulse rounded-3xl" />
                        ))
                    ) : recentTransactions.length === 0 ? (
                        <p className="text-center text-text-muted py-12 text-sm italic">Sem movimentações recentes</p>
                    ) : (
                        recentTransactions.map((tx, index) => (
                            <motion.div 
                                key={tx.id} 
                                variants={itemVariants} 
                                className={clsx(
                                    "glass p-4 rounded-[24px] flex items-center justify-between transition-all duration-300 hover:bg-white/[0.03] group",
                                    newTxId === tx.id && "ring-2 ring-brand ring-offset-2 ring-offset-background"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                                        tx.type === 'income' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                                    )}>
                                        {tx.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-text-main text-sm mb-0.5 group-hover:text-brand transition-colors">
                                            {tx.description}
                                        </div>
                                        <div className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
                                            {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </div>
                                    </div>
                                </div>
                                <div className={clsx(
                                    "font-display font-bold text-base tracking-tight",
                                    tx.type === 'income' ? 'text-success' : 'text-text-main'
                                )}>
                                    {isPrivacyMode ? '••••' : (tx.type === 'income' ? '+' : '-') + ` R$ ${parseFloat(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>

                {recentTransactions.length > 0 && !loading && (
                    <div className="dashboard-footer-action">
                        <Link to="/transactions" className="dashboard-section-link">
                            Ver tudo
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
