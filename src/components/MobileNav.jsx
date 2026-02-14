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

    const mainItems = [
        { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
        { icon: Receipt, label: 'Extrato', path: '/transactions' },
        { icon: PieChart, label: 'Análise', path: '/analysis' },
    ];

    const menuItems = [
        { icon: Target, label: 'Metas', path: '/goals' },
        { icon: Repeat, label: 'Recorrentes', path: '/recurring' },
        { icon: Calendar, label: 'Assinaturas', path: '/subscriptions' },
        { icon: TrendingUp, label: 'Simulador', path: '/simulator' },
        { icon: PiggyBank, label: 'Orçamentos', path: '/budgets' },
        { icon: Wallet, label: 'Carteiras', path: '/wallets' },
        { icon: Settings, label: 'Config', path: '/settings' },
    ];

    return (
        <>
            {/* Main Bottom Bar */}
            <nav className="mobile-bottom-bar">
                {mainItems.slice(0, 2).map((item) => (
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
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
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

                {mainItems.slice(2).map((item) => (
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
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                        )}
                    </NavLink>
                ))}

                {/* Menu Toggle */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="mobile-nav-item"
                    style={{ color: isMenuOpen ? 'var(--text-main)' : 'var(--text-muted)' }}
                >
                    {isMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
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
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '1rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px solid var(--glass-border)'
                        }}>
                            <button
                                onClick={togglePrivacy}
                                style={{
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--glass-border)',
                                    padding: '0.8rem',
                                    borderRadius: '12px',
                                    color: 'var(--text-main)',
                                    flex: 1,
                                    marginRight: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                                <span style={{ fontSize: '0.85rem' }}>{isPrivacyMode ? 'Visível' : 'Oculto'}</span>
                            </button>

                            <button
                                onClick={() => toggleEventMode(!isEventMode)}
                                style={{
                                    background: isEventMode ? 'var(--text-main)' : 'var(--input-bg)',
                                    border: '1px solid var(--glass-border)',
                                    padding: '0.8rem',
                                    borderRadius: '12px',
                                    color: isEventMode ? 'var(--bg-deep)' : 'var(--text-main)',
                                    flex: 1,
                                    marginLeft: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Plane size={18} />
                                <span style={{ fontSize: '0.85rem' }}>Viagem</span>
                            </button>
                        </div>
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className="mobile-menu-item"
                            >
                                <div className="mobile-menu-icon-container">
                                    <item.icon size={24} strokeWidth={1.5} />
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
