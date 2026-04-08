import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="modal-overlay"
            onClick={onClose}
        >
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        <span className="modal-kicker">Painel rapido</span>
                        <h3>{title}</h3>
                    </div>
                    <button type="button" className="btn-ghost btn-icon" onClick={onClose} aria-label="Fechar modal">
                        <X size={20} />
                    </button>
                </div>

                {children}
            </div>
        </div>,
        document.body
    );
}
