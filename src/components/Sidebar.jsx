import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, LogOut, PieChart, Wallet, Repeat, Eye, EyeOff, Calendar, TrendingUp, Plane } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';
import clsx from 'clsx';

import { createPortal } from 'react-dom';

export function Sidebar() {
    const { signOut, role } = useAuth();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();
    const { isEventMode, toggleEventMode } = useEvent();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Receipt, label: 'Transações', path: '/transactions' },
        { icon: Repeat, label: 'Recorrentes', path: '/recurring' },
        { icon: Target, label: 'Planejamento', path: '/planning' },
        { icon: Settings, label: 'Configurações', path: '/settings' },
    ];

    if (role === 'admin') {
        navItems.push({ icon: Receipt, label: 'Admin', path: '/admin' });
    }

    const sidebarContent = (
        <aside className="glass h-[calc(100vh-4vh)] m-[2vh_0] flex flex-col p-8 rounded-[32px] overflow-hidden border-orange-400/10">
            <div className="mb-10 px-2">
                <div className="flex justify-between items-center w-full mb-2">
                    <h1 className="text-2xl font-display font-semibold text-text-main m-0">Persona</h1>
                    <div className="flex gap-1">
                        <button
                            onClick={togglePrivacy}
                            className="p-2 rounded-full text-text-muted hover:bg-white/10 hover:text-text-main transition-all duration-300"
                            title={isPrivacyMode ? "Mostrar valores" : "Esconder valores"}
                        >
                            {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button
                            onClick={() => toggleEventMode(!isEventMode)}
                            className={clsx(
                                "p-2 rounded-full transition-all duration-300",
                                isEventMode ? "text-brand bg-brand/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "text-text-muted hover:bg-white/10 hover:text-text-main"
                            )}
                            title={isEventMode ? "Sair do Modo Viagem" : "Modo Viagem"}
                        >
                            <Plane size={18} />
                        </button>
                    </div>
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-[0.15em] font-medium opacity-60">Wealth Management</p>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item, index) => (
                    <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                    >
                        <NavLink
                            to={item.path}
                            className={({ isActive }) => clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group',
                                isActive 
                                    ? 'bg-brand/10 text-brand shadow-[inset_0_0_1px_rgba(212,175,55,0.4)]' 
                                    : 'text-text-secondary hover:bg-white/5 hover:text-text-main'
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={clsx(
                                        "transition-transform duration-300 group-hover:scale-110",
                                        isActive ? "scale-110" : ""
                                    )}>
                                        <item.icon size={20} className={isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
                                    </div>
                                    <span className="font-medium text-sm tracking-tight text-text-main">
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <motion.div 
                                            layoutId="active-pill"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_10px_rgba(212,175,55,0.6)]"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    </motion.div>
                ))}
            </nav>

            <button
                onClick={signOut}
                className="mt-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-danger font-semibold text-sm hover:bg-danger/10 transition-all duration-300 group"
            >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Sair</span>
            </button>
        </aside>
    );

    // Use Portal to render outside of the app root (avoiding transforms)
    return createPortal(
        <div className="sidebar-container">
            {sidebarContent}
        </div>,
        document.body
    );
}
