import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, LogOut, PieChart, Wallet, Repeat, Eye, EyeOff, Calendar, TrendingUp, Plane } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';
import clsx from 'clsx';

import { createPortal } from 'react-dom';

export function Sidebar() {
    const { signOut, role } = useAuth();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();
    const { isEventMode, toggleEventMode } = useEvent();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Receipt, label: 'Transações', path: '/transactions' },
        { icon: Target, label: 'Metas', path: '/goals' },
        { icon: PieChart, label: 'Análise', path: '/analysis' },
        // Subscriptions merged into Recurring
        { icon: Repeat, label: 'Recorrentes', path: '/recurring' },
        { icon: Wallet, label: 'Orçamentos', path: '/budgets' },
        { icon: Settings, label: 'Configurações', path: '/settings' },
        { icon: TrendingUp, label: 'Simulador', path: '/simulator' },
    ];

    if (role === 'admin') {
        navItems.push({ icon: Receipt, label: 'Admin', path: '/admin' });
    }

    const sidebarContent = (
        <aside className="glass-panel sidebar-panel">
            <div className="sidebar-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: 0, fontWeight: 600, color: 'var(--text-main)' }}>Persona</h1>
                    <button
                        onClick={togglePrivacy}
                        className="sidebar-header-btn"
                        title={isPrivacyMode ? "Mostrar valores" : "Esconder valores"}
                    >
                        {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                        onClick={() => toggleEventMode(!isEventMode)}
                        className="sidebar-header-btn"
                        style={{ color: isEventMode ? 'var(--text-main)' : undefined }}
                        title={isEventMode ? "Sair do Modo Viagem" : "Modo Viagem"}
                    >
                        <Plane size={18} />
                    </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Professional Finance</p>
            </div>

            <nav className="sidebar-nav">
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
                                <div>
                                    <item.icon size={20} />
                                </div>
                                <span>
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <button
                onClick={signOut}
                className="logout-btn"
            >
                <LogOut size={22} />
                <span>Sair</span>
            </button>
        </aside>
    );

    // Use Portal to render outside of the app root (avoiding transforms)
    return createPortal(
        <div className="sidebar-container">
            {sidebarContent}
        </div>,
        document.body
    );
}
