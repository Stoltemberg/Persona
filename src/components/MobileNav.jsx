import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, PieChart, Wallet, Menu as MenuIcon, X, PiggyBank, Repeat, Calendar, TrendingUp, Eye, EyeOff, Plane, Tag } from 'lucide-react';
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

    // Items for the bottom bar (Left of FAB and Right of FAB)
    // We want: Dashboard, Transactions | FAB | Fixos, Menu
    const barItemsLeft = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Receipt, label: 'Transações', path: '/transactions' },
    ];

    const barItemsRight = [
        { icon: Repeat, label: 'Fixos', path: '/recurring' },
        // The last slot is the menu button, handled separately
    ];

    // Items for the hamburger menu overlay
    const menuItems = [
        { icon: Wallet, label: 'Carteiras', path: '/wallets' },
        { icon: Tag, label: 'Categorias', path: '/categories' },
        { icon: Target, label: 'Planejamento', path: '/planning' },
        { icon: Settings, label: 'Configurações', path: '/settings' },
    ];

    return (
        <>
            {/* Main Bottom Bar */}
            <nav className="mobile-bottom-bar">
                {/* Left Side */}
                {barItemsLeft.map((item) => (
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

                {/* Right Side */}
                {barItemsRight.map((item) => (
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

                {/* Menu Toggle (Always last on right) */}
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
                <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div
                        className="mobile-menu-grid"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="menu-drag-handle"></div>

                        {/* Quick Settings Toggles */}
                        <div className="menu-toggles-row">
                            <button
                                onClick={togglePrivacy}
                                className={`menu-toggle-btn ${isPrivacyMode ? 'active' : ''}`}
                            >
                                <div className="toggle-icon-box">
                                    {isPrivacyMode ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
                                </div>
                                <span>{isPrivacyMode ? 'Oculto' : 'Visível'}</span>
                            </button>

                            <button
                                onClick={() => toggleEventMode(!isEventMode)}
                                className={`menu-toggle-btn ${isEventMode ? 'active' : ''}`}
                            >
                                <div className="toggle-icon-box">
                                    <Plane size={20} strokeWidth={1.5} />
                                </div>
                                <span>Viagem</span>
                            </button>
                        </div>

                        {/* Render Menu Items Grid */}
                        <div className="menu-items-grid">
                            {menuItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="mobile-menu-item"
                                >
                                    <div className="mobile-menu-icon-container">
                                        <item.icon size={22} strokeWidth={1.5} />
                                    </div>
                                    <span className="mobile-menu-label">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
