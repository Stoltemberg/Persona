import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, PieChart, Wallet, Menu as MenuIcon, X, PiggyBank, Repeat, Calendar, TrendingUp, Eye, EyeOff, Plane } from 'lucide-react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { FAB } from './FAB';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';

export function MobileNav() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();
    const { isEventMode, toggleEventMode } = useEvent();

    const navItems = [
        { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
        { icon: Receipt, label: 'Extrato', path: '/transactions' },
        { icon: Repeat, label: 'Fixos', path: '/recurring' },
        { icon: Target, label: 'Planos', path: '/planning' },
        { icon: Calendar, label: 'Assinaturas', path: '/subscriptions' }, // Changed label from 'Planos' to 'Assinaturas' to avoid conflict with 'Planos' above
        { icon: TrendingUp, label: 'Simular', path: '/simulator' },
        { icon: PiggyBank, label: 'Limites', path: '/budgets' },
        { icon: Settings, label: 'Ajustes', path: '/settings' }, // Kept 'Ajustes' from the first Settings entry
    ];

    return (
        <>
            {/* Main Bottom Bar */}
            <nav className="mobile-bottom-bar">
                {navItems.slice(0, 2).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="mobile-nav-item"
                    >
                        {({ isActive }) => (
                            <div className={`mobile-nav-icon`} style={{
                                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                transform: isActive ? 'scale(1.1)' : 'none',
                                transition: 'all 0.2s ease'
                            }}>
                                <item.icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                            </div>
                        )}
                    </NavLink>
                ))}

                {/* Center FAB */}
                <FAB
                    className="mobile-center-fab"
                    style={{
                        position: 'relative',
                        width: '56px',
                        height: '56px',
                        borderRadius: '18px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        flexShrink: 0
                    }}
                />

                {navItems.slice(2, 4).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="mobile-nav-item"
                    >
                        {({ isActive }) => (
                            <div className={`mobile-nav-icon`} style={{
                                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                transform: isActive ? 'scale(1.1)' : 'none',
                                transition: 'all 0.2s ease'
                            }}>
                                <item.icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                            </div>
                        )}
                    </NavLink>
                ))}

                {/* Menu Toggle (for Settings and others) */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="mobile-nav-item"
                    style={{ color: isMenuOpen ? 'var(--text-main)' : 'var(--text-muted)' }}
                >
                    {isMenuOpen ? <X size={24} strokeWidth={1.5} /> : <MenuIcon size={24} strokeWidth={1.5} />}
                </button>
            </nav>

            {/* Menu Overlay */}
            {isMenuOpen && createPortal(
                <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', position: 'fixed', inset: 0, zIndex: 100 }}>
                    <div
                        className="mobile-menu-grid"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Quick Settings Toggles */}
                        <div style={{
                            gridColumn: '1 / -1',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '2rem'
                        }}>
                            <button
                                onClick={togglePrivacy}
                                className={`menu-toggle-btn ${isPrivacyMode ? 'active' : ''}`}
                            >
                                {isPrivacyMode ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                                <span>{isPrivacyMode ? 'Oculto' : 'Visível'}</span>
                            </button>

                            <button
                                onClick={() => toggleEventMode(!isEventMode)}
                                className={`menu-toggle-btn ${isEventMode ? 'active' : ''}`}
                            >
                                <Plane size={16} strokeWidth={1.5} />
                                <span>Viagem</span>
                            </button>
                        </div>
                        {/* Render Settings in the menu */}
                        {[navItems[4]].map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className="mobile-menu-item"
                            >
                                <div className="mobile-menu-icon-container">
                                    <item.icon size={16} strokeWidth={1.5} />
                                </div>
                                <span className="mobile-menu-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
