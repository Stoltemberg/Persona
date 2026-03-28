import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, LogOut, PieChart, Wallet, Repeat, Eye, EyeOff, Calendar, TrendingUp, Plane } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';
import clsx from 'clsx';
import { motion } from 'framer-motion';

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
        <div className="sidebar-panel">
            {/* Logo Section */}
            <div className="flex items-center px-3 border-r border-orange-400/10 mr-2">
                <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                    <span className="font-display font-bold text-xl">P</span>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex items-center gap-1">
                {navItems.map((item, index) => (
                    <motion.div
                        key={item.path}
                        whileHover={{ y: -4, scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <NavLink
                            to={item.path}
                            className={({ isActive }) => clsx(
                                'flex flex-col items-center justify-center min-w-[64px] h-[56px] rounded-2xl transition-all duration-300 group relative',
                                isActive 
                                    ? 'text-brand' 
                                    : 'text-text-secondary hover:text-text-main hover:bg-white/5'
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={22} className={isActive ? "stroke-[2.2px]" : "stroke-[1.8px]"} />
                                    <span className="text-[9px] font-medium uppercase tracking-wider mt-1 opacity-80">
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <motion.div 
                                            layoutId="active-dock-pill"
                                            className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand shadow-[0_0_8px_rgba(212,175,55,1)]"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    </motion.div>
                ))}
            </nav>

            <div className="w-px h-8 bg-orange-400/10 mx-2" />

            {/* Toggles & Actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={togglePrivacy}
                    className="p-3 rounded-2xl text-text-muted hover:bg-white/5 hover:text-text-main transition-all duration-300"
                    title={isPrivacyMode ? "Mostrar valores" : "Esconder valores"}
                >
                    {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <button
                    onClick={() => toggleEventMode(!isEventMode)}
                    className={clsx(
                        "p-3 rounded-2xl transition-all duration-300",
                        isEventMode ? "text-brand bg-brand/10" : "text-text-muted hover:bg-white/5 hover:text-text-main"
                    )}
                    title={isEventMode ? "Sair do Modo Viagem" : "Modo Viagem"}
                >
                    <Plane size={20} />
                </button>
                <button
                    onClick={signOut}
                    className="p-3 rounded-2xl text-danger hover:bg-danger/10 transition-all duration-300 group"
                    title="Sair"
                >
                    <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );

    // Use Portal to render outside of the app root (avoiding transforms)
    return createPortal(
        <div className="sidebar-container">
            {sidebarContent}
        </div>,
        document.body
    );
}
