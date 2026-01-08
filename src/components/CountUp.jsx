import { useEffect, useState } from 'react';

export const CountUp = ({ end, duration = 2000, decimals = 2, prefix = '', suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;

            // Ease out quart
            const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

            if (progress < duration) {
                const percentage = easeOutQuart(progress / duration);
                setCount(end * percentage);
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return (
        <span>
            {prefix}
            {count.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
            {suffix}
        </span>
    );
};
