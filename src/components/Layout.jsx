import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function Layout() {
    const location = useLocation();

    return (
        <div className="app-layout">
            {/* Sidebar Area - Desktop */}
            <div className="sidebar-container">
                <div className="sidebar-wrapper">
                    <Sidebar />
                </div>
            </div>

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

        </div>
    );
}
