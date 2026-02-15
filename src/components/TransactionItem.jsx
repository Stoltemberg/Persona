import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card } from './Card';

export function TransactionItem({ transaction, categories, onEdit, onDelete, index }) {
    const x = useMotionValue(0);
    const backgroundOpacity = useTransform(x, [-100, 0, 100], [1, 0, 1]);
    const backgroundColor = useTransform(x, [-100, 0, 100], ['#f64f59', 'transparent', '#12c2e9']);

    // Determine Category Logic (duplicated from Transactions.jsx for now)
    const cat = categories.find(c => c.name === transaction.category && c.type === transaction.type);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', marginBottom: '10px' }}
        >
            {/* Background Actions Layer */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: backgroundColor,
                    opacity: backgroundOpacity,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 20px',
                    borderRadius: '16px',
                    zIndex: 0
                }}
            >
                <Edit2 color="white" size={24} />
                <Trash2 color="white" size={24} />
            </motion.div>

            {/* Foreground Card Layer */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, { offset, velocity }) => {
                    if (offset.x < -100) {
                        onDelete(transaction.id);
                    } else if (offset.x > 100) {
                        onEdit(transaction);
                    }
                }}
                style={{ x, position: 'relative', zIndex: 1, background: 'var(--bg-panel)', borderRadius: '16px' }} // Ensure background is solid
            >
                <Card
                    hover={false}
                    className="transaction-card"
                    style={{
                        margin: 0,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <div className="transaction-left">
                        <div style={{
                            padding: '0.6rem',
                            borderRadius: '50%',
                            background: cat ? `${cat.color}20` : (transaction.type === 'income' ? 'rgba(10, 132, 255, 0.1)' : 'rgba(255, 69, 58, 0.1)'),
                            color: cat ? cat.color : (transaction.type === 'income' ? 'var(--color-info)' : 'var(--color-danger)'),
                            display: 'flex', alignItems: 'center', justifyItems: 'center',
                            fontSize: '1rem'
                        }}>
                            {cat ? cat.icon : (transaction.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />)}
                        </div>

                        <div>
                            <h4 style={{ marginBottom: '0.1rem', fontSize: '0.95rem' }}>{transaction.description}</h4>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                {transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                {transaction.expense_type && (
                                    <span style={{
                                        marginLeft: '0.5rem',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px',
                                        background: 'rgba(255,255,255,0.1)',
                                        fontSize: '0.75rem'
                                    }}>
                                        {transaction.expense_type === 'fixed' && 'Fixo'}
                                        {transaction.expense_type === 'variable' && 'Variável'}
                                        {transaction.expense_type === 'lifestyle' && 'Lazer'}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="transaction-right">
                        <div style={{ textAlign: 'right' }}>
                            <h3 style={{
                                color: transaction.type === 'income' ? 'var(--color-info)' : 'var(--color-danger)',
                                fontWeight: 500,
                                fontSize: '1rem'
                            }}>
                                {transaction.type === 'income' ? '+ ' : '- '}R$ {parseFloat(transaction.amount).toFixed(2).replace('.', ',')}
                            </h3>
                        </div>
                        {/* Desktop Actions (Hidden on mobile via CSS ideally, or kept as backup) */}
                        <div className="desktop-actions" style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}
                                className="btn-ghost btn-icon"
                                title="Editar"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}
                                className="btn-ghost btn-icon"
                                style={{ color: '#f64f59' }}
                                title="Excluir"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}
