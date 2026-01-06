import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '../hooks/useAuth';

export function OnboardingTour() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const hasSeenTour = localStorage.getItem(`persona_tour_${user.id}`);

        if (!hasSeenTour) {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                doneBtnText: "Pronto!",
                nextBtnText: "Próximo",
                prevBtnText: "Anterior",
                steps: [
                    {
                        element: '#tour-welcome',
                        popover: {
                            title: 'Bem-vindo ao Persona! 🚀',
                            description: 'Este é o seu novo painel financeiro. Vamos fazer um tour rápido?',
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-wallets',
                        popover: {
                            title: 'Suas Carteiras 💰',
                            description: 'Aqui você gerencia suas contas bancárias, dinheiro físico e cartões.',
                            side: "top",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-transactions',
                        popover: {
                            title: 'Transações 📝',
                            description: 'Adicione ganhos e gastos rápidos aqui. Clique em "Nova Transação" para começar.',
                            side: "top",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-goals',
                        popover: {
                            title: 'Metas e Sonhos 🎯',
                            description: 'Defina objetivos financeiros e acompanhe seu progresso visualmente.',
                            side: "top",
                            align: 'start'
                        }
                    }
                ],
                onDestroyed: () => {
                    localStorage.setItem(`persona_tour_${user.id}`, 'true');
                }
            });

            // Small delay to ensure DOM is ready
            setTimeout(() => {
                driverObj.drive();
            }, 1500);
        }
    }, [user]);

    return null;
}
