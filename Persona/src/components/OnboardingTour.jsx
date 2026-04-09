import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Check, ArrowRight, X } from 'lucide-react';

const TOUR_STEPS = [
    {
        title: "Bem-vindo ao Persona!",
        content: "Seu novo centro de comando financeiro. Vamos fazer um tour rápido?",
        target: null // Center
    },
    {
        title: "Adicione Transações",
        content: "Toque no botão + flutuante a qualquer momento para registrar gastos ou receitas.",
        target: '.fab-btn'
    },
    {
        title: "Menu Completo",
        content: "Acesse Metas, Orçamentos e Simulador através do menu.",
        target: '.mobile-bottom-bar button:last-child' // Targeting menu button roughly
    },
    {
        title: "Modo Privacidade",
        content: "Toque no olho no topo da tela para esconder seus valores em público.",
        target: null
    }
];

export function OnboardingTour() {
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem('persona_onboarding_completed');
        if (!completed) {
            // Small delay to let app load
            setTimeout(() => setIsVisible(true), 1000);
        }
    }, []);

    const handleNext = () => {
        if (step < TOUR_STEPS.length - 1) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('persona_onboarding_completed', 'true');
    };

    if (!isVisible) return null;

    const currentStep = TOUR_STEPS[step];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}
            >
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <motion.div
                        key={step}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="glass-card"
                        style={{
                            background: 'var(--glass-panel-bg)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--color-2)',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-2)' }}>
                                Dica {step + 1}/{TOUR_STEPS.length}
                            </span>
                            <button onClick={handleComplete} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{currentStep.title}</h3>
                        <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            {currentStep.content}
                        </p>

                        <div className="flex-between">
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {TOUR_STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: i === step ? 'var(--color-2)' : 'rgba(255,255,255,0.1)'
                                        }}
                                    />
                                ))}
                            </div>

                            <Button onClick={handleNext} className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
                                {step === TOUR_STEPS.length - 1 ? 'Entendi' : 'Próximo'}
                                {step === TOUR_STEPS.length - 1 ? <Check size={18} style={{ marginLeft: '8px' }} /> : <ArrowRight size={18} style={{ marginLeft: '8px' }} />}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
