import { Button } from './Button';

export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
    return (
        <div className="glass-panel fade-in" style={{
            padding: '3rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            height: '100%',
            minHeight: '300px'
        }}>
            <div style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                marginBottom: '1.5rem',
                color: 'var(--text-muted)'
            }}>
                <Icon size={48} />
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '2rem' }}>
                {description}
            </p>

            {actionText && onAction && (
                <Button className="btn-primary" onClick={onAction}>
                    {actionText}
                </Button>
            )}
        </div>
    );
}
