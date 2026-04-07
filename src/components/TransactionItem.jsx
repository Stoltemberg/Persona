import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card } from './Card';
import { useAuth } from '../hooks/useAuth';

export const TransactionItem = React.memo(function TransactionItem({ transaction, categories, onEdit, onDelete, index }) {
    const { user, partnerProfile } = useAuth();
    const x = useMotionValue(0);
    const backgroundOpacity = useTransform(x, [-100, 0, 100], [1, 0, 1]);
    const backgroundColor = useTransform(x, [-100, 0, 100], ['#f64f59', 'transparent', '#12c2e9']);

    const category = categories.find((item) => item.name === transaction.category && item.type === transaction.type);

    return (
        <motion.div
            layout="position"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            transition={{
                duration: 0.3,
                ease: 'easeOut',
                opacity: { delay: index * 0.04 },
                y: { delay: index * 0.04 },
            }}
            style={{ position: 'relative', overflow: 'hidden', borderRadius: '2px', marginBottom: '6px' }}
        >
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
                    borderRadius: '2px',
                    zIndex: 0,
                }}
            >
                <Edit2 color="white" size={24} />
                <Trash2 color="white" size={24} />
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_event, { offset }) => {
                    if (offset.x < -100) {
                        onDelete(transaction.id);
                    } else if (offset.x > 100) {
                        onEdit(transaction);
                    }
                }}
                style={{ x, position: 'relative', zIndex: 1, borderRadius: '2px' }}
            >
                <Card
                    hover={false}
                    className="dashboard-tx-card"
                    style={{
                        margin: 0,
                        border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div className="transaction-left">
                        <div style={{
                            padding: '0.6rem',
                            borderRadius: '2px',
                            background: category ? `${category.color}20` : (transaction.type === 'income' ? 'rgba(40, 94, 77, 0.1)' : 'rgba(139, 44, 44, 0.1)'),
                            color: category ? category.color : (transaction.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyItems: 'center',
                            fontSize: '1rem',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset',
                        }}>
                            {category ? category.icon : (transaction.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />)}
                        </div>

                        <div>
                            <h4 style={{ marginBottom: '0.1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {transaction.description}
                                {transaction.profile_id && transaction.profile_id !== user?.id && (
                                    <span style={{
                                        fontSize: '0.65rem',
                                        padding: '0.15rem 0.4rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--text-main)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        textTransform: 'none',
                                    }}>
                                        {partnerProfile?.avatar_url ? (
                                            <img src={partnerProfile.avatar_url} alt="Partner" style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(246, 79, 89, 0.2)', color: '#f64f59', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700 }}>
                                                {(partnerProfile?.nickname || partnerProfile?.full_name || 'P')[0].toUpperCase()}
                                            </div>
                                        )}
                                        {partnerProfile?.nickname || partnerProfile?.full_name?.split(' ')[0] || 'Parceiro'}
                                    </span>
                                )}
                            </h4>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                {transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                {transaction.expense_type && (
                                    <span style={{
                                        marginLeft: '0.5rem',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px',
                                        background: 'rgba(255,255,255,0.1)',
                                        fontSize: '0.75rem',
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
                                fontSize: '1rem',
                            }}>
                                {transaction.type === 'income' ? '+ ' : '- '}R$ {parseFloat(transaction.amount).toFixed(2).replace('.', ',')}
                            </h3>
                        </div>
                        <div className="desktop-actions" style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}
                                className="btn-ghost btn-icon"
                                title="Editar"
                                aria-label={`Editar ${transaction.description}`}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}
                                className="btn-ghost btn-icon"
                                style={{ color: '#f64f59' }}
                                title="Excluir"
                                aria-label={`Excluir ${transaction.description}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
});
