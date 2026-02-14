import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { FAB } from './FAB';
import { InstallPrompt } from './InstallPrompt';

export function Layout() {
    return (
        <div className="app-layout">
            {/* Sidebar Area - Desktop */}
            <div className="sidebar-container">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <main className="main-content">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Nav - Only visible on mobile via CSS media queries logic (or hidden on desktop via CSS) */}
            {/* In our CSS, mobile-bottom-bar is fixed. We might want to conditionally render or let CSS handle it. */}
            {/* Since we want it to be cleaner, let's keep it here and ensure CSS hides it on desktop. */}
            <div className="mobile-nav-container">
                <MobileNav />
            </div>

            <FAB />
            <InstallPrompt />
        </div>
    );
}
