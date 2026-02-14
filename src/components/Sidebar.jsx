import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, LogOut, PieChart, Wallet, Repeat, Eye, EyeOff, Calendar, TrendingUp, Plane } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';
import clsx from 'clsx';

export function Sidebar() {
    const { signOut, role } = useAuth();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();
    const { isEventMode, toggleEventMode } = useEvent();

    const navItems = [
        { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
        { icon: Receipt, label: 'Extrato', path: '/transactions' },
        { icon: Target, label: 'Metas', path: '/goals' },
        { icon: PieChart, label: 'Análise', path: '/analysis' },
        { icon: Calendar, label: 'Assinaturas', path: '/subscriptions' },
        { icon: TrendingUp, label: 'Simulador', path: '/simulator' },
        { icon: Repeat, label: 'Recorrentes', path: '/recurring' },
        { icon: Wallet, label: 'Carteiras', path: '/budgets' }, // Budgets actually wallets in nav
        { icon: Settings, label: 'Ajustes', path: '/settings' },
    ];

    if (role === 'admin') {
        navItems.push({ icon: Receipt, label: 'Admin', path: '/admin' });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '0 12px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Persona</h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Finanças</span>
                </div>

                {/* Quick Toggles */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={togglePrivacy}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                        title={isPrivacyMode ? "Mostrar" : "Ocultar"}
                    >
                        {isPrivacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                        onClick={() => toggleEventMode(!isEventMode)}
                        style={{ background: 'none', border: 'none', color: isEventMode ? 'var(--color-pink)' : 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                        title="Modo Viagem"
                    >
                        <Plane size={16} />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            'nav-item',
                            isActive ? 'active' : ''
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ opacity: isActive ? 1 : 0.7 }} />
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer / Logout */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                <button
                    onClick={signOut}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '10px 12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-red)',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        borderRadius: '10px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 59, 48, 0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                    <LogOut size={18} />
                    <span>Sair</span>
                </button>
            </div>
        </div>
    );
}
