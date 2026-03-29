import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { FAB } from './FAB';
import { InstallPrompt } from './InstallPrompt';
import { usePrivacy } from '../context/PrivacyContext';
import { useEvent } from '../context/EventContext';
import { Eye, EyeOff, Plane } from 'lucide-react';
import clsx from 'clsx';

export function Layout() {
    const location = useLocation();
    const { isPrivacyMode, togglePrivacy } = usePrivacy();
    const { isEventMode, toggleEventMode } = useEvent();

    return (
        <div className="app-layout">
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
                    <Outlet />
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
