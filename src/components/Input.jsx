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
                style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)', // #F2F2F7
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'background-color 0.2s'
                }}
                onFocus={(e) => e.target.style.backgroundColor = '#E5E5EA'}
                onBlur={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
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
