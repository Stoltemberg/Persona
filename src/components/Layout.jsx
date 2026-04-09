import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { FAB } from './FAB';
import { InstallPrompt } from './InstallPrompt';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';
import { Eye, EyeOff, Plane } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export function Layout() {
    const location = useLocation();
    const reducedMotion = useReducedMotion();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();
    const { isEventMode, toggleEventMode } = useEvent();
    const routeKey = location.pathname;

    const pageVariants = {
        initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.995 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.995 },
    };

    return (
        <div className="app-layout">
            <div className="mesh-background" />
            {/* Desktop Control Center */}
            <div className="desktop-controls-overlay">
                <button
                    onClick={togglePrivacy}
                    className="control-btn"
                    title={isPrivacyMode ? "Mostrar valores" : "Esconder valores"}
                >
                    {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                    onClick={() => toggleEventMode(!isEventMode)}
                    className={clsx("control-btn", isEventMode && "active")}
                    title={isEventMode ? "Sair do Modo Viagem" : "Modo Viagem"}
                >
                    <Plane size={18} />
                </button>
            </div>

            {/* Sidebar Area - Desktop (Portal) */}

            <Sidebar />

            {/* Main Content Area */}
            <main className="main-content">
                <div className="content-wrapper">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={routeKey}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={pageVariants}
                            transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.9 }}
                            style={{ width: '100%', willChange: 'transform, opacity' }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="mobile-nav-container">
                <MobileNav />
            </div>

            <FAB className="desktop-fab" />
            <InstallPrompt />

        </div>
    );
}
