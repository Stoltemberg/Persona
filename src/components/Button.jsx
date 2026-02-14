import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Using clsx/twMerge for class management if we ever add tailwind, 
// but primarily for conditional class joining with our CSS modules/global styles.

export function Button({
    children,
    variant = 'primary',
    className,
    loading,
    icon: Icon,
    ...props
}) {
    const baseClass = 'btn';
    const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-ghost';

    return (
        <button
            className={clsx(baseClass, variantClass, className)}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <div className="loader"></div>
            ) : (
                <>
                    {Icon && <Icon size={18} />}
                    {children}
                </>
            )}
        </button>
    );
}
