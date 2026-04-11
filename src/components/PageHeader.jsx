import React from 'react';
import clsx from 'clsx';

export function PageHeader({ title, subtitle, children, className }) {
    return (
        <header className={clsx("page-header flex-between mb-2 flex-wrap gap-1", className)} style={{ marginBottom: '3rem', paddingTop: '1rem' }}>
            <div className="page-header-copy">
                <h1 className="page-header-title">{title}</h1>
                {subtitle && <p className="page-header-subtitle text-muted">{subtitle}</p>}
            </div>
            {children && (
                <div className="page-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {children}
                </div>
            )}
        </header>
    );
}
