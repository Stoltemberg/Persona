import clsx from 'clsx';
import { forwardRef } from 'react';

export const Input = forwardRef(({ className, error, label, ...props }, ref) => {
    return (
        <div className="input-group">
            {label && (
                <label className="input-label">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={clsx('input-field', className)}
                {...props}
            />
            {error && (
                <span className="input-error">
                    {error}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';
