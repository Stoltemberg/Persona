import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';

            const handleEsc = (e) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleEsc);
            return () => {
                window.removeEventListener('keydown', handleEsc);
                document.body.style.overflow = 'unset';
            };
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="modal-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 'var(--z-modal)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: 0,
                animation: 'fadeIn 0.25s ease-out'
            }}
        >
            {/* Clickable overlay as semantic button */}
            <button
                onClick={onClose}
                aria-label="Fechar modal"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'default',
                    outline: 'none'
                }}
            />
            
            <div
                className="modal-content slide-up"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderTopLeftRadius: 'var(--radius-xl)',
                    borderTopRightRadius: 'var(--radius-xl)',
                    borderBottomLeftRadius: window.innerWidth > 600 ? 'var(--radius-xl)' : '0',
                    borderBottomRightRadius: window.innerWidth > 600 ? 'var(--radius-xl)' : '0',
                    padding: '2rem',
                    position: 'relative',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-xl)',
                    marginBottom: window.innerWidth > 600 ? 'auto' : '0',
                    marginTop: window.innerWidth > 600 ? 'auto' : '0',
                    zIndex: 1
                }}
            >
                {/* Drag Handle for mobile feel */}
                <div style={{
                    width: '40px',
                    height: '5px',
                    backgroundColor: 'var(--divider)',
                    borderRadius: 'var(--radius-full)',
                    margin: '0 auto 1.5rem auto'
                }} />

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '2rem' 
                }}>
                    <h3 
                        id="modal-title"
                        style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: '700',
                            margin: 0
                        }}
                    >
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Fechar"
                        style={{
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            transition: 'all var(--transition-base)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-secondary)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {children}
            </div>
        </div>,
        document.body
    );
}
