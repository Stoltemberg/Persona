import { useEffect, useRef } from 'react';
import anime from 'animejs';

export function useDashboardAnimations(loading, activeFilter) {
  const containerRef = useRef(null);
  const animationPlayed = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || loading || !containerRef.current) return;

    const animatedNodes = containerRef.current.querySelectorAll(
      '.dashboard-header-centered, .dashboard-balance-section, .dashboard-stat-card, .upcoming-widget-container, .dashboard-tx-card'
    );

    if (animationPlayed.current && activeFilter) {
      anime({
        targets: containerRef.current.querySelectorAll('.dashboard-tx-card'),
        translateY: [20, 0],
        delay: anime.stagger(50),
        easing: 'spring(1, 80, 10, 0)',
        duration: 800,
      });
      return () => anime.remove(animatedNodes);
    }

    const timeline = anime.timeline({
      easing: 'spring(1, 90, 12, 0)',
    });

    timeline
      .add({
        targets: containerRef.current.querySelector('.dashboard-header-centered'),
        translateY: [20, 0],
      }, 0)
      .add({
        targets: containerRef.current.querySelector('.dashboard-balance-section'),
        scale: [0.95, 1],
      }, 50)
      .add({
        targets: containerRef.current.querySelectorAll('.dashboard-stat-card'),
        translateY: [30, 0],
        delay: anime.stagger(40),
      }, 100)
      .add({
        targets: containerRef.current.querySelector('.upcoming-widget-container'),
        translateY: [20, 0],
      }, 150)
      .add({
        targets: containerRef.current.querySelectorAll('.dashboard-tx-card'),
        translateY: [20, 0],
        delay: anime.stagger(30),
      }, 200);

    animationPlayed.current = true;
    return () => anime.remove(animatedNodes);
  }, [loading, activeFilter]);

  return containerRef;
}
