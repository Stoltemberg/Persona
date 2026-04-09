import clsx from 'clsx';
import { forwardRef, useId } from 'react';

export const Input = forwardRef(({ className, error, label, note, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const noteId = note ? `${inputId}-note` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [noteId, errorId].filter(Boolean).join(' ') || undefined;

    return (
        <div className="input-group">
            {label && (
                <label className="input-label" htmlFor={inputId}>
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                className={clsx('input-field', className)}
                aria-describedby={describedBy}
                {...props}
            />
            {note && (
                <span id={noteId} className="text-muted text-small" style={{ marginTop: '0.35rem', display: 'block' }}>
                    {note}
                </span>
            )}
            {error && (
                <span id={errorId} className="input-error">
                    {error}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';
