import { motion, useReducedMotion } from 'framer-motion';

const orbAnimation = (duration, x, y, scale) => ({
    animate: {
        x,
        y,
        scale,
    },
    transition: {
        duration,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: 'easeInOut',
    },
});

export function AmbientBackground() {
    const reducedMotion = useReducedMotion();

    return (
        <div className="app-ambient" aria-hidden="true">
            <div className="app-ambient-grid" />
            <div className="app-ambient-noise" />
            <motion.div
                className="app-ambient-orb orb-a"
                {...(reducedMotion ? {} : orbAnimation(26, [0, 18, -14, 0], [0, -24, 10, 0], [1, 1.04, 0.98, 1]))}
            />
            <motion.div
                className="app-ambient-orb orb-b"
                {...(reducedMotion ? {} : orbAnimation(32, [0, -12, 20, 0], [0, 16, -18, 0], [1, 1.06, 1, 1]))}
            />
            <motion.div
                className="app-ambient-orb orb-c"
                {...(reducedMotion ? {} : orbAnimation(38, [0, 10, -8, 0], [0, 8, -14, 0], [1, 1.03, 0.97, 1]))}
            />
        </div>
    );
}
