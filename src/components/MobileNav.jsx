import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, PieChart, Wallet, Menu as MenuIcon, X, PiggyBank, Repeat } from 'lucide-react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

export function MobileNav() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const mainItems = [
        { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
        { icon: Receipt, label: 'Extrato', path: '/transactions' },
        { icon: PieChart, label: 'Análise', path: '/analysis' },
    ];

    const menuItems = [
        { icon: Target, label: 'Metas', path: '/goals', color: '#c471ed' },
        { icon: Repeat, label: 'Recorrentes', path: '/recurring', color: '#00ebc7' },
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
                    style={{ color: isMenuOpen ? 'white' : 'var(--text-muted)' }}
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
