import { useEffect, useRef } from 'react';
import anime from 'animejs';

export function useDashboardAnimations(loading, activeFilter) {
  const containerRef = useRef(null);
  const animationPlayed = useRef(false);

  useEffect(() => {
    // Apenas rodar quando não estiver carregando,
    // garantindo que os elementos reais já estejam no DOM
    if (loading) return;

    if (!containerRef.current) return;

    // Redefinição caso o filtro mude, reanimando apenas as transações
    if (animationPlayed.current && activeFilter) {
      anime({
        targets: containerRef.current.querySelectorAll('.dashboard-tx-card'),
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(50),
        easing: 'spring(1, 80, 10, 0)',
        duration: 800
      });
      return;
    }

    // Timeline de entrada do Dashboard (Acelerado)
    const tl = anime.timeline({
      easing: 'spring(1, 90, 12, 0)',
    });

    tl.add({
      targets: containerRef.current.querySelector('.dashboard-header-centered'),
      translateY: [20, 0],
      opacity: [0, 1],
    }, 0)
    .add({
      targets: containerRef.current.querySelector('.dashboard-balance-section'),
      scale: [0.95, 1],
      opacity: [0, 1],
    }, 50)
    .add({
      targets: containerRef.current.querySelectorAll('.dashboard-stat-card'),
      translateY: [30, 0],
      opacity: [0, 1],
      delay: anime.stagger(40)
    }, 100)
    .add({
      targets: containerRef.current.querySelector('.upcoming-widget-container'),
      translateY: [20, 0],
      opacity: [0, 1],
    }, 150)
    .add({
      targets: containerRef.current.querySelectorAll('.dashboard-tx-card'),
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(30)
    }, 200);

    animationPlayed.current = true;

  }, [loading, activeFilter]);

  return containerRef;
}
