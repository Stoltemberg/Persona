import { useLocation, useOutlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { FAB } from './FAB';
import { InstallPrompt } from './InstallPrompt';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';
import { Eye, EyeOff, Plane } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const NAVIGATION_ORDER = [
    '/dashboard',
    '/transactions',
    '/recurring',
    '/planning',
    '/wallets',
    '/categories',
    '/settings',
    '/admin',
];

const getRouteIndex = (pathname) => {
    const matchedIndex = NAVIGATION_ORDER.findIndex((path) => pathname.startsWith(path));
    return matchedIndex === -1 ? NAVIGATION_ORDER.length : matchedIndex;
};

export function Layout() {
    const location = useLocation();
    const outlet = useOutlet();
    const reducedMotion = useReducedMotion();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();
    const { isEventMode, toggleEventMode } = useEvent();
    const routeKey = location.pathname;
    const previousRouteRef = useRef(routeKey);
    const [transitionDirection, setTransitionDirection] = useState(1);

    useEffect(() => {
        const previousRoute = previousRouteRef.current;
        if (previousRoute === routeKey) {
            return;
        }

        const previousIndex = getRouteIndex(previousRoute);
        const nextIndex = getRouteIndex(routeKey);
        setTransitionDirection(nextIndex >= previousIndex ? 1 : -1);
        previousRouteRef.current = routeKey;
    }, [routeKey]);

    const pageVariants = {
        initial: (direction) => (
            reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: direction > 0 ? 30 : -30, y: 10, scale: 0.992, filter: 'blur(6px)' }
        ),
        animate: { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' },
        exit: (direction) => (
            reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: direction > 0 ? -22 : 22, y: -6, scale: 0.992, filter: 'blur(4px)' }
        ),
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
                    <AnimatePresence mode="wait" initial={false} custom={transitionDirection}>
                        <motion.div
                            key={routeKey}
                            custom={transitionDirection}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={pageVariants}
                            transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 0.92 }}
                            style={{ width: '100%', willChange: 'transform, opacity' }}
                        >
                            {outlet}
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
