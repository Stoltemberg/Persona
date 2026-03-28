import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

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
        <motion.button
            whileTap={!loading && !props.disabled ? { scale: 0.95 } : {}}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={twMerge(clsx(baseClass, variantClass, className))}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <span className="loader">Loading...</span> // Simple loader text for now
            ) : (
                <>
                    {Icon && <Icon size={18} />}
                    {children}
                </>
            )}
        </motion.button>
    );
}
