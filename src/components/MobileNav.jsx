import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, PieChart, Menu, X, PiggyBank, Repeat, Calendar, TrendingUp, Eye, EyeOff, Plane, Wallet } from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';

export function MobileNav() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isPrivacyMode, togglePrivacy } = usePrivacy();

    const mainItems = [
        { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
        { icon: Receipt, label: 'Extrato', path: '/transactions' },
        { icon: PieChart, label: 'Análise', path: '/analysis' },
    ];

    const menuItems = [
        { icon: Target, label: 'Metas', path: '/goals' },
        { icon: Repeat, label: 'Recorrentes', path: '/recurring' },
        { icon: Calendar, label: 'Assinaturas', path: '/subscriptions' },
        { icon: Wallet, label: 'Carteiras', path: '/wallets' },
        { icon: Settings, label: 'Config', path: '/settings' },
    ];

    return (
        <>
            <nav role="navigation" aria-label="Mobile Navigation" style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--divider)',
                display: 'flex',
                justifyContent: 'space-around',
                padding: '0.75rem 0.5rem',
                zIndex: 100
            }}>
                {mainItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        aria-label={item.label}
                        style={({ isActive }) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: isActive ? 'var(--color-blue)' : 'var(--text-tertiary)',
                            fontSize: '0.7rem',
                            gap: '0.25rem'
                        })}
                    >
                        <item.icon size={24} strokeWidth={2} aria-hidden="true" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={isMenuOpen ? "Fechar Menu" : "Abrir Menu"}
                    aria-expanded={isMenuOpen}
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: isMenuOpen ? 'var(--color-blue)' : 'var(--text-tertiary)',
                        fontSize: '0.7rem',
                        gap: '0.25rem',
                        cursor: 'pointer'
                    }}
                >
                    {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
                    <span>Menu</span>
                </button>
            </nav>

            {isMenuOpen && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu Adicional"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.2)',
                        zIndex: 99
                    }}
                >
                    <div onClick={e => e.stopPropagation()} style={{
                        position: 'absolute',
                        bottom: '80px',
                        right: '1rem',
                        left: '1rem',
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                            <button onClick={togglePrivacy} className="btn" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', justifyContent: 'flex-start', fontSize: '0.9rem' }}>
                                {isPrivacyMode ? <EyeOff size={18} style={{ marginRight: '0.5rem' }} /> : <Eye size={18} style={{ marginRight: '0.5rem' }} />}
                                {isPrivacyMode ? 'Visível' : 'Oculto'}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {menuItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    aria-label={item.label}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textDecoration: 'none',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.8rem',
                                        gap: '0.5rem',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{
                                        background: 'var(--bg-secondary)',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        color: 'var(--color-blue)'
                                    }}>
                                        <item.icon size={20} aria-hidden="true" />
                                    </div>
                                    <span>{item.label}</span>
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
