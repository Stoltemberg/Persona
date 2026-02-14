import clsx from 'clsx';
import { forwardRef } from 'react';

export const Input = forwardRef(({ className, error, label, ...props }, ref) => {
    return (
        <div className="input-group" style={{ marginBottom: '1rem' }}>
            {label && (
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={clsx('input-field', className)}
                {...props}
            />
            {error && (
                <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                    {error}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';
