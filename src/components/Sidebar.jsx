import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import clsx from 'clsx';

export function Sidebar() {
    const { signOut } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Receipt, label: 'Transações', path: '/transactions' },
        { icon: Target, label: 'Metas', path: '/goals' },
        { icon: Settings, label: 'Configurações', path: '/settings' },
    ];

    return (
        <aside className="glass-panel" style={{
            width: '280px',
            height: '95vh',
            margin: '1rem',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem',
            position: 'fixed' // Simple fixed sidebar for now
        }}>
            <div style={{ marginBottom: '3rem', paddingLeft: '0.5rem' }}>
                <h1 style={{ fontSize: '2rem' }} className="text-gradient">Persona</h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Professional Finance</p>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            'nav-item',
                            isActive ? 'active' : ''
                        )}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            color: 'var(--text-secondary)',
                            transition: 'all 0.3s ease',
                            fontWeight: 500
                        }}
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
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#f64f59',
                    cursor: 'pointer',
                    marginTop: 'auto',
                    borderRadius: '12px',
                    transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(246, 79, 89, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <LogOut size={22} />
                <span style={{ fontWeight: 600 }}>Sair da Conta</span>
            </button>

            <style jsx>{`
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white !important;
        }
        .nav-item.active {
          background: rgba(255, 255, 255, 0.08); /* Or a gradient */
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
        </aside>
    );
}
