import clsx from 'clsx';

export function Card({ children, className, hover = false, ...props }) {
    return (
        <div
            className={clsx('glass-card', hover && 'hover-scale', className)}
            {...props}
        >
            {children}
        </div>
    );
}
