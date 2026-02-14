import clsx from 'clsx';
import { forwardRef } from 'react';

export const Input = forwardRef(({ className, error, label, ...props }, ref) => {
    return (
        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    marginLeft: '0.5rem' // Slight indent for label
                }}>
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={clsx('input-field', className)}
                {...props}
            />
            {error && (
                <span style={{
                    color: 'var(--color-red)',
                    fontSize: '0.8rem',
                    marginTop: '0.4rem',
                    display: 'block',
                    marginLeft: '0.5rem'
                }}>
                    {error}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';
