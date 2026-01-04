import clsx from 'clsx';

export function Card({ children, className, ...props }) {
    return (
        <div className={clsx('glass-card', className)} {...props}>
            {children}
        </div>
    );
}
