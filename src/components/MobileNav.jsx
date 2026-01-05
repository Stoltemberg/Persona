import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, PieChart } from 'lucide-react';
import clsx from 'clsx';

export function MobileNav() {
    const navItems = [
        { icon: LayoutDashboard, label: 'Inicio', path: '/' },
        { icon: Receipt, label: 'Transações', path: '/transactions' },
        { icon: PieChart, label: 'Análise', path: '/analysis' },
        { icon: Target, label: 'Metas', path: '/goals' },
        { icon: Settings, label: 'Config', path: '/settings' },
    ];

    return (
        <nav className="glass-panel" style={{
            position: 'fixed',
            bottom: '1rem',
            left: '1rem',
            right: '1rem',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0.75rem',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            background: 'rgba(15, 15, 20, 0.8)' // A bit darker for visibility
        }}>
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => clsx(
                        'mobile-nav-item',
                        isActive ? 'active' : ''
                    )}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem',
                        textDecoration: 'none',
                        color: 'var(--text-muted)',
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '12px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    {({ isActive }) => (
                        <>
                            <div style={{
                                color: isActive ? '#c471ed' : 'inherit',
                                transform: isActive ? 'translateY(-2px)' : 'none',
                                transition: 'transform 0.3s'
                            }}>
                                <item.icon size={24} />
                            </div>
                            <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: isActive ? 'white' : 'transparent', // Hide text when inactive for cleaner look? Or muted. Let's try muted.
                                opacity: isActive ? 1 : 0,
                                height: isActive ? 'auto' : 0,
                                overflow: 'hidden',
                                transition: 'all 0.3s'
                            }}>
                                {item.label}
                            </span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}
