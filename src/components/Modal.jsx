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
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dimmer overlay
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'flex-end', // Bottom sheet on mobile default
                justifyContent: 'center',
                padding: '0',
            }}
        >
            <div
                className="modal-content fade-in"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    backgroundColor: 'var(--bg-primary)',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    borderBottomLeftRadius: window.innerWidth > 600 ? '24px' : '0',
                    borderBottomRightRadius: window.innerWidth > 600 ? '24px' : '0',
                    padding: '2rem',
                    position: 'relative',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
                    marginBottom: window.innerWidth > 600 ? 'auto' : '0', // Center on desktop
                    marginTop: window.innerWidth > 600 ? 'auto' : '0',
                }}
            >
                {/* Drag Handle for mobile feel */}
                <div style={{
                    width: '40px',
                    height: '5px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '100px',
                    margin: '0 auto 1.5rem auto'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{title}</h3>
                    <button
                        onClick={onClose}
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
                            color: 'var(--text-secondary)'
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
