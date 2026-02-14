import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className, hover = false, ...props }) {
    // Minimalist card: just a container with padding and potential border
    // We using 'card' class which we will ensure exists or just use inline styles for now
    const baseClass = 'card';

    return (
        <div
            className={twMerge(clsx(baseClass, className))}
            style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--divider)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.5rem',
                ...props.style
            }}
            {...props}
        >
            {children}
        </div>
    );
}
