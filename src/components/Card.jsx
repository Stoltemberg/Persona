import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

export function Card({ children, className, hover = false, ...props }) {
    // Using the new glass-card class from index.css
    // If hover prop is true, add glass-card-hover for interactions
    const baseClass = 'glass-card';
    const hoverClass = hover ? 'glass-card-hover' : '';

    return (
        <motion.div
            whileHover={hover ? { scale: 1.015, y: -2 } : {}}
            whileTap={hover ? { scale: 0.98 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={twMerge(clsx(baseClass, hoverClass, className))}
            {...props}
        >
            {children}
        </motion.div>
    );
}
