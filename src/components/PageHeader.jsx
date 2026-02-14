import React from 'react';
import clsx from 'clsx';

export function PageHeader({ title, subtitle, children, className }) {
    return (
        <header className={clsx("page-header flex-between mb-2 flex-wrap gap-1", className)} style={{ marginBottom: '3rem', paddingTop: '1rem' }}>
            <div>
                {title}
                {subtitle && <p className="text-muted" style={{ opacity: 0.6 }}>{subtitle}</p>}
            </div>
            {children && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {children}
                </div>
            )}
        </header>
    );
}
