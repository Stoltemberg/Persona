import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card'; // Assuming we want a styled card container or just a div

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show if not already installed and not dismissed recently
            const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (!isDismissed) {
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '80px', // Above mobile nav
            left: '1rem',
            right: '1rem',
            zIndex: 100,
            animation: 'slideUp 0.5s ease-out'
        }}>
            <Card className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{
                    width: '40px', height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #c471ed, #f64f59)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                }}>
                    <Download size={20} />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Instalar App</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Acesse mais rápido e offline.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button onClick={handleInstall} className="btn-primary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}>
                        Instalar
                    </Button>
                    <button
                        onClick={handleDismiss}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.5rem', cursor: 'pointer' }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </Card>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
