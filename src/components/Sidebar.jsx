import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, LogOut, PieChart, Wallet, Repeat, Eye, EyeOff, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePrivacy } from '../context/PrivacyContext';

export function Sidebar() {
    const { signOut } = useAuth();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Receipt, label: 'Transações', path: '/transactions' },
        { icon: Target, label: 'Metas', path: '/goals' },
        { icon: PieChart, label: 'Análise', path: '/analysis' },
        { icon: Calendar, label: 'Assinaturas', path: '/subscriptions' },
        { icon: TrendingUp, label: 'Simulador', path: '/simulator' },
        { icon: Repeat, label: 'Recorrentes', path: '/recurring' },
        { icon: Wallet, label: 'Orçamentos', path: '/budgets' },
        { icon: Settings, label: 'Configurações', path: '/settings' },
    ];

    return (
        <aside style={{
            height: '100vh',
            background: 'var(--bg-elevated)',
            borderRight: '1px solid var(--divider)',
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--spacing-xl) var(--spacing-md)'
        }}>
            {/* Logo */}
            <div style={{ marginBottom: 'var(--spacing-2xl)', paddingLeft: 'var(--spacing-md)' }}>
                <h1 style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: '800', 
                    marginBottom: 'var(--spacing-xs)',
                    background: 'var(--gradient-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Persona
                </h1>
                <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: '600'
                }}>
                    Finance
                </p>
            </div>

            {/* Navigation */}
            <nav 
                role="navigation" 
                aria-label="Main Navigation"
                style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--spacing-xs)', 
                    flex: 1 
                }}
            >
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        aria-label={item.label}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            padding: '10px var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            color: isActive ? 'var(--color-blue)' : 'var(--text-secondary)',
                            background: isActive ? 'var(--bg-secondary)' : 'transparent',
                            fontWeight: isActive ? '600' : '500',
                            fontSize: '0.9375rem',
                            transition: 'all var(--transition-base)'
                        })}
                        onMouseEnter={(e) => {
                            if (!e.currentTarget.style.background.includes('--bg-secondary')) {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            const isActive = e.currentTarget.classList.contains('active');
                            if (!isActive) {
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                    >
                        <item.icon size={20} strokeWidth={2} aria-hidden="true" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer Actions */}
            <div style={{ 
                borderTop: '1px solid var(--divider)', 
                paddingTop: 'var(--spacing-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-xs)'
            }}>
                <button
                    onClick={togglePrivacy}
                    aria-label={isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-md)',
                        padding: '10px var(--spacing-md)',
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.9375rem',
                        fontWeight: '500',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all var(--transition-base)',
                        textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    {isPrivacyMode ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                    <span>{isPrivacyMode ? 'Mostrar Valores' : 'Ocultar Valores'}</span>
                </button>
                <button
                    onClick={signOut}
                    aria-label="Sair da conta"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-md)',
                        padding: '10px var(--spacing-md)',
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-red)',
                        cursor: 'pointer',
                        fontSize: '0.9375rem',
                        fontWeight: '500',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all var(--transition-base)',
                        textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <LogOut size={20} aria-hidden="true" />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
}
