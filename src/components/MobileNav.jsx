import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, PieChart, Wallet, Menu as MenuIcon, X, PiggyBank, Repeat, Calendar, TrendingUp, Eye, EyeOff, Plane } from 'lucide-react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
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
        { icon: Target, label: 'Metas', path: '/goals', color: '#c471ed' },
        { icon: Repeat, label: 'Recorrentes', path: '/recurring', color: '#00ebc7' },
        { icon: Calendar, label: 'Assinaturas', path: '/subscriptions', color: '#f64f59' },
        { icon: TrendingUp, label: 'Simulador', path: '/simulator', color: '#12c2e9' },
        { icon: PiggyBank, label: 'Orçamentos', path: '/budgets', color: '#f64f59' },
        { icon: Wallet, label: 'Carteiras', path: '/wallets', color: '#12c2e9' },
        { icon: Settings, label: 'Config', path: '/settings', color: 'var(--text-secondary)' },
    ];

    return (
        <>
            {/* Main Bottom Bar */}
            <nav className="mobile-bottom-bar">
                {mainItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="mobile-nav-item"
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`mobile-nav-icon ${isActive ? 'active' : ''}`} style={{
                                    color: isActive ? 'var(--color-2)' : 'inherit',
                                    transform: isActive ? 'translateY(-2px)' : 'none'
                                }}>
                                    <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Menu Toggle */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="mobile-nav-item"
                    style={{ color: isMenuOpen ? 'var(--color-2)' : 'var(--text-muted)' }}
                >
                    {isMenuOpen ? <X size={26} /> : <MenuIcon size={26} />}
                </button>
            </nav>

            {/* Menu Overlay */}
            {isMenuOpen && createPortal(
                <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
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
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <button
                                onClick={togglePrivacy}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'none',
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
                                {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
                                <span style={{ fontSize: '0.9rem' }}>{isPrivacyMode ? 'Visível' : 'Oculto'}</span>
                            </button>

                            <button
                                onClick={() => toggleEventMode(!isEventMode)}
                                style={{
                                    background: isEventMode ? 'rgba(246, 79, 89, 0.15)' : 'rgba(255,255,255,0.05)',
                                    border: isEventMode ? '1px solid #f64f59' : 'none',
                                    padding: '0.8rem',
                                    borderRadius: '12px',
                                    color: isEventMode ? '#f64f59' : 'var(--text-main)',
                                    flex: 1,
                                    marginLeft: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Plane size={20} />
                                <span style={{ fontSize: '0.9rem' }}>Viagem</span>
                            </button>
                        </div>
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className="mobile-menu-item"
                            >
                                <div style={{ color: item.color }}>
                                    <item.icon size={28} />
                                </div>
                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
