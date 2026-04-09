import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);

            if (!localStorage.getItem('pwa_prompt_dismissed')) {
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
        <div className="install-prompt-shell">
            <Card className="install-prompt-card">
                <div className="app-list-card-main">
                    <span className="app-inline-icon install-prompt-icon">
                        <Download size={18} />
                    </span>
                    <div>
                        <strong>Instalar Persona</strong>
                        <span>Abra mais rapido, mantenha acesso offline e use como app no dia a dia.</span>
                    </div>
                </div>

                <div className="install-prompt-actions">
                    <Button onClick={handleInstall} className="btn-primary">
                        Instalar
                    </Button>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="btn-ghost btn-icon"
                        aria-label="Dispensar sugestao de instalacao"
                    >
                        <X size={18} />
                    </button>
                </div>
            </Card>
        </div>
    );
}
