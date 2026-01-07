import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, LogOut, PieChart, Wallet, Repeat, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePrivacy } from '../context/PrivacyContext';
import clsx from 'clsx';

export function Sidebar() {
    const { signOut } = useAuth();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Receipt, label: 'Transações', path: '/transactions' },
        { icon: Target, label: 'Metas', path: '/goals' },
        { icon: PieChart, label: 'Análise', path: '/analysis' },
        { icon: Repeat, label: 'Recorrentes', path: '/recurring' },
        { icon: Wallet, label: 'Orçamentos', path: '/budgets' },
        { icon: Settings, label: 'Configurações', path: '/settings' },
    ];

    return (
        <aside className="glass-panel sidebar-panel">
            <div className="sidebar-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 0 }} className="text-gradient">Persona</h1>
                    <button
                        onClick={togglePrivacy}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        title={isPrivacyMode ? "Mostrar valores" : "Esconder valores"}
                    >
                        {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Professional Finance</p>
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
                                <div style={{
                                    color: isActive ? '#c471ed' : 'inherit'
                                }}>
                                    <item.icon size={22} />
                                </div>
                                <span style={{
                                    color: isActive ? 'white' : 'inherit',
                                    fontWeight: isActive ? 600 : 500
                                }}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <div style={{
                                        marginLeft: 'auto',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#c471ed',
                                        boxShadow: '0 0 10px #c471ed'
                                    }} />
                                )}
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
                <span>Sair da Conta</span>
            </button>
        </aside>
    );
}
