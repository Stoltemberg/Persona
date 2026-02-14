import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, LogOut, PieChart, Wallet, Repeat, Eye, EyeOff, Calendar, TrendingUp, Plane } from 'lucide-react';
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
            background: 'var(--bg-primary)',
            borderRight: '1px solid var(--divider)',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem 1rem'
        }}>
            <div style={{ marginBottom: '3rem', paddingLeft: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>Persona</h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Finance</p>
            </div>

            <nav role="navigation" aria-label="Main Navigation" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        aria-label={item.label}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            color: isActive ? 'var(--color-blue)' : 'var(--text-secondary)',
                            background: isActive ? 'var(--bg-secondary)' : 'transparent',
                            fontWeight: isActive ? '600' : '500',
                            transition: 'all 0.2s',
                            outline: 'none' // We will handle focus via global CSS or :focus-visible
                        })}
                    >
                        <item.icon size={20} aria-hidden="true" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div style={{ borderTop: '1px solid var(--divider)', paddingTop: '1rem' }}>
                <button
                    onClick={togglePrivacy}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
                    <span>{isPrivacyMode ? 'Mostrar Valores' : 'Ocultar Valores'}</span>
                </button>
                <button
                    onClick={signOut}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-red)',
                        cursor: 'pointer',
                        marginTop: '0.5rem',
                        fontSize: '0.9rem'
                    }}
                >
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
}
