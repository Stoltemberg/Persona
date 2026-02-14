import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, PieChart, Menu, X, Repeat, Calendar, TrendingUp, Eye, EyeOff, Wallet } from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePrivacy } from '../context/PrivacyContext';

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
        { icon: Wallet, label: 'Orçamentos', path: '/budgets' },
        { icon: TrendingUp, label: 'Simulador', path: '/simulator' },
        { icon: Settings, label: 'Config', path: '/settings' },
    ];

    return (
        <>
            <nav 
                role="navigation"
                aria-label="Mobile Navigation"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'var(--glass-bg-strong)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    borderTop: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    padding: '8px 4px calc(8px + env(safe-area-inset-bottom))',
                    zIndex: 'var(--z-elevated)',
                    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)'
                }}
            >
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
                            justifyContent: 'center',
                            textDecoration: 'none',
                            color: isActive ? 'var(--color-blue)' : 'var(--text-tertiary)',
                            fontSize: '0.6875rem',
                            gap: '4px',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            minWidth: '64px',
                            minHeight: '52px',
                            transition: 'all var(--transition-base)',
                            fontWeight: isActive ? '600' : '500',
                            background: isActive ? 'var(--bg-secondary)' : 'transparent'
                        })}
                    >
                        <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                    aria-expanded={isMenuOpen}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        color: isMenuOpen ? 'var(--color-blue)' : 'var(--text-tertiary)',
                        fontSize: '0.6875rem',
                        gap: '4px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        minWidth: '64px',
                        minHeight: '52px',
                        cursor: 'pointer',
                        transition: 'all var(--transition-base)',
                        fontWeight: isMenuOpen ? '600' : '500'
                    }}
                >
                    {isMenuOpen ? <X size={22} strokeWidth={2.5} aria-hidden="true" /> : <Menu size={22} strokeWidth={2} aria-hidden="true" />}
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
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 'var(--z-popover)',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <div 
                        onClick={e => e.stopPropagation()} 
                        className="slide-up"
                        style={{
                            position: 'absolute',
                            bottom: '70px',
                            right: 'var(--spacing-md)',
                            left: 'var(--spacing-md)',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--spacing-lg)',
                            boxShadow: 'var(--shadow-xl)',
                            maxWidth: '400px',
                            margin: '0 auto'
                        }}
                    >
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: 'var(--spacing-sm)', 
                            marginBottom: 'var(--spacing-md)' 
                        }}>
                            <button 
                                onClick={togglePrivacy} 
                                className="btn btn-ghost" 
                                style={{ 
                                    justifyContent: 'flex-start', 
                                    fontSize: '0.875rem',
                                    padding: '10px var(--spacing-md)'
                                }}
                            >
                                {isPrivacyMode ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                <span>{isPrivacyMode ? 'Visível' : 'Oculto'}</span>
                            </button>
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(3, 1fr)', 
                            gap: 'var(--spacing-md)' 
                        }}>
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
                                        fontSize: '0.75rem',
                                        gap: 'var(--spacing-sm)',
                                        textAlign: 'center',
                                        padding: 'var(--spacing-sm)',
                                        borderRadius: 'var(--radius-md)',
                                        transition: 'all var(--transition-base)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        background: 'var(--bg-secondary)',
                                        padding: '12px',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-blue)',
                                        width: '48px',
                                        height: '48px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <item.icon size={20} aria-hidden="true" />
                                    </div>
                                    <span style={{ fontWeight: '500' }}>{item.label}</span>
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
