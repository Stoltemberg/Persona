import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, LayoutDashboard, LogOut, Menu as MenuIcon, Plane, Receipt, Repeat, Settings, Tag, Target, Wallet, X } from 'lucide-react';
import { FAB } from './FAB';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../hooks/useAuth';

export function MobileNav() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();
    const { isEventMode, toggleEventMode } = useEvent();
    const { signOut } = useAuth();

    const barItemsLeft = [
        { id: 'dashboard', icon: LayoutDashboard, path: '/dashboard', label: 'Dashboard' },
        { id: 'transactions', icon: Receipt, path: '/transactions', label: 'Transacoes' },
    ];

    const barItemsRight = [
        { id: 'recurring', icon: Repeat, path: '/recurring', label: 'Contas recorrentes' },
    ];

    const menuItems = [
        { icon: Wallet, label: 'Carteiras', path: '/wallets' },
        { icon: Tag, label: 'Categorias', path: '/categories' },
        { icon: Target, label: 'Planejamento', path: '/planning' },
        { icon: Settings, label: 'Configuracoes', path: '/settings' },
    ];

    return (
        <>
            <motion.nav
                className="liquid-nav-container"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
                <div className="liquid-glass-pill">
                    {barItemsLeft.map((item) => {
                        const isActive = location.pathname.startsWith(item.path) && !isMenuOpen;
                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`liquid-nav-item ${isActive ? 'active' : ''}`}
                                aria-label={item.label}
                            >
                                {isActive && <motion.div layoutId="liquid-bubble" className="liquid-bubble" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
                                <item.icon className="liquid-icon" size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                            </NavLink>
                        );
                    })}

                    <div className="liquid-nav-item">
                        <FAB
                            className="liquid-fab-override"
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'transparent',
                                border: 'none',
                                color: 'inherit',
                                padding: 0,
                                boxShadow: 'none',
                            }}
                        />
                    </div>

                    {barItemsRight.map((item) => {
                        const isActive = location.pathname.startsWith(item.path) && !isMenuOpen;
                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`liquid-nav-item ${isActive ? 'active' : ''}`}
                                aria-label={item.label}
                            >
                                {isActive && <motion.div layoutId="liquid-bubble" className="liquid-bubble" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
                                <item.icon className="liquid-icon" size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                            </NavLink>
                        );
                    })}

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`liquid-nav-item ${isMenuOpen ? 'active' : ''}`}
                        aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen && <motion.div layoutId="liquid-bubble" className="liquid-bubble" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
                        {isMenuOpen ? <X className="liquid-icon" size={24} strokeWidth={2.5} /> : <MenuIcon className="liquid-icon" size={24} strokeWidth={1.5} />}
                    </button>
                </div>
            </motion.nav>

            {createPortal(
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mobile-menu-overlay"
                            onClick={() => setIsMenuOpen(false)}
                            style={{ zIndex: 9998 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="mobile-menu-grid"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="menu-drag-handle" />

                                <div className="menu-toggles-row">
                                    <button onClick={togglePrivacy} className={`menu-toggle-btn ${isPrivacyMode ? 'active' : ''}`} aria-label={isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}>
                                        <div className="toggle-icon-box">
                                            {isPrivacyMode ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                                        </div>
                                        <span>{isPrivacyMode ? 'Oculto' : 'Visivel'}</span>
                                    </button>
                                    <button onClick={() => toggleEventMode(!isEventMode)} className={`menu-toggle-btn ${isEventMode ? 'active' : ''}`} aria-label={isEventMode ? 'Sair do modo viagem' : 'Modo viagem'}>
                                        <div className="toggle-icon-box"><Plane size={16} strokeWidth={1.5} /></div>
                                        <span>Viagem</span>
                                    </button>
                                </div>

                                <motion.div
                                    className="menu-items-grid"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                                    }}
                                >
                                    {menuItems.map((item) => (
                                        <motion.div
                                            key={item.path}
                                            variants={{
                                                hidden: { opacity: 0, y: 10 },
                                                visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
                                            }}
                                        >
                                            <NavLink
                                                to={item.path}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="mobile-menu-item"
                                                aria-label={item.label}
                                            >
                                                <div className="mobile-menu-icon-container">
                                                    <item.icon size={22} strokeWidth={1.5} />
                                                </div>
                                                <span className="mobile-menu-label">{item.label}</span>
                                            </NavLink>
                                        </motion.div>
                                    ))}

                                    <motion.div
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
                                        }}
                                    >
                                        <button
                                            onClick={signOut}
                                            className="mobile-menu-item"
                                            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                                            aria-label="Sair da conta"
                                        >
                                            <div className="mobile-menu-icon-container" style={{ background: 'rgba(246, 79, 89, 0.1)', color: '#f64f59' }}>
                                                <LogOut size={22} strokeWidth={1.5} />
                                            </div>
                                            <span className="mobile-menu-label" style={{ color: '#f64f59' }}>Sair da conta</span>
                                        </button>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </>
    );
}
