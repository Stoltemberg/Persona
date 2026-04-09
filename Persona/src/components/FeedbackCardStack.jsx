import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, Undo2, X } from 'lucide-react';
import { Button } from './Button';

const TONE_MAP = {
    success: {
        icon: CheckCircle2,
        accent: '#30d158',
        label: 'Confirmado',
    },
    error: {
        icon: AlertTriangle,
        accent: '#ff6b6b',
        label: 'Atencao',
    },
    info: {
        icon: Info,
        accent: '#12c2e9',
        label: 'Atualizacao',
    },
};

export function FeedbackCardStack({ notices, onDismiss }) {
    return (
        <div className="feedback-card-stack" aria-live="polite" aria-atomic="true">
            <AnimatePresence initial={false}>
                {notices.map((notice) => {
                    const tone = TONE_MAP[notice.type] || TONE_MAP.info;
                    const Icon = tone.icon;

                    return (
                        <motion.div
                            key={notice.id}
                            initial={{ opacity: 0, y: 24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.96 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="feedback-card"
                            style={{ '--feedback-accent': tone.accent }}
                        >
                            <div className="feedback-card-head">
                                <div className="feedback-card-badge">
                                    <Icon size={16} />
                                    <span>{notice.label || tone.label}</span>
                                </div>
                                <button
                                    type="button"
                                    className="feedback-card-close"
                                    onClick={() => onDismiss(notice.id)}
                                    aria-label="Fechar aviso"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="feedback-card-body">
                                <div className="feedback-card-title">{notice.title}</div>
                                {notice.message && (
                                    <p className="feedback-card-message">{notice.message}</p>
                                )}
                            </div>

                            {(notice.actionLabel || notice.secondaryLabel) && (
                                <div className="feedback-card-actions">
                                    {notice.actionLabel && (
                                        <Button
                                            type="button"
                                            className="feedback-card-primary"
                                            icon={notice.actionIcon || Undo2}
                                            onClick={() => {
                                                notice.onAction?.();
                                                onDismiss(notice.id);
                                            }}
                                        >
                                            {notice.actionLabel}
                                        </Button>
                                    )}
                                    {notice.secondaryLabel && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="feedback-card-secondary"
                                            onClick={() => {
                                                notice.onSecondary?.();
                                                onDismiss(notice.id);
                                            }}
                                        >
                                            {notice.secondaryLabel}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
