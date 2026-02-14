import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card } from './Card';

export function TransactionItem({ transaction, categories, onEdit, onDelete, index }) {
    const x = useMotionValue(0);
    const backgroundOpacity = useTransform(x, [-100, 0, 100], [1, 0, 1]);
    const backgroundColor = useTransform(x, [-100, 0, 100], ['var(--color-red)', 'transparent', 'var(--color-blue)']);

    // Determine Category Logic
    const cat = categories.find(c => c.name === transaction.category && c.type === transaction.type);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
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
                    padding: '0 24px',
                    borderRadius: '16px',
                    zIndex: 0
                }}
            >
                <Edit2 color="white" size={20} />
                <Trash2 color="white" size={20} />
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
                style={{ x, position: 'relative', zIndex: 1, background: 'var(--bg-deep)', borderRadius: '16px' }}
            >
                <Card
                    hover={false}
                    className="transaction-card"
                    style={{
                        margin: 0,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                >
                    <div className="transaction-left">
                        <div style={{
                            padding: '10px',
                            borderRadius: '50%',
                            background: cat ? `${cat.color}20` : (transaction.type === 'income' ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255, 69, 58, 0.1)'),
                            color: cat ? cat.color : (transaction.type === 'income' ? 'var(--color-green)' : 'var(--color-red)'),
                            display: 'flex', alignItems: 'center', justifyItems: 'center'
                        }}>
                            {cat ? cat.icon : (transaction.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />)}
                        </div>

                        <div>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{transaction.description}</h4>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                {transaction.expense_type && (
                                    <span style={{
                                        marginLeft: '6px',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: 'var(--system-gray5)',
                                        fontSize: '11px',
                                        color: 'var(--text-secondary)'
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
                                color: transaction.type === 'income' ? 'var(--color-green)' : 'var(--text-main)',
                                fontWeight: 600,
                                fontSize: '15px',
                                margin: 0
                            }}>
                                {transaction.type === 'income' ? '+ ' : '- '}R$ {parseFloat(transaction.amount).toFixed(2).replace('.', ',')}
                            </h3>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}
