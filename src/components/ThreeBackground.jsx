import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const blobs = [
    {
        id: 'a',
        size: 420,
        top: '-8%',
        left: '-10%',
        color: 'rgba(196, 113, 237, 0.24)',
        driftX: 1,
        driftY: 1,
        duration: '16s',
    },
    {
        id: 'b',
        size: 360,
        top: '18%',
        right: '-8%',
        color: 'rgba(18, 194, 233, 0.18)',
        driftX: -1,
        driftY: 1,
        duration: '19s',
    },
    {
        id: 'c',
        size: 300,
        bottom: '6%',
        left: '22%',
        color: 'rgba(246, 79, 89, 0.14)',
        driftX: 1,
        driftY: -1,
        duration: '21s',
    },
];

export function ThreeBackground() {
    const mountRef = useRef(null);
    const rafRef = useRef(0);
    const pointerRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const root = mountRef.current;
        if (!root) return undefined;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isSmallViewport = window.innerWidth < 768;

        const updatePointer = () => {
            const { x, y } = pointerRef.current;
            root.style.setProperty('--bg-pointer-x', `${x}px`);
            root.style.setProperty('--bg-pointer-y', `${y}px`);
        };

        if (!prefersReducedMotion && !isSmallViewport) {
            const handlePointerMove = (event) => {
                pointerRef.current = {
                    x: event.clientX - window.innerWidth / 2,
                    y: event.clientY - window.innerHeight / 2,
                };

                if (rafRef.current) return;

                rafRef.current = window.requestAnimationFrame(() => {
                    updatePointer();
                    rafRef.current = 0;
                });
            };

            const handleResize = () => {
                root.style.setProperty('--bg-scale', window.innerWidth > 1440 ? '1' : '0.92');
            };

            handleResize();
            document.addEventListener('pointermove', handlePointerMove, { passive: true });
            window.addEventListener('resize', handleResize);

            return () => {
                if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
                document.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('resize', handleResize);
            };
        }

        return undefined;
    }, []);

    return createPortal(
        <div
            ref={mountRef}
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                pointerEvents: 'none',
                overflow: 'hidden',
                opacity: 0.72,
                background:
                    'radial-gradient(circle at 20% 20%, rgba(196, 113, 237, 0.08), transparent 32%), radial-gradient(circle at 80% 25%, rgba(18, 194, 233, 0.06), transparent 30%), radial-gradient(circle at 50% 90%, rgba(246, 79, 89, 0.05), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0))',
                transform: 'scale(var(--bg-scale, 1))',
                transition: 'transform 280ms ease, opacity 280ms ease',
                contain: 'layout paint style',
            }}
        >
            <style>{`
                @keyframes persona-orb-drift-a {
                    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
                    50% { transform: translate3d(22px, 18px, 0) scale(1.04); }
                }

                @keyframes persona-orb-drift-b {
                    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
                    50% { transform: translate3d(-18px, 24px, 0) scale(1.03); }
                }

                @keyframes persona-orb-drift-c {
                    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
                    50% { transform: translate3d(16px, -16px, 0) scale(1.05); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .persona-bg-orb {
                        animation: none !important;
                    }
                }
            `}</style>

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '72px 72px',
                    maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.08) 35%, rgba(0,0,0,0.55))',
                    opacity: 0.45,
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    inset: '-12%',
                    background:
                        'radial-gradient(circle at calc(50% + var(--bg-pointer-x, 0px) * 0.04) calc(50% + var(--bg-pointer-y, 0px) * 0.04), rgba(255,255,255,0.08), transparent 34%)',
                    opacity: 0.5,
                    transition: 'opacity 280ms ease',
                }}
            />

            {blobs.map((blob, index) => (
                <span
                    key={blob.id}
                    className="persona-bg-orb"
                    style={{
                        position: 'absolute',
                        width: `${blob.size}px`,
                        height: `${blob.size}px`,
                        borderRadius: '999px',
                        top: blob.top,
                        bottom: blob.bottom,
                        left: blob.left,
                        right: blob.right,
                        background: `radial-gradient(circle at 35% 35%, ${blob.color}, transparent 70%)`,
                        filter: 'blur(42px)',
                        opacity: 0.95,
                        mixBlendMode: 'screen',
                        transform: `translate3d(calc(var(--bg-pointer-x, 0px) * ${blob.driftX * 0.02}), calc(var(--bg-pointer-y, 0px) * ${blob.driftY * 0.02}), 0)`,
                        animation: `persona-orb-drift-${String.fromCharCode(97 + index)} ${blob.duration} ease-in-out infinite`,
                    }}
                />
            ))}
        </div>,
        document.body,
    );
}
