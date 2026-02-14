import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className, hover = false, ...props }) {
    // Using the new glass-card class from index.css
    // If hover prop is true, add glass-card-hover for interactions
    const baseClass = 'glass-card';
    const hoverClass = hover ? 'glass-card-hover' : '';

    return (
        <div
            className={twMerge(clsx(baseClass, hoverClass, className))}
            {...props}
        >
            {children}
        </div>
    );
}
