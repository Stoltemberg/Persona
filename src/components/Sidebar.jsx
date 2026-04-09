import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Eye, EyeOff, LayoutDashboard, LogOut, Plane, Receipt, Repeat, Settings, Tag, Target, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';

export function Sidebar() {
    const { signOut, role, hasNewPartnerUpdates } = useAuth();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();
    const { isEventMode, toggleEventMode } = useEvent();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Receipt, label: 'Transacoes', path: '/transactions' },
        { icon: Repeat, label: 'Recorrentes', path: '/recurring' },
        { icon: Target, label: 'Planejamento', path: '/planning' },
        { icon: Wallet, label: 'Carteiras', path: '/wallets' },
        { icon: Tag, label: 'Categorias', path: '/categories' },
        { icon: Settings, label: 'Configuracoes', path: '/settings' },
    ];

    if (role === 'admin') {
        navItems.push({ icon: Receipt, label: 'Admin', path: '/admin' });
    }

    return createPortal(
        <div className="sidebar-container">
            <aside className="glass-panel sidebar-panel">
                <div className="sidebar-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: 0, fontWeight: 600, color: 'var(--text-main)' }}>Persona</h1>
                        <button
                            onClick={togglePrivacy}
                            className="sidebar-header-btn"
                            title={isPrivacyMode ? 'Mostrar valores' : 'Esconder valores'}
                            aria-label={isPrivacyMode ? 'Mostrar valores monetarios' : 'Ocultar valores monetarios'}
                        >
                            {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button
                            onClick={() => toggleEventMode(!isEventMode)}
                            className="sidebar-header-btn"
                            style={{ color: isEventMode ? 'var(--text-main)' : undefined }}
                            title={isEventMode ? 'Sair do modo viagem' : 'Modo viagem'}
                            aria-label={isEventMode ? 'Sair do modo viagem' : 'Entrar no modo viagem'}
                        >
                            <Plane size={18} />
                        </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Professional Finance
                    </p>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            aria-label={item.label}
                            className={({ isActive }) =>
                                clsx('nav-item', isActive ? 'active' : '', item.label === 'Transacoes' && hasNewPartnerUpdates && 'indicator-pulse')
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.span
                                            layoutId="sidebar-nav-highlight"
                                            className="sidebar-nav-highlight"
                                            transition={{ type: 'spring', stiffness: 360, damping: 32, mass: 0.9 }}
                                        />
                                    )}
                                    <div className="nav-item-icon">
                                        <item.icon size={20} />
                                    </div>
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))=
                </nav>

                <button onClick={signOut} className="logout-btn" aria-label="Sair da conta">
                    <div>
                        <LogOut size={22} />
                    </div>
                    <span>Sair</span>
                </button>
            </aside>
        </div>,
        document.body,
    );
}
