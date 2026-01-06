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
            <nav className="glass-panel" style={{
                position: 'fixed',
                bottom: '1.5rem',
                left: '1.5rem',
                right: '1.5rem',
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.8rem 1.5rem',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)'
            }}>
                {mainItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.3rem',
                            textDecoration: 'none',
                            color: 'var(--text-muted)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {({ isActive }) => (
                            <>
                                <div style={{
                                    color: isActive ? 'var(--color-2)' : 'inherit',
                                    transform: isActive ? 'translateY(-2px)' : 'none',
                                    transition: 'all 0.3s'
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
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: isMenuOpen ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    {isMenuOpen ? <X size={26} /> : <MenuIcon size={26} />}
                </button>
            </nav>

            {/* Menu Overlay */}
            {isMenuOpen && createPortal(
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    paddingBottom: '7rem'
                }} onClick={() => setIsMenuOpen(false)}>
                    <div
                        className="glass-panel slide-up"
                        style={{
                            margin: '1.5rem',
                            padding: '1.5rem',
                            borderRadius: '24px',
                            background: 'var(--glass-panel-bg)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '1rem',
                            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.8rem',
                                    textDecoration: 'none',
                                    padding: '1.2rem',
                                    borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-main)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
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
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    );
}
