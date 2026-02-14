import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { FAB } from './FAB';
import { InstallPrompt } from './InstallPrompt';

export function Layout() {
    const location = useLocation();

    return (
        <div className="app-layout">
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
